const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, queryOne, run } = require('../db/connection');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);

// --- Danh sách Quyết định Khen thưởng & Kỷ luật ---
router.get('/', async (req, res) => {
    const records = await query(
        `SELECT rd.*, e.full_name as employee_name, e.employee_code, d.department_name, p.position_name
     FROM RewardDiscipline rd
     JOIN Employee e ON rd.employee_id = e.employee_id
     LEFT JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN Position p ON e.position_id = p.position_id
     ORDER BY rd.decision_date DESC`
    );
    res.json({ success: true, data: records });
});

// --- Tra cứu Lịch sử theo Nhân viên ---
router.get('/employee/:empId', async (req, res) => {
    const records = await query(
        `SELECT * FROM RewardDiscipline WHERE employee_id = ? ORDER BY decision_date DESC`,
        [req.params.empId]
    );
    res.json({ success: true, data: records });
});

// --- Thêm mới Quyết định ---
router.post('/', authorizeRole('Administrator', 'HR Staff'), async (req, res) => {
    try {
        const { employee_id, decision_type, decision_date, effective_date, reason, content, decision_by, attachment_url } = req.body;
        const now = Date.now();
        const id = 'rd-' + crypto.randomUUID();
        const prefix = decision_type === 'KHEN_THUONG' ? 'QĐ-KT' : 'QĐ-KL';
        const decisionNo = `${prefix}/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`;

        const dDate = decision_date ? (typeof decision_date === 'number' ? decision_date : new Date(decision_date).getTime()) : now;
        const eDate = effective_date ? (typeof effective_date === 'number' ? effective_date : new Date(effective_date).getTime()) : now;

        await run(
            `INSERT INTO RewardDiscipline (reward_discipline_id, created_date, last_modified_date, employee_id, decision_no, decision_type, decision_date, effective_date, reason, content, decision_by, attachment_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, now, now, employee_id, decisionNo, decision_type, dDate, eDate, reason, content, decision_by || 'Bùi Xuân Thức - Tổng Giám Đốc', attachment_url || null]
        );

        res.json({ success: true, message: `Thêm quyết định ${decision_type === 'KHEN_THUONG' ? 'Khen thưởng' : 'Kỷ luật'} thành công!` });
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
router.get('/criteria', async (req, res) => {
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
        const id = 'tc-' + crypto.randomUUID();

        await run(
            `INSERT INTO EvaluationCriteria (criteria_id, created_date, last_modified_date, criteria_code, criteria_name, weight, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [id, now, now, criteria_code, criteria_name, weight || 25, description || '']
        );

        // Insert Scale grades if provided
        if (scales && Array.isArray(scales)) {
            for (const s of scales) {
                const scaleId = 'sc-' + crypto.randomUUID();
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
router.get('/evaluations', async (req, res) => {
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
        const now = Date.now();
        const id = 'ev-' + crypto.randomUUID();
        const code = 'PĐG-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
        const evalDate = evaluation_date ? (typeof evaluation_date === 'number' ? evaluation_date : new Date(evaluation_date).getTime()) : now;

        // Fetch employee dept & position
        const emp = await queryOne(`SELECT department_id, position_id FROM Employee WHERE employee_id = ?`, [employee_id]);

        let totalScore = 0;
        if (details && Array.isArray(details) && details.length > 0) {
            let totalWeight = 0;
            for (const d of details) {
                const w = parseFloat(d.weight) || 25;
                const s = parseFloat(d.score) || 0;
                totalScore += (s * w / 100);
                totalWeight += w;
            }
            if (totalWeight > 0 && totalWeight !== 100) {
                // Adjust if weight sum wasn't 100%
                totalScore = Math.round(totalScore * 10) / 10;
            }
        }
        totalScore = Math.round(totalScore * 100) / 100;

        let gradeResult = 'Loại B (Tốt)';
        if (totalScore >= 9.0) gradeResult = 'Loại A+ (Xuất sắc)';
        else if (totalScore >= 8.0) gradeResult = 'Loại A (Giỏi)';
        else if (totalScore >= 6.5) gradeResult = 'Loại B (Tốt)';
        else if (totalScore >= 5.0) gradeResult = 'Loại C (Trung bình)';
        else gradeResult = 'Loại D (Yếu)';

        await run(
            `INSERT INTO EmployeeEvaluation (evaluation_id, created_date, last_modified_date, evaluation_code, evaluation_date, year, evaluator_id, employee_id, department_id, position_id, total_score, grade_result, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')`,
            [id, now, now, code, evalDate, year || 2026, evaluator_id, employee_id, emp?.department_id || null, emp?.position_id || null, totalScore, gradeResult, description || '']
        );

        // Insert Evaluation Details
        if (details && Array.isArray(details)) {
            for (const d of details) {
                const detailId = 'evd-' + crypto.randomUUID();
                await run(
                    `INSERT INTO EmployeeEvaluationDetail (detail_id, evaluation_id, criteria_id, criteria_code, criteria_name, weight, score, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [detailId, id, d.criteria_id, d.criteria_code || '', d.criteria_name || '', d.weight || 25, d.score || 0, d.note || '']
                );
            }
        }

        res.json({ success: true, message: 'Lập Phiếu Đánh giá Nhân viên thành công!', data: { id, code, totalScore, gradeResult } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PHIẾU ĐỀ XUẤT KHEN THƯỞNG / KỶ LUẬT ---
router.get('/proposals', async (req, res) => {
    try {
        const list = await query(
            `SELECT rdp.*, e.full_name as employee_name, e.employee_code, d.department_name, p.position_name
       FROM RewardDisciplineProposal rdp
       JOIN Employee e ON rdp.employee_id = e.employee_id
       LEFT JOIN Department d ON e.department_id = d.department_id
       LEFT JOIN Position p ON e.position_id = p.position_id
       ORDER BY rdp.created_date DESC`
        );
        res.json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/proposals', authorizeRole('Administrator', 'HR Staff', 'Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    try {
        const { record_type, employee_id, proposed_amount, reason, proposed_by } = req.body;
        const now = Date.now();
        const id = 'rdp-' + crypto.randomUUID();
        const prefix = record_type === 'KHEN_THUONG' ? 'DXKT' : 'DXKL';
        const code = `${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        await run(
            `INSERT INTO RewardDisciplineProposal (proposal_id, created_date, last_modified_date, proposal_code, record_type, employee_id, proposed_amount, reason, proposed_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [id, now, now, code, record_type || 'KHEN_THUONG', employee_id, proposed_amount || 0, reason || '', proposed_by || 'Quản lý Bộ phận']
        );

        res.json({ success: true, message: 'Tạo Phiếu Đề xuất Khen thưởng / Kỷ luật thành công!' });
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

module.exports = router;
