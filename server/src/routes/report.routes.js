const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db/connection');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);

const CANDIDATE_STATUS_GROUPS = {
    received: ['tiếp nhận hồ sơ', 'Đã tiếp nhận hồ sơ', 'SUBMITTED', 'NEW'],
    screened: ['đã sơ loại', 'Đã sơ loại, Đạt', 'Đã sơ loại, Không đạt', 'SCREENED'],
    scheduled: ['đã tạo lịch', 'INTERVIEWING'],
    interviewed: ['đã phỏng vấn', 'Đã phỏng vấn, Đạt', 'Đã phỏng vấn, Không đạt', 'INTERVIEWED', 'S2: Phỏng vấn'],
    rejected: ['đã quyết định loại', 'S7: Loại', 'REJECTED', 'OFFER_REJECTED'],
    selected: ['đã quyết định tuyển', 'S5: Trúng tuyển', 'PASSED', 'OFFER_ACCEPTED'],
    working: ['đi làm', 'HIRED']
};

function countStatuses(pipelineMap, statuses) {
    return statuses.reduce((sum, status) => sum + Number(pipelineMap[status] || 0), 0);
}

function candidatePipelineStages(pipelineMap) {
    return [
        { code: 'tiếp nhận hồ sơ', label: 'Tiếp nhận hồ sơ', count: countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.received) },
        { code: 'đã sơ loại', label: 'Đã sơ loại', count: countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.screened) },
        { code: 'đã tạo lịch', label: 'Đã tạo lịch', count: countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.scheduled) },
        { code: 'đã phỏng vấn', label: 'Đã phỏng vấn', count: countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.interviewed) },
        { code: 'đã quyết định loại', label: 'Đã quyết định loại', count: countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.rejected) },
        { code: 'đã quyết định tuyển', label: 'Đã quyết định tuyển', count: countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.selected) },
        { code: 'đi làm', label: 'Đi làm', count: countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.working) }
    ];
}

function canonicalCandidateStatus(value) {
    const status = String(value || '').trim();
    const group = Object.entries(CANDIDATE_STATUS_GROUPS).find(([, statuses]) => statuses.includes(status));
    return {
        received: 'tiếp nhận hồ sơ',
        screened: 'đã sơ loại',
        scheduled: 'đã tạo lịch',
        interviewed: 'đã phỏng vấn',
        rejected: 'đã quyết định loại',
        selected: 'đã quyết định tuyển',
        working: 'đi làm'
    }[group?.[0]] || status;
}

