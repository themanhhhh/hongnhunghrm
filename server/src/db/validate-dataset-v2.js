'use strict';

const {
    MAX_DATE,
    TABLES,
    PRIMARY_KEYS,
    FOREIGN_KEYS,
    UNIQUE_KEYS,
    STATUS_RULES,
    ROLE_NAMES,
    CANDIDATE_STATUS_VALUES,
    buildDatasetV2
} = require('./dataset-v2');

const futureDateAllowed = new Set([
    'Employee.citizen_expiry_date',
    'EmployeeContract.end_date',
    'EmployeeContract.probation_to_date',
    'ContractExtension.new_end_date',
    'Offer.expected_start_date',
    'RecruitmentRequest.expected_date',
    'RecruitmentPlan.end_date',
    'ContractProposal.proposed_start_date',
    'TransferProposal.proposed_effective_date',
    'ResignationApplication.desired_resign_date'
]);

const isDateColumn = (column) => /(?:date|time)$/i.test(column);
const keyFor = (row, columns) => columns.map((column) => String(row[column])).join('\u0001');

function validateDatasetV2(dataset = buildDatasetV2()) {
    const errors = [];
    const tables = dataset && dataset.tables ? dataset.tables : {};
    const rowsByTable = new Map(TABLES.map((table) => [table, Array.isArray(tables[table]) ? tables[table] : []]));
    const idsByTable = new Map();

    for (const table of TABLES) {
        if (!Array.isArray(tables[table])) {
            errors.push(`${table}: rows must be an array`);
            continue;
        }
        if (tables[table].length === 0) errors.push(`${table}: fixture table is empty`);

        const primaryKey = PRIMARY_KEYS[table];
        const ids = new Set();
        for (const [index, row] of tables[table].entries()) {
            if (!row || typeof row !== 'object') {
                errors.push(`${table}[${index}]: row must be an object`);
                continue;
            }
            if (row[primaryKey] === undefined || row[primaryKey] === null || row[primaryKey] === '') {
                errors.push(`${table}[${index}]: missing primary key ${primaryKey}`);
            } else if (ids.has(String(row[primaryKey]))) {
                errors.push(`${table}.${primaryKey}: duplicate value ${row[primaryKey]}`);
            }
            ids.add(String(row[primaryKey]));

            for (const [column, value] of Object.entries(row)) {
                if (value === null || value === undefined) errors.push(`${table}[${index}].${column}: null values are not allowed`);
            }
            if (row.created_date !== undefined && row.last_modified_date !== undefined && row.last_modified_date < row.created_date) {
                errors.push(`${table}[${index}]: last_modified_date precedes created_date`);
            }
            for (const [column, value] of Object.entries(row)) {
                if (value === null || value === undefined || !isDateColumn(column) || typeof value !== 'number') continue;
                if (value > MAX_DATE && !futureDateAllowed.has(`${table}.${column}`)) {
                    errors.push(`${table}[${index}].${column}: date is after ${new Date(MAX_DATE).toISOString()}`);
                }
            }
        }
        idsByTable.set(table, ids);

        for (const unique of UNIQUE_KEYS.filter(([uniqueTable]) => uniqueTable === table)) {
            const columns = unique.slice(1);
            const seen = new Set();
            for (const [index, row] of tables[table].entries()) {
                if (columns.some((column) => row[column] === null || row[column] === undefined)) continue;
                const value = keyFor(row, columns);
                if (seen.has(value)) errors.push(`${table}.${columns.join('+')}: duplicate value at row ${index}`);
                seen.add(value);
            }
        }

        const statusRules = STATUS_RULES[table] || {};
        for (const [column, allowed] of Object.entries(statusRules)) {
            const accepted = new Set(allowed.map((value) => String(value)));
            for (const [index, row] of tables[table].entries()) {
                if (row[column] !== null && row[column] !== undefined && !accepted.has(String(row[column]))) {
                    errors.push(`${table}[${index}].${column}: unsupported value ${row[column]}`);
                }
            }
        }
    }

    for (const [table, from, target, to] of FOREIGN_KEYS) {
        const targetIds = idsByTable.get(target) || new Set();
        for (const [index, row] of rowsByTable.get(table).entries()) {
            const value = row[from];
            if (value !== null && value !== undefined && !targetIds.has(String(value))) {
                errors.push(`${table}[${index}].${from}: ${value} does not reference ${target}.${to}`);
            }
        }
    }

    const rows = (table) => rowsByTable.get(table);
    const one = (table, predicate) => rows(table).find(predicate);
    const requireCoverage = (condition, message) => {
        if (!condition) errors.push(message);
    };

    const roleNames = rows('Role').map((row) => row.role_name);
    requireCoverage(roleNames.length === ROLE_NAMES.length && ROLE_NAMES.every((name) => roleNames.includes(name)), 'Role: exact application role names are required');
    for (const user of rows('User')) {
        if (user.password_hash !== 'RUNTIME_BCRYPT_HASH' && !/^\$2[aby]\$\d{2}\$/.test(String(user.password_hash || ''))) {
            errors.push(`User.${user.user_id}: password_hash must be a bcrypt hash or runtime marker`);
        }
    }
    requireCoverage(rows('User').length >= 15, 'User: at least 15 users are required');
    requireCoverage(rows('User').some((row) => row.status === 0), 'User: at least one locked/inactive user is required');
    const placeholderNamePattern = /^(?:Ứng viên|Ung vien|Nhân viên|Nhan vien|Nhân sự tổ chức|Nhan su To chuc|Ứng viên bổ sung|Ung vien bo sung)\b/i;
    const employeeNames = rows('Employee').map((row) => String(row.full_name || '').trim());
    const candidateNames = rows('Candidate').map((row) => String(row.full_name || '').trim());
    requireCoverage(employeeNames.every((name) => name && !placeholderNamePattern.test(name)), 'Employee: realistic full names are required');
    requireCoverage(candidateNames.every((name) => name && !placeholderNamePattern.test(name)), 'Candidate: realistic full names are required');
    requireCoverage(new Set(employeeNames).size === employeeNames.length, 'Employee: full names must be unique');
    requireCoverage(new Set(candidateNames).size === candidateNames.length, 'Candidate: full names must be unique');
    requireCoverage(rows('Department').length >= 12, 'Department: at least 12 departments are required');
    requireCoverage(rows('Position').length >= 30, 'Position: at least 30 positions are required');
    requireCoverage(rows('Employee').length >= 50, 'Employee: at least 50 employees are required');
    requireCoverage(rows('Employee').filter((row) => row.employment_status === 'WORKING').length >= 40, 'Employee: at least 40 working employees are required');
    requireCoverage(rows('Employee').filter((row) => row.employment_status === 'RESIGNED').length >= 5, 'Employee: at least 5 resigned employees are required');
    requireCoverage(rows('EmployeeContract').length >= 30, 'EmployeeContract: at least 30 contracts are required');
    requireCoverage(['PROBATION', 'FIXED_12', 'FIXED_36', 'UNLIMITED'].every((type) => rows('EmployeeContract').some((row) => row.contract_type === type)), 'EmployeeContract: probation, fixed and unlimited types are required');
    requireCoverage(['ACTIVE', 'EXPIRED', 'TERMINATED'].every((status) => rows('EmployeeContract').some((row) => row.status === status)), 'EmployeeContract: ACTIVE, EXPIRED and TERMINATED statuses are required');
    const futureContracts = rows('EmployeeContract').filter((row) => row.end_date > MAX_DATE);
    requireCoverage(futureContracts.length >= 2 && futureContracts.length <= 3, 'EmployeeContract: expected 2-3 legitimate post-cutoff expiries');
    requireCoverage(rows('ContractProposal').length >= 8, 'ContractProposal: at least 8 proposals are required');
    requireCoverage(rows('ContractExtension').length >= 6, 'ContractExtension: at least 6 extensions are required');
    requireCoverage(rows('ContractAppendix').length >= 6, 'ContractAppendix: at least 6 appendices are required');
    requireCoverage(rows('DepartmentQuota').length >= 8, 'DepartmentQuota: at least 8 quotas are required');
    requireCoverage(new Set(rows('DepartmentQuotaDetail').map((row) => row.quota_id)).size >= 8, 'DepartmentQuotaDetail: every quota needs detail coverage');
    requireCoverage(rows('RecruitmentRequest').length >= 10 && rows('RecruitmentPlan').length >= 10, 'Recruitment: at least 10 requests and plans are required');
    requireCoverage(rows('RecruitmentRound').length >= 20, 'RecruitmentRound: at least 20 rounds are required');
    const candidateStatuses = new Set(rows('Candidate').map((row) => row.status));
    const missingCandidateStatuses = CANDIDATE_STATUS_VALUES.filter((status) => !candidateStatuses.has(status));
    requireCoverage(rows('Candidate').length >= 40 && missingCandidateStatuses.length === 0, `Candidate: 40 rows and all normalizeCandidateStatus values are required; missing ${missingCandidateStatuses.join(', ')}`);
    requireCoverage(rows('InterviewSchedule').length >= 10, 'InterviewSchedule: at least 10 schedules are required');
    requireCoverage(rows('InterviewScheduleCandidate').length >= 10 && rows('InterviewSchedulePanel').length >= 10, 'InterviewSchedule: child candidate and panel rows are required');
    requireCoverage(rows('Interview').length >= 20 && rows('PreScreening').length >= 20 && rows('InterviewEvaluation').length >= 20, 'Recruitment interviews and evaluations need at least 20 rows each');
    requireCoverage(rows('InterviewEvaluationScript').length >= 20 && rows('InterviewEvaluationCriteria').length >= 20 && rows('PreScreeningCriteria').length >= 20, 'Recruitment evaluation child rows are incomplete');
    requireCoverage(rows('Offer').length >= 10 && rows('RecruitmentDecision').length >= 10, 'Recruitment offers and decisions are incomplete');
    requireCoverage(rows('LeaveApplication').length >= 20, 'LeaveApplication: at least 20 applications are required');
    requireCoverage(['ANNUAL', 'SICK', 'UNPAID'].every((type) => rows('LeaveApplication').some((row) => row.leave_type === type)), 'LeaveApplication: ANNUAL, SICK and UNPAID coverage is required');
    const activeEmployeeIds = new Set(rows('Employee').filter((row) => row.is_active === 1 && row.employment_status === 'WORKING').map((row) => row.employee_id));
    const balanceEmployeeIds = new Set(rows('EmployeeLeaveBalance').map((row) => row.employee_id));
    requireCoverage([...activeEmployeeIds].every((employeeId) => balanceEmployeeIds.has(employeeId)), 'EmployeeLeaveBalance: every active employee needs a 2026 balance');
    requireCoverage(rows('TransferProposal').length >= 6 && rows('TransferDecision').length >= 6, 'Transfer: at least 6 proposals and decisions are required');
    requireCoverage(rows('ResignationApplication').length >= 5 && rows('ResignationDecision').length >= 5, 'Resignation: 5 applications and decisions are required');
    const scalesByCriteria = rows('EvaluationScale').reduce((counts, row) => counts.set(row.criteria_id, (counts.get(row.criteria_id) || 0) + 1), new Map());
    requireCoverage(rows('EvaluationCriteria').length === 4 && rows('EvaluationScale').length >= 16 && rows('EvaluationCriteria').every((row) => scalesByCriteria.get(row.criteria_id) === 4), 'Evaluation criteria/scales require exactly 4 criteria and 4 scales each');
    requireCoverage(rows('EmployeeEvaluation').length >= 20 && rows('EmployeeEvaluationDetail').length >= rows('EmployeeEvaluation').length, 'Employee evaluations/details are incomplete');
    requireCoverage(rows('RewardDisciplineProposal').length >= 10 && rows('RewardDiscipline').length >= 10, 'Reward/discipline proposals and decisions are incomplete');
    requireCoverage(rows('ApprovalHistory').length >= 4 && rows('AuditLog').length >= 4, 'Approval and audit coverage is incomplete');

    for (const employee of rows('Employee')) {
        if (employee.employment_status === 'RESIGNED' && (employee.is_active !== 0 || !employee.resignation_date)) {
            errors.push(`Employee.${employee.employee_id}: resigned employee must be inactive and have resignation_date`);
        }
        if (employee.employment_status === 'WORKING' && employee.is_active !== 1) {
            errors.push(`Employee.${employee.employee_id}: working employee must be active`);
        }
        if (employee.resignation_date && employee.join_date && employee.resignation_date < employee.join_date) {
            errors.push(`Employee.${employee.employee_id}: resignation_date precedes join_date`);
        }
    }

    for (const contract of rows('EmployeeContract')) {
        if (contract.end_date && contract.start_date && contract.end_date < contract.start_date) {
            errors.push(`EmployeeContract.${contract.contract_id}: end_date precedes start_date`);
        }
        if (contract.probation_from_date && contract.probation_to_date && contract.probation_to_date < contract.probation_from_date) {
            errors.push(`EmployeeContract.${contract.contract_id}: probation dates are inverted`);
        }
    }

    for (const leave of rows('LeaveApplication')) {
        if (leave.end_date < leave.start_date) errors.push(`LeaveApplication.${leave.leave_id}: end_date precedes start_date`);
        if (leave.remaining_days_after !== null && leave.remaining_days_before !== null && leave.total_days !== null &&
            Number(leave.remaining_days_after) !== Number(leave.remaining_days_before) - Number(leave.total_days)) {
            errors.push(`LeaveApplication.${leave.leave_id}: remaining balance does not match total_days`);
        }
    }

    for (const schedule of rows('InterviewSchedule')) {
        if (schedule.start_time && schedule.end_time && schedule.end_time <= schedule.start_time) {
            errors.push(`InterviewSchedule.${schedule.schedule_id}: end_time must be after start_time`);
        }
    }

    for (const balance of rows('EmployeeLeaveBalance')) {
        const expected = Number(balance.entitled_days) + Number(balance.carried_forward_days) - Number(balance.used_days);
        if (Number(balance.remaining_days) !== expected) errors.push(`EmployeeLeaveBalance.${balance.leave_balance_id}: remaining_days is inconsistent`);
    }

    for (const approval of rows('ApprovalHistory')) {
        if (approval.decided_date && approval.submitted_date && approval.decided_date < approval.submitted_date) {
            errors.push(`ApprovalHistory.${approval.approval_id}: decided_date precedes submitted_date`);
        }
        if (approval.status === 'PENDING' && approval.decided_date && approval.decided_date !== approval.submitted_date) errors.push(`ApprovalHistory.${approval.approval_id}: pending approval has decided_date`);
    }

    for (const offer of rows('Offer')) {
        if (offer.offer_date && offer.expected_start_date && offer.expected_start_date < offer.offer_date) {
            errors.push(`Offer.${offer.offer_id}: expected_start_date precedes offer_date`);
        }
        if (offer.offer_status === 'ACCEPTED' && !offer.offer_date) errors.push(`Offer.${offer.offer_id}: accepted offer needs offer_date`);
    }

    const totalWeight = rows('EvaluationCriteria').reduce((sum, row) => sum + Number(row.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.001) errors.push(`EvaluationCriteria: weights must total 100, got ${totalWeight}`);
    for (const scale of rows('EvaluationScale')) {
        if (Number(scale.min_score) > Number(scale.max_score)) errors.push(`EvaluationScale.${scale.scale_id}: min_score exceeds max_score`);
    }
    for (const detail of rows('EmployeeEvaluationDetail')) {
        if (Number(detail.score) < 0 || Number(detail.score) > 10) errors.push(`EmployeeEvaluationDetail.${detail.detail_id}: score must be between 0 and 10`);
    }
    for (const evaluation of rows('EmployeeEvaluation')) {
        if (Number(evaluation.total_score) < 0 || Number(evaluation.total_score) > 10) errors.push(`EmployeeEvaluation.${evaluation.evaluation_id}: total_score must be between 0 and 10`);
    }

    const hiredCandidate = one('Candidate', (row) => row.candidate_id === 'cand-hired' && row.status === 'HIRED');
    const hiredEmployee = one('Employee', (row) => row.candidate_id === 'cand-hired');
    const hiredDecision = hiredCandidate && one('RecruitmentDecision', (row) => row.candidate_id === hiredCandidate.candidate_id && row.result === 'ĐẠT');
    const hiredOffer = hiredCandidate && one('Offer', (row) => row.candidate_id === hiredCandidate.candidate_id && row.offer_status === 'ACCEPTED');
    const hiredEvaluation = hiredDecision && one('InterviewEvaluation', (row) => row.interview_eval_id === hiredDecision.interview_eval_id && row.overall_result === 'PASSED');
    const hiredScreening = hiredCandidate && one('PreScreening', (row) => row.candidate_id === hiredCandidate.candidate_id && row.screening_result === 'PASSED');
    if (!hiredCandidate || !hiredEmployee || !hiredDecision || !hiredOffer || !hiredEvaluation || !hiredScreening) {
        errors.push('Hiring chain: expected screening -> evaluation -> decision -> accepted offer -> employee conversion for cand-hired');
    }

    const hasWorking = rows('Employee').some((row) => row.employment_status === 'WORKING');
    const hasResigned = rows('Employee').some((row) => row.employment_status === 'RESIGNED');
    if (!hasWorking || !hasResigned) errors.push('Employee: fixture must contain both working and resigned employees');

    const counts = Object.fromEntries(TABLES.map((table) => [table, rows(table).length]));
    return { valid: errors.length === 0, errors, counts, totalRows: Object.values(counts).reduce((sum, count) => sum + count, 0) };
}

if (require.main === module) {
    const result = validateDatasetV2();
    if (!result.valid) {
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log(`Dataset v2 is valid: ${result.totalRows} rows across ${TABLES.length} tables.`);
        console.log(JSON.stringify(result.counts, null, 2));
    }
}

module.exports = { validateDatasetV2 };
