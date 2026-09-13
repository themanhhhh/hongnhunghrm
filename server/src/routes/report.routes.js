const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db/connection');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const reportService = require('../services/report.service');

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

// Dedicated report APIs. The router-level middleware above supplies authentication and report-reader authorization.
const reportEndpoint = (handler) => async (req, res) => {
    try {
        return res.json({ success: true, ...(await handler(req)) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

router.get('/recruitment-result', reportEndpoint(reportService.getRecruitmentResult));
router.get('/recruitment-evaluations', reportEndpoint(reportService.getRecruitmentEvaluations));
router.get('/headcount-structure', reportEndpoint(reportService.getHeadcountStructure));
router.get('/headcount-movement', reportEndpoint(reportService.getHeadcountMovement));
router.get('/employees', reportEndpoint(reportService.getEmployees));
router.get('/reward-discipline', reportEndpoint(reportService.getRewardDiscipline));

// Dashboard nhân sự dùng chung cho Admin, Ban Giám Đốc và cấp quản lý.
router.get('/dashboard/workforce', authorizeRole('Administrator', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng'), async (req, res) => {
    try {
        const scopedRole = ['Trưởng Khối', 'Trưởng Phòng'].includes(req.user.roleName);
        let scopeDepartmentId = req.user.deptId;
        if (scopedRole && !scopeDepartmentId && req.user.employeeId) {
            const employee = await queryOne(
                `SELECT department_id FROM Employee WHERE employee_id = ?`,
                [req.user.employeeId]
            );
            scopeDepartmentId = employee?.department_id;
        }
        if (scopedRole && !scopeDepartmentId) {
            return res.status(422).json({ success: false, message: 'Tài khoản quản lý chưa được gán phòng ban. Vui lòng cập nhật lại tài khoản.' });
        }
        let departmentIds = [];
        if (scopedRole) {
            const departments = await query(
                `SELECT department_id FROM Department
                 WHERE status = 1 AND (department_id = ? OR parent_department_id = ?)`,
                [scopeDepartmentId, scopeDepartmentId]
            );
            departmentIds = departments.map((item) => item.department_id);
            if (!departmentIds.length && scopeDepartmentId) departmentIds.push(scopeDepartmentId);
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

module.exports = router;
