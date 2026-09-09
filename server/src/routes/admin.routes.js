const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, queryOne, run } = require('../db/connection');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);

// Seniority Helper
function computeSeniority(joinDate) {
    if (!joinDate) return 'Mới nhận việc';
    const join = new Date(typeof joinDate === 'number' ? joinDate : Number(joinDate));
    if (isNaN(join.getTime())) return '—';
    const now = new Date();
    let years = now.getFullYear() - join.getFullYear();
    let months = now.getMonth() - join.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    if (years > 0 && months > 0) return `${years} năm ${months} tháng`;
    if (years > 0) return `${years} năm`;
    if (months > 0) return `${months} tháng`;
    return 'Dưới 1 tháng';
}

// --- 1. PHÒNG BÀN (DEPARTMENTS) ---
router.get('/departments', async (req, res) => {
    const depts = await query(
        `SELECT d.*, e.full_name as manager_name, pd.department_name as parent_department_name,
            (SELECT COUNT(*) FROM Employee emp WHERE emp.department_id = d.department_id AND emp.is_active = 1) as current_count,
            (SELECT COALESCE(SUM(quantity), 0) FROM RecruitmentRequest rr WHERE rr.department_id = d.department_id AND rr.is_outside_headcount = 1 AND rr.status IN ('APPROVED', 'PENDING')) as outside_request_count
     FROM Department d 
     LEFT JOIN Employee e ON d.manager_id = e.employee_id 
     LEFT JOIN Department pd ON d.parent_department_id = pd.department_id
     WHERE d.status = 1 ORDER BY d.created_date ASC`
    );
    res.json({ success: true, data: depts });
});

