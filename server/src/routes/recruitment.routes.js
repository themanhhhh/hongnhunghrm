const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, queryOne, run } = require('../db/connection');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);

async function findDuplicateCandidate({ citizen_id, phone, email }, excludeCandidateId) {
    const duplicateChecks = [];
    const params = [];
    const citizenId = String(citizen_id || '').trim();
    const phoneNumber = String(phone || '').trim();
    const emailAddress = String(email || '').trim().toLowerCase();

    if (citizenId) {
        duplicateChecks.push('citizen_id = ?');
        params.push(citizenId);
    }
    if (phoneNumber) {
        duplicateChecks.push('phone = ?');
        params.push(phoneNumber);
    }
    if (emailAddress) {
        duplicateChecks.push('LOWER(LTRIM(RTRIM(email))) = ?');
        params.push(emailAddress);
    }
    if (duplicateChecks.length === 0) return null;

    let sql = `SELECT TOP 1 candidate_code, full_name FROM Candidate WHERE (${duplicateChecks.join(' OR ')})`;
    if (excludeCandidateId) {
        sql += ' AND candidate_id <> ?';
        params.push(excludeCandidateId);
    }
    return queryOne(sql, params);
}

async function replaceCandidateAttachments(candidateId, rawAttachments, now) {
    let attachments = rawAttachments;
    if (typeof attachments === 'string') {
        try {
            attachments = JSON.parse(attachments);
        } catch {
            return;
        }
    }
    if (!Array.isArray(attachments)) return;

    await run('DELETE FROM CandidateAttachment WHERE candidate_id = ?', [candidateId]);
    for (const attachment of attachments) {
        const fileName = String(attachment?.name || attachment?.file_name || '').trim();
        if (!fileName) continue;
        await run(
            `INSERT INTO CandidateAttachment (attachment_id, candidate_id, file_name, file_url, note, uploaded_date, created_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), candidateId, fileName, attachment?.url || attachment?.file_url || null, attachment?.note || null, now, now]
        );
    }
}

async function validateRequestQuota({ department_id, position_id, quota_id, quantity, is_outside_headcount }) {
    const position = await queryOne('SELECT position_id FROM Position WHERE position_id = ? AND department_id = ?', [position_id, department_id]);
    if (!position) return 'Vị trí tuyển dụng không thuộc bộ phận đã chọn.';
    if (Number(is_outside_headcount) === 1) return null;
    if (!quota_id) return 'Yêu cầu trong định biên bắt buộc phải chọn phiếu định biên.';

    const quota = await queryOne(
        'SELECT quota_id, department_id, target_headcount FROM DepartmentQuota WHERE quota_id = ?',
        [quota_id]
    );
    if (!quota) return 'Phiếu định biên không tồn tại.';
    if (quota.department_id !== department_id) return 'Phiếu định biên không thuộc bộ phận đã chọn.';

    const detail = await queryOne(
        `SELECT target_headcount, resignation_count, maternity_count
         FROM DepartmentQuotaDetail WHERE quota_id = ? AND position_id = ?`,
        [quota_id, position_id]
    );
    const current = await queryOne(
        `SELECT COUNT(*) as count FROM Employee
         WHERE department_id = ? AND position_id = ? AND is_active = 1 AND employment_status = 'WORKING'`,
        [department_id, position_id]
    );
    const target = Number(detail?.target_headcount ?? quota.target_headcount) || 0;
    const movement = Number(detail?.resignation_count ?? 0) + Number(detail?.maternity_count ?? 0);
    const currentCount = Number(current?.count) || 0;
    if (currentCount + (Number(quantity) || 0) - movement > target) {
        return 'Số lượng tuyển vượt định biên. Không thể lưu phiếu trong định biên.';
    }
    return null;
}

// --- 1. YÊU CẦU TUYỂN DỤNG ---
router.get('/requests', async (req, res) => {
    let sql = `
    SELECT r.*, d.department_name, p.position_name, p.position_code, e.full_name as requested_by_name
    FROM RecruitmentRequest r
    JOIN Department d ON r.department_id = d.department_id
    JOIN Position p ON r.position_id = p.position_id
    LEFT JOIN Employee e ON r.requested_by = e.employee_id
  `;

    const params = [];
    if ((req.user.roleName === 'Trưởng Phòng' || req.user.roleName === 'Trưởng Khối') && req.user.deptId) {
        sql += ` WHERE r.department_id = ?`;
        params.push(req.user.deptId);
    }

    sql += ` ORDER BY r.created_date DESC`;
    const requests = await query(sql, params);
    res.json({ success: true, data: requests });
});

router.post('/requests', authorizeRole('Administrator', 'HR Staff', 'Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    try {
        const { request_code, created_date, department_id, position_id, quota_id, requested_by, quantity, reason, expected_date, priority, is_outside_headcount, note } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();

        const yy = String(new Date().getFullYear()).slice(-2);
        const countReq = (await queryOne('SELECT COUNT(*) as cnt FROM RecruitmentRequest'))?.cnt || 0;
        const defaultCode = `YCTD/${yy}-${String(countReq + 1).padStart(3, '0')}`;
        const finalRequestCode = request_code && request_code.trim() !== '' ? request_code.trim() : defaultCode;

        const reqCreatedDate = created_date ? (typeof created_date === 'number' ? created_date : new Date(created_date).getTime()) : now;
        const expDate = expected_date ? (typeof expected_date === 'number' ? expected_date : new Date(expected_date).getTime()) : now + 30 * 86400000;
        const quotaError = await validateRequestQuota({ department_id, position_id, quota_id, quantity, is_outside_headcount });
        if (quotaError) return res.status(400).json({ success: false, message: quotaError });

        await run(
            `INSERT INTO RecruitmentRequest (recruitment_request_id, created_date, last_modified_date, request_code, department_id, position_id, quota_id, requested_by, quantity, reason, expected_date, priority, status, is_outside_headcount, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
            [id, reqCreatedDate, now, finalRequestCode, department_id, position_id, quota_id || null, requested_by || null, Number(quantity) || 1, reason || '', expDate, priority || 'MEDIUM', Number(is_outside_headcount) || 0, note || '']
        );

        res.json({ success: true, message: 'Đề xuất nhu cầu tuyển dụng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/requests/:id', authorizeRole('Administrator', 'HR Staff', 'Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    try {
        const { request_code, created_date, department_id, position_id, quota_id, requested_by, quantity, reason, expected_date, priority, is_outside_headcount, note, status } = req.body;
        const now = Date.now();
        const expDate = expected_date ? (typeof expected_date === 'number' ? expected_date : new Date(expected_date).getTime()) : now + 30 * 86400000;
        const quotaError = await validateRequestQuota({ department_id, position_id, quota_id, quantity, is_outside_headcount });
        if (quotaError) return res.status(400).json({ success: false, message: quotaError });

        let sql = `UPDATE RecruitmentRequest SET department_id = ?, position_id = ?, quota_id = ?, requested_by = ?, quantity = ?, reason = ?, expected_date = ?, priority = ?, is_outside_headcount = ?, note = ?, last_modified_date = ?`;
        let params = [department_id, position_id, quota_id || null, requested_by || null, Number(quantity) || 1, reason || '', expDate, priority || 'MEDIUM', Number(is_outside_headcount) || 0, note || '', now];

        if (request_code) {
            sql += `, request_code = ?`;
            params.push(request_code);
        }
        if (created_date) {
            const cDate = typeof created_date === 'number' ? created_date : new Date(created_date).getTime();
            sql += `, created_date = ?`;
            params.push(cDate);
        }
        if (status) {
            sql += `, status = ?`;
            params.push(status);
        }

        sql += ` WHERE recruitment_request_id = ?`;
        params.push(req.params.id);

        await run(sql, params);

        res.json({ success: true, message: 'Cập nhật Yêu cầu tuyển dụng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/requests/:id/approve', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { status, note } = req.body;
        const now = Date.now();

        await run(
            `UPDATE RecruitmentRequest 
       SET status = ?, note = ?, last_modified_date = ?
       WHERE recruitment_request_id = ?`,
            [status, note, now, req.params.id]
        );

        res.json({ success: true, message: `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} yêu cầu tuyển dụng!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/requests/:id', authorizeRole('Administrator', 'HR Staff', 'Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    try {
        const planCount = await queryOne(`SELECT COUNT(*) as cnt FROM RecruitmentPlan WHERE recruitment_request_id = ?`, [req.params.id]);
        if (planCount && planCount.cnt > 0) {
            return res.status(400).json({ success: false, message: `Yêu cầu tuyển dụng đang có ${planCount.cnt} kế hoạch tuyển dụng liên kết. Vui lòng xóa kế hoạch trước.` });
        }
        await run(`DELETE FROM RecruitmentRequest WHERE recruitment_request_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Yêu cầu tuyển dụng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2. KẾ HOẠCH TUYỂN DỤNG ---
router.get('/plans', async (req, res) => {
    const plans = await query(
        `SELECT p.*, r.request_code, d.department_name, pos.position_name
     FROM RecruitmentPlan p
     JOIN RecruitmentRequest r ON p.recruitment_request_id = r.recruitment_request_id
     JOIN Department d ON r.department_id = d.department_id
     JOIN Position pos ON r.position_id = pos.position_id
     ORDER BY p.created_date DESC`
    );
    res.json({ success: true, data: plans });
});

router.post('/plans', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { recruitment_request_id, plan_name, start_date, end_date, budget, note } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();

        const sDate = start_date ? (typeof start_date === 'number' ? start_date : new Date(start_date).getTime()) : now;
        const eDate = end_date ? (typeof end_date === 'number' ? end_date : new Date(end_date).getTime()) : now + 60 * 86400000;

        await run(
            `INSERT INTO RecruitmentPlan (recruitment_plan_id, created_date, last_modified_date, recruitment_request_id, plan_name, start_date, end_date, budget, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS', ?)`,
            [id, now, now, recruitment_request_id, plan_name, sDate, eDate, budget || 0, note || '']
        );

        await run(`INSERT INTO RecruitmentRound (recruitment_round_id, created_date, last_modified_date, recruitment_plan_id, round_name, round_order, description, status)
         VALUES (?, ?, ?, ?, 'Vòng 1: Sàng lọc CV', 1, 'HR Specialist sàng lọc hồ sơ', 'ACTIVE')`, [crypto.randomUUID(), now, now, id]);
        await run(`INSERT INTO RecruitmentRound (recruitment_round_id, created_date, last_modified_date, recruitment_plan_id, round_name, round_order, description, status)
         VALUES (?, ?, ?, ?, 'Vòng 2: Bài Test Chuyên môn', 2, 'Kiểm tra kỹ năng & tư duy chuyên môn', 'ACTIVE')`, [crypto.randomUUID(), now, now, id]);
        await run(`INSERT INTO RecruitmentRound (recruitment_round_id, created_date, last_modified_date, recruitment_plan_id, round_name, round_order, description, status)
         VALUES (?, ?, ?, ?, 'Vòng 3: Phỏng vấn Trưởng phòng & HR', 3, 'Trưởng phòng & HR Manager phỏng vấn trực tiếp', 'ACTIVE')`, [crypto.randomUUID(), now, now, id]);

        res.json({ success: true, message: 'Lập kế hoạch tuyển dụng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/plans/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const candCount = await queryOne(`SELECT COUNT(*) as cnt FROM Candidate WHERE recruitment_plan_id = ?`, [req.params.id]);
        if (candCount && candCount.cnt > 0) {
            return res.status(400).json({ success: false, message: `Kế hoạch tuyển dụng đang có ${candCount.cnt} ứng viên liên kết. Không thể xóa trực tiếp.` });
        }
        await run(`DELETE FROM RecruitmentRound WHERE recruitment_plan_id = ?`, [req.params.id]);
        await run(`DELETE FROM RecruitmentPlan WHERE recruitment_plan_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Kế hoạch tuyển dụng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 3. HỒ SƠ ỨNG VIÊN (CANDIDATES) ---
router.get('/candidates', async (req, res) => {
    const candidates = await query(
        `SELECT c.*, pl.plan_name, req.request_code, req.department_id as req_dept_id, req.position_id as req_pos_id,
            COALESCE(pos_direct.position_name, pos.position_name) as apply_position_name,
            COALESCE(d_direct.department_name, d.department_name) as department_name
     FROM Candidate c
     LEFT JOIN RecruitmentPlan pl ON c.recruitment_plan_id = pl.recruitment_plan_id
     LEFT JOIN RecruitmentRequest req ON pl.recruitment_request_id = req.recruitment_request_id
     LEFT JOIN Department d ON req.department_id = d.department_id
     LEFT JOIN Position pos ON req.position_id = pos.position_id
     LEFT JOIN Position pos_direct ON c.position_id = pos_direct.position_id
     LEFT JOIN Department d_direct ON pos_direct.department_id = d_direct.department_id
     ORDER BY c.received_date DESC, c.created_date DESC`
    );
    const parsed = candidates.map(c => {
        let attachments = [];
        try {
            if (c.attachments_json) attachments = JSON.parse(c.attachments_json);
        } catch (e) { }
        return {
            ...c,
            attachments_json: attachments
        };
    });
    res.json({ success: true, data: parsed });
});

router.post('/candidates', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            candidate_code, full_name, gender, date_of_birth, citizen_id, phone, email, address,
            culture_level, education_level, education_school, major, gpa, experience,
            recruitment_plan_id, recruitment_request_id, department_id, position_id, source, recruitment_unit, referrer, referrer_employee_id, received_date,
            status, rejection_reason, note, attachments_json
        } = req.body;

        const now = Date.now();
        const id = crypto.randomUUID();

        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);
        const dob = parseDate(date_of_birth);
        const rDate = parseDate(received_date) || now;
        const plan = recruitment_plan_id
            ? await queryOne(`SELECT request.department_id, request.recruitment_request_id
                               FROM RecruitmentPlan plan JOIN RecruitmentRequest request ON request.recruitment_request_id = plan.recruitment_request_id
                               WHERE plan.recruitment_plan_id = ?`, [recruitment_plan_id])
            : null;
        const position = position_id ? await queryOne('SELECT department_id FROM Position WHERE position_id = ?', [position_id]) : null;
        const finalRequestId = recruitment_request_id || plan?.recruitment_request_id || null;
        const finalDepartmentId = department_id || position?.department_id || plan?.department_id || null;
        const gpaValue = gpa === '' || gpa === null || gpa === undefined || Number.isNaN(Number(gpa)) ? null : Number(gpa);

        const attJson = Array.isArray(attachments_json) ? JSON.stringify(attachments_json) : (typeof attachments_json === 'string' ? attachments_json : '[]');
        const duplicate = await findDuplicateCandidate({ citizen_id, phone, email });
        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: `Thông tin ứng viên trùng với hồ sơ ${duplicate.candidate_code || duplicate.full_name}.`
            });
        }

        await run(
            `INSERT INTO Candidate (
        candidate_id, created_date, last_modified_date, candidate_code, full_name, gender, date_of_birth, citizen_id, phone, email, address,
        culture_level, education_level, education_school, major, gpa, experience, recruitment_plan_id, recruitment_request_id, department_id, position_id, source, recruitment_unit, referrer, referrer_employee_id,
        received_date, status, rejection_reason, note, attachments_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, now, now, candidate_code, full_name, gender || 'Nam', dob, citizen_id || '', phone || '', email || '', address || '',
                culture_level || '12/12', education_level || '', education_school || '', major || '', gpaValue, experience || '', recruitment_plan_id || '', finalRequestId, finalDepartmentId, position_id || null,
                source || 'TopCV', recruitment_unit || 'Công ty CP Phần mềm BRAVO', referrer || '', referrer_employee_id || null, rDate, status || 'Đã tiếp nhận hồ sơ', rejection_reason || '', note || '', attJson
            ]
        );
        await replaceCandidateAttachments(id, attachments_json, now);

        res.json({ success: true, message: 'Tiếp nhận hồ sơ ứng viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/candidates/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            candidate_code, full_name, gender, date_of_birth, citizen_id, phone, email, address,
            culture_level, education_level, education_school, major, gpa, experience,
            recruitment_plan_id, recruitment_request_id, department_id, position_id, source, recruitment_unit, referrer, referrer_employee_id, received_date, eval_date,
            status, rejection_reason, note, attachments_json
        } = req.body;

        const now = Date.now();
        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        const dob = parseDate(date_of_birth);
        const rDate = parseDate(received_date);
        const evDate = parseDate(eval_date);
        const plan = recruitment_plan_id
            ? await queryOne(`SELECT request.department_id, request.recruitment_request_id
                               FROM RecruitmentPlan plan JOIN RecruitmentRequest request ON request.recruitment_request_id = plan.recruitment_request_id
                               WHERE plan.recruitment_plan_id = ?`, [recruitment_plan_id])
            : null;
        const position = position_id ? await queryOne('SELECT department_id FROM Position WHERE position_id = ?', [position_id]) : null;
        const finalRequestId = recruitment_request_id || plan?.recruitment_request_id || null;
        const finalDepartmentId = department_id || position?.department_id || plan?.department_id || null;
        const gpaValue = gpa === '' || gpa === null || gpa === undefined || Number.isNaN(Number(gpa)) ? null : Number(gpa);

        const attJson = Array.isArray(attachments_json) ? JSON.stringify(attachments_json) : (typeof attachments_json === 'string' ? attachments_json : '[]');
        const duplicate = await findDuplicateCandidate({ citizen_id, phone, email }, req.params.id);
        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: `Thông tin ứng viên trùng với hồ sơ ${duplicate.candidate_code || duplicate.full_name}.`
            });
        }

        await run(
            `UPDATE Candidate 
       SET candidate_code = ?, full_name = ?, gender = ?, date_of_birth = ?, citizen_id = ?, phone = ?, email = ?, address = ?,
           culture_level = ?, education_level = ?, education_school = ?, major = ?, gpa = ?, experience = ?, recruitment_plan_id = ?, recruitment_request_id = ?, department_id = ?, position_id = ?,
           source = ?, recruitment_unit = ?, referrer = ?, referrer_employee_id = ?, received_date = ?, eval_date = ?, status = ?, rejection_reason = ?, note = ?, attachments_json = ?, last_modified_date = ?
       WHERE candidate_id = ?`,
            [
                candidate_code, full_name, gender, dob, citizen_id, phone, email, address,
                culture_level, education_level, education_school, major, gpaValue, experience, recruitment_plan_id, finalRequestId, finalDepartmentId, position_id,
                source, recruitment_unit, referrer, referrer_employee_id || null, rDate, evDate, status, rejection_reason, note, attJson, now, req.params.id
            ]
        );
        await replaceCandidateAttachments(req.params.id, attachments_json, now);

        res.json({ success: true, message: 'Cập nhật hồ sơ ứng viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/candidates/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const candidate = await queryOne(`SELECT status FROM Candidate WHERE candidate_id = ?`, [req.params.id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên.' });
        }
        if (candidate.status === 'HIRED') {
            return res.status(400).json({ success: false, message: 'Ứng viên này đã trở thành nhân viên chính thức - không được phép xóa dữ liệu lịch sử tuyển dụng.' });
        }
        const screenings = await query(`SELECT pre_screening_id FROM PreScreening WHERE candidate_id = ?`, [req.params.id]);
        for (const s of screenings) {
            await run(`DELETE FROM PreScreeningCriteria WHERE pre_screening_id = ?`, [s.pre_screening_id]);
        }
        await run(`DELETE FROM PreScreening WHERE candidate_id = ?`, [req.params.id]);
        await run(`DELETE FROM Interview WHERE candidate_id = ?`, [req.params.id]);
        await run(`DELETE FROM Offer WHERE candidate_id = ?`, [req.params.id]);
        await run(`DELETE FROM Candidate WHERE candidate_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa hồ sơ ứng viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 3B. SƠ LOẠI ỨNG VIÊN (PRE-SCREENING) ---
router.get('/pre-screenings', async (req, res) => {
    try {
        const list = await query(
            `SELECT ps.*, c.full_name as candidate_name, c.candidate_code,
              d.department_name, pos.position_name
       FROM PreScreening ps
       JOIN Candidate c ON ps.candidate_id = c.candidate_id
       LEFT JOIN Department d ON ps.department_id = d.department_id
       LEFT JOIN Position pos ON ps.position_id = pos.position_id
       ORDER BY ps.created_date DESC`
        );
        res.json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/pre-screenings/:id', async (req, res) => {
    try {
        const item = await queryOne(
            `SELECT ps.*, c.full_name as candidate_name, c.candidate_code,
              d.department_name, pos.position_name
       FROM PreScreening ps
       JOIN Candidate c ON ps.candidate_id = c.candidate_id
       LEFT JOIN Department d ON ps.department_id = d.department_id
       LEFT JOIN Position pos ON ps.position_id = pos.position_id
       WHERE ps.pre_screening_id = ?`,
            [req.params.id]
        );
        if (!item) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy Phiếu sơ loại.' });
        }
        const criteria = await query(`SELECT * FROM PreScreeningCriteria WHERE pre_screening_id = ? ORDER BY row_order ASC`, [req.params.id]);
        res.json({ success: true, data: { ...item, criteria } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/pre-screenings', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            candidate_id, received_date, culture_level, education_level, education_school,
            position_id, department_id, screening_date, level_score, screening_result, comment, criteria
        } = req.body;

        const candidate = await queryOne(`SELECT candidate_id FROM Candidate WHERE candidate_id = ?`, [candidate_id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ứng viên.' });
        }
        const existing = await queryOne(`SELECT pre_screening_id FROM PreScreening WHERE candidate_id = ?`, [candidate_id]);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Ứng viên này đã có Phiếu Sơ loại.' });
        }

        const now = Date.now();
        const id = crypto.randomUUID();
        const countRow = await queryOne(`SELECT COUNT(*) as count FROM PreScreening`);
        const code = `PSL/${new Date().getFullYear().toString().slice(-2)}-${String((countRow?.count || 0) + 1).padStart(3, '0')}`;

        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        await run(
            `INSERT INTO PreScreening (
        pre_screening_id, screening_code, candidate_id, received_date, culture_level, education_level, education_school,
        position_id, department_id, screening_date, level_score, screening_result, comment, created_date, last_modified_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, code, candidate_id, parseDate(received_date), culture_level || '', education_level || '', education_school || '',
                position_id || null, department_id || null, parseDate(screening_date) || now, Number(level_score) || 5,
                screening_result || 'ĐẠT', comment || '', now, now
            ]
        );

        if (Array.isArray(criteria)) {
            for (const [idx, c] of criteria.entries()) {
                await run(
                    `INSERT INTO PreScreeningCriteria (criteria_detail_id, pre_screening_id, row_order, criteria_type, required_from, required_description, candidate_value, candidate_description, is_passed, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        crypto.randomUUID(), id, idx + 1, c.criteria_type || 'Năng lực chuyên môn',
                        c.required_from || '', c.required_description || '', c.candidate_value || '', c.candidate_description || '',
                        c.is_passed ? 1 : 0, c.note || ''
                    ]
                );
            }
        }

        await run(`UPDATE Candidate SET status = ?, last_modified_date = ? WHERE candidate_id = ?`, [
            String(screening_result || '').trim().toUpperCase() === 'ĐẠT' ? 'Đã sơ loại, Đạt' : 'Đã sơ loại, Không đạt',
            now,
            candidate_id,
        ]);

        res.json({ success: true, message: 'Tạo Phiếu Sơ loại ứng viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/pre-screenings/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            candidate_id, received_date, culture_level, education_level, education_school,
            position_id, department_id, screening_date, level_score, screening_result, comment, criteria
        } = req.body;

        const now = Date.now();
        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        await run(
            `UPDATE PreScreening SET
        candidate_id = ?, received_date = ?, culture_level = ?, education_level = ?, education_school = ?,
        position_id = ?, department_id = ?, screening_date = ?, level_score = ?, screening_result = ?, comment = ?, last_modified_date = ?
       WHERE pre_screening_id = ?`,
            [
                candidate_id, parseDate(received_date), culture_level || '', education_level || '', education_school || '',
                position_id || null, department_id || null, parseDate(screening_date), Number(level_score) || 5,
                screening_result || 'ĐẠT', comment || '', now, req.params.id
            ]
        );

        if (Array.isArray(criteria)) {
            await run(`DELETE FROM PreScreeningCriteria WHERE pre_screening_id = ?`, [req.params.id]);
            for (const [idx, c] of criteria.entries()) {
                await run(
                    `INSERT INTO PreScreeningCriteria (criteria_detail_id, pre_screening_id, row_order, criteria_type, required_from, required_description, candidate_value, candidate_description, is_passed, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        crypto.randomUUID(), req.params.id, idx + 1, c.criteria_type || 'Năng lực chuyên môn',
                        c.required_from || '', c.required_description || '', c.candidate_value || '', c.candidate_description || '',
                        c.is_passed ? 1 : 0, c.note || ''
                    ]
                );
            }
        }

        await run(`UPDATE Candidate SET status = ?, last_modified_date = ? WHERE candidate_id = ?`, [
            String(screening_result || '').trim().toUpperCase() === 'ĐẠT' ? 'Đã sơ loại, Đạt' : 'Đã sơ loại, Không đạt',
            now,
            candidate_id,
        ]);

        res.json({ success: true, message: 'Cập nhật Phiếu Sơ loại ứng viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/pre-screenings/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const screening = await queryOne(`SELECT candidate_id FROM PreScreening WHERE pre_screening_id = ?`, [req.params.id]);
        await run(`DELETE FROM PreScreeningCriteria WHERE pre_screening_id = ?`, [req.params.id]);
        await run(`DELETE FROM PreScreening WHERE pre_screening_id = ?`, [req.params.id]);
        if (screening?.candidate_id) {
            await run(`UPDATE Candidate SET status = N'Đã tiếp nhận hồ sơ', last_modified_date = ? WHERE candidate_id = ? AND NOT EXISTS (SELECT 1 FROM PreScreening WHERE candidate_id = ?)`, [Date.now(), screening.candidate_id, screening.candidate_id]);
        }
        res.json({ success: true, message: 'Đã xóa Phiếu Sơ loại thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 3C. ĐÁNH GIÁ PHỎNG VẤN (INTERVIEW EVALUATION) ---

// Kiểm tra người dùng hiện tại có thuộc Hội đồng phỏng vấn của ứng viên này không (Admin/HR luôn được phép)
async function checkInterviewPanelAccess(req, candidate_id) {
    if (['Administrator', 'HR Staff'].includes(req.user.roleName)) return null; // OK, không cần kiểm tra thêm
    if (!req.user.employeeId) {
        return 'Tài khoản chưa liên kết với hồ sơ nhân viên, không thể thực hiện đánh giá phỏng vấn.';
    }
    const schedules = await query(`SELECT council_json, candidates_json FROM InterviewSchedule`);
    const isInPanel = schedules.some(sch => {
        let candidatesArr = [], council = [];
        try { candidatesArr = JSON.parse(sch.candidates_json || '[]'); } catch (e) { }
        try { council = JSON.parse(sch.council_json || '[]'); } catch (e) { }
        const hasCandidate = candidatesArr.some(c => c.candidate_id === candidate_id);
        const inCouncil = council.some(m => m.employee_id === req.user.employeeId);
        return hasCandidate && inCouncil;
    });
    return isInPanel ? null : 'Bạn không thuộc Hội đồng phỏng vấn của ứng viên này, không có quyền đánh giá.';
}

router.get('/interview-evaluations', async (req, res) => {
    try {
        const list = await query(
            `SELECT ie.*, c.full_name as candidate_name, c.candidate_code, sch.schedule_code, evaluator.full_name AS evaluator_name
       FROM InterviewEvaluation ie
       JOIN Candidate c ON ie.candidate_id = c.candidate_id
       LEFT JOIN InterviewSchedule sch ON ie.schedule_id = sch.schedule_id
       LEFT JOIN Employee evaluator ON evaluator.employee_id = ie.evaluator_id
       ORDER BY ie.created_date DESC`
        );
        res.json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/interview-evaluations/:id', async (req, res) => {
    try {
        const item = await queryOne(
            `SELECT ie.*, c.full_name as candidate_name, c.candidate_code, sch.schedule_code, evaluator.full_name AS evaluator_name
       FROM InterviewEvaluation ie
       JOIN Candidate c ON ie.candidate_id = c.candidate_id
       LEFT JOIN InterviewSchedule sch ON ie.schedule_id = sch.schedule_id
       LEFT JOIN Employee evaluator ON evaluator.employee_id = ie.evaluator_id
       WHERE ie.interview_eval_id = ?`,
            [req.params.id]
        );
        if (!item) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy Phiếu Đánh giá phỏng vấn.' });
        }
        const script = await query(`SELECT * FROM InterviewEvaluationScript WHERE interview_eval_id = ? ORDER BY row_order ASC`, [req.params.id]);
        const criteria = await query(`SELECT * FROM InterviewEvaluationCriteria WHERE interview_eval_id = ? ORDER BY row_order ASC`, [req.params.id]);
        res.json({ success: true, data: { ...item, script, criteria } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/interview-evaluations', async (req, res) => {
    try {
        const {
            evaluation_date, schedule_id, candidate_id, evaluator_id, duration_minutes,
            level_score, overall_result, overall_comment, script, criteria
        } = req.body;

        const accessError = await checkInterviewPanelAccess(req, candidate_id);
        if (accessError) {
            return res.status(403).json({ success: false, message: accessError });
        }

        const now = Date.now();
        const id = crypto.randomUUID();
        const countRow = await queryOne(`SELECT COUNT(*) as count FROM InterviewEvaluation`);
        const code = `PDGPV/${new Date().getFullYear().toString().slice(-2)}-${String((countRow?.count || 0) + 1).padStart(3, '0')}`;

        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        await run(
            `INSERT INTO InterviewEvaluation (
        interview_eval_id, eval_code, evaluation_date, schedule_id, candidate_id, evaluator_id, duration_minutes,
        level_score, overall_result, overall_comment, created_date, last_modified_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, code, parseDate(evaluation_date) || now, schedule_id || null, candidate_id, evaluator_id || req.user.employeeId || null, Number(duration_minutes) || 30,
                Number(level_score) || 5, overall_result || 'ĐẠT', overall_comment || '', now, now]
        );

        if (Array.isArray(script)) {
            for (const [idx, s] of script.entries()) {
                await run(
                    `INSERT INTO InterviewEvaluationScript (script_id, interview_eval_id, row_order, question, expectation, answer)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [crypto.randomUUID(), id, idx + 1, s.question || '', s.expectation || '', s.answer || '']
                );
            }
        }

        if (Array.isArray(criteria)) {
            for (const [idx, c] of criteria.entries()) {
                await run(
                    `INSERT INTO InterviewEvaluationCriteria (criteria_detail_id, interview_eval_id, row_order, criteria_type, required_from, required_description, candidate_value, candidate_description, is_passed, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [crypto.randomUUID(), id, idx + 1, c.criteria_type || 'Năng lực chuyên môn',
                    c.required_from || '', c.required_description || '', c.candidate_value || '', c.candidate_description || '',
                    c.is_passed ? 1 : 0, c.note || '']
                );
            }
        }

        res.json({ success: true, message: 'Tạo Phiếu Đánh giá phỏng vấn thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/interview-evaluations/:id', async (req, res) => {
    try {
        const {
            evaluation_date, schedule_id, candidate_id, evaluator_id, duration_minutes,
            level_score, overall_result, overall_comment, script, criteria
        } = req.body;

        const accessError = await checkInterviewPanelAccess(req, candidate_id);
        if (accessError) {
            return res.status(403).json({ success: false, message: accessError });
        }

        const now = Date.now();
        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        await run(
            `UPDATE InterviewEvaluation SET
         evaluation_date = ?, schedule_id = ?, candidate_id = ?, evaluator_id = COALESCE(?, evaluator_id), duration_minutes = ?,
        level_score = ?, overall_result = ?, overall_comment = ?, last_modified_date = ?
       WHERE interview_eval_id = ?`,
            [parseDate(evaluation_date), schedule_id || null, candidate_id, evaluator_id || null, Number(duration_minutes) || 30,
            Number(level_score) || 5, overall_result || 'ĐẠT', overall_comment || '', now, req.params.id]
        );

        if (Array.isArray(script)) {
            await run(`DELETE FROM InterviewEvaluationScript WHERE interview_eval_id = ?`, [req.params.id]);
            for (const [idx, s] of script.entries()) {
                await run(
                    `INSERT INTO InterviewEvaluationScript (script_id, interview_eval_id, row_order, question, expectation, answer)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [crypto.randomUUID(), req.params.id, idx + 1, s.question || '', s.expectation || '', s.answer || '']
                );
            }
        }

        if (Array.isArray(criteria)) {
            await run(`DELETE FROM InterviewEvaluationCriteria WHERE interview_eval_id = ?`, [req.params.id]);
            for (const [idx, c] of criteria.entries()) {
                await run(
                    `INSERT INTO InterviewEvaluationCriteria (criteria_detail_id, interview_eval_id, row_order, criteria_type, required_from, required_description, candidate_value, candidate_description, is_passed, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [crypto.randomUUID(), req.params.id, idx + 1, c.criteria_type || 'Năng lực chuyên môn',
                    c.required_from || '', c.required_description || '', c.candidate_value || '', c.candidate_description || '',
                    c.is_passed ? 1 : 0, c.note || '']
                );
            }
        }

        res.json({ success: true, message: 'Cập nhật Phiếu Đánh giá phỏng vấn thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/interview-evaluations/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM InterviewEvaluationScript WHERE interview_eval_id = ?`, [req.params.id]);
        await run(`DELETE FROM InterviewEvaluationCriteria WHERE interview_eval_id = ?`, [req.params.id]);
        await run(`DELETE FROM InterviewEvaluation WHERE interview_eval_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Phiếu Đánh giá phỏng vấn thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 4. LỊCH PHỎNG VẤN & THI TUYỂN ---
router.get('/interview-schedules', async (req, res) => {
    try {
        const schedules = await query(`SELECT * FROM InterviewSchedule ORDER BY created_date DESC`);
        res.json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/interview-schedules/:id', async (req, res) => {
    try {
        const schedule = await queryOne(
            'SELECT * FROM InterviewSchedule WHERE schedule_id = ?',
            [req.params.id]
        );
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch phỏng vấn.' });
        }
        const parseList = (value) => {
            try {
                const parsed = JSON.parse(value || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };
        const { candidates_json, council_json, tests_json, ...scheduleDetail } = schedule;
        res.json({
            success: true,
            data: {
                ...scheduleDetail,
                candidates: parseList(candidates_json),
                council: parseList(council_json),
                tests: parseList(tests_json)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/interview-schedules', async (req, res) => {
    try {
        const { schedule_code, round_type, format_type, location, start_time, end_time, note, candidate_note, candidates, council, tests } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();

        const yy = String(new Date().getFullYear()).slice(-2);
        const countSch = (await queryOne('SELECT COUNT(*) as cnt FROM InterviewSchedule'))?.cnt || 0;
        const defaultCode = `PVTT/${yy}-${String(countSch + 1).padStart(3, '0')}`;
        const finalCode = schedule_code && schedule_code.trim() !== '' ? schedule_code.trim() : defaultCode;

        const startTs = start_time ? (typeof start_time === 'number' ? start_time : new Date(start_time).getTime()) : now + 86400000;
        const endTs = end_time ? (typeof end_time === 'number' ? end_time : new Date(end_time).getTime()) : startTs + 7200000;

        const candJson = Array.isArray(candidates) ? JSON.stringify(candidates) : (typeof candidates === 'string' ? candidates : '[]');
        const counJson = Array.isArray(council) ? JSON.stringify(council) : (typeof council === 'string' ? council : '[]');
        const testJson = Array.isArray(tests) ? JSON.stringify(tests) : (typeof tests === 'string' ? tests : '[]');

        await run(
            `INSERT INTO InterviewSchedule (schedule_id, created_date, last_modified_date, schedule_code, round_type, format_type, location, start_time, end_time, note, candidate_note, candidates_json, council_json, tests_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Đã lên lịch')`,
            [id, now, now, finalCode, round_type || 'Vòng phỏng vấn', format_type || 'Offline', location || '', startTs, endTs, note || '', candidate_note || '', candJson, counJson, testJson]
        );

        res.json({ success: true, message: 'Tạo Lịch phỏng vấn - thi tuyển thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/interview-schedules/:id', async (req, res) => {
    try {
        const { schedule_code, round_type, format_type, location, start_time, end_time, note, candidate_note, candidates, council, tests, status } = req.body;
        const now = Date.now();

        const startTs = start_time ? (typeof start_time === 'number' ? start_time : new Date(start_time).getTime()) : now;
        const endTs = end_time ? (typeof end_time === 'number' ? end_time : new Date(end_time).getTime()) : startTs + 7200000;

        const candJson = Array.isArray(candidates) ? JSON.stringify(candidates) : (typeof candidates === 'string' ? candidates : '[]');
        const counJson = Array.isArray(council) ? JSON.stringify(council) : (typeof council === 'string' ? council : '[]');
        const testJson = Array.isArray(tests) ? JSON.stringify(tests) : (typeof tests === 'string' ? tests : '[]');

        await run(
            `UPDATE InterviewSchedule
       SET schedule_code = ?, round_type = ?, format_type = ?, location = ?, start_time = ?, end_time = ?, note = ?, candidate_note = ?, candidates_json = ?, council_json = ?, tests_json = ?, status = ?, last_modified_date = ?
       WHERE schedule_id = ?`,
            [schedule_code, round_type || 'Vòng phỏng vấn', format_type || 'Offline', location || '', startTs, endTs, note || '', candidate_note || '', candJson, counJson, testJson, status || 'Đã lên lịch', now, req.params.id]
        );

        res.json({ success: true, message: 'Cập nhật Lịch phỏng vấn - thi tuyển thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/interview-schedules/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM InterviewSchedule WHERE schedule_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Xóa Lịch phỏng vấn - thi tuyển thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/interviews', async (req, res) => {
    const interviews = await query(
        `SELECT i.*, c.full_name as candidate_name, c.candidate_code, c.email as candidate_email, rr.round_name, e.full_name as interviewer_name
     FROM Interview i
     JOIN Candidate c ON i.candidate_id = c.candidate_id
     JOIN RecruitmentRound rr ON i.recruitment_round_id = rr.recruitment_round_id
     LEFT JOIN Employee e ON i.interviewer_id = e.employee_id
     ORDER BY i.created_date DESC`
    );
    res.json({ success: true, data: interviews });
});

router.post('/interviews', async (req, res) => {
    try {
        const { candidate_id, recruitment_round_id, interviewer_id, interview_date, score, result, comment } = req.body;

        // Kiểm tra: chỉ Admin/HR hoặc người thuộc Hội đồng phỏng vấn của ứng viên này mới được chấm điểm
        const isPrivileged = ['Administrator', 'HR Staff'].includes(req.user.roleName);
        if (!isPrivileged) {
            if (!req.user.employeeId) {
                return res.status(403).json({ success: false, message: 'Tài khoản chưa liên kết với hồ sơ nhân viên, không thể chấm điểm phỏng vấn.' });
            }
            const schedules = await query(`SELECT council_json, candidates_json FROM InterviewSchedule`);
            const isInPanel = schedules.some(sch => {
                let candidates = [], council = [];
                try { candidates = JSON.parse(sch.candidates_json || '[]'); } catch (e) { }
                try { council = JSON.parse(sch.council_json || '[]'); } catch (e) { }
                const hasCandidate = candidates.some(c => c.candidate_id === candidate_id);
                const inCouncil = council.some(m => m.employee_id === req.user.employeeId);
                return hasCandidate && inCouncil;
            });
            if (!isInPanel) {
                return res.status(403).json({ success: false, message: 'Bạn không thuộc Hội đồng phỏng vấn của ứng viên này, không có quyền chấm điểm.' });
            }
        }

        const now = Date.now();
        const id = crypto.randomUUID();

        const iDate = interview_date ? (typeof interview_date === 'number' ? interview_date : new Date(interview_date).getTime()) : now;

        await run(
            `INSERT INTO Interview (interview_id, created_date, last_modified_date, candidate_id, recruitment_round_id, interviewer_id, interview_date, score, result, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, now, now, candidate_id, recruitment_round_id, interviewer_id || null, iDate, score || 0, result || 'PENDING', comment || '']
        );

        if (result === 'PASSED') {
            await run(`UPDATE Candidate SET status = 'S2: Phỏng vấn', last_modified_date = ? WHERE candidate_id = ?`, [now, candidate_id]);
        } else if (result === 'FAILED') {
            await run(`UPDATE Candidate SET status = 'S7: Loại', last_modified_date = ? WHERE candidate_id = ?`, [now, candidate_id]);
        }

        res.json({ success: true, message: 'Lên lịch & ghi nhận đánh giá phỏng vấn thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/interviews/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM Interview WHERE interview_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa kết quả phỏng vấn thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 5. OFFER TUYỂN DỤNG ---
router.get('/offers', async (req, res) => {
    const offers = await query(
        `SELECT o.*, c.full_name as candidate_name, c.candidate_code, c.phone as candidate_phone,
            d.department_name, pos.position_name, pos.position_name as apply_position_name
     FROM Offer o
     JOIN Candidate c ON o.candidate_id = c.candidate_id
     LEFT JOIN RecruitmentPlan pl ON c.recruitment_plan_id = pl.recruitment_plan_id
     LEFT JOIN RecruitmentRequest req ON pl.recruitment_request_id = req.recruitment_request_id
     LEFT JOIN Department d ON req.department_id = d.department_id
     LEFT JOIN Position pos ON req.position_id = pos.position_id
     ORDER BY o.created_date DESC`
    );
    res.json({ success: true, data: offers });
});

router.post('/offers', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { candidate_id, offer_date, expected_start_date, probation_salary, official_salary, salary_offer, note, offer_status } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();

        const oDate = offer_date ? (typeof offer_date === 'number' ? offer_date : new Date(offer_date).getTime()) : now;
        const sDate = expected_start_date ? (typeof expected_start_date === 'number' ? expected_start_date : new Date(expected_start_date).getTime()) : now + 14 * 86400000;
        const pSal = Number(probation_salary) || 0;
        const oSal = Number(official_salary || salary_offer) || 0;

        await run(
            `INSERT INTO Offer (offer_id, created_date, last_modified_date, candidate_id, offer_date, expected_start_date, probation_salary, official_salary, salary_offer, offer_status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, now, now, candidate_id, oDate, sDate, pSal, oSal, oSal, offer_status || 'Đã phát hành', note || '']
        );

        await run(`UPDATE Candidate SET status = 'S5: Trúng tuyển', last_modified_date = ? WHERE candidate_id = ?`, [now, candidate_id]);

        res.json({ success: true, message: 'Tạo Thư mời nhận việc (Offer) thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/offers/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { candidate_id, offer_date, expected_start_date, probation_salary, official_salary, salary_offer, note, offer_status } = req.body;
        const now = Date.now();

        const oDate = offer_date ? (typeof offer_date === 'number' ? offer_date : new Date(offer_date).getTime()) : now;
        const sDate = expected_start_date ? (typeof expected_start_date === 'number' ? expected_start_date : new Date(expected_start_date).getTime()) : now + 14 * 86400000;
        const pSal = Number(probation_salary) || 0;
        const oSal = Number(official_salary || salary_offer) || 0;

        await run(
            `UPDATE Offer SET candidate_id = ?, offer_date = ?, expected_start_date = ?, probation_salary = ?, official_salary = ?, salary_offer = ?, note = ?, offer_status = ?, last_modified_date = ?
       WHERE offer_id = ?`,
            [candidate_id, oDate, sDate, pSal, oSal, oSal, note || '', offer_status || 'Đã phát hành', now, req.params.id]
        );

        res.json({ success: true, message: 'Cập nhật Thư mời nhận việc (Offer) thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/offers/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM Offer WHERE offer_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Xóa Thư mời nhận việc (Offer) thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 6. QUYẾT ĐỊNH TRÚNG TUYỂN ---
router.get('/decisions', async (req, res) => {
    try {
        const decisions = await query(
            `SELECT decision.*, candidate.candidate_code, candidate.full_name AS candidate_name,
                    candidate.status AS candidate_status, evaluation.eval_code
             FROM RecruitmentDecision decision
             JOIN Candidate candidate ON candidate.candidate_id = decision.candidate_id
             LEFT JOIN InterviewEvaluation evaluation ON evaluation.interview_eval_id = decision.interview_eval_id
             ORDER BY decision.decision_date DESC, decision.created_date DESC`
        );
        res.json({ success: true, data: decisions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/decisions', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            decision_number,
            candidate_id,
            interview_eval_id,
            decision_date,
            result,
            rejection_reason,
            overall_comment,
            attachment_url
        } = req.body;
        const normalizedResult = String(result || '').trim().toLocaleUpperCase();
        if (!['ĐẠT', 'KHÔNG ĐẠT'].includes(normalizedResult)) {
            return res.status(400).json({ success: false, message: 'Kết quả quyết định phải là Đạt hoặc Không đạt.' });
        }
        if (normalizedResult === 'KHÔNG ĐẠT' && !String(rejection_reason || '').trim()) {
            return res.status(400).json({ success: false, message: 'Phải nhập lý do bị loại khi quyết định Không đạt.' });
        }

        const candidate = await queryOne('SELECT candidate_id FROM Candidate WHERE candidate_id = ?', [candidate_id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin ứng viên.' });
        }
        if (interview_eval_id) {
            const evaluation = await queryOne('SELECT interview_eval_id FROM InterviewEvaluation WHERE interview_eval_id = ? AND candidate_id = ?', [interview_eval_id, candidate_id]);
            if (!evaluation) {
                return res.status(400).json({ success: false, message: 'Phiếu đánh giá phỏng vấn không thuộc ứng viên đã chọn.' });
            }
        }
        const previousDecision = await queryOne(
            `SELECT decision_id FROM RecruitmentDecision
             WHERE candidate_id = ? AND status <> 'CANCELLED'`,
            [candidate_id]
        );
        if (previousDecision) {
            return res.status(409).json({ success: false, message: 'Ứng viên này đã có quyết định tuyển dụng.' });
        }

        const now = Date.now();
        const id = crypto.randomUUID();
        const count = (await queryOne('SELECT COUNT(*) AS count FROM RecruitmentDecision'))?.count || 0;
        const defaultNumber = `QDTD/${String(new Date().getFullYear()).slice(-2)}-${String(Number(count) + 1).padStart(4, '0')}`;
        const finalNumber = String(decision_number || '').trim() || defaultNumber;
        const decisionDate = decision_date ? new Date(decision_date).getTime() : now;

        await run(
            `INSERT INTO RecruitmentDecision (
                decision_id, created_date, last_modified_date, decision_number, candidate_id,
                interview_eval_id, decision_date, result, rejection_reason, overall_comment,
                decision_by_id, decision_by_name, status, attachment_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)`,
            [
                id, now, now, finalNumber, candidate_id, interview_eval_id || null,
                Number.isNaN(decisionDate) ? now : decisionDate, normalizedResult,
                normalizedResult === 'KHÔNG ĐẠT' ? String(rejection_reason).trim() : null,
                overall_comment || '', req.user.employeeId || null, req.user.fullName || '', attachment_url || null
            ]
        );
        await run(
            `UPDATE Candidate SET status = ?, rejection_reason = ?, last_modified_date = ? WHERE candidate_id = ?`,
            [normalizedResult === 'ĐẠT' ? 'S5: Trúng tuyển' : 'S7: Loại', normalizedResult === 'KHÔNG ĐẠT' ? String(rejection_reason).trim() : null, now, candidate_id]
        );

        res.json({ success: true, message: 'Đã lập quyết định tuyển dụng.', data: { id, decision_number: finalNumber } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 7. WORKFLOW: CHUYỂN ỨNG VIÊN THÀNH NHÂN VIÊN ---
router.post('/convert-to-employee', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { candidate_id } = req.body;
        const now = Date.now();

        const candidate = await queryOne(`SELECT c.*, COALESCE(req_plan.department_id, req_direct.department_id) AS department_id, COALESCE(req_plan.position_id, req_direct.position_id) AS position_id
             FROM Candidate c
             LEFT JOIN RecruitmentPlan pl ON c.recruitment_plan_id = pl.recruitment_plan_id
             LEFT JOIN RecruitmentRequest req_plan ON pl.recruitment_request_id = req_plan.recruitment_request_id
             LEFT JOIN RecruitmentRequest req_direct ON c.recruitment_request_id = req_direct.recruitment_request_id
             WHERE c.candidate_id = ?`, [candidate_id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin ứng viên.' });
        }
        if (candidate.status === 'HIRED') {
            return res.status(400).json({ success: false, message: 'Ứng viên này đã được chuyển thành nhân viên.' });
        }
        const hiringDecision = await queryOne(
            `SELECT TOP 1 decision_id FROM RecruitmentDecision
             WHERE candidate_id = ? AND result = N'ĐẠT' AND status = 'COMPLETED'
             ORDER BY decision_date DESC, created_date DESC`,
            [candidate_id]
        );
        if (!hiringDecision) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ ứng viên có quyết định trúng tuyển kết quả Đạt mới được chuyển thành nhân viên.'
            });
        }

        const offer = await queryOne(`SELECT * FROM Offer WHERE candidate_id = ?`, [candidate_id]);

        const empId = crypto.randomUUID();
        const empCode = 'NV-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);

        const joinDate = offer ? offer.expected_start_date : now;

        await run(
            `INSERT INTO Employee (employee_id, created_date, last_modified_date, employee_code, full_name, gender, date_of_birth, citizen_id, phone, email, address, candidate_id, department_id, position_id, join_date, initial_contract_date, employment_status, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WORKING', 1)`,
            [
                empId,
                now,
                now,
                empCode,
                candidate.full_name,
                candidate.gender || 'Nam',
                candidate.date_of_birth,
                candidate.citizen_id || '001099' + Math.floor(100000 + Math.random() * 900000),
                candidate.phone,
                candidate.email,
                candidate.address || 'Hà Nội',
                candidate_id,
                candidate.department_id,
                candidate.position_id,
                joinDate,
                joinDate
            ]
        );

        await run(`UPDATE Candidate SET status = 'HIRED', last_modified_date = ? WHERE candidate_id = ?`, [now, candidate_id]);

        const contractId = crypto.randomUUID();
        const contractNum = 'HDTV/BRAVO/' + new Date().getFullYear() + '/' + Math.floor(100 + Math.random() * 900);
        const salary = offer ? offer.salary_offer : 15000000;
        const probationEnd = new Date(Number(joinDate));
        probationEnd.setMonth(probationEnd.getMonth() + 2);

        await run(
            `INSERT INTO EmployeeContract (contract_id, created_date, last_modified_date, contract_no, contract_date, employee_id, contract_type, start_date, end_date, has_probation, probation_from_date, probation_to_date, probation_salary_rate, salary, status, note)
       VALUES (?, ?, ?, ?, ?, ?, 'Hợp đồng Thử việc (2 tháng)', ?, ?, 1, ?, ?, 100, ?, 'ACTIVE', 'Tự động tạo khi chuyển từ Ứng viên')`,
            [contractId, now, now, contractNum, joinDate, empId, joinDate, probationEnd.getTime(), joinDate, probationEnd.getTime(), salary]
        );

        res.json({
            success: true,
            message: `Chuyển ứng viên ${candidate.full_name} thành nhân viên chính thức thành công! Mã NV: ${empCode}`,
            data: { empId, empCode }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
