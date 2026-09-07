const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const { query, queryOne, run } = require('../db/connection');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const approvalWorkflow = require('../services/approvalWorkflow');

router.use(authenticateToken);

const parseDate = (d) => {
    if (!d) return null;
    if (typeof d === 'number') return isNaN(d) ? null : d;
    const t = new Date(d).getTime();
    return isNaN(t) ? null : t;
};

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

async function updateExtendedEmployeeFields(employeeId, input, now) {
    const dateFields = new Set(['citizen_expiry_date', 'initial_contract_date']);
    const numberFields = new Set(['gpa', 'graduation_year']);
    const fields = [
        'candidate_id', 'blood_type', 'tax_code', 'citizen_expiry_date',
        'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
        'bank_account_number', 'bank_account_holder', 'bank_name', 'bank_branch',
        'culture_level', 'education_level', 'education_school', 'major', 'gpa',
        'graduation_year', 'initial_contract_date'
    ];
    const assignments = [];
    const values = [];

    for (const field of fields) {
        if (!hasOwn(input, field)) continue;
        let value = input[field];
        if (dateFields.has(field)) value = parseDate(value);
        if (numberFields.has(field)) {
            const number = Number(value);
            value = value === '' || value === null || value === undefined || Number.isNaN(number) ? null : number;
        }
        assignments.push(`${field} = ?`);
        values.push(value ?? null);
    }

    if (assignments.length === 0) return;
    assignments.push('last_modified_date = ?');
    values.push(now, employeeId);
    await run(`UPDATE Employee SET ${assignments.join(', ')} WHERE employee_id = ?`, values);
}


const avatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!avatarMimeTypes.has(file.mimetype)) {
            const error = new Error('Ảnh hồ sơ chỉ hỗ trợ định dạng JPEG, PNG hoặc WebP.');
            error.status = 400;
            return cb(error);
        }
        cb(null, true);
    }
});

function uploadAvatar(req, res, next) {
    upload.single('avatar')(req, res, (error) => {
        if (!error) return next();
        error.status = error.code === 'LIMIT_FILE_SIZE' ? 400 : (error.status || 400);
        if (error.code === 'LIMIT_FILE_SIZE') error.message = 'Ảnh hồ sơ không được vượt quá 5 MB.';
        next(error);
    });
}

function pinataGatewayUrl(cid) {
    const gateway = (process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud').replace(/\/+$/, '');
    return `${gateway}/ipfs/${cid}`;
}

// --- 0. DANH MỤC PHÒNG BÀN (DEPARTMENTS) ---
router.get('/departments', async (req, res) => {
    const depts = await query(
        `SELECT d.*, e.full_name as manager_name, pd.department_name as parent_department_name
     FROM Department d 
     LEFT JOIN Employee e ON d.manager_id = e.employee_id 
     LEFT JOIN Department pd ON d.parent_department_id = pd.department_id
     WHERE d.status = 1 ORDER BY d.created_date ASC`
    );
    res.json({ success: true, data: depts });
});

// --- 1. HỒ SƠ NHÂN VIÊN (EMPLOYEES) ---
// Nhân viên thường KHÔNG được xem danh sách toàn bộ nhân sự - chỉ các vai trò quản lý/HR/Admin
router.get('/employees', authorizeRole('Administrator', 'HR Staff', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    const employees = await query(
        `SELECT e.*, d.department_name, p.position_name, m.full_name as manager_name
     FROM Employee e
     LEFT JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN Position p ON e.position_id = p.position_id
     LEFT JOIN Employee m ON e.manager_id = m.employee_id
     WHERE e.is_active = 1 ORDER BY e.created_date DESC`
    );
    res.json({ success: true, data: employees });
});

// Hồ sơ của chính người đang đăng nhập - AI cũng gọi được, không cần quyền đặc biệt vì chỉ trả về dữ liệu của chính họ
router.get('/employees/me', async (req, res) => {
    if (!req.user.employeeId) {
        return res.status(404).json({ success: false, message: 'Tài khoản này chưa được liên kết với hồ sơ nhân viên nào.' });
    }
    req.params.id = req.user.employeeId;
    return await getEmployeeDetail(req, res);
});

router.get('/employees/:id', async (req, res) => {
    // Nhân viên thường chỉ được xem hồ sơ của chính mình - không được xem người khác dù biết ID
    const isPrivileged = ['Administrator', 'HR Staff', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng'].includes(req.user.roleName);
    if (!isPrivileged && req.params.id !== req.user.employeeId) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem hồ sơ nhân viên khác.' });
    }
    return await getEmployeeDetail(req, res);
});

async function getEmployeeDetail(req, res) {
    const employee = await queryOne(
        `SELECT e.*, d.department_name, p.position_name, m.full_name as manager_name
     FROM Employee e
     LEFT JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN Position p ON e.position_id = p.position_id
     LEFT JOIN Employee m ON e.manager_id = m.employee_id
     WHERE e.employee_id = ?`,
        [req.params.id]
    );

    if (!employee) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nhân viên.' });
    }

    const contracts = await query(`SELECT * FROM EmployeeContract WHERE employee_id = ? ORDER BY sign_date DESC`, [req.params.id]);
    const workHistory = await query(
        `SELECT wh.*, fd.department_name as department_name, fp.position_name as position_name
     FROM WorkHistory wh
     LEFT JOIN Department fd ON wh.department_id = fd.department_id
     LEFT JOIN Position fp ON wh.position_id = fp.position_id
     WHERE wh.employee_id = ? ORDER BY wh.effective_date DESC`,
        [req.params.id]
    );
    const rewards = await query(`SELECT * FROM RewardDiscipline WHERE employee_id = ? ORDER BY decision_date DESC`, [req.params.id]);
    const leaveBalances = await query(`SELECT * FROM EmployeeLeaveBalance WHERE employee_id = ? ORDER BY leave_year DESC`, [req.params.id]);

    res.json({
        success: true,
        data: {
            ...employee,
            contracts,
            workHistory,
            rewards,
            leaveBalances
        }
    });
}