// Single-click inspection: Get employees belonging to department with Seniority
router.get('/departments/:id/employees', async (req, res) => {
    try {
        const employees = await query(
            `SELECT e.employee_id, e.employee_code, e.full_name, e.date_of_birth, e.gender, e.phone, e.email, e.join_date, p.position_name
       FROM Employee e
       LEFT JOIN Position p ON e.position_id = p.position_id
       WHERE e.department_id = ? AND e.is_active = 1
       ORDER BY e.join_date ASC`,
            [req.params.id]
        );

        const result = employees.map(emp => ({
            ...emp,
            seniority: computeSeniority(emp.join_date)
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/departments', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { department_code, department_name, description, manager_id, parent_department_id, target_headcount } = req.body;
        if (!department_code || !department_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã bộ phận và Tên bộ phận.' });
        }

        const existing = await queryOne(`SELECT department_id FROM Department WHERE department_code = ? AND status = 1`, [department_code.trim()]);
        if (existing) {
            return res.status(400).json({ success: false, message: `Mã bộ phận '${department_code}' đã tồn tại trong hệ thống. Vui lòng chọn mã khác.` });
        }

        const now = Date.now();
        const id = crypto.randomUUID();

        await run(
            `INSERT INTO Department (department_id, created_date, last_modified_date, department_code, department_name, description, manager_id, parent_department_id, target_headcount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [id, now, now, department_code.trim(), department_name.trim(), description || '', manager_id || null, parent_department_id || null, parseInt(target_headcount) || 0]
        );

        res.json({ success: true, message: 'Thêm phòng ban thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/departments/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { department_code, department_name, description, manager_id, parent_department_id, target_headcount } = req.body;
        const now = Date.now();
        const deptId = req.params.id;

        if (parent_department_id === deptId) {
            return res.status(400).json({ success: false, message: 'Không thể chọn chính bộ phận đang chỉnh sửa làm bộ phận cấp trên.' });
        }

        const existingCode = await queryOne(`SELECT department_id FROM Department WHERE department_code = ? AND department_id != ? AND status = 1`, [department_code.trim(), deptId]);
        if (existingCode) {
            return res.status(400).json({ success: false, message: `Mã bộ phận '${department_code}' trùng với bộ phận khác.` });
        }

        await run(
            `UPDATE Department SET department_code = ?, department_name = ?, description = ?, manager_id = ?, parent_department_id = ?, target_headcount = ?, last_modified_date = ?
       WHERE department_id = ?`,
            [department_code.trim(), department_name.trim(), description || '', manager_id || null, parent_department_id || null, parseInt(target_headcount) || 0, now, deptId]
        );

        res.json({ success: true, message: 'Cập nhật phòng ban thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/departments/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const deptId = req.params.id;
        // Check constraint 1: Check active employees
        const empCount = await queryOne(`SELECT COUNT(*) as cnt FROM Employee WHERE department_id = ? AND is_active = 1`, [deptId]);
        if (empCount && empCount.cnt > 0) {
            return res.status(400).json({ success: false, message: `Bộ phận đang có ${empCount.cnt} nhân sự trực thuộc. Không thể xóa trực tiếp.` });
        }

        // Check constraint 2: Check child departments
        const childCount = await queryOne(`SELECT COUNT(*) as cnt FROM Department WHERE parent_department_id = ? AND status = 1`, [deptId]);
        if (childCount && childCount.cnt > 0) {
            return res.status(400).json({ success: false, message: `Bộ phận đang có ${childCount.cnt} phòng ban con trực thuộc. Không thể xóa trực tiếp.` });
        }

        await run(`UPDATE Department SET status = 0 WHERE department_id = ?`, [deptId]);
        res.json({ success: true, message: 'Xóa phòng ban thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2. CHỨC VỤ & VỊ TRÍ CÔNG VIỆC (POSITIONS) ---
router.get('/positions', async (req, res) => {
    const positions = await query(
        `SELECT p.*, d.department_name,
            (SELECT COUNT(*) FROM Employee emp WHERE emp.position_id = p.position_id AND emp.is_active = 1) as current_count
     FROM Position p 
     LEFT JOIN Department d ON p.department_id = d.department_id 
     WHERE p.status = 1 ORDER BY d.department_code ASC, p.created_date ASC`
    );
    res.json({ success: true, data: positions });
});

// Single-click inspection: Get contract pathway for position
router.get('/positions/:id/pathway', async (req, res) => {
    try {
        const pathway = await query(
            `SELECT pw.*, ct.contract_type_code, ct.contract_type_name, ct.duration_months, ct.has_probation, ct.probation_days
       FROM PositionContractPathway pw
       JOIN ContractType ct ON pw.contract_type_id = ct.contract_type_id
       WHERE pw.position_id = ?
       ORDER BY pw.step_order ASC`,
            [req.params.id]
        );
        res.json({ success: true, data: pathway });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/positions/:id/pathway', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { contract_type_id, step_order, note } = req.body;
        const posId = req.params.id;
        const now = Date.now();
        const id = crypto.randomUUID();

        await run(
            `INSERT INTO PositionContractPathway (pathway_id, position_id, contract_type_id, step_order, note, created_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, posId, contract_type_id, parseInt(step_order) || 1, note || '', now]
        );

        res.json({ success: true, message: 'Thêm bước lộ trình hợp đồng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/positions/:id/pathway/:pathwayId', authorizeRole('Administrator'), async (req, res) => {
    try {
        await run(`DELETE FROM PositionContractPathway WHERE pathway_id = ? AND position_id = ?`, [req.params.pathwayId, req.params.id]);
        res.json({ success: true, message: 'Xóa bước lộ trình hợp đồng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/positions', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { position_code, position_name, department_id, description, target_headcount, is_assistant, salary_grade } = req.body;
        if (!position_code || !position_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã vị trí và Tên vị trí.' });
        }

        const existing = await queryOne(`SELECT position_id FROM Position WHERE position_code = ? AND status = 1`, [position_code.trim()]);
        if (existing) {
            return res.status(400).json({ success: false, message: `Mã vị trí '${position_code}' đã tồn tại. Vui lòng chọn mã khác.` });
        }

        const now = Date.now();
        const id = crypto.randomUUID();

        await run(
            `INSERT INTO Position (position_id, created_date, last_modified_date, position_code, position_name, department_id, description, target_headcount, is_assistant, salary_grade, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [id, now, now, position_code.trim(), position_name.trim(), department_id || null, description || '', parseInt(target_headcount) || 0, is_assistant ? 1 : 0, salary_grade || '']
        );

        res.json({ success: true, message: 'Thêm vị trí công việc thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/positions/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { position_code, position_name, department_id, description, target_headcount, is_assistant, salary_grade } = req.body;
        const now = Date.now();
        const posId = req.params.id;

        const existingCode = await queryOne(`SELECT position_id FROM Position WHERE position_code = ? AND position_id != ? AND status = 1`, [position_code.trim(), posId]);
        if (existingCode) {
            return res.status(400).json({ success: false, message: `Mã vị trí '${position_code}' trùng với vị trí khác.` });
        }

        await run(
            `UPDATE Position SET position_code = ?, position_name = ?, department_id = ?, description = ?, target_headcount = ?, is_assistant = ?, salary_grade = ?, last_modified_date = ?
       WHERE position_id = ?`,
            [position_code.trim(), position_name.trim(), department_id || null, description || '', parseInt(target_headcount) || 0, is_assistant ? 1 : 0, salary_grade || '', now, posId]
        );

        res.json({ success: true, message: 'Cập nhật vị trí công việc thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/positions/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const posId = req.params.id;
        // Check constraint: Check active employees using position
        const empCount = await queryOne(`SELECT COUNT(*) as cnt FROM Employee WHERE position_id = ? AND is_active = 1`, [posId]);
        if (empCount && empCount.cnt > 0) {
            return res.status(400).json({ success: false, message: `Vị trí công việc đang được sử dụng bởi ${empCount.cnt} nhân sự. Không thể xóa trực tiếp.` });
        }

        await run(`UPDATE Position SET status = 0 WHERE position_id = ?`, [posId]);
        res.json({ success: true, message: 'Xóa vị trí công việc thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2.1 DANH MỤC LOẠI HĐLĐ (CONTRACT TYPES) ---
router.get('/contract-types', async (req, res) => {
    try {
        const types = await query(
            `SELECT ct.*,
              (SELECT COUNT(*) FROM PositionContractPathway pw WHERE pw.contract_type_id = ct.contract_type_id) as pathway_usage_count,
              (SELECT COUNT(*) FROM EmployeeContract ec WHERE ec.contract_type = ct.contract_type_code OR ec.contract_type = ct.contract_type_name) as employee_contract_count
       FROM ContractType ct
       WHERE ct.status = 1 ORDER BY ct.created_date ASC`
        );
        res.json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/contract-types', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { contract_type_code, contract_type_name, duration_months, has_probation, probation_days } = req.body;
        if (!contract_type_code || !contract_type_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã loại HĐ và Tên loại HĐ.' });
        }

        const duration = parseInt(duration_months);
        if (isNaN(duration) || duration < 0) {
            return res.status(400).json({ success: false, message: 'Số tháng thời hạn phải là số nguyên >= 0.' });
        }

        const isProbation = has_probation ? 1 : 0;
        const probDays = isProbation ? parseInt(probation_days) || 0 : 0;

        if (isProbation && probDays <= 0) {
            return res.status(400).json({ success: false, message: 'Khi chọn "Có thử việc", số ngày thử việc phải là số nguyên dương.' });
        }

        const existing = await queryOne(`SELECT contract_type_id FROM ContractType WHERE contract_type_code = ? AND status = 1`, [contract_type_code.trim()]);
        if (existing) {
            return res.status(400).json({ success: false, message: `Mã loại HĐ '${contract_type_code}' đã tồn tại.` });
        }

        const now = Date.now();
        const id = crypto.randomUUID();

        await run(
            `INSERT INTO ContractType (contract_type_id, created_date, last_modified_date, contract_type_code, contract_type_name, duration_months, has_probation, probation_days, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [id, now, now, contract_type_code.trim(), contract_type_name.trim(), duration, isProbation, probDays]
        );

        res.json({ success: true, message: 'Thêm loại hợp đồng lao động thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/contract-types/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { contract_type_code, contract_type_name, duration_months, has_probation, probation_days } = req.body;
        const ctId = req.params.id;
        const now = Date.now();

        const duration = parseInt(duration_months);
        if (isNaN(duration) || duration < 0) {
            return res.status(400).json({ success: false, message: 'Số tháng thời hạn phải là số nguyên >= 0.' });
        }

        const isProbation = has_probation ? 1 : 0;
        const probDays = isProbation ? parseInt(probation_days) || 0 : 0;

        if (isProbation && probDays <= 0) {
            return res.status(400).json({ success: false, message: 'Khi chọn "Có thử việc", số ngày thử việc phải là số nguyên dương.' });
        }

        const existingCode = await queryOne(`SELECT contract_type_id FROM ContractType WHERE contract_type_code = ? AND contract_type_id != ? AND status = 1`, [contract_type_code.trim(), ctId]);
        if (existingCode) {
            return res.status(400).json({ success: false, message: `Mã loại HĐ '${contract_type_code}' trùng với loại HĐ khác.` });
        }

        await run(
            `UPDATE ContractType SET contract_type_code = ?, contract_type_name = ?, duration_months = ?, has_probation = ?, probation_days = ?, last_modified_date = ?
       WHERE contract_type_id = ?`,
            [contract_type_code.trim(), contract_type_name.trim(), duration, isProbation, probDays, now, ctId]
        );

        res.json({ success: true, message: 'Cập nhật loại hợp đồng lao động thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/contract-types/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const ctId = req.params.id;
        const ct = await queryOne(`SELECT * FROM ContractType WHERE contract_type_id = ?`, [ctId]);
        if (!ct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy loại HĐLĐ.' });
        }

        const pwUsage = await queryOne(`SELECT COUNT(*) as cnt FROM PositionContractPathway WHERE contract_type_id = ?`, [ctId]);
        if (pwUsage && pwUsage.cnt > 0) {
            return res.status(400).json({ success: false, message: `Loại HĐLĐ đang được sử dụng trong ${pwUsage.cnt} lộ trình vị trí công việc. Không thể xóa trực tiếp.` });
        }

        const ecUsage = await queryOne(`SELECT COUNT(*) as cnt FROM EmployeeContract WHERE contract_type = ? OR contract_type = ?`, [ct.contract_type_code, ct.contract_type_name]);
        if (ecUsage && ecUsage.cnt > 0) {
            return res.status(400).json({ success: false, message: `Loại HĐLĐ đang được gán cho ${ecUsage.cnt} hợp đồng nhân viên. Không thể xóa trực tiếp.` });
        }

        await run(`UPDATE ContractType SET status = 0 WHERE contract_type_id = ?`, [ctId]);
        res.json({ success: true, message: 'Xóa loại hợp đồng lao động thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 3. QUẢN LÝ TÀI KHOẢN ---
router.get('/users', authorizeRole('Administrator'), async (req, res) => {
    const users = await query(
        `SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.role_id, u.department_id, r.role_name, d.department_name, u.status, u.created_date
     FROM User u
     JOIN Role r ON u.role_id = r.role_id
     LEFT JOIN Department d ON u.department_id = d.department_id
     ORDER BY u.created_date DESC`
    );
    res.json({ success: true, data: users });
});

router.post('/users', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { username, password, full_name, email, phone, role_id, department_id, employee_id } = req.body;
        if (!username?.trim() || !full_name?.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và họ tên.' });
        }
        if (password && password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        const existing = await queryOne(`SELECT user_id FROM User WHERE username = ?`, [username]);
        if (existing) {
            return res.status(400).json({ success: false, message: `Tên đăng nhập '${username}' đã tồn tại trong hệ thống. Vui lòng chọn tên khác.` });
        }

        const now = Date.now();
        const id = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password || '123456', 10);
        const finalRole = role_id || 'role-hr';
        const role = await queryOne(`SELECT role_id FROM Role WHERE role_id = ? AND status = 1`, [finalRole]);
        if (!role) {
            return res.status(400).json({ success: false, message: 'Vai trò tài khoản không hợp lệ.' });
        }

        await run(
            `INSERT INTO User (user_id, username, password_hash, full_name, email, phone, role_id, department_id, employee_id, created_date, last_modified_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [id, username.trim(), passwordHash, full_name.trim(), email || `${username}@bravo.com.vn`, phone || '', finalRole, department_id || null, employee_id || null, now, now]
        );

        res.json({ success: true, message: 'Tạo tài khoản người dùng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/users/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const { full_name, email, phone, role_id, department_id, status, password } = req.body;
        const now = Date.now();

        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            await run(
                `UPDATE User SET full_name = ?, email = ?, phone = ?, role_id = ?, department_id = ?, status = ?, password_hash = ?, last_modified_date = ?
         WHERE user_id = ?`,
                [full_name, email, phone, role_id, department_id || null, status ?? 1, passwordHash, now, req.params.id]
            );
        } else {
            await run(
                `UPDATE User SET full_name = ?, email = ?, phone = ?, role_id = ?, department_id = ?, status = ?, last_modified_date = ?
         WHERE user_id = ?`,
                [full_name, email, phone, role_id, department_id || null, status ?? 1, now, req.params.id]
            );
        }

        res.json({ success: true, message: 'Cập nhật tài khoản người dùng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/users/:id', authorizeRole('Administrator'), async (req, res) => {
    try {
        const isNhungAdmin = req.user && (
            req.user.username?.toUpperCase() === 'NHUNGNH' ||
            (req.user.fullName && req.user.fullName.toLowerCase().includes('hồng nhung'))
        );

        if (!isNhungAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Chỉ có Quản trị viên Nguyễn Hồng Nhung mới có quyền thực hiện xóa tài khoản khỏi hệ thống.'
            });
        }

        const userId = req.params.id;
        const user = await queryOne(`SELECT * FROM User WHERE user_id = ?`, [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Tài khoản người dùng không tồn tại.' });
        }

        if (req.user && (req.user.id === user.user_id || req.user.username === user.username)) {
            return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản hiện tại của bạn đang đăng nhập.' });
        }

        await run(`DELETE FROM User WHERE user_id = ?`, [user.user_id]);
        res.json({ success: true, message: `Đã xóa vĩnh viễn tài khoản '${user.username}' khỏi hệ thống!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 4. VAI TRÒ ---
router.get('/roles', async (req, res) => {
    const roles = await query(`SELECT * FROM Role ORDER BY created_date ASC`);
    res.json({ success: true, data: roles });
});

// --- 5. AUDIT LOGS (LỊCH SỬ THAO TÁC) ---
router.get('/audit-logs', authorizeRole('Administrator'), async (req, res) => {
    try {
        const logs = await query(`SELECT TOP (200) * FROM AuditLog ORDER BY created_date DESC`);
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