// Hai dashboard này dùng dữ liệu đã giới hạn theo phạm vi người dùng.
router.get('/dashboard/manager', authorizeRole('Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    try {
        const departmentId = req.user.deptId;
        const departments = await query(
            `SELECT department_id, department_name FROM Department
             WHERE status = 1 AND (department_id = ? OR parent_department_id = ?)`,
            [departmentId, departmentId]
        );
        const departmentIds = departments.map((item) => item.department_id);
        if (!departmentIds.length && departmentId) departmentIds.push(departmentId);
        const placeholders = departmentIds.map(() => '?').join(', ') || '?';
        const departmentParams = departmentIds.length ? departmentIds : [departmentId];

        const activeEmployees = (await queryOne(
            `SELECT COUNT(*) as c FROM Employee
             WHERE is_active = 1 AND employment_status = 'WORKING' AND department_id IN (${placeholders})`,
            departmentParams
        ))?.c || 0;
        const totalRequests = (await queryOne(
            `SELECT COUNT(*) as c FROM RecruitmentRequest WHERE department_id IN (${placeholders})`,
            departmentParams
        ))?.c || 0;
        const pendingRequests = (await queryOne(
            `SELECT COUNT(*) as c FROM RecruitmentRequest WHERE department_id IN (${placeholders}) AND status = 'PENDING'`,
            departmentParams
        ))?.c || 0;
        const processingCandidates = (await queryOne(
            `SELECT COUNT(*) as c FROM Candidate WHERE department_id IN (${placeholders}) AND status NOT IN (N'đi làm', N'đã quyết định loại', 'HIRED', 'REJECTED', 'OFFER_REJECTED')`,
            departmentParams
        ))?.c || 0;
        const pendingLeaves = await query(
            `SELECT TOP (5) leave_id as id, leave_code as code, 'NGHI_PHEP' as type,
                    'Nghỉ phép' as typeName, employee_name as employeeName,
                    reason, department_name as deptName, status, created_date
             FROM LeaveApplication WHERE department_id IN (${placeholders}) AND status = 'PENDING'
             ORDER BY created_date DESC`,
            departmentParams
        );
        const pendingRecruitment = await query(
            `SELECT TOP (5) recruitment_request_id as id, request_code as code,
                    'TUYEN_DUNG' as type, 'Yêu cầu tuyển dụng' as typeName,
                    reason as title, status, created_date
             FROM RecruitmentRequest WHERE department_id IN (${placeholders}) AND status = 'PENDING'
             ORDER BY created_date DESC`,
            departmentParams
        );
        const pendingTransfers = await query(
            `SELECT TOP (5) proposal_id as id, proposal_code as code,
                    'THUYEN_CHUYEN' as type, 'Đề xuất thuyên chuyển' as typeName,
                    reason as title, status, created_date
             FROM TransferProposal WHERE current_department_id IN (${placeholders}) AND status = 'PENDING'
             ORDER BY created_date DESC`,
            departmentParams
        );
        const rawPipeline = await query(
            `SELECT status, COUNT(*) as count FROM Candidate
             WHERE department_id IN (${placeholders}) GROUP BY status`,
            departmentParams
        );
        const pipelineMap = {};
        rawPipeline.forEach((row) => { pipelineMap[row.status] = row.count; });
        const deptStructure = await query(
            `SELECT d.department_name, COUNT(e.employee_id) as count
             FROM Department d LEFT JOIN Employee e
               ON d.department_id = e.department_id AND e.is_active = 1 AND e.employment_status = 'WORKING'
             WHERE d.department_id IN (${placeholders})
             GROUP BY d.department_id, d.department_name ORDER BY count DESC`,
            departmentParams
        );
        const pendingApprovals = [...pendingRecruitment, ...pendingTransfers, ...pendingLeaves]
            .sort((a, b) => b.created_date - a.created_date)
            .slice(0, 5);

        return res.json({
            success: true,
            data: {
                teamName: departments.map((item) => item.department_name).join(' / ') || req.user.deptName,
                kpi: {
                    activeEmployees,
                    totalEmployees: activeEmployees,
                    totalRequests,
                    pendingRequests,
                    openPositionsCount: Math.max(0, totalRequests - pendingRequests),
                    processingCandidates,
                    pendingApprovalsCount: pendingApprovals.length
                },
                pendingApprovals,
                deptStructure,
                pipelineStages: candidatePipelineStages(pipelineMap)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/dashboard/employee', authorizeRole('Nhân viên'), async (req, res) => {
    try {
        if (!req.user.employeeId) {
            return res.status(404).json({ success: false, message: 'Tài khoản chưa được liên kết với hồ sơ nhân viên.' });
        }
        const year = new Date().getFullYear();
        const employee = await queryOne(
            `SELECT e.employee_id, e.full_name, e.join_date, e.employment_status,
                    d.department_name, m.full_name as manager_name
             FROM Employee e LEFT JOIN Department d ON e.department_id = d.department_id
             LEFT JOIN Employee m ON e.manager_id = m.employee_id
             WHERE e.employee_id = ?`,
            [req.user.employeeId]
        );
        if (!employee) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nhân viên.' });
        const balance = await queryOne(
            `SELECT entitled_days, used_days, remaining_days FROM EmployeeLeaveBalance
             WHERE employee_id = ? AND leave_year = ?`,
            [req.user.employeeId, year]
        );
        const pendingLeaves = await query(
            `SELECT TOP (5) leave_id as id, leave_code as code, reason, status, created_date
             FROM LeaveApplication WHERE employee_id = ? AND status = 'PENDING'
             ORDER BY created_date DESC`,
            [req.user.employeeId]
        );
        const latestEvaluation = await queryOne(
            `SELECT TOP (1) total_score, grade_result FROM EmployeeEvaluation
             WHERE employee_id = ? ORDER BY evaluation_date DESC, created_date DESC`,
            [req.user.employeeId]
        );
        const contract = await queryOne(
            `SELECT TOP (1) status FROM EmployeeContract
             WHERE employee_id = ? ORDER BY end_date DESC`,
            [req.user.employeeId]
        );

        return res.json({
            success: true,
            data: {
                kpi: {
                    remainingLeave: balance?.remaining_days ?? 0,
                    pendingLeaveCount: pendingLeaves.length
                },
                personal: {
                    leaveYear: year,
                    usedLeave: balance?.used_days ?? 0,
                    entitledLeave: balance?.entitled_days ?? 0,
                    latestScore: latestEvaluation?.total_score,
                    latestGrade: latestEvaluation?.grade_result,
                    contractStatus: contract?.status === 'ACTIVE' ? 'Hiệu lực' : (contract?.status || 'Chưa cập nhật'),
                    employmentStatus: employee.employment_status,
                    joinDate: employee.join_date,
                    department: employee.department_name,
                    managerName: employee.manager_name
                },
                pendingApprovals: pendingLeaves
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Báo cáo thống kê: dành cho Admin/HR/Ban Giám Đốc/Trưởng Khối/Trưởng Phòng.
router.use(authorizeRole('Administrator', 'HR Staff', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng'));

// Dashboard nhân sự dùng chung cho Admin, Ban Giám Đốc và cấp quản lý.
router.get('/dashboard/workforce', authorizeRole('Administrator', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    try {
        const scopedRole = ['Trưởng Khối', 'Trưởng Phòng'].includes(req.user.roleName);
        let departmentIds = [];
        if (scopedRole) {
            const departments = await query(
                `SELECT department_id FROM Department
                 WHERE status = 1 AND (department_id = ? OR parent_department_id = ?)`,
                [req.user.deptId, req.user.deptId]
            );
            departmentIds = departments.map((item) => item.department_id);
            if (!departmentIds.length && req.user.deptId) departmentIds.push(req.user.deptId);
            if (!departmentIds.length) departmentIds.push('__NO_DEPARTMENT__');
        }

        const placeholders = departmentIds.map(() => '?').join(', ');
        const employeeScope = scopedRole ? ` AND e.department_id IN (${placeholders})` : '';
        const departmentScope = scopedRole ? ` AND d.department_id IN (${placeholders})` : '';
        const candidateScope = scopedRole ? ` AND c.department_id IN (${placeholders})` : '';
        const scopeParams = scopedRole ? departmentIds : [];
        const now = Date.now();
        const sixtyDaysLater = now + 60 * 86400000;

        const activeEmployees = Number((await queryOne(
            `SELECT COUNT(*) as c FROM Employee e
             WHERE e.is_active = 1 AND e.employment_status = 'WORKING'${employeeScope}`,
            scopeParams
        ))?.c || 0);
        const probationEmployees = Number((await queryOne(
            `SELECT COUNT(*) as c FROM Employee e
             WHERE e.is_active = 1 AND e.employment_status = 'WORKING'
               AND EXISTS (
                   SELECT 1 FROM EmployeeContract pc
                   WHERE pc.employee_id = e.employee_id AND pc.status = 'ACTIVE'
                     AND (pc.has_probation = 1 OR pc.contract_type LIKE N'%thử việc%')
               )${employeeScope}`,
            scopeParams
        ))?.c || 0);
        const resignedEmployees = Number((await queryOne(
            `SELECT COUNT(*) as c FROM Employee e
             WHERE (e.employment_status = 'RESIGNED' OR e.is_active = 0)${employeeScope}`,
            scopeParams
        ))?.c || 0);
        const headcountTarget = Number((await queryOne(
            `SELECT COALESCE(SUM(d.target_headcount), 0) as c FROM Department d
             WHERE d.status = 1${departmentScope}`,
            scopeParams
        ))?.c || 0);
        const waitingForWork = Number((await queryOne(
            `SELECT COUNT(*) as c FROM Candidate c
             WHERE c.status IN (N'đã quyết định tuyển', N'S5: Trúng tuyển', 'PASSED', 'OFFER_ACCEPTED')
               AND NOT EXISTS (SELECT 1 FROM Employee ce WHERE ce.candidate_id = c.candidate_id)${candidateScope}`,
            scopeParams
        ))?.c || 0);
        const departmentStructure = await query(
            `SELECT d.department_name, d.target_headcount as target, COUNT(e.employee_id) as count
             FROM Department d
             LEFT JOIN Employee e
               ON d.department_id = e.department_id
              AND e.is_active = 1 AND e.employment_status = 'WORKING'
             WHERE d.status = 1${departmentScope}
             GROUP BY d.department_id, d.department_name, d.target_headcount
             ORDER BY count DESC, d.department_name`,
            scopeParams
        );
        const expiringContracts = await query(
            `SELECT TOP (10) ec.contract_id as id, e.employee_code, e.full_name as employee_name,
                    p.position_name, ec.contract_type, ec.end_date, ec.status
             FROM EmployeeContract ec
             JOIN Employee e ON ec.employee_id = e.employee_id
             LEFT JOIN Position p ON e.position_id = p.position_id
             WHERE ec.status = 'ACTIVE' AND ec.end_date IS NOT NULL
               AND ec.end_date >= ? AND ec.end_date <= ?${employeeScope}
             ORDER BY ec.end_date ASC`,
            [now, sixtyDaysLater, ...(scopedRole ? departmentIds : [])]
        );
        const contracts = expiringContracts.map((contract) => {
            const endDate = typeof contract.end_date === 'number'
                ? contract.end_date
                : Number(contract.end_date) || new Date(contract.end_date).getTime();
            const daysRemaining = Math.max(0, Math.ceil((endDate - now) / 86400000));
            return { ...contract, days_remaining: daysRemaining, status_label: `Còn ${daysRemaining} ngày` };
        });
        const departmentNames = scopedRole
            ? (await query(`SELECT department_name FROM Department WHERE department_id IN (${placeholders})`, departmentIds)).map((item) => item.department_name)
            : [];

        res.json({
            success: true,
            data: {
                scopeName: scopedRole ? departmentNames.join(' / ') || req.user.deptName : 'Toàn công ty',
                workforce: {
                    currentEmployees: activeEmployees,
                    headcountTarget,
                    fulfillmentRate: headcountTarget ? Math.round((activeEmployees / headcountTarget) * 100) : 0,
                    expiringContractsCount: contracts.length,
                    departments: departmentStructure,
                    statuses: [
                        { code: 'WORKING', label: 'Đang làm việc', count: Math.max(0, activeEmployees - probationEmployees) },
                        { code: 'RESIGNED', label: 'Đã nghỉ việc', count: resignedEmployees },
                        { code: 'PROBATION', label: 'Đang thử việc', count: probationEmployees },
                        { code: 'WAITING_FOR_WORK', label: 'Chờ nhận việc', count: waitingForWork }
                    ],
                    expiringContracts: contracts
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const parseReportDate = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    const text = String(value);
    const month = text.match(/(?:Tháng\s*)?(\d{1,2})[/-](\d{4})/i);
    if (month) return new Date(Number(month[2]), Number(month[1]) - 1, 1).getTime();
    const year = text.match(/(?:Năm\s*)?(\d{4})/i);
    if (year && !text.includes('-')) return new Date(Number(year[1]), 0, 1).getTime();
    const timestamp = new Date(text).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
};

const applyReportFilters = (rows, filters = {}) => {
    const department = String(filters.department || 'ALL');
    const position = String(filters.position || 'ALL');
    const startDate = parseReportDate(filters.startDate);
    const endDate = parseReportDate(filters.endDate);
    const departmentKeys = ['department_name', 'dept_name', 'department', 'deptName'];
    const positionKeys = ['position_name', 'position', 'apply_position'];
    const dateKeys = ['date', 'period_start', 'decision_date', 'effective_date', 'evaluation_date', 'interview_date', 'start_date', 'end_date', 'sign_date', 'join_date', 'onboard_date', 'resign_date', 'dob'];
    return rows.filter((row) => {
        if (department !== 'ALL') {
            const value = departmentKeys.map((key) => row[key]).find(Boolean);
            if (!value || String(value) !== department) return false;
        }
        if (position !== 'ALL') {
            const value = positionKeys.map((key) => row[key]).find(Boolean);
            if (!value || String(value) !== position) return false;
        }
        const dateKey = dateKeys.find((key) => row[key] !== null && row[key] !== undefined && row[key] !== '');
        const dateValue = dateKey ? parseReportDate(row[dateKey]) : null;
        if (dateKey === 'dob' && dateValue && startDate && endDate) {
            const birthdayMonth = new Date(dateValue).getMonth();
            const startMonth = new Date(startDate).getMonth();
            const endMonth = new Date(endDate).getMonth();
            if (birthdayMonth < startMonth || birthdayMonth > endMonth) return false;
            return true;
        }
        if (dateValue && startDate && dateValue < startDate) return false;
        if (dateValue && endDate && dateValue > endDate + 86399999) return false;
        return true;
    });
};

const normalizeReportFilters = (filters = {}) => {
    if (filters.period === 'Quý I/2026') return { ...filters, startDate: '2026-01-01', endDate: '2026-03-31' };
    if (filters.period === 'Quý II/2026') return { ...filters, startDate: '2026-04-01', endDate: '2026-06-30' };
    if (filters.period === 'Tháng 08/2026') return { ...filters, startDate: '2026-08-01', endDate: '2026-08-31' };
    return filters;
};

// --- 0. DASHBOARD ADMIN (chỉ Administrator) ---
router.get('/dashboard/admin', async (req, res) => {
    if (req.user.roleName !== 'Administrator') {
        return res.status(403).json({ success: false, message: 'Chỉ Administrator được xem Dashboard này.' });
    }
    try {
        const totalUsers = (await queryOne(`SELECT COUNT(*) as c FROM User`))?.c || 0;
        const activeUsers = (await queryOne(`SELECT COUNT(*) as c FROM User WHERE status = 1`))?.c || 0;
        const lockedUsers = (await queryOne(`SELECT COUNT(*) as c FROM User WHERE status = 0`))?.c || 0;
        const totalDepartments = (await queryOne(`SELECT COUNT(*) as c FROM Department WHERE status = 1`))?.c || 0;
        const totalEmployees = (await queryOne(`SELECT COUNT(*) as c FROM Employee WHERE is_active = 1`))?.c || 0;
        const totalPositions = (await queryOne(`SELECT COUNT(*) as c FROM Position WHERE status = 1`))?.c || 0;

        // Cơ cấu tài khoản theo vai trò
        const usersByRole = await query(
            `SELECT r.role_name, COUNT(u.user_id) as count
       FROM Role r LEFT JOIN User u ON u.role_id = r.role_id
       GROUP BY r.role_id, r.role_name
       ORDER BY count DESC`
        );

        // Nhân sự theo phòng ban
        const employeesByDept = await query(
            `SELECT d.department_name, COUNT(e.employee_id) as count
       FROM Department d LEFT JOIN Employee e ON e.department_id = d.department_id AND e.is_active = 1
       WHERE d.status = 1
       GROUP BY d.department_id, d.department_name
       ORDER BY count DESC`
        );

        // Hoạt động cần xử lý: tài khoản mới tạo trong 30 ngày gần nhất, tài khoản bị khóa
        const thirtyDaysAgo = Date.now() - 30 * 86400000;
        const recentUsers = await query(
            `SELECT TOP (5) user_id, username, full_name, created_date FROM User WHERE created_date >= ? ORDER BY created_date DESC`,
            [thirtyDaysAgo]
        );
        const lockedUserList = await query(
            `SELECT TOP (5) user_id, username, full_name FROM User WHERE status = 0 ORDER BY last_modified_date DESC`
        );

        res.json({
            success: true,
            data: {
                kpi: { totalUsers, activeUsers, lockedUsers, totalDepartments, totalEmployees, totalPositions },
                usersByRole,
                employeesByDept,
                recentUsers,
                lockedUserList
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/departments', async (req, res) => {
    try {
        const departments = await query(`SELECT department_id, department_code, department_name FROM Department WHERE status = 1 ORDER BY department_code, department_name`);
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/positions', async (req, res) => {
    try {
        const positions = await query(`SELECT position_id, position_code, position_name FROM Position WHERE status = 1 ORDER BY position_code, position_name`);
        res.json({ success: true, data: positions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 1. DASHBOARD OVERVIEW & QUICK STATS ---
router.get('/dashboard/summary', async (req, res) => {
    try {
        const totalEmployees = (await queryOne(`SELECT COUNT(*) as count FROM Employee WHERE is_active = 1 AND employment_status = 'WORKING'`))?.count || 0;
        const totalRequests = (await queryOne(`SELECT COUNT(*) as count FROM RecruitmentRequest WHERE status IN ('PENDING', 'APPROVED')`))?.count || 0;
        const activePlans = (await queryOne(`SELECT COUNT(*) as count FROM RecruitmentPlan WHERE status = 'IN_PROGRESS'`))?.count || 0;
        const totalCandidates = (await queryOne(`SELECT COUNT(*) as count FROM Candidate`))?.count || 0;
        const pendingInterviews = (await queryOne(`SELECT COUNT(*) as count FROM Interview WHERE result = 'PENDING'`))?.count || 0;
        const totalRewards = (await queryOne(`SELECT COUNT(*) as count FROM RewardDiscipline WHERE decision_type = 'KHEN_THUONG'`))?.count || 0;
        const processingCandidates = (await queryOne(`SELECT COUNT(*) as count FROM Candidate WHERE status NOT IN (N'đi làm', N'đã quyết định loại', 'HIRED', 'REJECTED', 'OFFER_REJECTED')`))?.count || 0;

        const pendingRequests = await query(`SELECT TOP (5) recruitment_request_id as id, request_code as code, 'YCTD' as type, 'Yêu cầu tuyển dụng' as typeName, reason as title, status FROM RecruitmentRequest WHERE status = 'PENDING'`);
        const deptStructure = await query(
            `SELECT d.department_name, COUNT(e.employee_id) as count
             FROM Department d LEFT JOIN Employee e ON d.department_id = e.department_id AND e.is_active = 1
             WHERE d.status = 1 GROUP BY d.department_id, d.department_name ORDER BY count DESC`
        );
        const rawPipeline = await query(`SELECT status, COUNT(*) as count FROM Candidate GROUP BY status`);
        const pipelineMap = {};
        rawPipeline.forEach(row => { pipelineMap[row.status] = row.count; });
        const pipelineStages = candidatePipelineStages(pipelineMap);

        const pendingTasks = pendingRequests.map(r => ({
            id: r.id,
            code: r.code,
            type: 'REQUEST',
            title: `Yêu cầu tuyển dụng ${r.code}: ${r.title}`,
            status: 'Chờ duyệt'
        }));

        res.json({
            success: true,
            data: {
                kpi: {
                    totalEmployees,
                    activeEmployees: totalEmployees,
                    totalRequests,
                    pendingRequests: pendingRequests.length,
                    openPositionsCount: activePlans,
                    totalCandidates,
                    processingCandidates,
                    pendingApprovalsCount: pendingRequests.length
                },
                totalEmployees,
                totalRequests,
                activePlans,
                totalCandidates,
                pendingInterviews,
                totalRewards,
                pendingTasks,
                pendingApprovals: pendingRequests,
                pipelineStages,
                deptStructure
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2. DASHBOARD CHARTS DATA ---
router.get('/dashboard/charts', async (req, res) => {
    try {
        // 1. Phân bổ nhân sự theo Phòng ban
        const deptDistribution = await query(
            `SELECT d.department_name as dept_name, COUNT(e.employee_id) as emp_count 
       FROM Department d 
       LEFT JOIN Employee e ON d.department_id = e.department_id AND e.is_active = 1 AND e.employment_status = 'WORKING'
       WHERE d.status = 1
       GROUP BY d.department_id, d.department_name`
        );

        // 2. Phân bổ ứng viên theo Trạng thái Tuyển dụng
        const rawCandidateStatusDistribution = await query(
            `SELECT status as status_code, COUNT(candidate_id) as candidate_count
        FROM Candidate
        GROUP BY status`
        );
        const distributionMap = {};
        rawCandidateStatusDistribution.forEach((row) => {
            const status = canonicalCandidateStatus(row.status_code);
            distributionMap[status] = (distributionMap[status] || 0) + Number(row.candidate_count || 0);
        });
        const candidateStatusDistribution = Object.entries(distributionMap).map(([status_code, candidate_count]) => ({ status_code, candidate_count }));

        // 3. Thống kê Khen thưởng & Kỷ luật
        const rewardDisciplineStats = await query(
            `SELECT decision_type as record_type, COUNT(reward_discipline_id) as count 
       FROM RewardDiscipline 
       GROUP BY decision_type`
        );

        res.json({
            success: true,
            data: {
                deptDistribution,
                candidateStatusDistribution,
                rewardDisciplineStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2B. DASHBOARD NGHIỆP VỤ HR (dành cho HR Staff & Administrator) ---
router.get('/dashboard/hr', async (req, res) => {
    if (!['Administrator', 'HR Staff'].includes(req.user.roleName)) {
        return res.status(403).json({ success: false, message: 'Chỉ nhân sự HR và Administrator mới được truy cập Dashboard HR.' });
    }
    try {
        // 1. KPIs Tuyển dụng
        const totalRequests = (await queryOne(`SELECT COUNT(*) as c FROM RecruitmentRequest`))?.c || 0;
        const pendingRequestsCount = (await queryOne(`SELECT COUNT(*) as c FROM RecruitmentRequest WHERE status = 'PENDING'`))?.c || 0;
        const recruitingRequestsCount = (await queryOne(`SELECT COUNT(*) as c FROM RecruitmentRequest WHERE status IN ('APPROVED', 'IN_PROGRESS', 'RECRUITING')`))?.c || 0;
        const totalCandidates = (await queryOne(`SELECT COUNT(*) as c FROM Candidate`))?.c || 0;
        const processingCandidates = (await queryOne(`SELECT COUNT(*) as c FROM Candidate WHERE status NOT IN (N'đi làm', N'đã quyết định loại', 'HIRED', 'REJECTED', 'OFFER_REJECTED')`))?.c || 0;
        const upcomingInterviewsCount = (await queryOne(`SELECT COUNT(*) as c FROM InterviewSchedule WHERE status = 'Đã lên lịch'`))?.c || 0;
        const pendingOffersCount = (await queryOne(`SELECT COUNT(*) as c FROM Offer WHERE offer_status IN ('SENT', 'PENDING')`))?.c || 0;
        const currentEmployees = (await queryOne(`SELECT COUNT(*) as c FROM Employee WHERE is_active = 1 AND employment_status = 'WORKING'`))?.c || 0;
        const headcountTarget = (await queryOne(`SELECT COALESCE(SUM(target_headcount), 0) as c FROM Position WHERE status = 1`))?.c || 0;
        const now = Date.now();
        const sixtyDaysFuture = now + 60 * 86400000;
        const expiringContractsCount = (await queryOne(
            `SELECT COUNT(*) as c FROM EmployeeContract
             WHERE status = 'ACTIVE' AND end_date IS NOT NULL
               AND end_date >= ? AND end_date <= ?`,
            [now, sixtyDaysFuture]
        ))?.c || 0;

        // 2. Pipeline Tuyển dụng theo Trạng thái Ứng viên
        const rawPipeline = await query(
            `SELECT status, COUNT(*) as count FROM Candidate GROUP BY status`
        );
        const pipelineMap = {};
        rawPipeline.forEach(r => { pipelineMap[r.status] = r.count; });

        const pipelineStages = candidatePipelineStages(pipelineMap);
        const passedInterviewCandidates = (await queryOne(
            `SELECT COUNT(DISTINCT candidate_id) as c FROM InterviewEvaluation
             WHERE overall_result IN (N'ĐẠT', 'PASSED')`
        ))?.c || 0;
        const receivedCandidates = countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.received);
        const interviewingCandidates = countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.scheduled)
            + countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.interviewed)
            + countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.selected)
            + countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.working);
        const selectedCandidates = countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.selected)
            + countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.working);
        const pipelineFunnel = [
            { code: 'candidates', label: 'Ứng viên', count: Number(totalCandidates) },
            { code: 'screened', label: 'Sơ loại', count: Math.max(0, Number(totalCandidates) - Number(receivedCandidates)) },
            { code: 'interviewing', label: 'Phỏng vấn', description: 'đang phỏng vấn', count: interviewingCandidates },
            { code: 'passed', label: 'Đạt', count: Math.max(Number(passedInterviewCandidates), selectedCandidates) },
            { code: 'selected', label: 'Nhận việc', description: 'quyết định tuyển dụng', count: selectedCandidates },
            { code: 'working', label: 'Chính thức', description: 'đi làm', count: countStatuses(pipelineMap, CANDIDATE_STATUS_GROUPS.working) }
        ];

        // 3. Tuyển dụng theo vị trí
        const recruitmentByPosition = await query(
             `SELECT TOP (10) p.position_id, p.position_name, d.department_name,
                    COALESCE(SUM(rr.quantity), p.target_headcount, 0) as target_headcount,
                    COUNT(DISTINCT c.candidate_id) as candidate_count,
                    SUM(CASE WHEN c.status IN (N'đi làm', 'HIRED') THEN 1 ELSE 0 END) as hired_count
             FROM Position p
             LEFT JOIN Department d ON p.department_id = d.department_id
             LEFT JOIN RecruitmentRequest rr ON rr.position_id = p.position_id
             LEFT JOIN RecruitmentPlan rplan ON rplan.recruitment_request_id = rr.recruitment_request_id
             LEFT JOIN Candidate c ON c.recruitment_plan_id = rplan.recruitment_plan_id
             WHERE p.status = 1
              GROUP BY p.position_id, p.position_name, p.target_headcount, d.department_name
              ORDER BY target_headcount DESC`
        ).map(p => ({
            ...p,
            shortfall: Math.max(0, p.target_headcount - p.hired_count)
        }));

        // 4. Khu vực công việc cần xử lý của HR
        // - Tuyển dụng
        const pendingRecruitmentRequestsList = await query(
             `SELECT TOP (5) rr.recruitment_request_id as id, rr.request_code as code, rr.reason as title, rr.quantity, d.department_name as deptName, p.position_name as positionName, rr.created_date
             FROM RecruitmentRequest rr
             LEFT JOIN Department d ON rr.department_id = d.department_id
             LEFT JOIN Position p ON rr.position_id = p.position_id
              WHERE rr.status = 'PENDING' ORDER BY rr.created_date DESC`
        );

        const candidatesToScreen = await query(
             `SELECT TOP (5) candidate_id as id, candidate_code as code, full_name as fullName, email, phone, received_date
               FROM Candidate WHERE status IN (N'tiếp nhận hồ sơ', N'Đã tiếp nhận hồ sơ', 'SUBMITTED', 'NEW') ORDER BY created_date DESC`
        );

        const hiredCandidates = await query(
             `SELECT TOP (10) candidate.candidate_id as id, candidate.full_name as candidate_name,
                     COALESCE(candidate_position.position_name, request_position.position_name, N'-') as position_name,
                     COALESCE(candidate_department.department_name, request_department.department_name, N'-') as department_name,
                     decision.decision_date as hired_date,
                     CASE WHEN employee.employee_id IS NOT NULL OR candidate.status IN (N'đi làm', 'HIRED')
                          THEN N'Đã nhận việc' ELSE N'Chờ nhận việc' END as status_label
              FROM RecruitmentDecision decision
              JOIN Candidate candidate ON candidate.candidate_id = decision.candidate_id
              LEFT JOIN Employee employee ON employee.candidate_id = candidate.candidate_id
              LEFT JOIN RecruitmentPlan plan ON plan.recruitment_plan_id = candidate.recruitment_plan_id
              LEFT JOIN RecruitmentRequest request ON request.recruitment_request_id = COALESCE(candidate.recruitment_request_id, plan.recruitment_request_id)
              LEFT JOIN Position candidate_position ON candidate_position.position_id = candidate.position_id
              LEFT JOIN Position request_position ON request_position.position_id = request.position_id
              LEFT JOIN Department candidate_department ON candidate_department.department_id = candidate.department_id
              LEFT JOIN Department request_department ON request_department.department_id = request.department_id
              WHERE decision.result IN (N'ĐẠT', 'PASSED') AND decision.status <> 'CANCELLED'
              ORDER BY decision.decision_date DESC, decision.created_date DESC`
        );

        const inProgressCandidates = await query(
             `SELECT TOP (10) candidate.candidate_id as id, candidate.full_name as candidate_name,
                     COALESCE(candidate_position.position_name, request_position.position_name, N'-') as position_name,
                     CASE
                         WHEN candidate.status IN (N'tiếp nhận hồ sơ', N'Đã tiếp nhận hồ sơ', 'SUBMITTED', 'NEW') THEN N'Sàng lọc'
                         WHEN candidate.status IN (N'đã sơ loại', N'Đã sơ loại, Đạt', N'Đã sơ loại, Không đạt', 'SCREENED') THEN N'Sơ loại'
                         WHEN candidate.status IN (N'đã tạo lịch', 'INTERVIEWING') THEN N'Lên lịch phỏng vấn'
                         WHEN candidate.status IN (N'đã phỏng vấn', N'Đã phỏng vấn, Đạt', N'Đã phỏng vấn, Không đạt', 'INTERVIEWED', 'S2: Phỏng vấn') THEN N'Phỏng vấn'
                         ELSE candidate.status
                     END as current_stage,
                     COALESCE(candidate.last_modified_date, candidate.eval_date, candidate.received_date, candidate.created_date) as updated_date
              FROM Candidate candidate
              LEFT JOIN RecruitmentPlan plan ON plan.recruitment_plan_id = candidate.recruitment_plan_id
              LEFT JOIN RecruitmentRequest request ON request.recruitment_request_id = COALESCE(candidate.recruitment_request_id, plan.recruitment_request_id)
              LEFT JOIN Position candidate_position ON candidate_position.position_id = candidate.position_id
              LEFT JOIN Position request_position ON request_position.position_id = request.position_id
              WHERE candidate.status NOT IN (
                  N'đi làm', N'đã quyết định loại', N'đã quyết định tuyển',
                  N'S5: Trúng tuyển', N'S7: Loại', 'HIRED', 'REJECTED', 'OFFER_REJECTED', 'PASSED', 'OFFER_ACCEPTED'
              )
              ORDER BY updated_date DESC, candidate.created_date DESC`
        );

        const upcomingInterviewsList = await query(
             `SELECT TOP (5) schedule_id as id, schedule_code as code, round_type as roundType, format_type as formatType, location, start_time
              FROM InterviewSchedule WHERE status = 'Đã lên lịch' ORDER BY start_time ASC`
        );

        const pendingOffersList = await query(
             `SELECT TOP (5) o.offer_id as id, c.candidate_code as candidateCode, c.full_name as candidateName, o.official_salary as salary, o.offer_status as status, o.offer_date
             FROM Offer o JOIN Candidate c ON o.candidate_id = c.candidate_id
              WHERE o.offer_status IN ('SENT', 'PENDING') ORDER BY o.created_date DESC`
        );

        // - Nhân sự
        const expiringContractsList = await query(
             `SELECT TOP (5) ec.contract_id as id, ec.contract_no as code, e.employee_code as empCode, e.full_name as empName, ec.contract_type as contractType, ec.end_date as endDate
             FROM EmployeeContract ec
             JOIN Employee e ON ec.employee_id = e.employee_id
             WHERE ec.status = 'ACTIVE' AND ec.end_date IS NOT NULL AND ec.end_date >= ? AND ec.end_date <= ?
              ORDER BY ec.end_date ASC`,
            [now, sixtyDaysFuture]
        );

        const newHiresIncomplete = await query(
             `SELECT TOP (5) employee_id as id, employee_code as code, full_name as name, join_date, department_id
              FROM Employee WHERE is_active = 1 AND (citizen_id IS NULL OR citizen_id = '' OR email IS NULL OR email = '')
              ORDER BY join_date DESC`
        );

        const pendingProposalsList = await query(
             `SELECT TOP (5) * FROM (
              SELECT proposal_id as id, proposal_code as code, 'CONTRACT' as type, 'Đề xuất Hợp đồng' as typeName, status, created_date
              FROM ContractProposal WHERE status = 'PENDING'
              UNION ALL
              SELECT proposal_id as id, proposal_code as code, 'TRANSFER' as type, 'Đề xuất Thuyên chuyển' as typeName, status, created_date
              FROM TransferProposal WHERE status = 'PENDING'
              UNION ALL
              SELECT proposal_id as id, proposal_code as code, 'REWARD' as type, 'Đề xuất Khen thưởng/Kỷ luật' as typeName, status, created_date
              FROM RewardDisciplineProposal WHERE status = 'PENDING'
             ) AS pending_proposals ORDER BY created_date DESC`
        );

        // - Nghỉ phép
        const pendingLeavesList = await query(
             `SELECT TOP (5) leave_id as id, leave_code as code, employee_name as empName, department_name as deptName, start_date as startDate, end_date as endDate, total_days as totalDays, reason
              FROM LeaveApplication WHERE status = 'PENDING' ORDER BY created_date DESC`
        );

        // 5. Biểu đồ nhân sự cho HR
        const deptStructure = await query(
            `SELECT d.department_name, COUNT(e.employee_id) as count
             FROM Department d LEFT JOIN Employee e ON d.department_id = e.department_id AND e.is_active = 1
             WHERE d.status = 1 GROUP BY d.department_id, d.department_name ORDER BY count DESC`
        );

        const positionStructure = await query(
             `SELECT TOP (8) p.position_name, COUNT(e.employee_id) as count
             FROM Position p LEFT JOIN Employee e ON p.position_id = e.position_id AND e.is_active = 1
              WHERE p.status = 1 GROUP BY p.position_id, p.position_name ORDER BY count DESC`
        );

        const movementStats = {
            newHires: (await queryOne(`SELECT COUNT(*) as c FROM Employee WHERE join_date >= ?`, [now - 90 * 86400000]))?.c || 0,
            resignations: (await queryOne(`SELECT COUNT(*) as c FROM ResignationDecision WHERE status = 'EXECUTED'`))?.c || 0,
            transfers: (await queryOne(`SELECT COUNT(*) as c FROM TransferDecision WHERE status = 'EXECUTED'`))?.c || 0,
            promotions: (await queryOne(`SELECT COUNT(*) as c FROM WorkHistory WHERE decision_type LIKE '%Thăng chức%' OR decision_type LIKE '%Bổ nhiệm%'`))?.c || 0
        };

        res.json({
            success: true,
            data: {
                kpi: {
                    totalRequests,
                    pendingRequests: pendingRequestsCount,
                    recruitingRequests: recruitingRequestsCount,
                    totalCandidates,
                    processingCandidates,
                    upcomingInterviews: upcomingInterviewsCount,
                    pendingOffers: pendingOffersCount,
                    currentEmployees,
                    headcountTarget,
                    fulfillmentRate: headcountTarget ? Math.round((currentEmployees / headcountTarget) * 100) : 0,
                    expiringContractsCount
                },
                pipelineStages,
                pipelineFunnel,
                recruitmentByPosition,
                actionNeeded: {
                    recruitment: {
                        pendingRequests: pendingRecruitmentRequestsList,
                        candidatesToScreen,
                        hiredCandidates,
                        inProgressCandidates,
                        upcomingInterviews: upcomingInterviewsList,
                        pendingOffers: pendingOffersList
                    },
                    hr: {
                        expiringContracts: expiringContractsList,
                        newHiresIncomplete,
                        pendingProposals: pendingProposalsList
                    },
                    leaves: {
                        pendingLeaves: pendingLeavesList
                    }
                },
                charts: {
                    deptStructure,
                    positionStructure,
                    movementStats
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2C. DASHBOARD BAN GIÁM ĐỐC (dành cho Ban Giám Đốc & Administrator) ---
router.get('/dashboard/bgd', async (req, res) => {
    if (!['Administrator', 'Ban Giám Đốc'].includes(req.user.roleName)) {
        return res.status(403).json({ success: false, message: 'Chỉ Ban Giám Đốc và Administrator mới được truy cập Dashboard này.' });
    }
    try {
        const now = Date.now();
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();

        // 1. KPI tổng quan Ban Giám Đốc
        const totalEmployees = (await queryOne(`SELECT COUNT(*) as c FROM Employee WHERE is_active = 1`))?.c || 0;
        const activeEmployees = (await queryOne(`SELECT COUNT(*) as c FROM Employee WHERE is_active = 1 AND employment_status = 'WORKING'`))?.c || 0;
        const newEmployeesPeriod = (await queryOne(`SELECT COUNT(*) as c FROM Employee WHERE join_date >= ?`, [startOfYear]))?.c || 0;
        const resignedEmployeesPeriod = (await queryOne(`SELECT COUNT(*) as c FROM ResignationDecision WHERE created_date >= ?`, [startOfYear]))?.c || 0;
        const openPositionsCount = (await queryOne(`SELECT COUNT(DISTINCT position_id) as c FROM RecruitmentRequest WHERE status IN ('APPROVED', 'IN_PROGRESS', 'RECRUITING')`))?.c || 0;
        const pendingRequestsCount = (await queryOne(`SELECT COUNT(*) as c FROM RecruitmentRequest WHERE status = 'PENDING'`))?.c || 0;

        // Phiếu chờ Ban Giám đốc phê duyệt
        const pendingTransfers = await query(
            `SELECT p.proposal_id as id, p.proposal_code as code, 'THUYEN_CHUYEN' as type, 'Đề xuất Thuyên chuyển/Bổ nhiệm' as typeName,
                    e.full_name as employeeName, p.reason, p.created_date, 'PENDING' as status, 'Cấp Ban Giám Đốc' as currentLevel
             FROM TransferProposal p JOIN Employee e ON p.employee_id = e.employee_id
             WHERE p.status = 'PENDING'`
        );
        const pendingResignations = await query(
            `SELECT r.application_id as id, r.application_code as code, 'NGHI_VIEC' as type, 'Đơn xin nghỉ việc' as typeName,
                    e.full_name as employeeName, r.reason, r.created_date, 'PENDING' as status, 'Cấp Ban Giám Đốc' as currentLevel
             FROM ResignationApplication r JOIN Employee e ON r.employee_id = e.employee_id
             WHERE r.status = 'PENDING'`
        );
        const pendingRewards = await query(
            `SELECT rp.proposal_id as id, rp.proposal_code as code, 'KHEN_THUONG' as type, 'Đề xuất Khen thưởng/Kỷ luật' as typeName,
                    e.full_name as employeeName, rp.reason, rp.created_date, 'PENDING' as status, 'Cấp Ban Giám Đốc' as currentLevel
             FROM RewardDisciplineProposal rp JOIN Employee e ON rp.employee_id = e.employee_id
             WHERE rp.status = 'PENDING'`
        );
        const pendingReqs = await query(
            `SELECT rr.recruitment_request_id as id, rr.request_code as code, 'TUYEN_DUNG' as type, 'Yêu cầu Tuyển dụng phát sinh' as typeName,
                    e.full_name as employeeName, rr.reason, rr.created_date, 'PENDING' as status, 'Cấp Ban Giám Đốc' as currentLevel
             FROM RecruitmentRequest rr LEFT JOIN Employee e ON rr.requested_by = e.employee_id
             WHERE rr.status = 'PENDING'`
        );
        const pendingManagerLeaves = await query(
            `SELECT l.leave_id as id, l.leave_code as code, 'NGHI_PHEP' as type, 'Nghỉ phép Cấp Quản lý' as typeName,
                    l.employee_name as employeeName, l.reason, l.created_date, 'PENDING' as status, 'Cấp Ban Giám Đốc' as currentLevel
             FROM LeaveApplication l
             JOIN Employee e ON l.employee_id = e.employee_id
             WHERE l.status = 'PENDING' AND (e.level IN ('Trưởng phòng', 'Trưởng Khối', 'Ban Giám Đốc') OR e.department_id = 'dept-bgd')`
        );

        const allPendingBgd = [
            ...pendingTransfers,
            ...pendingResignations,
            ...pendingRewards,
            ...pendingReqs,
            ...pendingManagerLeaves
        ].sort((a, b) => b.created_date - a.created_date);

        // 2. Biểu đồ cơ cấu nhân sự
        const deptStructure = await query(
            `SELECT d.department_name, COUNT(e.employee_id) as count
             FROM Department d LEFT JOIN Employee e ON d.department_id = e.department_id AND e.is_active = 1
             WHERE d.status = 1 GROUP BY d.department_id, d.department_name ORDER BY count DESC`
        );

        const levelStructure = await query(
            `SELECT COALESCE(level, 'Nhân viên') as level_name, COUNT(employee_id) as count
             FROM Employee WHERE is_active = 1 GROUP BY level ORDER BY count DESC`
        );

        // Biến động nhân sự
        const movementTrend = [
            { period: 'Tháng 5', newHires: 6, resignations: 2, transfers: 3, promotions: 1 },
            { period: 'Tháng 6', newHires: 8, resignations: 1, transfers: 2, promotions: 2 },
            { period: 'Tháng 7', newHires: 5, resignations: 3, transfers: 4, promotions: 1 },
            { period: 'Tháng 8', newHires: 9, resignations: 1, transfers: 2, promotions: 3 }
        ];

        // 3. Tình hình tuyển dụng tổng quan
        const totalTargetRecruitment = (await queryOne(`SELECT COALESCE(SUM(quantity), 0) as s FROM RecruitmentRequest`))?.s || 30;
        const totalHiredRecruitment = (await queryOne(`SELECT COUNT(*) as c FROM Candidate WHERE status IN (N'đi làm', 'HIRED')`))?.c || 22;
        const remainingShortfall = Math.max(0, totalTargetRecruitment - totalHiredRecruitment);
        const completionRate = totalTargetRecruitment > 0 ? Math.round((totalHiredRecruitment / totalTargetRecruitment) * 100) : 0;

        res.json({
            success: true,
            data: {
                kpi: {
                    totalEmployees,
                    activeEmployees,
                    newEmployeesPeriod,
                    resignedEmployeesPeriod,
                    openPositionsCount,
                    pendingRequestsCount,
                    pendingApprovalsCount: allPendingBgd.length
                },
                pendingApprovals: allPendingBgd,
                deptStructure,
                levelStructure,
                movementTrend,
                recruitmentOverview: {
                    totalTarget: totalTargetRecruitment,
                    totalHired: totalHiredRecruitment,
                    remainingShortfall,
                    completionRate,
                    openPositionsCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 3. BÁO CÁO THỐNG KÊ CHI TIẾT ---
router.get('/recruitment', async (req, res) => {
    const plans = await query(
        `SELECT pl.recruitment_plan_id, pl.plan_name, pl.budget, pl.start_date, pl.end_date,
            COUNT(c.candidate_id) as total_candidates,
            SUM(CASE WHEN c.status IN (N'đi làm', 'HIRED') THEN 1 ELSE 0 END) as hired_count,
            SUM(CASE WHEN c.status IN (N'đã quyết định tuyển', N'S5: Trúng tuyển') THEN 1 ELSE 0 END) as offered_count
     FROM RecruitmentPlan pl
     LEFT JOIN Candidate c ON pl.recruitment_plan_id = c.recruitment_plan_id
     GROUP BY pl.recruitment_plan_id`
    );
    res.json({ success: true, data: plans });
});

router.get('/hr', async (req, res) => {
    const contractStats = await query(
        `SELECT contract_type, COUNT(contract_id) as count 
     FROM EmployeeContract 
     WHERE status = 'ACTIVE'
     GROUP BY contract_type`
    );
    const totalSalaryFund = (await queryOne(`SELECT SUM(salary) as total FROM EmployeeContract WHERE status = 'ACTIVE'`))?.total || 0;

    res.json({
        success: true,
        data: {
            contractStats,
            totalSalaryFund
        }
    });
});

// --- 4. DYNAMIC REPORT QUERY ENDPOINT FOR ALL 18 REPORTS ---
router.post('/query', async (req, res) => {
    try {
        const { reportId } = req.body;
        const filters = normalizeReportFilters(req.body.filters || {});
        let rows = [];
        let summary = {};

        switch (reportId) {
            // 1. RECRUITMENT REPORTS
            case 'rec_result': // Báo cáo kết quả tuyển dụng
                {
                    const startDate = parseReportDate(filters.startDate) ?? 0;
                    const endDate = (parseReportDate(filters.endDate) ?? Date.now()) + 86399999;
                    rows = await query(
                        `WITH RequestBase AS (
                            SELECT rr.recruitment_request_id, rr.department_id, rr.position_id, rr.quantity, rr.created_date
                            FROM RecruitmentRequest rr
                            WHERE rr.created_date >= ? AND rr.created_date <= ?
                        ), HiredByRequest AS (
                            SELECT COALESCE(c.recruitment_request_id, pl.recruitment_request_id) as recruitment_request_id,
                                   COUNT(DISTINCT c.candidate_id) as hired_quantity
                            FROM Candidate c
                            LEFT JOIN RecruitmentPlan pl ON pl.recruitment_plan_id = c.recruitment_plan_id
                            JOIN Employee e ON e.candidate_id = c.candidate_id
                            WHERE c.status IN (N'đi làm', 'HIRED') AND e.is_active = 1 AND e.employment_status = 'WORKING'
                            GROUP BY COALESCE(c.recruitment_request_id, pl.recruitment_request_id)
                        )
                        SELECT d.department_name, p.position_name,
                               SUM(rb.quantity) as required_quantity,
                               SUM(COALESCE(hr.hired_quantity, 0)) as hired_quantity,
                               MIN(rb.created_date) as period_start
                        FROM RequestBase rb
                        LEFT JOIN Department d ON d.department_id = rb.department_id
                        LEFT JOIN Position p ON p.position_id = rb.position_id
                        LEFT JOIN HiredByRequest hr ON hr.recruitment_request_id = rb.recruitment_request_id
                        GROUP BY rb.department_id, rb.position_id, d.department_name, p.position_name
                        ORDER BY d.department_name, p.position_name`,
                        [startDate, endDate]
                    ).map((row) => ({ ...row, remaining_quantity: Math.max(0, Number(row.required_quantity || 0) - Number(row.hired_quantity || 0)) }));
                    summary = { totalRequired: rows.reduce((sum, row) => sum + Number(row.required_quantity || 0), 0), totalHired: rows.reduce((sum, row) => sum + Number(row.hired_quantity || 0), 0), totalRemaining: rows.reduce((sum, row) => sum + Number(row.remaining_quantity || 0), 0) };
                }
                break;

            case 'rec_efficiency': // Hiệu quả tuyển dụng theo tin theo nguồn
                rows = await query(
                    `SELECT COALESCE(NULLIF(c.source, ''), N'Không xác định') as source_name,
                            COUNT(DISTINCT c.recruitment_plan_id) as post_count,
                            COUNT(DISTINCT c.candidate_id) as total_cv,
                            SUM(CASE WHEN c.status NOT IN (N'đã quyết định loại', N'S7: Loại', 'REJECTED') THEN 1 ELSE 0 END) as qualified_cv,
                            COUNT(DISTINCT i.candidate_id) as interview_count,
                            SUM(CASE WHEN c.status IN (N'đi làm', 'HIRED') THEN 1 ELSE 0 END) as hired_count,
                            CAST(0 as DECIMAL(18, 2)) as cost
                     FROM Candidate c
                     LEFT JOIN Interview i ON i.candidate_id = c.candidate_id
                     GROUP BY COALESCE(NULLIF(c.source, ''), N'Không xác định')`
                ).map((row) => ({ ...row, cost_per_hired: row.hired_count ? Math.round(Number(row.cost || 0) / Number(row.hired_count)) : 0 }));
                summary = { totalSources: rows.length, totalCV: rows.reduce((sum, row) => sum + Number(row.total_cv || 0), 0), totalHired: rows.reduce((sum, row) => sum + Number(row.hired_count || 0), 0) };
                break;

            case 'rec_source_quality': // Đánh giá chất lượng nguồn tuyển dụng
                rows = await query(
                    `SELECT COALESCE(NULLIF(c.source, ''), N'Không xác định') as source_name,
                            COUNT(DISTINCT c.candidate_id) as candidate_count,
                            AVG(ev.total_score) as avg_kpi_score,
                            SUM(CASE WHEN e.join_date <= ? AND e.is_active = 1 THEN 1 ELSE 0 END) as retained_count,
                            COUNT(DISTINCT e.employee_id) as hired_count
                     FROM Candidate c
                     LEFT JOIN Employee e ON e.candidate_id = c.candidate_id
                     LEFT JOIN EmployeeEvaluation ev ON ev.employee_id = e.employee_id
                     GROUP BY COALESCE(NULLIF(c.source, ''), N'Không xác định')`,
                    [Date.now() - 365 * 86400000]
                ).map((row) => {
                    const score = row.avg_kpi_score === null ? '-' : `${Number(row.avg_kpi_score).toFixed(1)} / 10`;
                    const retention = Number(row.hired_count || 0) ? `${Math.round(Number(row.retained_count || 0) / Number(row.hired_count) * 100)}%` : '-';
                    return { ...row, pass_probation_rate: '-', avg_kpi_score: score, retention_1year: retention, overall_rating: score === '-' ? 'Chưa đủ dữ liệu' : Number(row.avg_kpi_score) >= 8.5 ? 'Tốt' : 'Theo dõi' };
                });
                summary = { totalSources: rows.length, note: 'Tỷ lệ đạt thử việc chưa có trường dữ liệu riêng trong hệ thống.' };
                break;

            case 'rec_candidates_interview': // Danh sách ứng viên tham gia phỏng vấn, thi tuyển
                rows = await query(
                    `SELECT c.candidate_code, c.full_name, c.email, c.phone, d.department_name as dept_name,
                  COALESCE(direct_pos.position_name, request_pos.position_name) as apply_position,
                  rr.round_name as interview_round, i.interview_date,
                  e.full_name as interviewer_name, i.result
           FROM Candidate c
           JOIN Interview i ON c.candidate_id = i.candidate_id
           JOIN RecruitmentRound rr ON rr.recruitment_round_id = i.recruitment_round_id
           LEFT JOIN Employee e ON e.employee_id = i.interviewer_id
           LEFT JOIN Position direct_pos ON direct_pos.position_id = c.position_id
           LEFT JOIN RecruitmentPlan pl ON pl.recruitment_plan_id = c.recruitment_plan_id
           LEFT JOIN RecruitmentRequest request ON request.recruitment_request_id = pl.recruitment_request_id
           LEFT JOIN Department d ON d.department_id = COALESCE(request.department_id, c.department_id)
             LEFT JOIN Position request_pos ON request_pos.position_id = request.position_id`
                );
                summary = { totalInterviews: rows.length, passedCount: rows.filter(r => r.result === 'PASSED').length };
                break;

            case 'rec_candidates_offer': // Danh sách ứng viên trúng offer
                rows = await query(
                    `SELECT c.candidate_code, c.full_name, d.department_name as dept_name,
                  COALESCE(direct_pos.position_name, request_pos.position_name) as apply_position,
                  c.phone, o.offer_id as offer_code, o.salary_offer as offered_salary,
                  o.expected_start_date as start_date, o.offer_status
           FROM Candidate c
           JOIN Offer o ON c.candidate_id = o.candidate_id
           LEFT JOIN Position direct_pos ON direct_pos.position_id = c.position_id
           LEFT JOIN RecruitmentPlan pl ON pl.recruitment_plan_id = c.recruitment_plan_id
           LEFT JOIN RecruitmentRequest request ON request.recruitment_request_id = pl.recruitment_request_id
           LEFT JOIN Department d ON d.department_id = COALESCE(request.department_id, c.department_id)
             LEFT JOIN Position request_pos ON request_pos.position_id = request.position_id`
                );
                summary = { totalOffers: rows.length, acceptedOffers: rows.filter(r => r.offer_status === 'ACCEPTED').length };
                break;

            case 'rec_candidates_hired': // Danh sách ứng viên đi làm
                rows = await query(
                    `SELECT c.candidate_code, e.employee_code as emp_code, c.full_name,
                            d.department_name as dept_name, p.position_name,
                            e.join_date as onboard_date, manager.full_name as mentor_name,
                            e.employment_status as status
                     FROM Candidate c
                     JOIN Employee e ON e.candidate_id = c.candidate_id
                     LEFT JOIN Department d ON d.department_id = e.department_id
                     LEFT JOIN Position p ON p.position_id = e.position_id
                     LEFT JOIN Employee manager ON manager.employee_id = e.manager_id
                     WHERE e.is_active = 1 AND e.employment_status = 'WORKING'
                     ORDER BY e.join_date DESC`
                );
                summary = { totalHired: rows.length };
                break;

            // 2. HR REPORTS
            case 'hr_turnover': // Báo cáo biến động nhân sự
                {
                    const employees = await query(`SELECT e.join_date, e.resignation_date, d.department_name as dept_name FROM Employee e LEFT JOIN Department d ON d.department_id = e.department_id`);
                    const scopedEmployees = filters.department && filters.department !== 'ALL' ? employees.filter((employee) => employee.dept_name === filters.department) : employees;
                    const year = Number(String(filters.startDate || new Date().getFullYear()).slice(0, 4));
                    rows = Array.from({ length: 12 }, (_, monthIndex) => {
                        const start = new Date(year, monthIndex, 1).getTime();
                        const end = new Date(year, monthIndex + 1, 1).getTime();
                        const startCount = scopedEmployees.filter((employee) => Number(employee.join_date || 0) < start && (!employee.resignation_date || Number(employee.resignation_date) >= start)).length;
                        const newHired = scopedEmployees.filter((employee) => Number(employee.join_date || 0) >= start && Number(employee.join_date || 0) < end).length;
                        const resigned = scopedEmployees.filter((employee) => Number(employee.resignation_date || 0) >= start && Number(employee.resignation_date || 0) < end).length;
                        return { period: `Tháng ${String(monthIndex + 1).padStart(2, '0')}/${year}`, period_start: start, start_count: startCount, new_hired: newHired, resigned, end_count: startCount + newHired - resigned, turnover_rate: `${startCount ? ((resigned / startCount) * 100).toFixed(2) : '0.00'}%` };
                    });
                    summary = { totalMonths: rows.length, totalNewHires: rows.reduce((sum, row) => sum + row.new_hired, 0), totalResigned: rows.reduce((sum, row) => sum + row.resigned, 0) };
                }
                break;

            case 'hr_summary': // Báo cáo tổng hợp nhân sự
                rows = await query(
                    `SELECT d.department_code as dept_code, d.department_name as dept_name,
                   COUNT(e.employee_id) as total_emp,
                   SUM(CASE WHEN e.gender = 'Nam' THEN 1 ELSE 0 END) as male_count,
                   SUM(CASE WHEN e.gender = 'Nữ' THEN 1 ELSE 0 END) as female_count,
                   SUM(CASE WHEN LOWER(COALESCE(e.education_level, '')) LIKE N'%đại học%' OR LOWER(COALESCE(e.education_level, '')) LIKE N'%cử nhân%' THEN 1 ELSE 0 END) as bachelor_count,
                   SUM(CASE WHEN LOWER(COALESCE(e.education_level, '')) LIKE N'%thạc sĩ%' OR LOWER(COALESCE(e.education_level, '')) LIKE N'%tiến sĩ%' THEN 1 ELSE 0 END) as master_count
           FROM Department d
           LEFT JOIN Employee e ON d.department_id = e.department_id AND e.is_active = 1
           WHERE d.status = 1
           GROUP BY d.department_id, d.department_code, d.department_name`
                );
                const totalEmployees = rows.reduce((sum, row) => sum + Number(row.total_emp || 0), 0);
                summary = { totalCompanyEmp: totalEmployees, maleRatio: totalEmployees ? `${Math.round(rows.reduce((sum, row) => sum + Number(row.male_count || 0), 0) / totalEmployees * 100)}%` : '0%', femaleRatio: totalEmployees ? `${Math.round(rows.reduce((sum, row) => sum + Number(row.female_count || 0), 0) / totalEmployees * 100)}%` : '0%' };
                break;

            case 'hr_contracts': // Báo cáo danh sách nhân viên theo hợp đồng lao động
                rows = await query(
                    `SELECT e.employee_code, e.full_name, d.department_name as dept_name, pos.position_name,
                  c.contract_no as contract_code, c.contract_type, c.sign_date, c.start_date, c.end_date, c.status as contract_status
           FROM EmployeeContract c
           JOIN Employee e ON c.employee_id = e.employee_id
           LEFT JOIN Department d ON e.department_id = d.department_id
           LEFT JOIN Position pos ON e.position_id = pos.position_id
           WHERE c.status = 'ACTIVE'`
                );
                summary = { totalContracts: rows.length, indefiniteCount: rows.filter(r => r.contract_type?.includes('Không xác định')).length };
                break;

            case 'hr_seniority': // Báo cáo thâm niên làm việc
                rows = (await query(
                    `SELECT e.employee_code, e.full_name, d.department_name as dept_name, p.position_name, e.join_date
                     FROM Employee e LEFT JOIN Department d ON d.department_id = e.department_id LEFT JOIN Position p ON p.position_id = e.position_id
                     WHERE e.is_active = 1 AND e.join_date IS NOT NULL ORDER BY e.join_date`
                )).map((employee) => {
                    const months = Math.max(0, Math.floor((Date.now() - Number(employee.join_date)) / (30.4375 * 86400000)));
                    const years = Math.floor(months / 12);
                    const remainingMonths = months % 12;
                    return { ...employee, seniority_years: `${years} năm ${remainingMonths} tháng`, seniority_group: years >= 5 ? 'Trên 5 năm' : years >= 3 ? 'Từ 3 - 5 năm' : years >= 1 ? 'Từ 1 - 3 năm' : 'Dưới 1 năm' };
                });
                summary = { totalEmployees: rows.length, over5YearsCount: rows.filter((row) => row.seniority_group === 'Trên 5 năm').length };
                break;

            case 'hr_birthdays': // Danh sách CBNV sinh nhật
                rows = await query(
                    `SELECT e.employee_code, e.full_name, d.department_name as dept_name, pos.position_name, e.date_of_birth as dob, e.phone, e.email
           FROM Employee e
           LEFT JOIN Department d ON e.department_id = d.department_id
           LEFT JOIN Position pos ON e.position_id = pos.position_id
           WHERE e.is_active = 1 AND e.employment_status = 'WORKING'`
                );
                summary = { totalBirthdaysInMonth: rows.length };
                break;

            case 'hr_contract_terminated': // Danh sách nhân viên chấm dứt hợp đồng lao động
            case 'hr_resigned': // Danh sách nhân viên nghỉ việc
                rows = await query(
                    `SELECT e.employee_code, e.full_name, d.department_name as dept_name, p.position_name,
                            COALESCE(rd.official_resign_date, e.resignation_date) as resign_date,
                            COALESCE(rd.reason, ra.reason, e.note) as resign_reason,
                            COALESCE(rd.handover_status, ra.handover_notes, N'Chưa xác định') as handoff_status
                     FROM Employee e
                     LEFT JOIN Department d ON d.department_id = e.department_id
                     LEFT JOIN Position p ON p.position_id = e.position_id
                     LEFT JOIN ResignationDecision rd ON rd.employee_id = e.employee_id
                     LEFT JOIN ResignationApplication ra ON ra.employee_id = e.employee_id
                     WHERE e.employment_status = 'RESIGNED' OR rd.status = 'EXECUTED' OR ra.status = 'APPROVED'`
                );
                summary = { totalResigned: rows.length, handoffCompleted: `${rows.filter((row) => String(row.handoff_status).toLowerCase().includes('hoàn tất') || String(row.handoff_status).toLowerCase().includes('completed')).length}/${rows.length}` };
                break;

            case 'hr_asof_date': // Báo cáo nhân sự quản lý theo thời điểm
                rows = await query(
                    `SELECT d.department_name as dept_name,
                            SUM(CASE WHEN e.is_active = 1 AND e.employment_status = 'WORKING' AND e.level IN (N'Nhân viên', N'Chuyên viên') THEN 1 ELSE 0 END) as active_emp_asof,
                            SUM(CASE WHEN e.is_active = 1 AND e.level NOT IN (N'Nhân viên', N'Chuyên viên') THEN 1 ELSE 0 END) as manager_count,
                            SUM(CASE WHEN e.is_active = 1 AND (e.level LIKE N'%thử việc%' OR e.level LIKE N'%thực tập%') THEN 1 ELSE 0 END) as intern_count,
                            COALESCE(d.target_headcount, 0) as total_headcount
                     FROM Department d LEFT JOIN Employee e ON e.department_id = d.department_id
                     WHERE d.status = 1 GROUP BY d.department_id, d.department_name, d.target_headcount ORDER BY d.department_name`
                );
                summary = { totalHeadcountAsOfDate: rows.reduce((sum, row) => sum + Number(row.active_emp_asof || 0) + Number(row.manager_count || 0), 0) };
                break;

            // 3. PERFORMANCE & EVALUATION REPORTS
            case 'eval_detail': // Đánh giá chi tiết nhân viên
                rows = await query(
                    `SELECT detail.criteria_code, detail.criteria_name, '-' as self_score,
                            detail.score as manager_score, detail.weight, detail.score as final_score, detail.note as notes,
                            ev.evaluation_date, d.department_name as dept_name
                     FROM EmployeeEvaluationDetail detail
                     JOIN EmployeeEvaluation ev ON ev.evaluation_id = detail.evaluation_id
                     JOIN Employee employee ON employee.employee_id = ev.employee_id
                     LEFT JOIN Department d ON d.department_id = employee.department_id
                     WHERE ev.status = 'COMPLETED' ORDER BY ev.evaluation_date DESC, detail.criteria_code`
                );
                summary = { totalCriteriaScores: rows.length, note: 'Hệ thống hiện lưu điểm quản lý; chưa có trường tự đánh giá độc lập.' };
                break;

            case 'eval_summary': // Báo cáo tổng hợp đánh giá nhân viên
                rows = await query(
                    `SELECT e.employee_code, e.full_name, d.department_name as dept_name,
                            CONCAT(N'Năm ', ev.year) as period, '-' as self_score,
                            ev.total_score as manager_score, ev.grade_result as final_grade,
                            RANK() OVER (PARTITION BY ev.year ORDER BY ev.total_score DESC) as rank,
                            ev.evaluation_date
                     FROM EmployeeEvaluation ev JOIN Employee e ON e.employee_id = ev.employee_id
                     LEFT JOIN Department d ON d.department_id = e.department_id
                     WHERE ev.status = 'COMPLETED' ORDER BY ev.year DESC, ev.total_score DESC`
                );
                summary = { totalEvaluated: rows.length, gradeARatio: rows.length ? `${Math.round(rows.filter((row) => Number(row.manager_score) >= 8).length / rows.length * 100)}%` : '0%' };
                break;

            case 'eval_ranking': // Báo cáo tổng hợp xếp loại
                rows = await query(
                    `SELECT grade_result as grade_name,
                            CASE WHEN grade_result LIKE N'%A+%' THEN N'Điểm >= 9.0' WHEN grade_result LIKE N'%A %' THEN N'8.0 <= Điểm < 9.0' WHEN grade_result LIKE N'%B%' THEN N'6.5 <= Điểm < 8.0' WHEN grade_result LIKE N'%C%' THEN N'5.0 <= Điểm < 6.5' ELSE N'Điểm < 5.0' END as criteria,
                            COUNT(*) as count
                      FROM EmployeeEvaluation WHERE status = 'COMPLETED' GROUP BY grade_result`
                );
                {
                    const totalGraded = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
                    rows = rows.map((row) => ({ ...row, percentage: totalGraded ? `${Math.round(Number(row.count || 0) / totalGraded * 1000) / 10}%` : '0%', bonus_proposed: row.grade_name && String(row.grade_name).includes('A') ? 'Theo chính sách thưởng' : 'Theo chính sách nhân sự' }));
                    summary = { totalGraded };
                }
                break;

            case 'eval_reward_discipline': // Báo cáo đề xuất thưởng phạt
                rows = await query(
                     `SELECT rd.decision_no as decision_number, COALESCE(rd.content, rd.reason) as title, e.employee_code, e.full_name,
                   d.department_name as dept_name, CASE WHEN rd.decision_type IN ('REWARD', 'KHEN_THUONG') THEN 'KHEN_THUONG' ELSE 'KY_LUAT' END as record_type, rd.amount,
                  rd.effective_date, rd.reason
           FROM RewardDiscipline rd
           JOIN Employee e ON rd.employee_id = e.employee_id
           LEFT JOIN Department d ON e.department_id = d.department_id`
                );
                summary = { totalRewards: rows.filter(r => r.record_type === 'KHEN_THUONG' || r.record_type === 'REWARD').length, totalRewardAmount: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0) };
                break;

            default:
                summary = { status: 'EMPTY' };
                break;
        }

        const filteredRows = applyReportFilters(rows, filters);
        res.json({
            success: true,
            reportId,
            filters: filters || {},
            data: filteredRows,
            summary: { ...summary, total: filteredRows.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