router.post('/employees', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            employee_code, short_name, full_name, gender, date_of_birth, place_of_birth,
            is_foreign, hometown, nationality, ethnicity, religion, marital_status,
            citizen_id, citizen_issue_date, citizen_issue_place, phone, email,
            personal_email, company_email, address, permanent_address,
            department_id, position_id, manager_id, level,
            join_date, official_date, resignation_date, employment_status, note
        } = req.body;

        const now = Date.now();
        const id = crypto.randomUUID();
        const empCode = employee_code || short_name || ('NV-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900));

        const dob = parseDate(date_of_birth);
        const cidDate = parseDate(citizen_issue_date);
        const jDate = parseDate(join_date) || now;
        const oDate = parseDate(official_date) || (now + 60 * 86400000);
        const resDate = parseDate(resignation_date);

        await run(
            `INSERT INTO Employee (
        employee_id, created_date, last_modified_date, employee_code, short_name, full_name, gender, date_of_birth, place_of_birth,
        is_foreign, hometown, nationality, ethnicity, religion, marital_status,
        citizen_id, citizen_issue_date, citizen_issue_place, phone, email, personal_email, company_email, address, permanent_address,
        department_id, position_id, manager_id, level, join_date, official_date, resignation_date, employment_status, note, is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                id, now, now, empCode, short_name || empCode, full_name, gender || 'Nam', dob, place_of_birth,
                is_foreign ? 1 : 0, hometown, nationality || 'Việt Nam', ethnicity || 'Kinh', religion || 'Không', marital_status || 'Độc thân',
                citizen_id, cidDate, citizen_issue_place, phone, email || company_email || personal_email, personal_email || email, company_email || email, address, permanent_address,
                department_id || null, position_id || null, manager_id || null, level || 'Nhân viên', jDate, oDate, resDate, employment_status || 'WORKING', note || ''
            ]
        );
        await updateExtendedEmployeeFields(id, req.body, now);

        res.json({ success: true, message: 'Tạo hồ sơ nhân viên thành công!', data: { id, empCode } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/employees/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            employee_code, short_name, full_name, gender, date_of_birth, place_of_birth,
            is_foreign, hometown, nationality, ethnicity, religion, marital_status,
            citizen_id, citizen_issue_date, citizen_issue_place, phone, email,
            personal_email, company_email, address, permanent_address,
            department_id, position_id, manager_id, level,
            join_date, official_date, resignation_date, employment_status, note
        } = req.body;

        const now = Date.now();
        const dob = parseDate(date_of_birth);
        const cidDate = parseDate(citizen_issue_date);
        const jDate = parseDate(join_date);
        const oDate = parseDate(official_date);
        const resDate = parseDate(resignation_date);

        await run(
            `UPDATE Employee 
       SET employee_code = ?, short_name = ?, full_name = ?, gender = ?, date_of_birth = ?, place_of_birth = ?,
           is_foreign = ?, hometown = ?, nationality = ?, ethnicity = ?, religion = ?, marital_status = ?,
           citizen_id = ?, citizen_issue_date = ?, citizen_issue_place = ?,
           phone = ?, email = ?, personal_email = ?, company_email = ?, address = ?, permanent_address = ?,
           department_id = ?, position_id = ?, manager_id = ?, level = ?,
           join_date = ?, official_date = ?, resignation_date = ?, employment_status = ?, note = ?, last_modified_date = ?
       WHERE employee_id = ?`,
            [
                employee_code, short_name || employee_code, full_name, gender, dob, place_of_birth,
                is_foreign ? 1 : 0, hometown, nationality || 'Việt Nam', ethnicity || 'Kinh', religion || 'Không', marital_status || 'Độc thân',
                citizen_id, cidDate, citizen_issue_place,
                phone, email || company_email || personal_email, personal_email || email, company_email || email, address, permanent_address,
                department_id || null, position_id || null, manager_id || null, level || 'Nhân viên',
                jDate, oDate, resDate, employment_status, note, now, req.params.id
            ]
        );
        await updateExtendedEmployeeFields(req.params.id, req.body, now);

        res.json({ success: true, message: 'Cập nhật hồ sơ nhân viên thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/employees/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const empId = req.params.id;
        const emp = await queryOne(`SELECT * FROM Employee WHERE employee_id = ?`, [empId]);
        if (!emp) {
            return res.status(404).json({ success: false, message: 'Hồ sơ nhân sự không tồn tại.' });
        }

        // Business Rule 1: Direct Manager Check
        const managedStaff = await query(`SELECT full_name FROM Employee WHERE manager_id = ? AND is_active = 1 AND employee_id != ?`, [empId, empId]);
        if (managedStaff.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa nhân sự '${emp.full_name}' do đang là Người quản lý trực tiếp của ${managedStaff.length} nhân viên khác. Vui lòng bàn giao công việc quản lý trước khi xóa.`
            });
        }

        // Business Rule 2: Department Manager Check
        const deptMgr = await queryOne(`SELECT department_name FROM Department WHERE manager_id = ? AND status = 1`, [empId]);
        if (deptMgr) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa nhân sự '${emp.full_name}' do đang giữ vị trí Trưởng phòng của '${deptMgr.department_name}'. Vui lòng bổ nhiệm Trưởng phòng mới trước khi xóa.`
            });
        }

        await run(`UPDATE Employee SET is_active = 0, employment_status = 'RESIGNED', last_modified_date = ? WHERE employee_id = ?`, [Date.now(), empId]);
        res.json({ success: true, message: 'Đã xóa hồ sơ nhân sự thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/employees/:id/avatar', authorizeRole('Administrator', 'HR Staff'), uploadAvatar, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Chưa chọn file ảnh đại diện.' });
        }
        if (!process.env.PINATA_JWT) {
            return res.status(503).json({ success: false, message: 'Chưa cấu hình PINATA_JWT trên máy chủ.' });
        }
        const employee = await queryOne('SELECT employee_id FROM Employee WHERE employee_id = ?', [req.params.id]);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Hồ sơ nhân viên không tồn tại.' });
        }

        const formData = new FormData();
        formData.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
        formData.append('network', 'public');
        formData.append('name', `employee-avatar-${req.params.id}`);
        formData.append('keyvalues', JSON.stringify({ keyvalues: { employee_id: req.params.id, resource: 'employee-avatar' } }));

        const pinataResponse = await fetch('https://uploads.pinata.cloud/v3/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
            body: formData
        });
        const pinataBody = await pinataResponse.json().catch(() => null);
        const cid = pinataBody?.data?.cid;
        if (!pinataResponse.ok || !cid) {
            return res.status(502).json({
                success: false,
                message: pinataBody?.error?.message || pinataBody?.message || 'Pinata không thể lưu ảnh hồ sơ.'
            });
        }

        const avatarUrl = pinataGatewayUrl(cid);
        const now = Date.now();

        await run(`UPDATE Employee SET avatar_url = ?, last_modified_date = ? WHERE employee_id = ?`, [avatarUrl, now, req.params.id]);

        res.json({ success: true, message: 'Tải ảnh đại diện thành công!', data: { avatarUrl, cid } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2. HỢP ĐỒNG LAO ĐỘNG (EMPLOYEE CONTRACTS) ---
router.get('/contracts', async (req, res) => {
    const contracts = await query(
        `SELECT c.*, e.full_name as employee_name, e.employee_code, d.department_name, p.position_name
     FROM EmployeeContract c
     JOIN Employee e ON c.employee_id = e.employee_id
     LEFT JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN Position p ON e.position_id = p.position_id
     ORDER BY c.created_date DESC`
    );
    const parsed = contracts.map(c => {
        let allowances = [];
        try {
            if (c.allowance_details) allowances = JSON.parse(c.allowance_details);
        } catch (e) { }
        return {
            ...c,
            allowance_details: allowances
        };
    });
    res.json({ success: true, data: parsed });
});

router.post('/contracts', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            contract_no,
            contract_date,
            signer_id,
            signer_name,
            signer_position,
            employee_id,
            employee_position,
            contract_type,
            start_date,
            end_date,
            has_probation,
            probation_from_date,
            probation_to_date,
            probation_salary_rate,
            job_description,
            salary_scale,
            salary_grade,
            allowance_details,
            base_salary,
            social_insurance_salary,
            salary,
            status,
            note
        } = req.body;

        const now = Date.now();
        const id = crypto.randomUUID();

        // Auto-generate standard contract_no format HĐLĐ/yy-000 if not provided
        const yr = new Date().getFullYear().toString().slice(-2);
        const countRow = await queryOne(`SELECT COUNT(*) as count FROM EmployeeContract`);
        const count = (countRow ? countRow.count : 0) + 1;
        const defaultContractNo = `HĐLĐ/${yr}-${String(count).padStart(3, '0')}`;
        const finalContractNo = contract_no && contract_no.trim() ? contract_no.trim() : defaultContractNo;

        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        const cDate = parseDate(contract_date) || now;
        const sDate = parseDate(start_date) || now;
        const eDate = parseDate(end_date);
        const pFrom = parseDate(probation_from_date);
        const pTo = parseDate(probation_to_date);
        const hasProbation = has_probation === true || Number(has_probation) === 1 || /thử việc/i.test(contract_type || '');

        const allowanceJson = Array.isArray(allowance_details) ? JSON.stringify(allowance_details) : (typeof allowance_details === 'string' ? allowance_details : '[]');
        const finalSalary = Number(base_salary || salary || 0);

        await run(
            `INSERT INTO EmployeeContract (
        contract_id, created_date, last_modified_date, contract_no, contract_date,
        signer_id, signer_name, signer_position, employee_id, employee_position,
         contract_type, start_date, end_date, has_probation, probation_from_date, probation_to_date, probation_salary_rate,
         job_description, salary_scale, salary_grade, allowance_details, base_salary,
         social_insurance_salary, salary, status, note
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, now, now, finalContractNo, cDate,
                signer_id || null, signer_name || '', signer_position || '', employee_id, employee_position || '',
                 contract_type || 'Hợp đồng thử việc', sDate, eDate, hasProbation ? 1 : 0, pFrom, pTo, hasProbation ? Number(probation_salary_rate || 0) : null,
                job_description || '', salary_scale || '', salary_grade || '', allowanceJson, Number(base_salary || 0),
                Number(social_insurance_salary || 0), finalSalary, status || 'ACTIVE', note || ''
            ]
        );

        res.json({ success: true, message: 'Lập hợp đồng lao động mới thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/contracts/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            contract_no,
            contract_date,
            signer_id,
            signer_name,
            signer_position,
            employee_id,
            employee_position,
            contract_type,
            start_date,
            end_date,
            has_probation,
            probation_from_date,
            probation_to_date,
            probation_salary_rate,
            job_description,
            salary_scale,
            salary_grade,
            allowance_details,
            base_salary,
            social_insurance_salary,
            salary,
            status,
            note
        } = req.body;

        const now = Date.now();
        const contractId = req.params.id;

        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        const cDate = parseDate(contract_date);
        const sDate = parseDate(start_date);
        const eDate = parseDate(end_date);
        const pFrom = parseDate(probation_from_date);
        const pTo = parseDate(probation_to_date);
        const hasProbation = has_probation === true || Number(has_probation) === 1 || /thử việc/i.test(contract_type || '');

        const allowanceJson = Array.isArray(allowance_details) ? JSON.stringify(allowance_details) : (typeof allowance_details === 'string' ? allowance_details : '[]');
        const finalSalary = Number(base_salary || salary || 0);

        await run(
            `UPDATE EmployeeContract SET
        contract_no = ?, contract_date = ?, signer_id = ?, signer_name = ?, signer_position = ?,
         employee_id = ?, employee_position = ?, contract_type = ?, start_date = ?, end_date = ?, has_probation = ?,
         probation_from_date = ?, probation_to_date = ?, probation_salary_rate = ?, job_description = ?, salary_scale = ?, salary_grade = ?,
        allowance_details = ?, base_salary = ?, social_insurance_salary = ?, salary = ?, status = ?,
        note = ?, last_modified_date = ?
       WHERE contract_id = ?`,
            [
                contract_no, cDate, signer_id || null, signer_name || '', signer_position || '',
                 employee_id, employee_position || '', contract_type, sDate, eDate, hasProbation ? 1 : 0,
                 pFrom, pTo, hasProbation ? Number(probation_salary_rate || 0) : null, job_description || '', salary_scale || '', salary_grade || '',
                allowanceJson, Number(base_salary || 0), Number(social_insurance_salary || 0), finalSalary, status || 'ACTIVE',
                note || '', now, contractId
            ]
        );

        res.json({ success: true, message: 'Cập nhật hợp đồng lao động thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/contracts/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM EmployeeContract WHERE contract_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Hợp đồng lao động thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/contracts/:id/appendices', async (req, res) => {
    try {
        const appendices = await query(
            `SELECT appendix.*, signer.full_name AS signer_full_name
             FROM ContractAppendix appendix
             LEFT JOIN Employee signer ON signer.employee_id = appendix.signer_id
             WHERE appendix.contract_id = ?
             ORDER BY appendix.effective_date DESC, appendix.created_date DESC`,
            [req.params.id]
        );
        res.json({ success: true, data: appendices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/contracts/:id/appendices', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            appendix_no,
            signed_date,
            appendix_type,
            effective_date,
            changed_content,
            signer_id,
            signer_name,
            attachment_url,
            note
        } = req.body;
        if (!String(appendix_type || '').trim()) {
            return res.status(400).json({ success: false, message: 'Phải chọn loại phụ lục hợp đồng.' });
        }
        const contract = await queryOne('SELECT contract_id FROM EmployeeContract WHERE contract_id = ?', [req.params.id]);
        if (!contract) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng lao động.' });
        }

        const now = Date.now();
        const count = (await queryOne('SELECT COUNT(*) AS count FROM ContractAppendix'))?.count || 0;
        const appendixNo = String(appendix_no || '').trim() || `PLHĐ/${String(new Date().getFullYear()).slice(-2)}-${String(Number(count) + 1).padStart(4, '0')}`;
        const toDate = (value) => value ? (typeof value === 'number' ? value : new Date(value).getTime()) : null;
        await run(
            `INSERT INTO ContractAppendix (appendix_id, contract_id, appendix_no, signed_date, appendix_type, effective_date, changed_content, signer_id, signer_name, attachment_url, note, status, created_date, last_modified_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
            [crypto.randomUUID(), req.params.id, appendixNo, toDate(signed_date), appendix_type, toDate(effective_date), changed_content || '', signer_id || null, signer_name || '', attachment_url || null, note || '', now, now]
        );
        res.json({ success: true, message: 'Đã thêm phụ lục hợp đồng.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 3. QUÁ TRÌNH CÔNG TÁC (WORK HISTORY) ---
router.get('/work-history', async (req, res) => {
    const histories = await query(
        `SELECT wh.*, e.full_name as employee_name, e.employee_code,
            d.department_name, p.position_name
     FROM WorkHistory wh
     JOIN Employee e ON wh.employee_id = e.employee_id
     LEFT JOIN Department d ON wh.department_id = d.department_id
     LEFT JOIN Position p ON wh.position_id = p.position_id
     ORDER BY wh.effective_date DESC`
    );
    res.json({ success: true, data: histories });
});

router.post('/work-history', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { employee_id, department_id, position_id, decision_type, effective_date, reason, note } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();

        const effDate = effective_date ? (typeof effective_date === 'number' ? effective_date : new Date(effective_date).getTime()) : now;

        await run(
            `INSERT INTO WorkHistory (work_history_id, created_date, last_modified_date, employee_id, department_id, position_id, decision_type, effective_date, reason, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, now, now, employee_id, department_id || null, position_id || null, decision_type, effDate, reason, note || '']
        );

        // Cập nhật thông tin phòng ban & chức vụ mới nếu có điều chuyển
        if (department_id || position_id) {
            const updates = [];
            const params = [];
            if (department_id) { updates.push('department_id = ?'); params.push(department_id); }
            if (position_id) { updates.push('position_id = ?'); params.push(position_id); }
            updates.push('last_modified_date = ?'); params.push(now);
            params.push(employee_id);

            await run(`UPDATE Employee SET ${updates.join(', ')} WHERE employee_id = ?`, params);
        }

        res.json({ success: true, message: 'Ghi nhận quá trình công tác thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 4. CẢNH BÁO HỢP ĐỒNG LAO ĐỘNG SẮP HẾT HẠN (< 30 NGÀY) ---
router.get('/expiring-contracts', async (req, res) => {
    try {
        const thirtyDaysFromNow = Date.now() + 30 * 86400000;
        const expiringContracts = await query(
            `SELECT c.*, e.full_name as employee_name, e.employee_code, d.department_name, p.position_name
       FROM EmployeeContract c
       JOIN Employee e ON c.employee_id = e.employee_id
       LEFT JOIN Department d ON e.department_id = d.department_id
       LEFT JOIN Position p ON e.position_id = p.position_id
       WHERE c.status = 'ACTIVE' AND c.end_date IS NOT NULL AND c.end_date <= ?
       ORDER BY c.end_date ASC`,
            [thirtyDaysFromNow]
        );
        res.json({ success: true, data: expiringContracts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 5. ĐỀ XUẤT HỢP ĐỒNG LAO ĐỘNG (CONTRACT PROPOSALS) ---
router.get('/contract-proposals', async (req, res) => {
    const list = await query(
        `SELECT cp.*, e.full_name as employee_name, e.employee_code, d.department_name
     FROM ContractProposal cp
     JOIN Employee e ON cp.employee_id = e.employee_id
     LEFT JOIN Department d ON e.department_id = d.department_id
     ORDER BY cp.created_date DESC`
    );
    res.json({ success: true, data: list });
});

router.post('/contract-proposals', async (req, res) => {
    try {
        const { employee_id, contract_type, proposed_salary, proposed_start_date, reason } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();
        const code = 'DXHD-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
        const stDate = proposed_start_date ? (typeof proposed_start_date === 'number' ? proposed_start_date : new Date(proposed_start_date).getTime()) : now;

        await run(
            `INSERT INTO ContractProposal (proposal_id, created_date, last_modified_date, proposal_code, employee_id, contract_type, proposed_salary, proposed_start_date, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [id, now, now, code, employee_id, contract_type, proposed_salary || 0, stDate, reason || '']
        );

        res.json({ success: true, message: 'Tạo Phiếu Đề xuất HĐLĐ thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/contract-proposals/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM ContractProposal WHERE proposal_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Đề xuất HĐLĐ thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 6. GIA HẠN HỢP ĐỒNG LAO ĐỘNG (CONTRACT EXTENSIONS) ---
router.get('/contract-extensions', async (req, res) => {
    const list = await query(
        `SELECT ce.*, e.full_name as employee_name, e.employee_code, c.contract_no
     FROM ContractExtension ce
     JOIN Employee e ON ce.employee_id = e.employee_id
     LEFT JOIN EmployeeContract c ON ce.contract_id = c.contract_id
     ORDER BY ce.created_date DESC`
    );
    res.json({ success: true, data: list });
});

router.post('/contract-extensions', async (req, res) => {
    try {
        const { contract_id, employee_id, new_end_date, new_salary, extension_term, reason } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();
        const code = 'GHHD-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
        const eDate = new_end_date ? (typeof new_end_date === 'number' ? new_end_date : new Date(new_end_date).getTime()) : now + 365 * 86400000;

        await run(
            `INSERT INTO ContractExtension (extension_id, created_date, last_modified_date, extension_code, contract_id, employee_id, new_end_date, new_salary, extension_term, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
            [id, now, now, code, contract_id, employee_id, eDate, new_salary || 0, extension_term || 'Gia hạn 1 năm', reason || '']
        );

        // Cập nhật ngày kết thúc mới cho Hợp đồng lao động
        if (contract_id) {
            await run(`UPDATE EmployeeContract SET end_date = ?, salary = CASE WHEN ? > 0 THEN ? ELSE salary END, last_modified_date = ? WHERE contract_id = ?`, [eDate, new_salary, new_salary, now, contract_id]);
        }

        res.json({ success: true, message: 'Tạo Phiếu Gia hạn HĐLĐ thành công & đã cập nhật HĐLĐ!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/contract-extensions/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM ContractExtension WHERE extension_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Phiếu Gia hạn HĐLĐ thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 7. ĐỀ XUẤT THUYÊN CHUYỂN, BỔ NHIỆM, MIỄN NHIỆM (TRANSFER PROPOSALS) ---
router.get('/transfer-proposals', async (req, res) => {
    const list = await query(
        `SELECT tp.*, e.full_name as employee_name, e.employee_code,
            cd.department_name as current_dept_name, td.department_name as target_dept_name,
            cp.position_name as current_pos_name, tp_pos.position_name as target_pos_name
     FROM TransferProposal tp
     LEFT JOIN Employee e ON tp.employee_id = e.employee_id
     LEFT JOIN Department cd ON tp.current_department_id = cd.department_id
     LEFT JOIN Department td ON tp.target_department_id = td.department_id
     LEFT JOIN Position cp ON tp.current_position_id = cp.position_id
     LEFT JOIN Position tp_pos ON tp.target_position_id = tp_pos.position_id
     ORDER BY tp.created_date DESC`
    );
    const parsed = list.map(item => {
        let details = [];
        try {
            if (item.detail_items) details = JSON.parse(item.detail_items);
        } catch (e) { }
        return {
            ...item,
            detail_items: details
        };
    });
    res.json({ success: true, data: parsed });
});

router.post('/transfer-proposals', async (req, res) => {
    try {
        const {
            proposal_code,
            proposal_date,
            effective_date,
            decision_type,
            proposer_id,
            proposer_name,
            proposer_position,
            proposer_department,
            detail_items,
            note,
            status
        } = req.body;

        const now = Date.now();
        const id = crypto.randomUUID();

        const yr = new Date().getFullYear().toString().slice(-2);
        const countRow = await queryOne(`SELECT COUNT(*) as count FROM TransferProposal`);
        const count = (countRow ? countRow.count : 0) + 1;
        const defaultCode = `DX/TCBN-${yr}${String(count).padStart(3, '0')}`;
        const finalCode = proposal_code && proposal_code.trim() ? proposal_code.trim() : defaultCode;

        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        const pDate = parseDate(proposal_date) || now;
        const effDate = parseDate(effective_date) || now;

        const detailsJson = Array.isArray(detail_items) ? JSON.stringify(detail_items) : (typeof detail_items === 'string' ? detail_items : '[]');

        const firstItem = Array.isArray(detail_items) && detail_items.length > 0 ? detail_items[0] : {};
        const firstEmpId = firstItem.employee_id || req.body.employee_id || 'emp-hr-01';

        await run(
            `INSERT INTO TransferProposal (
        proposal_id, created_date, last_modified_date, proposal_code, employee_id,
         proposal_date, proposed_effective_date, decision_type, proposer_id, proposer_name,
        proposer_position, proposer_department, detail_items, note, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, now, now, finalCode, firstEmpId,
                pDate, effDate, decision_type || 'Thuyên chuyển', proposer_id || null, proposer_name || '',
                proposer_position || '', proposer_department || '', detailsJson, note || '', status || 'PENDING'
            ]
        );

        res.json({ success: true, message: 'Tạo Phiếu Đề xuất Thuyên chuyển, Bổ nhiệm, Miễn nhiệm thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/transfer-proposals/:id', async (req, res) => {
    try {
        const {
            proposal_code,
            proposal_date,
            effective_date,
            decision_type,
            proposer_id,
            proposer_name,
            proposer_position,
            proposer_department,
            detail_items,
            note,
            status
        } = req.body;

        const now = Date.now();
        const id = req.params.id;

        const parseDate = (d) => (d ? (typeof d === 'number' ? d : new Date(d).getTime()) : null);

        const pDate = parseDate(proposal_date);
        const effDate = parseDate(effective_date);

        const detailsJson = Array.isArray(detail_items) ? JSON.stringify(detail_items) : (typeof detail_items === 'string' ? detail_items : '[]');

        const firstItem = Array.isArray(detail_items) && detail_items.length > 0 ? detail_items[0] : {};
        const firstEmpId = firstItem.employee_id || req.body.employee_id || 'emp-hr-01';

        await run(
            `UPDATE TransferProposal SET
         proposal_code = ?, employee_id = ?, proposal_date = ?, proposed_effective_date = ?, decision_type = ?,
        proposer_id = ?, proposer_name = ?, proposer_position = ?, proposer_department = ?,
        detail_items = ?, note = ?, status = ?, last_modified_date = ?
       WHERE proposal_id = ?`,
            [
                proposal_code, firstEmpId, pDate, effDate, decision_type,
                proposer_id || null, proposer_name || '', proposer_position || '', proposer_department || '',
                detailsJson, note || '', status || 'PENDING', now, id
            ]
        );

        res.json({ success: true, message: 'Cập nhật Phiếu Đề xuất Thuyên chuyển, Bổ nhiệm, Miễn nhiệm thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/transfer-proposals/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM TransferProposal WHERE proposal_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Đề xuất Thuyên chuyển thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 8. QUYẾT ĐỊNH THUYÊN CHUYỂN, BỔ NHIỆM (TRANSFER DECISIONS) ---
router.get('/transfer-decisions', async (req, res) => {
    const list = await query(
        `SELECT td.*, e.full_name as employee_name, e.employee_code,
            dept.department_name as target_dept_name, pos.position_name as target_pos_name
     FROM TransferDecision td
     JOIN Employee e ON td.employee_id = e.employee_id
     LEFT JOIN Department dept ON td.target_department_id = dept.department_id
     LEFT JOIN Position pos ON td.target_position_id = pos.position_id
     ORDER BY td.created_date DESC`
    );
    res.json({ success: true, data: list });
});

router.post('/transfer-decisions', async (req, res) => {
    try {
        const {
            proposal_id,
            employee_id,
            target_department_id,
            target_position_id,
            manager_id,
            decision_date,
            decision_type,
            creator_id,
            creator_name,
            effective_date,
            signed_by,
            description,
            reason,
            note
        } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();
        const decNo = 'QĐ-TCBN/' + new Date().getFullYear() + '/' + Math.floor(100 + Math.random() * 900);
        const effDate = effective_date ? (typeof effective_date === 'number' ? effective_date : new Date(effective_date).getTime()) : now;
        const decisionDate = decision_date ? (typeof decision_date === 'number' ? decision_date : new Date(decision_date).getTime()) : now;

        await run(
            `INSERT INTO TransferDecision (decision_id, created_date, last_modified_date, decision_number, proposal_id, employee_id, target_department_id, target_position_id, manager_id, decision_date, effective_date, decision_type, creator_id, creator_name, signed_by, description, reason, note, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EXECUTED')`,
            [id, now, now, decNo, proposal_id || null, employee_id, target_department_id || null, target_position_id || null, manager_id || null, decisionDate, effDate, decision_type || 'Thuyên chuyển', creator_id || req.user.employeeId || null, creator_name || req.user.fullName || '', signed_by || 'Ban Giám Đốc', description || '', reason || '', note || '']
        );

        // Quyết định hoàn thiện đồng bộ bộ phận, vị trí và quản lý trực tiếp vào hồ sơ nhân sự.
        if (target_department_id || target_position_id || manager_id) {
            const updates = [];
            const params = [];
            if (target_department_id) { updates.push('department_id = ?'); params.push(target_department_id); }
            if (target_position_id) { updates.push('position_id = ?'); params.push(target_position_id); }
            if (manager_id) { updates.push('manager_id = ?'); params.push(manager_id); }
            updates.push('last_modified_date = ?'); params.push(now);
            params.push(employee_id);

            await run(`UPDATE Employee SET ${updates.join(', ')} WHERE employee_id = ?`, params);
        }

        if (proposal_id) {
            await run(`UPDATE TransferProposal SET status = 'APPROVED' WHERE proposal_id = ?`, [proposal_id]);
        }

        res.json({ success: true, message: 'Ban hành Quyết định Thuyên chuyển/Bổ nhiệm & đã cập nhật sơ đồ nhân sự!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/transfer-decisions/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM TransferDecision WHERE decision_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Quyết định Thuyên chuyển thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 9. ĐƠN XIN NGHỈ VIỆC (RESIGNATION APPLICATIONS) ---
router.get('/resignation-applications', async (req, res) => {
    const list = await query(
        `SELECT ra.*, e.full_name as employee_name, e.employee_code, d.department_name, p.position_name
     FROM ResignationApplication ra
     JOIN Employee e ON ra.employee_id = e.employee_id
     LEFT JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN Position p ON e.position_id = p.position_id
     ORDER BY ra.created_date DESC`
    );
    res.json({ success: true, data: list });
});

router.post('/resignation-applications', async (req, res) => {
    try {
        const { employee_id, desired_resign_date, reason, handover_notes } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();
        const code = 'DXNV-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
        const rDate = desired_resign_date ? (typeof desired_resign_date === 'number' ? desired_resign_date : new Date(desired_resign_date).getTime()) : now + 30 * 86400000;

        await run(
            `INSERT INTO ResignationApplication (application_id, created_date, last_modified_date, application_code, employee_id, desired_resign_date, reason, handover_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [id, now, now, code, employee_id, rDate, reason || '', handover_notes || '']
        );

        res.json({ success: true, message: 'Tiếp nhận Đơn xin nghỉ việc thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/resignation-applications/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM ResignationApplication WHERE application_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Đơn xin nghỉ việc thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 10. QUYẾT ĐỊNH NGHỈ VIỆC (RESIGNATION DECISIONS) ---
router.get('/resignation-decisions', async (req, res) => {
    const list = await query(
        `SELECT rd.*, e.full_name as employee_name, e.employee_code, d.department_name, p.position_name
     FROM ResignationDecision rd
     JOIN Employee e ON rd.employee_id = e.employee_id
     LEFT JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN Position p ON e.position_id = p.position_id
     ORDER BY rd.created_date DESC`
    );
    res.json({ success: true, data: list });
});

router.post('/resignation-decisions', async (req, res) => {
    try {
        const { application_id, employee_id, official_resign_date, handover_status, signed_by, reason } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();
        const decNo = 'QĐ-TV/' + new Date().getFullYear() + '/' + Math.floor(100 + Math.random() * 900);
        const rDate = official_resign_date ? (typeof official_resign_date === 'number' ? official_resign_date : new Date(official_resign_date).getTime()) : now;

        await run(
            `INSERT INTO ResignationDecision (decision_id, created_date, last_modified_date, decision_number, application_id, employee_id, official_resign_date, handover_status, signed_by, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EXECUTED')`,
            [id, now, now, decNo, application_id || null, employee_id, rDate, handover_status || 'COMPLETED', signed_by || 'Tổng Giám Đốc BRAVO', reason || '', 'EXECUTED']
        );

        // Cập nhật trạng thái nhân viên sang RESIGNED (Nghỉ việc)
        await run(`UPDATE Employee SET employment_status = 'RESIGNED', is_active = 0, last_modified_date = ? WHERE employee_id = ?`, [now, employee_id]);
        await run(`UPDATE EmployeeContract SET status = 'TERMINATED', last_modified_date = ? WHERE employee_id = ?`, [now, employee_id]);

        if (application_id) {
            await run(`UPDATE ResignationApplication SET status = 'APPROVED' WHERE application_id = ?`, [application_id]);
        }

        res.json({ success: true, message: 'Ban hành Quyết định thôi việc & Đã cập nhật trạng thái nhân viên sang NGHỈ VIỆC!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/resignation-decisions/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM ResignationDecision WHERE decision_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Quyết định nghỉ việc thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Audit Log Helper ---
const recordAuditLog = async (req, action, entity_type, entity_id, entity_name, details = '') => {
    try {
        const auditId = crypto.randomUUID();
        const userId = req.user ? req.user.id : null;
        const username = req.user ? (req.user.username || req.user.fullName) : 'Hệ thống';
        const now = Date.now();
        await run(
            `INSERT INTO AuditLog (audit_id, user_id, username, action, entity_type, entity_id, entity_name, details, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [auditId, userId, username, action, entity_type, entity_id || '', entity_name || '', details, now]
        );
    } catch (e) {
        console.error('Failed to log audit:', e);
    }
};

// --- 7. ĐỊNH BIÊN NHÂN SỰ (DEPARTMENT HEADCOUNT QUOTAS) ---
router.get('/quotas', async (req, res) => {
    try {
        const quotas = await query(
            `SELECT q.*, d.department_name, d.department_code
       FROM DepartmentQuota q
       LEFT JOIN Department d ON q.department_id = d.department_id
       ORDER BY q.created_date DESC`
        );

        const employees = await query(`SELECT department_id FROM Employee WHERE is_active = 1 AND employment_status = 'WORKING'`);
        const countMap = {};
        for (const emp of employees) {
            if (emp.department_id) {
                countMap[emp.department_id] = (countMap[emp.department_id] || 0) + 1;
            }
        }

        const result = quotas.map(q => ({
            ...q,
            current_headcount: countMap[q.department_id] !== undefined ? countMap[q.department_id] : q.current_headcount
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/quotas/next-code', async (req, res) => {
    try {
        const effectiveDate = req.query.date ? new Date(req.query.date) : new Date();
        const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
        const year = String(effectiveDate.getFullYear()).slice(-2);
        const prefix = `ĐB/${month}${year}-`;

        const existingQuotas = await query(`SELECT quota_code FROM DepartmentQuota WHERE quota_code LIKE ?`, [`${prefix}%`]);
        let maxSeq = 0;
        for (const q of existingQuotas) {
            const seqStr = q.quota_code.replace(prefix, '');
            const seqNum = parseInt(seqStr, 10);
            if (!isNaN(seqNum) && seqNum > maxSeq) {
                maxSeq = seqNum;
            }
        }
        const nextSeq = String(maxSeq + 1).padStart(4, '0');
        const code = `${prefix}${nextSeq}`;
        res.json({ success: true, code });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/quotas/:id', async (req, res) => {
    try {
        const quota = await queryOne(
            `SELECT q.*, d.department_name, d.department_code
       FROM DepartmentQuota q
       LEFT JOIN Department d ON q.department_id = d.department_id
       WHERE q.quota_id = ? OR q.quota_code = ?`,
            [req.params.id, req.params.id]
        );

        if (!quota) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu định biên nhân sự.' });
        }

        const details = await query(
            `SELECT * FROM DepartmentQuotaDetail WHERE quota_id = ? ORDER BY position_code ASC`,
            [quota.quota_id]
        );

        const empCounts = await query(
            `SELECT position_id, COUNT(*) as cnt FROM Employee 
       WHERE department_id = ? AND is_active = 1 AND employment_status = 'WORKING'
       GROUP BY position_id`,
            [quota.department_id]
        );
        const posCountMap = {};
        for (const ec of empCounts) {
            if (ec.position_id) posCountMap[ec.position_id] = ec.cnt;
        }

        const updatedDetails = details.map(d => {
            const curr = posCountMap[d.position_id] !== undefined ? posCountMap[d.position_id] : (d.current_headcount || 0);
            const target = Number(d.target_headcount) || 0;
            const resign = Number(d.resignation_count) || 0;
            const mat = Number(d.maternity_count) || 0;
            const needed = Math.max(0, target - curr + resign + mat);
            return {
                ...d,
                current_headcount: curr,
                needed_headcount: needed
            };
        });

        res.json({
            success: true,
            data: {
                ...quota,
                details: updatedDetails
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/quotas', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            effective_date, department_id, creator_name, target_headcount,
            max_capacity, budget, budget_details, description, status, details = []
        } = req.body;

        const now = Date.now();
        const id = crypto.randomUUID();

        const effDate = effective_date ? (typeof effective_date === 'number' ? effective_date : new Date(effective_date).getTime()) : now;

        const dateObj = new Date(effDate);
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = String(dateObj.getFullYear()).slice(-2);
        const prefix = `ĐB/${month}${year}-`;

        const existingQuotas = await query(`SELECT quota_code FROM DepartmentQuota WHERE quota_code LIKE ?`, [`${prefix}%`]);
        let maxSeq = 0;
        for (const q of existingQuotas) {
            const seqStr = q.quota_code.replace(prefix, '');
            const seqNum = parseInt(seqStr, 10);
            if (!isNaN(seqNum) && seqNum > maxSeq) {
                maxSeq = seqNum;
            }
        }
        const quota_code = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;

        const currentEmpCount = await queryOne(
            `SELECT COUNT(*) as count FROM Employee WHERE department_id = ? AND is_active = 1 AND employment_status = 'WORKING'`,
            [department_id]
        );
        const current_headcount = currentEmpCount ? currentEmpCount.count : 0;

        let computedTarget = Number(target_headcount) || 0;
        if (Array.isArray(details) && details.length > 0) {
            computedTarget = details.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
        }
        const budgetDetailsJson = Array.isArray(budget_details) ? JSON.stringify(budget_details) : (budget_details || '[]');

        await run(
            `INSERT INTO DepartmentQuota (quota_id, created_date, last_modified_date, quota_code, effective_date, department_id, creator_name, target_headcount, max_capacity, current_headcount, budget, budget_details, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, now, now, quota_code, effDate, department_id, creator_name || 'HR Test 01',
                computedTarget, Number(max_capacity) || computedTarget || 0,
                current_headcount, Number(budget) || 0, budgetDetailsJson, description || '', status || 'Tạo phiếu'
            ]
        );

        if (Array.isArray(details)) {
            for (const d of details) {
                const detId = crypto.randomUUID();
                const target = Number(d.target_headcount) || 0;
                const resign = Number(d.resignation_count) || 0;
                const mat = Number(d.maternity_count) || 0;
                const curr = Number(d.current_headcount) || 0;
                const needed = Math.max(0, target - curr + resign + mat);

                await run(
                    `INSERT INTO DepartmentQuotaDetail (detail_id, quota_id, position_id, position_code, position_name, target_headcount, resignation_count, maternity_count, current_headcount, needed_headcount, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        detId, id, d.position_id || null, d.position_code || '', d.position_name || '',
                        target, resign, mat, curr, needed, d.note || ''
                    ]
                );
            }
        }

        await run(`UPDATE Department SET target_headcount = ?, last_modified_date = ? WHERE department_id = ?`, [computedTarget, now, department_id]);

        await recordAuditLog(req, 'CREATE', 'DepartmentQuota', id, quota_code, `Tạo phiếu định biên nhân sự mới: ${quota_code}`);

        res.json({ success: true, message: 'Tạo phiếu định biên nhân sự thành công!', data: { id, quota_code, current_headcount } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/quotas/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const {
            effective_date, department_id, creator_name, target_headcount,
            max_capacity, budget, budget_details, description, status, details
        } = req.body;

        const now = Date.now();
        const existing = await queryOne(`SELECT * FROM DepartmentQuota WHERE quota_id = ?`, [req.params.id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Phiếu định biên không tồn tại.' });
        }

        const effDate = effective_date ? (typeof effective_date === 'number' ? effective_date : new Date(effective_date).getTime()) : existing.effective_date;
        const targetDeptId = department_id || existing.department_id;

        const currentEmpCount = await queryOne(
            `SELECT COUNT(*) as count FROM Employee WHERE department_id = ? AND is_active = 1 AND employment_status = 'WORKING'`,
            [targetDeptId]
        );
        const current_headcount = currentEmpCount ? currentEmpCount.count : 0;

        let computedTarget = Number(target_headcount) || 0;
        if (Array.isArray(details) && details.length > 0) {
            computedTarget = details.reduce((sum, d) => sum + (Number(d.target_headcount) || 0), 0);
        }
        const budgetDetailsJson = Array.isArray(budget_details) ? JSON.stringify(budget_details) : (budget_details || existing.budget_details || '[]');

        await run(
            `UPDATE DepartmentQuota 
       SET effective_date = ?, department_id = ?, creator_name = COALESCE(?, creator_name),
           target_headcount = ?, max_capacity = ?, current_headcount = ?, budget = ?, budget_details = ?, description = ?,
           status = COALESCE(?, status), last_modified_date = ?
       WHERE quota_id = ?`,
            [
                effDate, targetDeptId, creator_name, computedTarget,
                Number(max_capacity) || computedTarget || 0, current_headcount,
                Number(budget) || 0, budgetDetailsJson, description || '', status, now, req.params.id
            ]
        );

        if (Array.isArray(details)) {
            await run(`DELETE FROM DepartmentQuotaDetail WHERE quota_id = ?`, [req.params.id]);

            for (const d of details) {
                const detId = crypto.randomUUID();
                const target = Number(d.target_headcount) || 0;
                const resign = Number(d.resignation_count) || 0;
                const mat = Number(d.maternity_count) || 0;
                const curr = Number(d.current_headcount) || 0;
                const needed = Math.max(0, target - curr + resign + mat);

                await run(
                    `INSERT INTO DepartmentQuotaDetail (detail_id, quota_id, position_id, position_code, position_name, target_headcount, resignation_count, maternity_count, current_headcount, needed_headcount, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        detId, req.params.id, d.position_id || null, d.position_code || '', d.position_name || '',
                        target, resign, mat, curr, needed, d.note || ''
                    ]
                );
            }
        }

        if (targetDeptId) {
            await run(`UPDATE Department SET target_headcount = ?, last_modified_date = ? WHERE department_id = ?`, [computedTarget, now, targetDeptId]);
        }

        await recordAuditLog(req, 'UPDATE', 'DepartmentQuota', req.params.id, existing.quota_code, `Cập nhật phiếu định biên: ${existing.quota_code}`);

        res.json({ success: true, message: 'Cập nhật phiếu định biên nhân sự thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/quotas/:id/status', async (req, res) => {
    try {
        const { status, note } = req.body;
        const now = Date.now();
        const quota = await queryOne(`SELECT * FROM DepartmentQuota WHERE quota_id = ?`, [req.params.id]);
        if (!quota) {
            return res.status(404).json({ success: false, message: 'Phiếu định biên không tồn tại.' });
        }

        await run(
            `UPDATE DepartmentQuota SET status = ?, last_modified_date = ? WHERE quota_id = ?`,
            [status, now, req.params.id]
        );

        await recordAuditLog(req, status === 'Đã hoàn thiện' ? 'APPROVE' : status === 'Từ chối' ? 'REJECT' : 'UPDATE', 'DepartmentQuota', req.params.id, quota.quota_code, `Chuyển trạng thái phiếu ${quota.quota_code} sang: ${status}`);

        res.json({ success: true, message: `Đã cập nhật trạng thái phiếu định biên sang '${status}'` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/quotas/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const quota = await queryOne(`SELECT * FROM DepartmentQuota WHERE quota_id = ?`, [req.params.id]);
        if (!quota) {
            return res.status(404).json({ success: false, message: 'Phiếu định biên không tồn tại.' });
        }

        const reqs = await query(`SELECT request_code FROM RecruitmentRequest WHERE department_id = ? AND status IN ('PENDING', 'APPROVED', 'IN_PROGRESS')`, [quota.department_id]);
        if (reqs.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Phiếu định biên '${quota.quota_code}' đã phát sinh ${reqs.length} yêu cầu tuyển dụng liên quan (${reqs.map(r => r.request_code).join(', ')}) và không thể xóa.`
            });
        }

        await run(`DELETE FROM DepartmentQuotaDetail WHERE quota_id = ?`, [req.params.id]);
        await run(`DELETE FROM DepartmentQuota WHERE quota_id = ?`, [req.params.id]);

        await recordAuditLog(req, 'DELETE', 'DepartmentQuota', req.params.id, quota.quota_code, `Xóa phiếu định biên: ${quota.quota_code}`);

        res.json({ success: true, message: 'Đã xóa phiếu định biên nhân sự thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// --- 12. ĐƠN XIN NGHỈ PHÉP (LEAVE APPLICATIONS) ---
function leaveDaysFromInput(totalDays, details) {
    const detailDays = Array.isArray(details)
        ? details.reduce((sum, item) => sum + (Number(item?.days) || 0), 0)
        : 0;
    return detailDays || Number(totalDays) || 1;
}

function annualLeaveEntitlement(joinDate, leaveYear) {
    const joined = new Date(Number(joinDate));
    if (Number.isNaN(joined.getTime()) || joined.getFullYear() < leaveYear) return 12;
    if (joined.getFullYear() > leaveYear) return 0;
    return 12 - joined.getMonth();
}

async function ensureAnnualLeaveBalance(employeeId, leaveYear, now) {
    const employee = await queryOne('SELECT join_date FROM Employee WHERE employee_id = ?', [employeeId]);
    if (!employee) throw new Error('Không tìm thấy hồ sơ nhân viên để tính phép năm.');

    let balance = await queryOne(
        'SELECT * FROM EmployeeLeaveBalance WHERE employee_id = ? AND leave_year = ?',
        [employeeId, leaveYear]
    );
    if (!balance) {
        const entitlement = annualLeaveEntitlement(employee.join_date, leaveYear);
        await run(
            `INSERT INTO EmployeeLeaveBalance (leave_balance_id, employee_id, leave_year, entitled_days, carried_forward_days, used_days, remaining_days, calculation_note, last_calculated_date, created_date, last_modified_date)
             VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), employeeId, leaveYear, entitlement, entitlement, '12 ngày/năm, tính theo tháng vào làm và không chuyển phép sang năm sau.', now, now, now]
        );
        balance = { entitled_days: entitlement, used_days: 0, remaining_days: entitlement };
    }
    return balance;
}

async function refreshAnnualLeaveBalance(employeeId, leaveYear, now) {
    const balance = await ensureAnnualLeaveBalance(employeeId, leaveYear, now);
    const yearStart = new Date(leaveYear, 0, 1).getTime();
    const nextYearStart = new Date(leaveYear + 1, 0, 1).getTime();
    const usage = await queryOne(
        `SELECT COALESCE(SUM(total_days), 0) AS used_days FROM LeaveApplication
         WHERE employee_id = ? AND leave_type = 'ANNUAL' AND status = 'APPROVED'
           AND (leave_year = ? OR (leave_year IS NULL AND start_date >= ? AND start_date < ?))`,
        [employeeId, leaveYear, yearStart, nextYearStart]
    );
    const usedDays = Number(usage?.used_days || 0);
    const remainingDays = Math.max(0, Number(balance.entitled_days) - usedDays);
    await run(
        `UPDATE EmployeeLeaveBalance
         SET used_days = ?, remaining_days = ?, last_calculated_date = ?, last_modified_date = ?
         WHERE employee_id = ? AND leave_year = ?`,
        [usedDays, remainingDays, now, now, employeeId, leaveYear]
    );
    return { ...balance, used_days: usedDays, remaining_days: remainingDays };
}

router.get('/leave-applications', async (req, res) => {
    try {
        const apps = await query(`SELECT * FROM LeaveApplication ORDER BY created_date DESC`);
        res.json({ success: true, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/leave-applications', async (req, res) => {
    try {
        const { leave_code, employee_id, employee_code, employee_name, department_id, department_name, approver_id, approver_name, related_person_id, related_person_name, start_date, end_date, total_days, leave_type, reason, details_json } = req.body;
        const now = Date.now();
        const id = crypto.randomUUID();

        const yy = String(new Date().getFullYear()).slice(-2);
        const countLv = (await queryOne('SELECT COUNT(*) as cnt FROM LeaveApplication'))?.cnt || 0;
        const defaultCode = `DXNP/${yy}-${String(countLv + 1).padStart(3, '0')}`;
        const finalCode = leave_code && leave_code.trim() !== '' ? leave_code.trim() : defaultCode;

        const startTs = start_date ? (typeof start_date === 'number' ? start_date : new Date(start_date).getTime()) : now;
        const endTs = end_date ? (typeof end_date === 'number' ? end_date : new Date(end_date).getTime()) : startTs;
        const detailsStr = Array.isArray(details_json) ? JSON.stringify(details_json) : (typeof details_json === 'string' ? details_json : '[]');
        let details = details_json;
        if (typeof details === 'string') {
            try { details = JSON.parse(details); } catch { details = []; }
        }
        const requestedDays = leaveDaysFromInput(total_days, details);

        // Người nộp đơn thực tế: ưu tiên hồ sơ nhân viên của chính người đăng nhập, nếu HR lập hộ thì dùng employee_id gửi lên
        const subjectEmployeeId = employee_id || req.user.employeeId || '';
        if (!subjectEmployeeId) {
            return res.status(400).json({ success: false, message: 'Phải chọn nhân viên lập đơn nghỉ phép.' });
        }
        const leaveType = leave_type || 'ANNUAL';
        const leaveYear = new Date(startTs).getFullYear();
        let entitlement = null;
        let usedDaysBefore = null;
        let remainingDaysBefore = null;
        if (leaveType === 'ANNUAL') {
            const balance = await refreshAnnualLeaveBalance(subjectEmployeeId, leaveYear, now);
            const pendingUsage = await queryOne(
                `SELECT COALESCE(SUM(total_days), 0) AS pending_days FROM LeaveApplication
                 WHERE employee_id = ? AND leave_type = 'ANNUAL' AND status NOT IN ('REJECTED', 'CANCELLED')
                   AND (leave_year = ? OR (leave_year IS NULL AND start_date >= ? AND start_date < ?))`,
                [subjectEmployeeId, leaveYear, new Date(leaveYear, 0, 1).getTime(), new Date(leaveYear + 1, 0, 1).getTime()]
            );
            entitlement = Number(balance.entitled_days);
            usedDaysBefore = Number(pendingUsage?.pending_days || 0);
            remainingDaysBefore = Math.max(0, entitlement - usedDaysBefore);
            if (requestedDays > remainingDaysBefore) {
                return res.status(400).json({ success: false, message: `Số ngày phép yêu cầu vượt quá số phép còn lại (${remainingDaysBefore} ngày).` });
            }
        }
        const initialStatus = subjectEmployeeId
            ? await approvalWorkflow.initApprovalChain('LeaveApplication', id, subjectEmployeeId)
            : 'PENDING_LEVEL_1';

        await run(
            `INSERT INTO LeaveApplication (leave_id, created_date, last_modified_date, leave_code, employee_id, employee_code, employee_name, department_id, department_name, approver_id, approver_name, related_person_id, related_person_name, start_date, end_date, total_days, leave_type, leave_year, entitled_days, used_days_before, remaining_days_before, remaining_days_after, reason, details_json, approver_note, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?)`,
            [id, now, now, finalCode, subjectEmployeeId, employee_code || '', employee_name || '', department_id || '', department_name || '', approver_id || '', approver_name || '', related_person_id || '', related_person_name || '', startTs, endTs, requestedDays, leaveType, leaveYear, entitlement, usedDaysBefore, remainingDaysBefore, remainingDaysBefore === null ? null : remainingDaysBefore - requestedDays, reason || '', detailsStr, initialStatus]
        );

        res.json({ success: true, message: 'Tạo Đơn xin nghỉ phép thành công! Đơn đã được gửi tới cấp duyệt đầu tiên.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xem lịch sử phê duyệt đầy đủ của 1 đơn nghỉ phép (ai duyệt, khi nào, ý kiến gì, cấp mấy)
router.get('/leave-applications/:id/approval-history', async (req, res) => {
    try {
        const history = await approvalWorkflow.getApprovalHistory('LeaveApplication', req.params.id);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/leave-applications/:id/approve', authorizeRole('Administrator', 'HR Staff', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    try {
        const { status, approver_note } = req.body;
        const now = Date.now();
        const decision = status === 'REJECTED' ? 'REJECTED' : 'APPROVED';

        const result = await approvalWorkflow.advanceApproval('LeaveApplication', req.params.id, decision, approver_note, req.user);

        if (result.error) {
            return res.status(403).json({ success: false, message: result.error });
        }

        await run(
            `UPDATE LeaveApplication SET status = ?, approver_note = ?, approver_id = ?, approver_name = ?, last_modified_date = ? WHERE leave_id = ?`,
            [result.newDocumentStatus, approver_note || '', req.user.id, req.user.fullName, now, req.params.id]
        );

        if (result.newDocumentStatus === 'APPROVED') {
            const application = await queryOne('SELECT employee_id, leave_type, leave_year FROM LeaveApplication WHERE leave_id = ?', [req.params.id]);
            if (application?.leave_type === 'ANNUAL' && application.leave_year) {
                const balance = await refreshAnnualLeaveBalance(application.employee_id, Number(application.leave_year), now);
                await run(
                    `UPDATE LeaveApplication SET remaining_days_after = ?, last_modified_date = ? WHERE leave_id = ?`,
                    [balance.remaining_days, now, req.params.id]
                );
            }
        }

        const message = result.newDocumentStatus === 'REJECTED'
            ? 'Đã từ chối Đơn xin nghỉ phép!'
            : result.newDocumentStatus === 'APPROVED'
                ? 'Đã phê duyệt hoàn tất Đơn xin nghỉ phép (đã qua đủ các cấp)!'
                : `Đã duyệt ở cấp này! Đơn đang chuyển tới cấp duyệt tiếp theo (${result.newDocumentStatus}).`;

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/leave-applications/:id', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        await run(`DELETE FROM LeaveApplication WHERE leave_id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã xóa Đơn xin nghỉ phép thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
