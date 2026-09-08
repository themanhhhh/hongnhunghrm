const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, queryOne, run } = require('../db/connection');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);

const rewardReaders = authorizeRole('Administrator', 'HR Staff', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng');
const rewardManagers = authorizeRole('Administrator', 'HR Staff', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng');

const toTimestamp = (value, fallback = Date.now()) => {
    if (!value) return fallback;
    return typeof value === 'number' ? value : new Date(value).getTime();
};

const normalizeType = (value) => value === 'KHEN_THUONG' || value === 'REWARD' ? 'KHEN_THUONG' : 'KY_LUAT';

const calculateEvaluation = (details) => {
    if (!Array.isArray(details) || details.length === 0) {
        throw new Error('Phiếu đánh giá phải có ít nhất một tiêu chí.');
    }
    const parsed = details.map((item) => ({
        ...item,
        weight: Number(item.weight),
        score: Number(item.score),
    }));
    if (parsed.some((item) => !Number.isFinite(item.weight) || item.weight <= 0 || !Number.isFinite(item.score) || item.score < 0 || item.score > 10)) {
        throw new Error('Trọng số phải lớn hơn 0 và điểm phải nằm trong khoảng 0 đến 10.');
    }
    const totalWeight = parsed.reduce((sum, item) => sum + item.weight, 0);
    const normalized = parsed.map((item) => ({ ...item, weight: item.weight * 100 / totalWeight }));
    const totalScore = Math.round(normalized.reduce((sum, item) => sum + item.score * item.weight / 100, 0) * 100) / 100;
    const gradeResult = totalScore >= 9 ? 'Loại A+ (Xuất sắc)' : totalScore >= 8 ? 'Loại A (Giỏi)' : totalScore >= 6.5 ? 'Loại B (Tốt)' : totalScore >= 5 ? 'Loại C (Trung bình)' : 'Loại D (Yếu)';
    return { normalized, totalScore, gradeResult };
};

// --- Danh sách Quyết định Khen thưởng & Kỷ luật ---
router.get('/', rewardReaders, async (req, res) => {
    const records = await query(
        `SELECT rd.*, e.full_name as employee_name, e.employee_code, d.department_name, p.position_name
     FROM RewardDiscipline rd
     JOIN Employee e ON rd.employee_id = e.employee_id
     LEFT JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN Position p ON e.position_id = p.position_id
     ORDER BY rd.decision_date DESC`
    );
    res.json({ success: true, data: records.map((record) => ({ ...record, decision_type: normalizeType(record.decision_type) })) });
});

// --- Tra cứu Lịch sử theo Nhân viên ---
router.get('/employee/:empId', rewardReaders, async (req, res) => {
    const records = await query(
        `SELECT * FROM RewardDiscipline WHERE employee_id = ? ORDER BY decision_date DESC`,
        [req.params.empId]
    );
    res.json({ success: true, data: records.map((record) => ({ ...record, decision_type: normalizeType(record.decision_type) })) });
});

// --- Thêm mới Quyết định ---
router.post('/', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { employee_id, decision_type, decision_date, effective_date, reason, content, decision_by, attachment_url, proposal_id, amount } = req.body;
        if (!employee_id || !decision_type || !reason || !proposal_id) return res.status(400).json({ success: false, message: 'Nhân viên, đề xuất liên kết, loại quyết định và lý do là bắt buộc.' });
        if (proposal_id) {
            const proposal = await queryOne(`SELECT proposal_id, employee_id, record_type, proposed_amount, status FROM RewardDisciplineProposal WHERE proposal_id = ?`, [proposal_id]);
            if (!proposal) return res.status(404).json({ success: false, message: 'Không tìm thấy đề xuất liên kết.' });
            if (proposal.status !== 'APPROVED') return res.status(400).json({ success: false, message: 'Chỉ đề xuất đã được duyệt mới được lập quyết định.' });
            if (proposal.employee_id !== employee_id) return res.status(400).json({ success: false, message: 'Nhân viên của quyết định không khớp với đề xuất.' });
        }
        const normalizedType = normalizeType(decision_type);
        const now = Date.now();
        const id = crypto.randomUUID();
        const prefix = normalizedType === 'KHEN_THUONG' ? 'QĐ-KT' : 'QĐ-KL';
        const decisionNo = `${prefix}/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`;

        const dDate = toTimestamp(decision_date, now);
        const eDate = toTimestamp(effective_date, now);

        await run(
            `INSERT INTO RewardDiscipline (reward_discipline_id, created_date, last_modified_date, employee_id, decision_no, decision_type, decision_date, effective_date, reason, content, decision_by, proposal_id, amount, status, attachment_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)`,
            [id, now, now, employee_id, decisionNo, normalizedType, dDate, eDate, reason, content || '', decision_by || req.user?.fullName || 'Người có thẩm quyền', proposal_id || null, Number(amount) || 0, attachment_url || null]
        );

        res.json({ success: true, data: { id }, message: `Thêm quyết định ${normalizedType === 'KHEN_THUONG' ? 'Khen thưởng' : 'Kỷ luật'} thành công!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Xóa Quyết định ---
router.delete('/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM RewardDiscipline WHERE reward_discipline_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Xóa quyết định thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- DANH MỤC TIÊU CHÍ ĐÁNH GIÁ NHÂN VIÊN ---
router.get('/criteria', rewardReaders, async (req, res) => {
    try {
        const list = await query(`SELECT * FROM EvaluationCriteria WHERE status = 1 ORDER BY criteria_code ASC`);
        const criteriaWithScales = [];
        for (const c of list) {
            const scales = await query(`SELECT * FROM EvaluationScale WHERE criteria_id = ? ORDER BY min_score DESC`, [c.criteria_id]);
            criteriaWithScales.push({ ...c, scales });
        }
        res.json({ success: true, data: criteriaWithScales });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/criteria', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { criteria_code, criteria_name, weight, description, scales } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();

        await run(
            `INSERT INTO EvaluationCriteria (criteria_id, created_date, last_modified_date, criteria_code, criteria_name, weight, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [id, now, now, criteria_code, criteria_name, weight || 25, description || '']
        );

        // Insert Scale grades if provided
        if (scales && Array.isArray(scales)) {
            for (const s of scales) {
                const scaleId = crypto.randomUUID();
                await run(
                    `INSERT INTO EvaluationScale (scale_id, criteria_id, grade_name, min_score, max_score, description)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [scaleId, id, s.grade_name, s.min_score || 0, s.max_score || 10, s.description || '']
                );
            }
        }

        res.json({ success: true, message: 'Thêm Tiêu chí Đánh giá thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PHIẾU ĐÁNH GIÁ NHÂN VIÊN ---
router.get('/evaluations', rewardReaders, async (req, res) => {
    try {
        const list = await query(
            `SELECT ev.*,
              emp.full_name as employee_name, emp.employee_code,
              eval.full_name as evaluator_name,
              d.department_name, p.position_name
       FROM EmployeeEvaluation ev
       JOIN Employee emp ON ev.employee_id = emp.employee_id
       JOIN Employee eval ON ev.evaluator_id = eval.employee_id
       LEFT JOIN Department d ON emp.department_id = d.department_id
       LEFT JOIN Position p ON emp.position_id = p.position_id
       ORDER BY ev.evaluation_date DESC`
        );

        const fullEvaluations = [];
        for (const item of list) {
            const details = await query(`SELECT * FROM EmployeeEvaluationDetail WHERE evaluation_id = ?`, [item.evaluation_id]);
            fullEvaluations.push({ ...item, details });
        }

        res.json({ success: true, data: fullEvaluations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/evaluations', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { evaluation_date, year, evaluator_id, employee_id, description, details } = req.body;
        if (!employee_id || !evaluator_id) return res.status(400).json({ success: false, message: 'Nhân viên và người đánh giá là bắt buộc.' });
        const calculation = calculateEvaluation(details);
        const now = Date.now();
        const id = crypto.randomUUID();
        const code = 'PĐG-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
        const evalDate = evaluation_date ? (typeof evaluation_date === 'number' ? evaluation_date : new Date(evaluation_date).getTime()) : now;

        // Fetch employee dept & position
        const emp = await queryOne(`SELECT department_id, position_id FROM Employee WHERE employee_id = ?`, [employee_id]);
        if (!emp) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên được đánh giá.' });
        const evaluator = await queryOne(`SELECT employee_id FROM Employee WHERE employee_id = ?`, [evaluator_id]);
        if (!evaluator) return res.status(404).json({ success: false, message: 'Không tìm thấy người đánh giá.' });

        await run(
            `INSERT INTO EmployeeEvaluation (evaluation_id, created_date, last_modified_date, evaluation_code, evaluation_date, year, evaluator_id, employee_id, department_id, position_id, total_score, grade_result, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')`,
            [id, now, now, code, evalDate, year || new Date().getFullYear(), evaluator_id, employee_id, emp?.department_id || null, emp?.position_id || null, calculation.totalScore, calculation.gradeResult, description || '']
        );

        // Insert Evaluation Details
        if (calculation.normalized) {
            for (const d of calculation.normalized) {
                const detailId = crypto.randomUUID();
                await run(
                    `INSERT INTO EmployeeEvaluationDetail (detail_id, evaluation_id, criteria_id, criteria_code, criteria_name, weight, score, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [detailId, id, d.criteria_id, d.criteria_code || '', d.criteria_name || '', d.weight, d.score, d.note || '']
                );
            }
        }

        res.json({ success: true, message: 'Lập Phiếu Đánh giá Nhân viên thành công!', data: { id, code, totalScore: calculation.totalScore, gradeResult: calculation.gradeResult } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PHIẾU ĐỀ XUẤT KHEN THƯỞNG / KỶ LUẬT ---
router.get('/proposals', rewardReaders, async (req, res) => {
    try {
        const list = await query(
            `SELECT rdp.*, e.full_name as employee_name, e.employee_code, d.department_name, p.position_name
       FROM RewardDisciplineProposal rdp
       JOIN Employee e ON rdp.employee_id = e.employee_id
       LEFT JOIN Department d ON e.department_id = d.department_id
       LEFT JOIN Position p ON e.position_id = p.position_id
       ORDER BY rdp.created_date DESC`
        );
        res.json({ success: true, data: list.map((proposal) => ({ ...proposal, record_type: normalizeType(proposal.record_type) })) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/proposals', rewardManagers, async (req, res) => {
    try {
        const { record_type, employee_id, proposed_amount, reason, proposed_by, proposal_date, content, proposed_by_employee_id, attachment_url } = req.body;
        if (!employee_id || !record_type || !reason) return res.status(400).json({ success: false, message: 'Nhân viên, loại đề xuất và lý do là bắt buộc.' });
        const employee = await queryOne(`SELECT employee_id FROM Employee WHERE employee_id = ?`, [employee_id]);
        if (!employee) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên được đề xuất.' });
        const now = Date.now();
        const id = crypto.randomUUID();
        const normalizedType = normalizeType(record_type);
        const prefix = normalizedType === 'KHEN_THUONG' ? 'DXKT' : 'DXKL';
        const code = `${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        await run(
            `INSERT INTO RewardDisciplineProposal (proposal_id, created_date, last_modified_date, proposal_code, record_type, employee_id, proposed_amount, proposal_date, reason, content, proposed_by_employee_id, proposed_by, attachment_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [id, now, now, code, normalizedType, employee_id, Number(proposed_amount) || 0, toTimestamp(proposal_date, now), reason, content || '', proposed_by_employee_id || req.user?.employeeId || null, proposed_by || req.user?.fullName || 'Người đề xuất', attachment_url || null]
        );

        res.json({ success: true, data: { id }, message: 'Tạo Phiếu Đề xuất Khen thưởng / Kỷ luật thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/proposals/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM RewardDisciplineProposal WHERE proposal_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Đề xuất Khen thưởng/Kỷ luật thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/criteria/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const usage = await queryOne(`SELECT COUNT(*) as cnt FROM EmployeeEvaluationDetail WHERE criteria_id = ?`, [req.params.id]);
        if (usage && usage.cnt > 0) {
            return res.status(400).json({ success: false, message: `Tiêu chí đang được sử dụng trong ${usage.cnt} phiếu đánh giá. Không thể xóa trực tiếp.` });
        }
        await run(`DELETE FROM EvaluationScale WHERE criteria_id = ?`, [req.params.id]);
        await run(`UPDATE EvaluationCriteria SET status = 0 WHERE criteria_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Tiêu chí Đánh giá thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/evaluations/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM EmployeeEvaluationDetail WHERE evaluation_id = ?`, [req.params.id]);
        await run(`DELETE FROM EmployeeEvaluation WHERE evaluation_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Phiếu Đánh giá Nhân viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/criteria/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { criteria_code, criteria_name, weight, description, scales } = req.body;
        if (!criteria_code || !criteria_name || Number(weight) <= 0) return res.status(400).json({ success: false, message: 'Mã, tên và trọng số tiêu chí là bắt buộc.' });
        const now = Date.now();
        await run(`UPDATE EvaluationCriteria SET last_modified_date = ?, criteria_code = ?, criteria_name = ?, weight = ?, description = ? WHERE criteria_id = ?`, [now, criteria_code, criteria_name, Number(weight), description || '', req.params.id]);
        await run(`DELETE FROM EvaluationScale WHERE criteria_id = ?`, [req.params.id]);
        for (const scale of Array.isArray(scales) ? scales : []) {
            await run(`INSERT INTO EvaluationScale (scale_id, criteria_id, grade_name, min_score, max_score, description) VALUES (?, ?, ?, ?, ?, ?)`, [crypto.randomUUID(), req.params.id, scale.grade_name, Number(scale.min_score) || 0, Number(scale.max_score) || 10, scale.description || '']);
        }
        res.json({ success: true, message: 'Cập nhật tiêu chí đánh giá thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/evaluations/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { evaluation_date, year, evaluator_id, employee_id, description, details } = req.body;
        const calculation = calculateEvaluation(details);
        const emp = await queryOne(`SELECT department_id, position_id FROM Employee WHERE employee_id = ?`, [employee_id]);
        if (!emp) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên được đánh giá.' });
        const now = Date.now();
        await run(`UPDATE EmployeeEvaluation SET last_modified_date = ?, evaluation_date = ?, year = ?, evaluator_id = ?, employee_id = ?, department_id = ?, position_id = ?, total_score = ?, grade_result = ?, description = ? WHERE evaluation_id = ?`, [now, toTimestamp(evaluation_date, now), year || new Date().getFullYear(), evaluator_id, employee_id, emp.department_id || null, emp.position_id || null, calculation.totalScore, calculation.gradeResult, description || '', req.params.id]);
        await run(`DELETE FROM EmployeeEvaluationDetail WHERE evaluation_id = ?`, [req.params.id]);
        for (const detail of calculation.normalized) {
            await run(`INSERT INTO EmployeeEvaluationDetail (detail_id, evaluation_id, criteria_id, criteria_code, criteria_name, weight, score, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [crypto.randomUUID(), req.params.id, detail.criteria_id, detail.criteria_code || '', detail.criteria_name || '', detail.weight, detail.score, detail.note || '']);
        }
        res.json({ success: true, message: 'Cập nhật phiếu đánh giá thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/proposals/:id/status', rewardManagers, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái đề xuất không hợp lệ.' });
        const result = await run(`UPDATE RewardDisciplineProposal SET last_modified_date = ?, status = ? WHERE proposal_id = ?`, [Date.now(), status, req.params.id]);
        if (!result?.changes) return res.status(404).json({ success: false, message: 'Không tìm thấy đề xuất.' });
        res.json({ success: true, message: status === 'APPROVED' ? 'Đã duyệt đề xuất.' : status === 'REJECTED' ? 'Đã từ chối đề xuất.' : 'Đã cập nhật đề xuất.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/proposals/:id', rewardManagers, async (req, res) => {
    try {
        const { record_type, employee_id, proposed_amount, reason, proposed_by, proposal_date, content, proposed_by_employee_id, attachment_url } = req.body;
        if (!record_type || !employee_id || !reason) return res.status(400).json({ success: false, message: 'Nhân viên, loại đề xuất và lý do là bắt buộc.' });
        await run(`UPDATE RewardDisciplineProposal SET last_modified_date = ?, record_type = ?, employee_id = ?, proposed_amount = ?, proposal_date = ?, reason = ?, content = ?, proposed_by_employee_id = ?, proposed_by = ?, attachment_url = ?, status = 'PENDING' WHERE proposal_id = ?`, [Date.now(), normalizeType(record_type), employee_id, Number(proposed_amount) || 0, toTimestamp(proposal_date), reason, content || '', proposed_by_employee_id || null, proposed_by || '', attachment_url || null, req.params.id]);
        res.json({ success: true, message: 'Cập nhật đề xuất thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { employee_id, decision_type, decision_date, effective_date, reason, content, decision_by, proposal_id, amount, attachment_url } = req.body;
        if (!employee_id || !decision_type || !reason || !proposal_id) return res.status(400).json({ success: false, message: 'Nhân viên, đề xuất liên kết, loại quyết định và lý do là bắt buộc.' });
        const proposal = await queryOne(`SELECT employee_id, status FROM RewardDisciplineProposal WHERE proposal_id = ?`, [proposal_id]);
        if (!proposal || proposal.status !== 'APPROVED' || proposal.employee_id !== employee_id) return res.status(400).json({ success: false, message: 'Đề xuất phải tồn tại, được duyệt và cùng nhân viên với quyết định.' });
        await run(`UPDATE RewardDiscipline SET last_modified_date = ?, employee_id = ?, decision_type = ?, decision_date = ?, effective_date = ?, reason = ?, content = ?, decision_by = ?, proposal_id = ?, amount = ?, attachment_url = ? WHERE reward_discipline_id = ?`, [Date.now(), employee_id, normalizeType(decision_type), toTimestamp(decision_date), toTimestamp(effective_date), reason, content || '', decision_by || '', proposal_id || null, Number(amount) || 0, attachment_url || null, req.params.id]);
        res.json({ success: true, message: 'Cập nhật quyết định thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/criteria/:id', rewardReaders, async (req, res) => {
    const criteria = await queryOne(`SELECT * FROM EvaluationCriteria WHERE criteria_id = ?`, [req.params.id]);
    if (!criteria) return res.status(404).json({ success: false, message: 'Không tìm thấy tiêu chí.' });
    criteria.scales = await query(`SELECT * FROM EvaluationScale WHERE criteria_id = ? ORDER BY min_score DESC`, [req.params.id]);
    res.json({ success: true, data: [criteria] });
});

router.get('/evaluations/:id', rewardReaders, async (req, res) => {
    const evaluation = await queryOne(`SELECT ev.*, emp.full_name as employee_name, eval.full_name as evaluator_name FROM EmployeeEvaluation ev JOIN Employee emp ON ev.employee_id = emp.employee_id JOIN Employee eval ON ev.evaluator_id = eval.employee_id WHERE ev.evaluation_id = ?`, [req.params.id]);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu đánh giá.' });
    evaluation.details = await query(`SELECT * FROM EmployeeEvaluationDetail WHERE evaluation_id = ?`, [req.params.id]);
    res.json({ success: true, data: [evaluation] });
});

router.get('/proposals/:id', rewardReaders, async (req, res) => {
    const proposal = await queryOne(`SELECT rdp.*, e.full_name as employee_name, e.employee_code FROM RewardDisciplineProposal rdp JOIN Employee e ON rdp.employee_id = e.employee_id WHERE rdp.proposal_id = ?`, [req.params.id]);
    if (!proposal) return res.status(404).json({ success: false, message: 'Không tìm thấy đề xuất.' });
    res.json({ success: true, data: [{ ...proposal, record_type: normalizeType(proposal.record_type) }] });
});

router.get('/:id', rewardReaders, async (req, res) => {
    const record = await queryOne(`SELECT rd.*, e.full_name as employee_name, e.employee_code FROM RewardDiscipline rd JOIN Employee e ON rd.employee_id = e.employee_id WHERE rd.reward_discipline_id = ?`, [req.params.id]);
    if (!record) return res.status(404).json({ success: false, message: 'Không tìm thấy quyết định.' });
    res.json({ success: true, data: [{ ...record, decision_type: normalizeType(record.decision_type) }] });
});

module.exports = router;
