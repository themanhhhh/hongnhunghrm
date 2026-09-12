'use strict';

const AS_OF = '2026-09-12';
const MAX_DATE = Date.UTC(2026, 8, 12, 23, 59, 59, 999);

const date = (value) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
};

const json = (value) => JSON.stringify(value);
const stamp = (created = '2026-01-01', modified = created) => ({
    created_date: date(created),
    last_modified_date: date(modified)
});

const ROLE_NAMES = ['Administrator', 'HR Staff', 'Ban Giám Đốc', 'Trưởng Khối', 'Trưởng Phòng', 'Nhân viên'];
const CANDIDATE_STATUS_VALUES = [
    'new', 'submitted', 'S1: Mới', 'đã tiếp nhận hồ sơ', 'tiếp nhận hồ sơ',
    'screened', 'SCREENED', 'đã sơ loại', 'đã sơ loại, đạt', 'đã sơ loại, không đạt',
    'đã tạo lịch', 'interviewing', 'interviewed', 'S2: Phỏng vấn', 'đã phỏng vấn',
    'đã phỏng vấn, đạt', 'đã phỏng vấn, không đạt', 'S7: Loại', 'rejected', 'offer_rejected',
    'loại', 'đã quyết định loại', 'S5: Trúng tuyển', 'passed', 'đạt', 'offer_accepted',
    'đã quyết định tuyển', 'HIRED', 'hired', 'SUBMITTED', 'đã chuyển thành nhân viên', 'đã chuyển nhân viên', 'đi làm'
];

// Synthetic Vietnamese names keep the fixture realistic without using real personal data.
const CANDIDATE_NAMES = [
    'Nguyễn Hà My', 'Lê Minh Quân', 'Trần Bảo Ngọc', 'Đỗ Văn Hùng', 'Phạm Thu Uyên', 'Vũ Minh Khôi',
    'Phan Đức Anh', 'Bùi Bảo Trâm', 'Nguyễn Hoàng Yến', 'Trần Gia Huy', 'Lê Ngọc Mai', 'Phạm Quang Vinh',
    'Đặng Khánh Linh', 'Hoàng Minh Châu', 'Võ Thành Đạt', 'Nguyễn Thảo Vy', 'Trương Quốc Bảo', 'Phan Ngọc Hân',
    'Đinh Tuấn Anh', 'Cao Phương Thảo', 'Lý Minh Khang', 'Huỳnh Kim Oanh', 'Bạch Nhật Nam', 'Dương Thùy Dương',
    'Tạ Hoàng Long', 'Mai Thanh Tâm', 'Trịnh Khánh Toàn', 'Hà Ngọc Anh', 'Nguyễn Quốc Khánh', 'Đoàn Hải Yến',
    'Phạm Nhật Minh', 'Lê Thu Trang', 'Vũ Hoàng Phúc', 'Trần Ngọc Diệp', 'Bùi Anh Khoa', 'Nguyễn Khánh An',
    'Đỗ Quỳnh Như', 'Hoàng Đức Thành', 'Phan Thanh Huyền', 'Trần Minh Nhật'
];

const EMPLOYEE_NAMES = [
    'Bùi Xuân Thức', 'Trần Thu Hà', 'Nguyễn Thùy Linh', 'Lê Hoàng Nam', 'Phạm Đức Duy', 'Vũ Khánh Linh',
    'Đỗ Phương Anh', 'Phan Đức Anh', 'Nguyễn Hữu Phúc', 'Trần Ngọc Hân', 'Lê Quốc Việt', 'Phạm Thị Minh Anh',
    'Vũ Tuấn Kiệt', 'Đặng Hoàng Nam', 'Nguyễn Khánh Vy', 'Trương Minh Đức', 'Võ Thùy Trang', 'Hoàng Gia Bảo',
    'Phan Ngọc Huyền', 'Đỗ Minh Khang', 'Bùi Thanh Tùng', 'Lý Quỳnh Anh', 'Hà Đức Minh', 'Cao Thị Ngọc',
    'Dương Quốc Toàn', 'Tạ Mỹ Linh', 'Trịnh Anh Tuấn', 'Mai Phương Thảo', 'Nguyễn Đức Hoàng', 'Đoàn Minh Châu',
    'Phạm Hoài Nam', 'Lê Thanh Trúc', 'Vũ Quốc Hưng', 'Trần Bích Ngọc', 'Bùi Minh Quân', 'Nguyễn Thảo Nguyên',
    'Đỗ Thành Công', 'Hoàng Khánh Vân', 'Phan Tuấn Anh', 'Võ Ngọc Diệp', 'Trương Hải Đăng', 'Hà Phương Uyên',
    'Cao Minh Nhật', 'Dương Thùy Linh', 'Tạ Quốc Khánh', 'Lý Hoàng Anh', 'Mai Ngọc Lan', 'Đặng Minh Khoa',
    'Trịnh Hoàng Yến', 'Nguyễn An Nhiên'
];

const TABLES = [
    'SchemaMigration', 'Role', 'User', 'Department', 'Position', 'Employee',
    'EmployeeContract', 'WorkHistory', 'RewardDiscipline', 'RecruitmentRequest',
    'RecruitmentPlan', 'RecruitmentRound', 'Candidate', 'CandidateAttachment',
    'DepartmentQuota', 'DepartmentQuotaDetail', 'Interview', 'InterviewSchedule',
    'InterviewScheduleCandidate', 'InterviewSchedulePanel', 'LeaveApplication',
    'EmployeeLeaveBalance', 'AuditLog', 'InterviewEvaluation',
    'InterviewEvaluationScript', 'InterviewEvaluationCriteria', 'PreScreening',
    'PreScreeningCriteria', 'ApprovalHistory', 'Offer', 'RecruitmentDecision',
    'ContractProposal', 'ContractExtension', 'TransferProposal', 'TransferDecision',
    'TransferProposalDetail', 'TransferDecisionDetail', 'ResignationApplication',
    'ResignationDecision', 'EvaluationCriteria', 'EvaluationScale',
    'EmployeeEvaluation', 'EmployeeEvaluationDetail', 'RewardDisciplineProposal',
    'ContractType', 'ContractAppendix', 'PositionContractPathway'
];

const PRIMARY_KEYS = {
    SchemaMigration: 'migration_key', Role: 'role_id', User: 'user_id',
    Department: 'department_id', Position: 'position_id', Employee: 'employee_id',
    EmployeeContract: 'contract_id', WorkHistory: 'work_history_id',
    RewardDiscipline: 'reward_discipline_id', RecruitmentRequest: 'recruitment_request_id',
    RecruitmentPlan: 'recruitment_plan_id', RecruitmentRound: 'recruitment_round_id',
    Candidate: 'candidate_id', CandidateAttachment: 'attachment_id', DepartmentQuota: 'quota_id',
    DepartmentQuotaDetail: 'detail_id', Interview: 'interview_id', InterviewSchedule: 'schedule_id',
    InterviewScheduleCandidate: 'schedule_candidate_id', InterviewSchedulePanel: 'panel_member_id',
    LeaveApplication: 'leave_id', EmployeeLeaveBalance: 'leave_balance_id', AuditLog: 'audit_id',
    InterviewEvaluation: 'interview_eval_id', InterviewEvaluationScript: 'script_id',
    InterviewEvaluationCriteria: 'criteria_detail_id', PreScreening: 'pre_screening_id',
    PreScreeningCriteria: 'criteria_detail_id', ApprovalHistory: 'approval_id', Offer: 'offer_id',
    RecruitmentDecision: 'decision_id', ContractProposal: 'proposal_id', ContractExtension: 'extension_id',
    TransferProposal: 'proposal_id', TransferDecision: 'decision_id',
    TransferProposalDetail: 'detail_id', TransferDecisionDetail: 'detail_id',
    ResignationApplication: 'application_id', ResignationDecision: 'decision_id',
    EvaluationCriteria: 'criteria_id', EvaluationScale: 'scale_id', EmployeeEvaluation: 'evaluation_id',
    EmployeeEvaluationDetail: 'detail_id', RewardDisciplineProposal: 'proposal_id',
    ContractType: 'contract_type_id', ContractAppendix: 'appendix_id', PositionContractPathway: 'pathway_id'
};

// This is intentionally kept in the fixture module so validation remains offline.
const FOREIGN_KEYS = [
    ['User', 'role_id', 'Role', 'role_id'], ['User', 'department_id', 'Department', 'department_id'],
    ['User', 'employee_id', 'Employee', 'employee_id'], ['Department', 'manager_id', 'Employee', 'employee_id'],
    ['Department', 'parent_department_id', 'Department', 'department_id'],
    ['Position', 'department_id', 'Department', 'department_id'], ['Employee', 'candidate_id', 'Candidate', 'candidate_id'],
    ['Employee', 'department_id', 'Department', 'department_id'], ['Employee', 'position_id', 'Position', 'position_id'],
    ['Employee', 'manager_id', 'Employee', 'employee_id'], ['EmployeeContract', 'employee_id', 'Employee', 'employee_id'],
    ['EmployeeContract', 'signer_id', 'Employee', 'employee_id'], ['WorkHistory', 'employee_id', 'Employee', 'employee_id'],
    ['WorkHistory', 'department_id', 'Department', 'department_id'], ['WorkHistory', 'position_id', 'Position', 'position_id'],
    ['RewardDiscipline', 'employee_id', 'Employee', 'employee_id'],
    ['RewardDiscipline', 'proposal_id', 'RewardDisciplineProposal', 'proposal_id'],
    ['RecruitmentRequest', 'department_id', 'Department', 'department_id'],
    ['RecruitmentRequest', 'position_id', 'Position', 'position_id'],
    ['RecruitmentRequest', 'quota_id', 'DepartmentQuota', 'quota_id'],
    ['RecruitmentRequest', 'requested_by', 'Employee', 'employee_id'],
    ['RecruitmentPlan', 'recruitment_request_id', 'RecruitmentRequest', 'recruitment_request_id'],
    ['RecruitmentRound', 'recruitment_plan_id', 'RecruitmentPlan', 'recruitment_plan_id'],
    ['Candidate', 'recruitment_plan_id', 'RecruitmentPlan', 'recruitment_plan_id'],
    ['Candidate', 'recruitment_request_id', 'RecruitmentRequest', 'recruitment_request_id'],
    ['Candidate', 'department_id', 'Department', 'department_id'], ['Candidate', 'position_id', 'Position', 'position_id'],
    ['Candidate', 'referrer_employee_id', 'Employee', 'employee_id'],
    ['CandidateAttachment', 'candidate_id', 'Candidate', 'candidate_id'],
    ['DepartmentQuota', 'department_id', 'Department', 'department_id'],
    ['DepartmentQuota', 'creator_id', 'Employee', 'employee_id'],
    ['DepartmentQuotaDetail', 'quota_id', 'DepartmentQuota', 'quota_id'],
    ['DepartmentQuotaDetail', 'position_id', 'Position', 'position_id'],
    ['Interview', 'candidate_id', 'Candidate', 'candidate_id'], ['Interview', 'recruitment_round_id', 'RecruitmentRound', 'recruitment_round_id'],
    ['Interview', 'interviewer_id', 'Employee', 'employee_id'],
    ['InterviewSchedule', 'recruitment_request_id', 'RecruitmentRequest', 'recruitment_request_id'],
    ['InterviewScheduleCandidate', 'schedule_id', 'InterviewSchedule', 'schedule_id'],
    ['InterviewScheduleCandidate', 'candidate_id', 'Candidate', 'candidate_id'],
    ['InterviewSchedulePanel', 'schedule_id', 'InterviewSchedule', 'schedule_id'],
    ['InterviewSchedulePanel', 'employee_id', 'Employee', 'employee_id'],
    ['LeaveApplication', 'employee_id', 'Employee', 'employee_id'], ['LeaveApplication', 'department_id', 'Department', 'department_id'],
    ['LeaveApplication', 'approver_id', 'Employee', 'employee_id'], ['LeaveApplication', 'related_person_id', 'Employee', 'employee_id'],
    ['EmployeeLeaveBalance', 'employee_id', 'Employee', 'employee_id'], ['AuditLog', 'user_id', 'User', 'user_id'],
    ['InterviewEvaluation', 'candidate_id', 'Candidate', 'candidate_id'], ['InterviewEvaluation', 'schedule_id', 'InterviewSchedule', 'schedule_id'],
    ['InterviewEvaluation', 'evaluator_id', 'Employee', 'employee_id'],
    ['InterviewEvaluationScript', 'interview_eval_id', 'InterviewEvaluation', 'interview_eval_id'],
    ['InterviewEvaluationCriteria', 'interview_eval_id', 'InterviewEvaluation', 'interview_eval_id'],
    ['PreScreening', 'candidate_id', 'Candidate', 'candidate_id'], ['PreScreening', 'position_id', 'Position', 'position_id'],
    ['PreScreening', 'department_id', 'Department', 'department_id'],
    ['PreScreeningCriteria', 'pre_screening_id', 'PreScreening', 'pre_screening_id'],
    ['ApprovalHistory', 'department_scope', 'Department', 'department_id'],
    ['ApprovalHistory', 'approver_employee_id', 'Employee', 'employee_id'],
    ['Offer', 'candidate_id', 'Candidate', 'candidate_id'], ['RecruitmentDecision', 'candidate_id', 'Candidate', 'candidate_id'],
    ['RecruitmentDecision', 'interview_eval_id', 'InterviewEvaluation', 'interview_eval_id'],
    ['RecruitmentDecision', 'decision_by_id', 'Employee', 'employee_id'],
    ['ContractProposal', 'employee_id', 'Employee', 'employee_id'], ['ContractExtension', 'contract_id', 'EmployeeContract', 'contract_id'],
    ['ContractExtension', 'employee_id', 'Employee', 'employee_id'], ['ContractAppendix', 'contract_id', 'EmployeeContract', 'contract_id'],
    ['ContractAppendix', 'signer_id', 'Employee', 'employee_id'], ['TransferProposal', 'employee_id', 'Employee', 'employee_id'],
    ['TransferProposal', 'current_department_id', 'Department', 'department_id'], ['TransferProposal', 'target_department_id', 'Department', 'department_id'],
    ['TransferProposal', 'current_position_id', 'Position', 'position_id'], ['TransferProposal', 'target_position_id', 'Position', 'position_id'],
    ['TransferProposal', 'proposer_id', 'Employee', 'employee_id'], ['TransferDecision', 'proposal_id', 'TransferProposal', 'proposal_id'],
    ['TransferDecision', 'employee_id', 'Employee', 'employee_id'], ['TransferDecision', 'current_department_id', 'Department', 'department_id'],
    ['TransferDecision', 'current_position_id', 'Position', 'position_id'], ['TransferDecision', 'target_department_id', 'Department', 'department_id'],
    ['TransferDecision', 'target_position_id', 'Position', 'position_id'], ['TransferDecision', 'manager_id', 'Employee', 'employee_id'],
    ['TransferDecision', 'creator_id', 'Employee', 'employee_id'], ['TransferProposalDetail', 'proposal_id', 'TransferProposal', 'proposal_id'],
    ['TransferProposalDetail', 'employee_id', 'Employee', 'employee_id'], ['TransferProposalDetail', 'current_department_id', 'Department', 'department_id'],
    ['TransferProposalDetail', 'current_position_id', 'Position', 'position_id'], ['TransferProposalDetail', 'target_department_id', 'Department', 'department_id'],
    ['TransferProposalDetail', 'target_position_id', 'Position', 'position_id'], ['TransferProposalDetail', 'manager_id', 'Employee', 'employee_id'],
    ['TransferDecisionDetail', 'decision_id', 'TransferDecision', 'decision_id'], ['TransferDecisionDetail', 'employee_id', 'Employee', 'employee_id'],
    ['TransferDecisionDetail', 'current_department_id', 'Department', 'department_id'], ['TransferDecisionDetail', 'current_position_id', 'Position', 'position_id'],
    ['TransferDecisionDetail', 'target_department_id', 'Department', 'department_id'], ['TransferDecisionDetail', 'target_position_id', 'Position', 'position_id'],
    ['TransferDecisionDetail', 'manager_id', 'Employee', 'employee_id'], ['ResignationApplication', 'employee_id', 'Employee', 'employee_id'],
    ['ResignationDecision', 'application_id', 'ResignationApplication', 'application_id'], ['ResignationDecision', 'employee_id', 'Employee', 'employee_id'],
    ['EvaluationScale', 'criteria_id', 'EvaluationCriteria', 'criteria_id'], ['EmployeeEvaluation', 'evaluator_id', 'Employee', 'employee_id'],
    ['EmployeeEvaluation', 'employee_id', 'Employee', 'employee_id'], ['EmployeeEvaluation', 'department_id', 'Department', 'department_id'],
    ['EmployeeEvaluation', 'position_id', 'Position', 'position_id'], ['EmployeeEvaluationDetail', 'evaluation_id', 'EmployeeEvaluation', 'evaluation_id'],
    ['EmployeeEvaluationDetail', 'criteria_id', 'EvaluationCriteria', 'criteria_id'], ['RewardDisciplineProposal', 'employee_id', 'Employee', 'employee_id'],
    ['RewardDisciplineProposal', 'proposed_by_employee_id', 'Employee', 'employee_id'],
    ['PositionContractPathway', 'position_id', 'Position', 'position_id'], ['PositionContractPathway', 'contract_type_id', 'ContractType', 'contract_type_id']
];

const UNIQUE_KEYS = [
    ['Role', 'role_name'], ['User', 'username'], ['Department', 'department_code'], ['Position', 'position_code'],
    ['Employee', 'employee_code'], ['EmployeeContract', 'contract_no'], ['RewardDiscipline', 'decision_no'],
    ['RecruitmentRequest', 'request_code'], ['Candidate', 'candidate_code'], ['DepartmentQuota', 'quota_code'],
    ['InterviewSchedule', 'schedule_code'], ['RecruitmentDecision', 'decision_number'], ['LeaveApplication', 'leave_code'],
    ['EmployeeLeaveBalance', 'employee_id', 'leave_year'], ['EvaluationCriteria', 'criteria_code'],
    ['EmployeeEvaluation', 'evaluation_code'], ['RewardDisciplineProposal', 'proposal_code'], ['ContractType', 'contract_type_code'],
    ['ContractProposal', 'proposal_code'], ['ContractExtension', 'extension_code'], ['TransferProposal', 'proposal_code'],
    ['TransferDecision', 'decision_number'], ['ResignationApplication', 'application_code'], ['ResignationDecision', 'decision_number'],
    ['ContractAppendix', 'appendix_no'], ['PositionContractPathway', 'position_id', 'step_order']
];

const STATUS_RULES = {
    Role: { status: [0, 1] }, User: { status: [0, 1] }, Department: { status: [0, 1] }, Position: { status: [0, 1] },
    EvaluationCriteria: { status: [0, 1] }, ContractType: { status: [0, 1] },
    Employee: { employment_status: ['WORKING', 'RESIGNED'] },
    EmployeeContract: { status: ['ACTIVE', 'EXPIRED', 'TERMINATED', 'DRAFT'] },
    RewardDiscipline: { decision_type: ['REWARD', 'DISCIPLINE'], status: ['COMPLETED', 'CANCELLED'] },
    RecruitmentRequest: { priority: ['LOW', 'MEDIUM', 'HIGH'], status: ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'] },
    RecruitmentPlan: { status: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
    RecruitmentRound: { status: ['ACTIVE', 'COMPLETED', 'CANCELLED'] },
    DepartmentQuota: { status: ['Tạo phiếu', 'Đã phê duyệt', 'PENDING', 'APPROVED'] },
    Candidate: {
        status: CANDIDATE_STATUS_VALUES
    },
    Interview: { result: ['PASSED', 'FAILED', 'PENDING'] },
    InterviewSchedule: { status: ['Đã lên lịch', 'COMPLETED', 'CANCELLED'] },
    InterviewScheduleCandidate: { status: ['SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] },
    LeaveApplication: { leave_type: ['ANNUAL', 'SICK', 'MATERNITY', 'UNPAID'], status: ['PENDING', 'APPROVED', 'REJECTED'] },
    InterviewEvaluation: { overall_result: ['PASSED', 'FAILED', 'PENDING'] },
    PreScreening: { screening_result: ['PASSED', 'FAILED', 'PENDING'] },
    ApprovalHistory: { status: ['PENDING', 'WAITING', 'APPROVED', 'REJECTED'] },
    Offer: { offer_status: ['SENT', 'ACCEPTED', 'DECLINED', 'PENDING'] },
    RecruitmentDecision: { result: ['ĐẠT', 'KHÔNG ĐẠT'], status: ['COMPLETED', 'CANCELLED'] },
    ContractProposal: { status: ['PENDING', 'APPROVED', 'REJECTED'] }, ContractExtension: { status: ['PENDING', 'APPROVED', 'REJECTED'] },
    ContractAppendix: { status: ['ACTIVE', 'EXPIRED'] }, TransferProposal: { status: ['PENDING', 'APPROVED', 'REJECTED'] },
    TransferDecision: { status: ['EXECUTED', 'CANCELLED'] }, ResignationApplication: { status: ['PENDING', 'APPROVED', 'REJECTED'] },
    ResignationDecision: { handover_status: ['COMPLETED', 'PENDING'], status: ['EXECUTED', 'CANCELLED'] },
    EmployeeEvaluation: { status: ['COMPLETED', 'DRAFT'] }, RewardDisciplineProposal: { record_type: ['REWARD', 'DISCIPLINE'], status: ['PENDING', 'APPROVED', 'REJECTED'] }
};

const INSERT_ORDER = [
    'SchemaMigration', 'Role', 'Department', 'Position', 'ContractType', 'DepartmentQuota', 'DepartmentQuotaDetail',
    'RecruitmentRequest', 'RecruitmentPlan', 'RecruitmentRound', 'Candidate', 'CandidateAttachment', 'Employee', 'User',
    'EmployeeContract', 'WorkHistory', 'ContractProposal', 'ContractExtension', 'ContractAppendix', 'PositionContractPathway',
    'TransferProposal', 'TransferProposalDetail', 'TransferDecision', 'TransferDecisionDetail', 'ResignationApplication',
    'ResignationDecision', 'RewardDisciplineProposal', 'RewardDiscipline', 'InterviewSchedule', 'InterviewScheduleCandidate',
    'InterviewSchedulePanel', 'Interview', 'PreScreening', 'PreScreeningCriteria', 'InterviewEvaluation',
    'InterviewEvaluationScript', 'InterviewEvaluationCriteria', 'Offer', 'RecruitmentDecision', 'LeaveApplication',
    'EmployeeLeaveBalance', 'EvaluationCriteria', 'EvaluationScale', 'EmployeeEvaluation', 'EmployeeEvaluationDetail',
    'ApprovalHistory', 'AuditLog'
];

const CLEAR_ORDER = [
    'PositionContractPathway', 'ApprovalHistory', 'AuditLog', 'InterviewSchedulePanel', 'InterviewScheduleCandidate',
    'InterviewEvaluationCriteria', 'InterviewEvaluationScript', 'PreScreeningCriteria', 'PreScreening', 'RecruitmentDecision',
    'InterviewEvaluation', 'Offer', 'Interview', 'InterviewSchedule', 'CandidateAttachment', 'Candidate', 'RecruitmentRound', 'RecruitmentPlan',
    'RecruitmentRequest', 'DepartmentQuotaDetail', 'DepartmentQuota', 'EmployeeEvaluationDetail',
    'EmployeeEvaluation', 'EvaluationScale', 'EvaluationCriteria', 'RewardDiscipline', 'RewardDisciplineProposal',
    'LeaveApplication', 'EmployeeLeaveBalance', 'ResignationDecision', 'ResignationApplication', 'TransferDecisionDetail',
    'TransferProposalDetail', 'TransferDecision', 'TransferProposal', 'ContractAppendix', 'ContractExtension', 'ContractProposal',
    'WorkHistory', 'EmployeeContract', 'User', 'Employee', 'Position', 'Department', 'Role', 'ContractType', 'SchemaMigration'
];

// These nullable cycle edges must be detached before deleting the involved parent rows.
const CLEAR_PRELUDE = [
    'UPDATE [Department] SET [manager_id] = NULL, [parent_department_id] = NULL',
    'UPDATE [Employee] SET [manager_id] = NULL, [candidate_id] = NULL',
    'UPDATE [Candidate] SET [referrer_employee_id] = NULL'
];

function buildDatasetV2({ passwordHash = 'RUNTIME_BCRYPT_HASH' } = {}) {
    const tables = Object.fromEntries(TABLES.map((table) => [table, []]));
    const add = (table, rows) => tables[table].push(...rows);

    add('SchemaMigration', [{ migration_key: 'dataset-v2', applied_date: date(AS_OF) }]);
    add('Role', [
        { role_id: 'role-admin', role_name: 'Administrator', description: 'Toan quyen quan tri he thong', ...stamp() },
        { role_id: 'role-hr', role_name: 'HR Staff', description: 'Nghiep vu nhan su va tuyen dung', ...stamp('2026-01-02') },
        { role_id: 'role-bgd', role_name: 'Ban Giám Đốc', description: 'Phe duyet va dieu hanh cap cong ty', ...stamp('2026-01-02') },
        { role_id: 'role-block', role_name: 'Trưởng Khối', description: 'Quan ly va phe duyet cap khoi', ...stamp('2026-01-02') },
        { role_id: 'role-manager', role_name: 'Trưởng Phòng', description: 'Quan ly va phe duyet cap phong', ...stamp('2026-01-02') },
        { role_id: 'role-employee', role_name: 'Nhân viên', description: 'Nguoi su dung nghiep vu', ...stamp('2026-01-02') }
    ].map((row) => ({ ...row, status: 1 })));

    add('Department', [
        { department_id: 'dept-exec', ...stamp(), department_code: 'BGD', department_name: 'Ban Giám Đốc', description: 'Dieu hanh cong ty', manager_id: null, parent_department_id: null, target_headcount: 3, status: 1 },
        { department_id: 'dept-people', ...stamp('2026-01-02'), department_code: 'PHR', department_name: 'Phòng Nhân sự', description: 'Nhan su va hanh chinh', manager_id: null, parent_department_id: null, target_headcount: 8, status: 1 },
        { department_id: 'dept-engineering', ...stamp('2026-01-03'), department_code: 'KTTK', department_name: 'Khối Kỹ thuật triển khai', description: 'Trien khai va phat trien san pham', manager_id: null, parent_department_id: null, target_headcount: 12, status: 1 },
        { department_id: 'dept-platform', ...stamp('2026-01-03'), department_code: 'CLOUD', department_name: 'Phòng Cloud và Hạ tầng', description: 'Cloud va van hanh', manager_id: null, parent_department_id: 'dept-engineering', target_headcount: 6, status: 1 }
    ]);

    add('Department', [
        { department_id: 'dept-pmk', ...stamp('2026-01-04'), department_code: 'PMK', department_name: 'Phòng Marketing', description: 'Marketing va truyen thong', manager_id: null, parent_department_id: null, target_headcount: 8, status: 1 },
        { department_id: 'dept-kd', ...stamp('2026-01-04'), department_code: 'PKD', department_name: 'Phòng Kinh doanh', description: 'Kinh doanh va thi truong', manager_id: null, parent_department_id: null, target_headcount: 10, status: 1 },
        { department_id: 'dept-gptv', ...stamp('2026-01-04'), department_code: 'GPTV', department_name: 'Phòng Giải pháp tư vấn', description: 'Tu van giai phap ERP', manager_id: null, parent_department_id: null, target_headcount: 8, status: 1 },
        { department_id: 'dept-kttk-1', ...stamp('2026-01-04'), department_code: 'KTTK1', department_name: 'Phòng KTTK 1', description: 'Ky thuat trien khai mien Bac', manager_id: null, parent_department_id: 'dept-engineering', target_headcount: 8, status: 1 },
        { department_id: 'dept-kttk-2', ...stamp('2026-01-04'), department_code: 'KTTK2', department_name: 'Phòng KTTK 2', description: 'Ky thuat trien khai mien Trung va Nam', manager_id: null, parent_department_id: 'dept-engineering', target_headcount: 8, status: 1 },
        { department_id: 'dept-ptnv', ...stamp('2026-01-04'), department_code: 'PTNV', department_name: 'Phòng Phân tích nghiệp vụ', description: 'Phan tich nghiep vu va quy trinh', manager_id: null, parent_department_id: null, target_headcount: 6, status: 1 },
        { department_id: 'dept-ptsp', ...stamp('2026-01-04'), department_code: 'PTSP', department_name: 'Phòng Phát triển sản phẩm', description: 'Nghien cuu va phat trien san pham', manager_id: null, parent_department_id: null, target_headcount: 10, status: 1 },
        { department_id: 'dept-kcn', ...stamp('2026-01-04'), department_code: 'KCN', department_name: 'Khối Công nghệ', description: 'Dinh huong cong nghe va R&D', manager_id: null, parent_department_id: null, target_headcount: 6, status: 1 },
        { department_id: 'dept-kt', ...stamp('2026-01-04'), department_code: 'PKT', department_name: 'Phòng Kiểm thử', description: 'Kiem thu va dam bao chat luong', manager_id: null, parent_department_id: null, target_headcount: 8, status: 1 },
        { department_id: 'dept-bh', ...stamp('2026-01-04'), department_code: 'PBH', department_name: 'Phòng Bảo hành', description: 'Bao hanh va ho tro ky thuat', manager_id: null, parent_department_id: null, target_headcount: 6, status: 1 }
    ]);

    add('Position', [
        { position_id: 'pos-ceo', ...stamp(), position_code: 'BGD_CEO', position_name: 'Giam doc', department_id: 'dept-exec', description: 'Dieu hanh cong ty', target_headcount: 1, is_assistant: 0, salary_grade: 'G12', status: 1 },
        { position_id: 'pos-hr-manager', ...stamp('2026-01-02'), position_code: 'HR_MGR', position_name: 'Truong phong Nhan su', department_id: 'dept-people', description: 'Quan ly phong nhan su', target_headcount: 1, is_assistant: 0, salary_grade: 'G9', status: 1 },
        { position_id: 'pos-hr-specialist', ...stamp('2026-01-02'), position_code: 'HR_SPEC', position_name: 'Chuyen vien Nhan su', department_id: 'dept-people', description: 'Thuc hien nghiep vu HR', target_headcount: 5, is_assistant: 0, salary_grade: 'G6', status: 1 },
        { position_id: 'pos-eng-manager', ...stamp('2026-01-03'), position_code: 'ENG_MGR', position_name: 'Truong phong Ky thuat', department_id: 'dept-engineering', description: 'Quan ly ky thuat', target_headcount: 1, is_assistant: 0, salary_grade: 'G9', status: 1 },
        { position_id: 'pos-eng-specialist', ...stamp('2026-01-03'), position_code: 'ENG_SPEC', position_name: 'Ky su phat trien', department_id: 'dept-engineering', description: 'Phat trien he thong', target_headcount: 8, is_assistant: 0, salary_grade: 'G6', status: 1 },
        { position_id: 'pos-platform-specialist', ...stamp('2026-01-03'), position_code: 'PLAT_SPEC', position_name: 'Ky su Ha tang', department_id: 'dept-platform', description: 'Van hanh cloud', target_headcount: 5, is_assistant: 0, salary_grade: 'G6', status: 1 }
    ]);
    const extraPositionDepartments = ['dept-exec', 'dept-people', 'dept-engineering', 'dept-platform', 'dept-pmk', 'dept-kd', 'dept-gptv', 'dept-kttk-1', 'dept-kttk-2', 'dept-ptnv', 'dept-ptsp', 'dept-kcn', 'dept-kt', 'dept-bh'];
    add('Position', Array.from({ length: 24 }, (_, index) => {
        const departmentId = extraPositionDepartments[index % extraPositionDepartments.length];
        const number = String(index + 1).padStart(2, '0');
        return {
            position_id: `pos-extra-${number}`, ...stamp('2026-01-05'), position_code: `ORG_${number}`,
            position_name: `Chuyên viên nghiệp vụ ${number}`, department_id: departmentId,
            description: 'Vi tri bo sung trong co cau to chuc 2026', target_headcount: 3,
            is_assistant: index % 11 === 0 ? 1 : 0, salary_grade: index % 3 === 0 ? 'G7' : 'G5', status: 1
        };
    }));

    add('ContractType', [
        { contract_type_id: 'ctype-probation', ...stamp(), contract_type_code: 'PROBATION', contract_type_name: 'Hop dong thu viec', duration_months: 2, has_probation: 1, probation_days: 60, status: 1 },
        { contract_type_id: 'ctype-12m', ...stamp('2026-01-02'), contract_type_code: 'FIXED_12', contract_type_name: 'Hop dong xac dinh thoi han 12 thang', duration_months: 12, has_probation: 0, probation_days: 0, status: 1 },
        { contract_type_id: 'ctype-36m', ...stamp('2026-01-02'), contract_type_code: 'FIXED_36', contract_type_name: 'Hop dong xac dinh thoi han 36 thang', duration_months: 36, has_probation: 0, probation_days: 0, status: 1 },
        { contract_type_id: 'ctype-unlimited', ...stamp('2026-01-02'), contract_type_code: 'UNLIMITED', contract_type_name: 'Hop dong khong xac dinh thoi han', duration_months: 0, has_probation: 0, probation_days: 0, status: 1 }
    ]);

    add('DepartmentQuota', [
        { quota_id: 'quota-eng-2026', ...stamp('2026-01-05'), quota_code: 'Q-ENG-2026', effective_date: date('2026-01-05'), department_id: 'dept-engineering', creator_id: null, creator_name: 'Hệ thống', target_headcount: 12, max_capacity: 14, current_headcount: 3, budget: 720000000, budget_details: json({ salary: 600000000, onboarding: 120000000 }), description: 'Ke hoach nhan su ky thuat 2026', status: 'Tạo phiếu' },
        { quota_id: 'quota-people-2026', ...stamp('2026-01-06'), quota_code: 'Q-HR-2026', effective_date: date('2026-01-06'), department_id: 'dept-people', creator_id: null, creator_name: 'Hệ thống', target_headcount: 8, max_capacity: 10, current_headcount: 3, budget: 360000000, budget_details: json({ salary: 320000000, training: 40000000 }), description: 'Ke hoach nhan su HR 2026', status: 'Đã phê duyệt' }
    ]);
    add('DepartmentQuota', Array.from({ length: 6 }, (_, index) => {
        const positionIndex = (index + 4) % 24;
        const department = extraPositionDepartments[positionIndex];
        const number = String(index + 3).padStart(2, '0');
        return {
            quota_id: `quota-extra-${number}`, ...stamp(`2026-0${(index % 8) + 2}-05`), quota_code: `Q-2026-${number}`, effective_date: date(`2026-0${(index % 8) + 2}-05`),
            department_id: department, creator_id: null, creator_name: 'Hệ thống', target_headcount: 5 + index, max_capacity: 7 + index,
            current_headcount: index % 3, budget: 180000000 + index * 30000000, budget_details: json({ salary: 150000000 + index * 20000000, training: 30000000 }),
            description: `Dinh bien tuyen dung dot ${number}`, status: index % 2 ? 'Đã phê duyệt' : 'Tạo phiếu'
        };
    }));
    add('DepartmentQuotaDetail', [
        { detail_id: 'quota-detail-01', quota_id: 'quota-eng-2026', position_id: 'pos-eng-specialist', position_code: 'ENG_SPEC', position_name: 'Ky su phat trien', target_headcount: 8, resignation_count: 1, maternity_count: 0, current_headcount: 2, needed_headcount: 6, note: 'Bo sung ky su san pham' },
        { detail_id: 'quota-detail-02', quota_id: 'quota-eng-2026', position_id: 'pos-platform-specialist', position_code: 'PLAT_SPEC', position_name: 'Ky su Ha tang', target_headcount: 5, resignation_count: 0, maternity_count: 0, current_headcount: 1, needed_headcount: 4, note: 'Mo rong van hanh cloud' },
        { detail_id: 'quota-detail-03', quota_id: 'quota-people-2026', position_id: 'pos-hr-specialist', position_code: 'HR_SPEC', position_name: 'Chuyen vien Nhan su', target_headcount: 5, resignation_count: 0, maternity_count: 1, current_headcount: 1, needed_headcount: 4, note: 'Bo sung tuyen dung va C&B' }
    ]);
    add('DepartmentQuotaDetail', Array.from({ length: 6 }, (_, index) => {
        const positionIndex = (index + 4) % 24;
        const positionNumber = String(positionIndex + 1).padStart(2, '0');
        const quotaNumber = String(index + 3).padStart(2, '0');
        return {
            detail_id: `quota-detail-extra-${quotaNumber}`, quota_id: `quota-extra-${quotaNumber}`, position_id: `pos-extra-${positionNumber}`,
            position_code: `ORG_${positionNumber}`, position_name: `Chuyên viên nghiệp vụ ${positionNumber}`, target_headcount: 5 + index,
            resignation_count: index % 2, maternity_count: index === 2 ? 1 : 0, current_headcount: index % 3, needed_headcount: 4 + index,
            note: 'Chi tiet dinh bien theo vi tri'
        };
    }));

    add('RecruitmentRequest', [
        { recruitment_request_id: 'req-eng-001', ...stamp('2026-02-01'), request_code: 'RR-ENG-001', department_id: 'dept-engineering', position_id: 'pos-eng-specialist', quota_id: 'quota-eng-2026', requested_by: null, quantity: 2, reason: 'Mo rong nhom phat trien san pham', expected_date: date('2026-04-01'), priority: 'HIGH', status: 'APPROVED', is_outside_headcount: 0, note: 'Da duyet ngan sach' },
        { recruitment_request_id: 'req-hr-001', ...stamp('2026-03-10'), request_code: 'RR-HR-001', department_id: 'dept-people', position_id: 'pos-hr-specialist', quota_id: 'quota-people-2026', requested_by: null, quantity: 1, reason: 'Bo sung chuyen vien tuyen dung', expected_date: date('2026-05-15'), priority: 'MEDIUM', status: 'IN_PROGRESS', is_outside_headcount: 0, note: 'Dang phong van' },
        { recruitment_request_id: 'req-platform-001', ...stamp('2026-07-20'), request_code: 'RR-PLAT-001', department_id: 'dept-platform', position_id: 'pos-platform-specialist', quota_id: 'quota-eng-2026', requested_by: null, quantity: 1, reason: 'Thay the nhan su nghi viec', expected_date: date('2026-09-20'), priority: 'LOW', status: 'PENDING', is_outside_headcount: 0, note: 'Cho phe duyet' },
        { recruitment_request_id: 'req-eng-rejected', ...stamp('2026-04-02'), request_code: 'RR-ENG-REJ', department_id: 'dept-engineering', position_id: 'pos-eng-specialist', quota_id: 'quota-eng-2026', requested_by: null, quantity: 1, reason: 'Nhu cau tam thoi', expected_date: date('2026-05-01'), priority: 'LOW', status: 'REJECTED', is_outside_headcount: 1, note: 'Chua can thiet trong quy nay' }
    ]);
    add('RecruitmentRequest', Array.from({ length: 6 }, (_, index) => {
        const positionIndex = (index + 4) % 24;
        const number = String(index + 5).padStart(3, '0');
        return {
            recruitment_request_id: `req-extra-${number}`, ...stamp(`2026-0${(index % 8) + 2}-12`), request_code: `RR-2026-${number}`,
            department_id: extraPositionDepartments[positionIndex], position_id: `pos-extra-${String(positionIndex + 1).padStart(2, '0')}`, quota_id: `quota-extra-${String(index + 3).padStart(2, '0')}`,
            requested_by: null, quantity: 1 + (index % 2), reason: 'Bo sung nhan su theo ke hoach van hanh', expected_date: date(index % 2 ? '2026-09-20' : '2026-08-20'),
            priority: ['LOW', 'MEDIUM', 'HIGH'][index % 3], status: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'APPROVED'][index], is_outside_headcount: index === 4 ? 1 : 0,
            note: 'Yeu cau du lieu mau v2'
        };
    }));
    add('RecruitmentPlan', [
        { recruitment_plan_id: 'plan-eng-q1', ...stamp('2026-02-05'), recruitment_request_id: 'req-eng-001', plan_name: 'Tuyen ky su san pham Q1', start_date: date('2026-02-06'), end_date: date('2026-04-30'), budget: 180000000, status: 'COMPLETED', note: 'Da ket thuc dot tuyen' },
        { recruitment_plan_id: 'plan-hr-q2', ...stamp('2026-03-12'), recruitment_request_id: 'req-hr-001', plan_name: 'Tuyen chuyen vien HR Q2', start_date: date('2026-03-15'), end_date: date('2026-06-30'), budget: 90000000, status: 'IN_PROGRESS', note: 'Con 1 ung vien dang xu ly' },
        { recruitment_plan_id: 'plan-platform-q3', ...stamp('2026-07-21'), recruitment_request_id: 'req-platform-001', plan_name: 'Tuyen ky su Ha tang Q3', start_date: date('2026-07-22'), end_date: date('2026-09-30'), budget: 120000000, status: 'IN_PROGRESS', note: 'Co ung vien da trung tuyen' },
        { recruitment_plan_id: 'plan-cancelled', ...stamp('2026-04-03'), recruitment_request_id: 'req-eng-rejected', plan_name: 'Ke hoach tam dung', start_date: date('2026-04-04'), end_date: date('2026-05-01'), budget: 30000000, status: 'CANCELLED', note: 'Huy theo yeu cau kinh doanh' }
    ]);
    add('RecruitmentPlan', Array.from({ length: 6 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        return {
            recruitment_plan_id: `plan-extra-${number}`, ...stamp(`2026-0${(index % 8) + 2}-15`), recruitment_request_id: `req-extra-${number}`,
            plan_name: `Ke hoach tuyen dung ${number}`, start_date: date(`2026-0${(index % 8) + 2}-16`), end_date: date(index % 2 ? '2026-09-30' : '2026-08-30'),
            budget: 60000000 + index * 15000000, status: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED'][index], note: 'Ke hoach theo phong ban'
        };
    }));
    add('RecruitmentRound', [
        { recruitment_round_id: 'round-eng-screen', ...stamp('2026-02-06'), recruitment_plan_id: 'plan-eng-q1', round_name: 'Vong 1 - Sang loc ho so', round_order: 1, description: 'Kiem tra ho so va kinh nghiem', status: 'COMPLETED' },
        { recruitment_round_id: 'round-eng-interview', ...stamp('2026-02-20'), recruitment_plan_id: 'plan-eng-q1', round_name: 'Vong 2 - Phong van ky thuat', round_order: 2, description: 'Danh gia chuyen mon', status: 'COMPLETED' },
        { recruitment_round_id: 'round-platform-interview', ...stamp('2026-08-01'), recruitment_plan_id: 'plan-platform-q3', round_name: 'Vong 1 - Phong van Ha tang', round_order: 1, description: 'Danh gia van hanh cloud', status: 'ACTIVE' },
        { recruitment_round_id: 'round-hr-interview', ...stamp('2026-03-20'), recruitment_plan_id: 'plan-hr-q2', round_name: 'Vong 1 - Phong van HR', round_order: 1, description: 'Danh gia nghiep vu nhan su', status: 'ACTIVE' }
    ]);
    add('RecruitmentRound', Array.from({ length: 16 }, (_, index) => {
        const planNumber = String(5 + Math.floor(index / 3)).padStart(3, '0');
        const roundNumber = index % 3 + 1;
        return {
            recruitment_round_id: `round-extra-${String(index + 5).padStart(3, '0')}`, ...stamp(`2026-0${(index % 8) + 2}-10`), recruitment_plan_id: `plan-extra-${planNumber}`,
            round_name: `Vong ${roundNumber} - Danh gia nghiep vu`, round_order: roundNumber, description: 'Vong danh gia theo quy trinh tuyen dung', status: index % 5 === 0 ? 'COMPLETED' : 'ACTIVE'
        };
    }));

    const candidateRows = [
        ['cand-new', 'UV-001', CANDIDATE_NAMES[0], 'plan-hr-q2', 'req-hr-001', 'dept-people', 'pos-hr-specialist', 'S1: Mới', '2026-03-18'],
        ['cand-screened', 'UV-002', CANDIDATE_NAMES[1], 'plan-eng-q1', 'req-eng-001', 'dept-engineering', 'pos-eng-specialist', 'đã sơ loại', '2026-02-08'],
        ['cand-interview', 'UV-003', CANDIDATE_NAMES[2], 'plan-platform-q3', 'req-platform-001', 'dept-platform', 'pos-platform-specialist', 'S2: Phỏng vấn', '2026-08-10'],
        ['cand-rejected', 'UV-004', CANDIDATE_NAMES[3], 'plan-platform-q3', 'req-platform-001', 'dept-platform', 'pos-platform-specialist', 'S7: Loại', '2026-08-12'],
        ['cand-cv-rejected', 'UV-005', CANDIDATE_NAMES[4], 'plan-eng-q1', 'req-eng-001', 'dept-engineering', 'pos-eng-specialist', 'đã sơ loại, không đạt', '2026-02-09'],
        ['cand-passed', 'UV-006', CANDIDATE_NAMES[5], 'plan-hr-q2', 'req-hr-001', 'dept-people', 'pos-hr-specialist', 'S5: Trúng tuyển', '2026-06-01'],
        ['cand-hired', 'UV-007', CANDIDATE_NAMES[6], 'plan-platform-q3', 'req-platform-001', 'dept-platform', 'pos-platform-specialist', 'HIRED', '2026-07-05'],
        ['cand-submitted', 'UV-008', CANDIDATE_NAMES[7], 'plan-platform-q3', 'req-platform-001', 'dept-platform', 'pos-platform-specialist', 'SUBMITTED', '2026-08-26']
    ];
    add('Candidate', candidateRows.map(([id, code, name, plan, request, department, position, status, received], index) => ({
        candidate_id: id, ...stamp(received), candidate_code: code, full_name: name, gender: index % 2 ? 'Nam' : 'Nữ',
        date_of_birth: date(`199${index % 5}-${String((index + 2) % 9 + 1).padStart(2, '0')}-15`), citizen_id: `001199${String(index + 1).padStart(6, '0')}`,
        phone: `09000000${String(index + 1).padStart(2, '0')}`, email: `${code.toLowerCase()}@example.test`, address: 'Ha Noi', culture_level: '12/12',
        education_level: 'Dai hoc', education_school: 'Dai hoc Cong nghe', gpa: 7.5 + index / 10, major: index % 2 ? 'He thong thong tin' : 'Cong nghe thong tin',
        skill_level: index === 6 ? 'TOT' : 'KHA', experience: 'Kinh nghiem phu hop vi tri', recruitment_plan_id: plan, recruitment_request_id: request,
        department_id: department, position_id: position, source: index % 2 ? 'LinkedIn' : 'TopCV', recruitment_unit: 'BRAVO', referrer: null,
        referrer_employee_id: null, cv_url: `/uploads/cv-${code}.pdf`, received_date: date(received), eval_date: status === 'S1: Mới' || status === 'SUBMITTED' ? null : date(received),
        status, rejection_reason: ['S7: Loại', 'rejected', 'offer_rejected', 'loại', 'đã quyết định loại', 'đã sơ loại, không đạt'].includes(status) ? 'Ket qua danh gia chua dat yeu cau' : null, note: null,
        attachments_json: json([{ name: 'CV.pdf', url: `/uploads/cv-${code}.pdf` }])
    })));
    const existingCandidateStatuses = candidateRows.map((row) => row[7]);
    const remainingCandidateStatuses = CANDIDATE_STATUS_VALUES.filter((status) => !existingCandidateStatuses.includes(status));
    const generatedCandidateStatuses = remainingCandidateStatuses.concat(CANDIDATE_STATUS_VALUES.slice(0, Math.max(0, 32 - remainingCandidateStatuses.length)));
    const candidatePlanMap = [
        ['plan-eng-q1', 'req-eng-001', 'dept-engineering', 'pos-eng-specialist'],
        ['plan-hr-q2', 'req-hr-001', 'dept-people', 'pos-hr-specialist'],
        ['plan-platform-q3', 'req-platform-001', 'dept-platform', 'pos-platform-specialist'],
        ['plan-extra-005', 'req-extra-005', 'dept-pmk', 'pos-extra-05'],
        ['plan-extra-006', 'req-extra-006', 'dept-kd', 'pos-extra-06'],
        ['plan-extra-007', 'req-extra-007', 'dept-gptv', 'pos-extra-07'],
        ['plan-extra-008', 'req-extra-008', 'dept-kttk-1', 'pos-extra-08'],
        ['plan-extra-009', 'req-extra-009', 'dept-kttk-2', 'pos-extra-09'],
        ['plan-extra-010', 'req-extra-010', 'dept-ptnv', 'pos-extra-10'],
        ['plan-cancelled', 'req-eng-rejected', 'dept-engineering', 'pos-eng-specialist']
    ];
    add('Candidate', generatedCandidateStatuses.map((status, index) => {
        const number = String(index + 9).padStart(3, '0');
        const context = candidatePlanMap[index % candidatePlanMap.length];
        const received = `2026-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 20) + 1).padStart(2, '0')}`;
        return {
            candidate_id: `cand-extra-${number}`, ...stamp(received), candidate_code: `UV-${number}`, full_name: CANDIDATE_NAMES[index + 8],
            gender: index % 2 ? 'Nam' : 'Nữ', date_of_birth: date(`${1990 + (index % 12)}-${String((index % 9) + 1).padStart(2, '0')}-18`),
            citizen_id: `001299${number}`, phone: `090900${number}`, email: `candidate${number}@example.test`, address: 'Ha Noi', culture_level: '12/12',
            education_level: 'Dai hoc', education_school: 'Dai hoc Quoc gia Ha Noi', gpa: 7 + (index % 25) / 10, major: 'Cong nghe thong tin',
            skill_level: index % 3 ? 'KHA' : 'TOT', experience: 'Kinh nghiem tuyen dung phu hop', recruitment_plan_id: context[0], recruitment_request_id: context[1],
            department_id: context[2], position_id: context[3], source: index % 2 ? 'LinkedIn' : 'TopCV', recruitment_unit: 'BRAVO', referrer: null,
            referrer_employee_id: null, cv_url: `/uploads/cv-${number}.pdf`, received_date: date(received), eval_date: ['new', 'submitted', 'S1: Mới', 'đã tiếp nhận hồ sơ', 'tiếp nhận hồ sơ'].includes(status) ? null : date(received),
            status, rejection_reason: ['S7: Loại', 'rejected', 'offer_rejected', 'loại', 'đã quyết định loại'].includes(status) ? 'Khong phu hop yeu cau tuyen dung' : null,
            note: 'Ho so ung vien tiep nhan theo ke hoach tuyen dung', attachments_json: json([{ name: 'CV.pdf', url: `/uploads/cv-${number}.pdf` }])
        };
    }));
    add('CandidateAttachment', [
        { attachment_id: 'attachment-cand-002', candidate_id: 'cand-screened', file_name: 'Bang-diem.pdf', file_url: '/uploads/bang-diem-002.pdf', note: 'Bang diem dai hoc', uploaded_date: date('2026-02-09'), created_date: date('2026-02-09') },
        { attachment_id: 'attachment-cand-007', candidate_id: 'cand-hired', file_name: 'CV.pdf', file_url: '/uploads/cv-UV-007.pdf', note: 'Ho so goc', uploaded_date: date('2026-07-05'), created_date: date('2026-07-05') }
    ]);

    const employeeSpecs = [
        ['emp-001', 'NV-2024-001', EMPLOYEE_NAMES[0], 'dept-exec', 'pos-ceo', '2024-01-08', 'WORKING', 65000000, null],
        ['emp-002', 'NV-2024-002', EMPLOYEE_NAMES[1], 'dept-people', 'pos-hr-manager', '2024-02-12', 'WORKING', 32000000, null],
        ['emp-003', 'NV-2024-003', EMPLOYEE_NAMES[2], 'dept-people', 'pos-hr-specialist', '2025-01-06', 'WORKING', 18000000, 'emp-002'],
        ['emp-004', 'NV-2024-004', EMPLOYEE_NAMES[3], 'dept-engineering', 'pos-eng-manager', '2023-06-01', 'WORKING', 42000000, 'emp-001'],
        ['emp-005', 'NV-2024-005', EMPLOYEE_NAMES[4], 'dept-engineering', 'pos-eng-specialist', '2025-03-03', 'WORKING', 20000000, 'emp-004'],
        ['emp-006', 'NV-2024-006', EMPLOYEE_NAMES[5], 'dept-platform', 'pos-platform-specialist', '2025-05-12', 'WORKING', 19000000, 'emp-004'],
        ['emp-007', 'NV-2024-007', EMPLOYEE_NAMES[6], 'dept-engineering', 'pos-eng-specialist', '2024-08-01', 'RESIGNED', 18500000, 'emp-004'],
        ['emp-008', 'NV-2026-001', EMPLOYEE_NAMES[7], 'dept-platform', 'pos-platform-specialist', '2026-08-15', 'WORKING', 21000000, 'emp-004']
    ];
    add('Employee', employeeSpecs.map(([id, code, name, department, position, join, employmentStatus, salary, manager], index) => ({
        employee_id: id, ...stamp(join), employee_code: code, short_name: name.split(' ').pop(), full_name: name, gender: index % 2 ? 'Nữ' : 'Nam',
        date_of_birth: date(`198${index + 1}-0${(index % 8) + 1}-12`), place_of_birth: 'Ha Noi', is_foreign: 0, hometown: 'Ha Noi', nationality: 'Viet Nam',
        ethnicity: 'Kinh', religion: null, blood_type: 'O', marital_status: index === 0 ? 'Married' : 'Single', tax_code: `01090000${index + 1}`,
        citizen_id: `001088${String(index + 1).padStart(6, '0')}`, citizen_issue_date: date('2020-01-10'), citizen_issue_place: 'Ha Noi', citizen_expiry_date: date('2035-01-10'),
        phone: `09880000${String(index + 1).padStart(2, '0')}`, email: `${code.toLowerCase()}@bravo.example`, personal_email: `${code.toLowerCase()}@mail.example`,
        company_email: `${code.toLowerCase()}@bravo.example`, emergency_contact_name: 'Nguoi than', emergency_contact_relationship: 'Gia dinh', emergency_contact_phone: '0911111111',
        address: 'Ha Noi', permanent_address: 'Ha Noi', bank_account_number: `102000000${index + 1}`, bank_account_holder: name.toUpperCase(), bank_name: 'Vietcombank', bank_branch: 'Ha Noi',
        culture_level: '12/12', education_level: 'Dai hoc', education_school: 'Dai hoc Bach Khoa Ha Noi', major: 'Cong nghe thong tin', gpa: 8.2, graduation_year: 2018 + index,
        candidate_id: id === 'emp-008' ? 'cand-hired' : null, department_id: department, position_id: position, manager_id: manager, level: index < 2 ? 'Quan ly cap cao' : 'Nhan vien',
        join_date: date(join), initial_contract_date: date(join), official_date: date(index === 7 ? '2026-08-15' : join), resignation_date: employmentStatus === 'RESIGNED' ? date('2026-06-30') : null,
        employment_status: employmentStatus, avatar_url: null, note: employmentStatus === 'RESIGNED' ? 'Da hoan tat ban giao' : null, is_active: employmentStatus === 'WORKING' ? 1 : 0
    })));
    add('Employee', Array.from({ length: 42 }, (_, index) => {
        const positionIndex = index % 24;
        const number = String(index + 9).padStart(3, '0');
        const resigned = index < 6;
        const joinMonth = String((index % 8) + 1).padStart(2, '0');
        const joinDay = String((index % 20) + 1).padStart(2, '0');
        const join = `${resigned ? 2024 : 2025}-${joinMonth}-${joinDay}`;
        const resignation = resigned ? date(`2026-0${(index % 6) + 1}-${String(10 + index).padStart(2, '0')}`) : null;
        const department = extraPositionDepartments[positionIndex];
        const position = `pos-extra-${String(positionIndex + 1).padStart(2, '0')}`;
        const name = EMPLOYEE_NAMES[index + 8];
        return {
            employee_id: `emp-extra-${number}`, ...stamp(join), employee_code: `NV-2026-${number}`, short_name: name.split(' ').pop(), full_name: name,
            gender: index % 2 ? 'Nữ' : 'Nam', date_of_birth: date(`${1980 + (index % 15)}-${String((index % 9) + 1).padStart(2, '0')}-15`),
            place_of_birth: 'Ha Noi', is_foreign: 0, hometown: 'Ha Noi', nationality: 'Viet Nam', ethnicity: 'Kinh', religion: null,
            blood_type: index % 2 ? 'A' : 'O', marital_status: 'Single', tax_code: `010990${number}`, citizen_id: `001099${number}`,
            citizen_issue_date: date('2021-01-10'), citizen_issue_place: 'Ha Noi', citizen_expiry_date: date('2036-01-10'),
            phone: `097700${number}`, email: `employee${number}@bravo.example`, personal_email: `employee${number}@mail.example`, company_email: `employee${number}@bravo.example`,
            emergency_contact_name: 'Nguoi than', emergency_contact_relationship: 'Gia dinh', emergency_contact_phone: '0912222222', address: 'Ha Noi', permanent_address: 'Ha Noi',
            bank_account_number: `103000${number}`, bank_account_holder: name.toUpperCase(), bank_name: 'Vietcombank', bank_branch: 'Ha Noi', culture_level: '12/12',
            education_level: 'Dai hoc', education_school: 'Dai hoc Cong nghe', major: 'Quan tri doanh nghiep', gpa: 7.5 + (index % 15) / 10, graduation_year: 2018 + (index % 7),
            candidate_id: null, department_id: department, position_id: position, manager_id: 'emp-004', level: 'Nhân viên', join_date: date(join), initial_contract_date: date(join),
            official_date: date(join), resignation_date: resignation, employment_status: resigned ? 'RESIGNED' : 'WORKING', avatar_url: null,
            note: resigned ? 'Da hoan tat ban giao' : null, is_active: resigned ? 0 : 1
        };
    }));
    const employeeById = new Map(tables.Employee.map((employee) => [employee.employee_id, employee]));
    const employeeName = (employeeId) => employeeById.get(employeeId)?.full_name || null;
    const employeePositionName = (employeeId) => {
        const employee = employeeById.get(employeeId);
        return tables.Position.find((position) => position.position_id === employee?.position_id)?.position_name || null;
    };
    const employeeDepartmentName = (employeeId) => {
        const employee = employeeById.get(employeeId);
        return tables.Department.find((department) => department.department_id === employee?.department_id)?.department_name || null;
    };
    add('User', [
        { user_id: 'user-admin', username: 'admin', password_hash: passwordHash, full_name: employeeName('emp-001'), email: 'admin@bravo.example', phone: '0988000001', role_id: 'role-admin', department_id: 'dept-exec', employee_id: 'emp-001', avatar_url: null, ...stamp('2026-01-04'), status: 1 },
        { user_id: 'user-hr', username: 'hr.ha', password_hash: passwordHash, full_name: employeeName('emp-002'), email: 'hr.ha@bravo.example', phone: '0988000002', role_id: 'role-hr', department_id: 'dept-people', employee_id: 'emp-002', avatar_url: null, ...stamp('2026-01-04'), status: 1 },
        { user_id: 'user-manager', username: 'eng.nam', password_hash: passwordHash, full_name: employeeName('emp-004'), email: 'eng.nam@bravo.example', phone: '0988000004', role_id: 'role-manager', department_id: 'dept-engineering', employee_id: 'emp-004', avatar_url: null, ...stamp('2026-01-05'), status: 1 },
        { user_id: 'user-resigned', username: 'former.employee', password_hash: passwordHash, full_name: employeeName('emp-007'), email: 'former@bravo.example', phone: '0988000007', role_id: 'role-employee', department_id: 'dept-engineering', employee_id: 'emp-007', avatar_url: null, ...stamp('2026-01-05'), status: 0 },
        { user_id: 'user-bgd', username: 'bgd.van', password_hash: passwordHash, full_name: employeeName('emp-001'), email: 'bgd.van@bravo.example', phone: '0988000010', role_id: 'role-bgd', department_id: 'dept-exec', employee_id: 'emp-001', avatar_url: null, ...stamp('2026-01-06'), status: 1 },
        { user_id: 'user-block', username: 'block.nam', password_hash: passwordHash, full_name: employeeName('emp-004'), email: 'block.nam@bravo.example', phone: '0988000011', role_id: 'role-block', department_id: 'dept-engineering', employee_id: 'emp-004', avatar_url: null, ...stamp('2026-01-06'), status: 1 },
        { user_id: 'user-hr-specialist', username: 'hr.linh', password_hash: passwordHash, full_name: employeeName('emp-003'), email: 'hr.linh@bravo.example', phone: '0988000012', role_id: 'role-hr', department_id: 'dept-people', employee_id: 'emp-003', avatar_url: null, ...stamp('2026-01-06'), status: 1 },
        { user_id: 'user-employee-005', username: 'duy.pham', password_hash: passwordHash, full_name: employeeName('emp-005'), email: 'duy.pham@bravo.example', phone: '0988000013', role_id: 'role-employee', department_id: 'dept-engineering', employee_id: 'emp-005', avatar_url: null, ...stamp('2026-01-07'), status: 1 },
        { user_id: 'user-employee-006', username: 'linh.vu', password_hash: passwordHash, full_name: employeeName('emp-006'), email: 'linh.vu@bravo.example', phone: '0988000014', role_id: 'role-employee', department_id: 'dept-platform', employee_id: 'emp-006', avatar_url: null, ...stamp('2026-01-07'), status: 1 },
        { user_id: 'user-locked', username: 'locked.user', password_hash: passwordHash, full_name: employeeName('emp-extra-009'), email: 'locked@bravo.example', phone: '0988000015', role_id: 'role-employee', department_id: 'dept-exec', employee_id: 'emp-extra-009', avatar_url: null, ...stamp('2026-01-08'), status: 0 },
        { user_id: 'user-employee-010', username: 'employee.010', password_hash: passwordHash, full_name: employeeName('emp-extra-010'), email: 'employee010@bravo.example', phone: '0988000016', role_id: 'role-employee', department_id: 'dept-people', employee_id: 'emp-extra-010', avatar_url: null, ...stamp('2026-01-08'), status: 1 },
        { user_id: 'user-employee-011', username: 'employee.011', password_hash: passwordHash, full_name: employeeName('emp-extra-011'), email: 'employee011@bravo.example', phone: '0988000017', role_id: 'role-employee', department_id: 'dept-engineering', employee_id: 'emp-extra-011', avatar_url: null, ...stamp('2026-01-08'), status: 1 },
        { user_id: 'user-employee-012', username: 'employee.012', password_hash: passwordHash, full_name: employeeName('emp-extra-012'), email: 'employee012@bravo.example', phone: '0988000018', role_id: 'role-employee', department_id: 'dept-platform', employee_id: 'emp-extra-012', avatar_url: null, ...stamp('2026-01-08'), status: 1 },
        { user_id: 'user-employee-013', username: 'employee.013', password_hash: passwordHash, full_name: employeeName('emp-extra-013'), email: 'employee013@bravo.example', phone: '0988000019', role_id: 'role-employee', department_id: 'dept-pmk', employee_id: 'emp-extra-013', avatar_url: null, ...stamp('2026-01-08'), status: 1 },
        { user_id: 'user-employee-014', username: 'employee.014', password_hash: passwordHash, full_name: employeeName('emp-extra-014'), email: 'employee014@bravo.example', phone: '0988000020', role_id: 'role-employee', department_id: 'dept-kd', employee_id: 'emp-extra-014', avatar_url: null, ...stamp('2026-01-08'), status: 1 }
    ]);

    add('EmployeeContract', [
        { contract_id: 'contract-001', ...stamp('2024-01-08'), contract_no: 'HD-2024-001', contract_date: date('2024-01-08'), signer_id: 'emp-001', signer_name: 'Bui Xuan Thuc', signer_position: 'Giam doc', employee_id: 'emp-001', employee_position: 'Giam doc', contract_type: 'UNLIMITED', sign_date: date('2024-01-08'), start_date: date('2024-01-08'), end_date: null, has_probation: 0, probation_from_date: null, probation_to_date: null, probation_salary_rate: null, job_description: 'Dieu hanh cong ty', salary_scale: 'G12', salary_grade: 'G12', allowance_details: json({ phone: 2000000 }), base_salary: 65000000, social_insurance_salary: 30000000, salary: 65000000, status: 'ACTIVE', attachment_url: null, note: null },
        { contract_id: 'contract-002', ...stamp('2024-02-12'), contract_no: 'HD-2024-002', contract_date: date('2024-02-12'), signer_id: 'emp-001', signer_name: 'Bui Xuan Thuc', signer_position: 'Giam doc', employee_id: 'emp-002', employee_position: 'Truong phong Nhan su', contract_type: 'FIXED_36', sign_date: date('2024-02-12'), start_date: date('2024-02-12'), end_date: date('2027-02-02'), has_probation: 0, probation_from_date: null, probation_to_date: null, probation_salary_rate: null, job_description: 'Quan ly nhan su', salary_scale: 'G9', salary_grade: 'G9', allowance_details: null, base_salary: 32000000, social_insurance_salary: 28000000, salary: 32000000, status: 'ACTIVE', attachment_url: null, note: null },
        { contract_id: 'contract-003', ...stamp('2025-01-06'), contract_no: 'HD-2025-003', contract_date: date('2025-01-06'), signer_id: 'emp-002', signer_name: 'Tran Thu Ha', signer_position: 'Truong phong Nhan su', employee_id: 'emp-003', employee_position: 'Chuyen vien Nhan su', contract_type: 'PROBATION', sign_date: date('2025-01-06'), start_date: date('2025-01-06'), end_date: date('2025-03-06'), has_probation: 1, probation_from_date: date('2025-01-06'), probation_to_date: date('2025-03-06'), probation_salary_rate: 0.85, job_description: 'Nghiep vu nhan su', salary_scale: 'G6', salary_grade: 'G6', allowance_details: null, base_salary: 15300000, social_insurance_salary: 0, salary: 15300000, status: 'TERMINATED', attachment_url: null, note: 'Da ket thuc thu viec' },
        { contract_id: 'contract-004', ...stamp('2023-06-01'), contract_no: 'HD-2023-004', contract_date: date('2023-06-01'), signer_id: 'emp-001', signer_name: 'Bui Xuan Thuc', signer_position: 'Giam doc', employee_id: 'emp-004', employee_position: 'Truong phong Ky thuat', contract_type: 'UNLIMITED', sign_date: date('2023-06-01'), start_date: date('2023-06-01'), end_date: null, has_probation: 0, probation_from_date: null, probation_to_date: null, probation_salary_rate: null, job_description: 'Quan ly ky thuat', salary_scale: 'G9', salary_grade: 'G9', allowance_details: null, base_salary: 42000000, social_insurance_salary: 35000000, salary: 42000000, status: 'ACTIVE', attachment_url: null, note: null },
        { contract_id: 'contract-005', ...stamp('2024-08-01'), contract_no: 'HD-2024-005', contract_date: date('2024-08-01'), signer_id: 'emp-004', signer_name: 'Le Hoang Nam', signer_position: 'Truong phong Ky thuat', employee_id: 'emp-007', employee_position: 'Ky su phat trien', contract_type: 'FIXED_12', sign_date: date('2024-08-01'), start_date: date('2024-08-01'), end_date: date('2025-08-01'), has_probation: 0, probation_from_date: null, probation_to_date: null, probation_salary_rate: null, job_description: 'Phat trien san pham', salary_scale: 'G6', salary_grade: 'G6', allowance_details: null, base_salary: 18500000, social_insurance_salary: 16000000, salary: 18500000, status: 'EXPIRED', attachment_url: null, note: 'Nhan su da nghi viec' },
        { contract_id: 'contract-006', ...stamp('2026-08-15'), contract_no: 'HD-2026-006', contract_date: date('2026-08-15'), signer_id: 'emp-001', signer_name: 'Bui Xuan Thuc', signer_position: 'Giam doc', employee_id: 'emp-008', employee_position: 'Ky su Ha tang', contract_type: 'PROBATION', sign_date: date('2026-08-15'), start_date: date('2026-08-15'), end_date: date('2026-10-14'), has_probation: 1, probation_from_date: date('2026-08-15'), probation_to_date: date('2026-10-14'), probation_salary_rate: 0.85, job_description: 'Van hanh cloud', salary_scale: 'G6', salary_grade: 'G6', allowance_details: null, base_salary: 17850000, social_insurance_salary: 0, salary: 17850000, status: 'ACTIVE', attachment_url: null, note: 'Hop dong thu viec tuyen moi' }
    ]);
    add('EmployeeContract', Array.from({ length: 24 }, (_, index) => {
        const employee = tables.Employee[8 + index];
        const type = ['PROBATION', 'FIXED_12', 'FIXED_36', 'UNLIMITED'][index % 4];
        const status = ['ACTIVE', 'EXPIRED', 'TERMINATED', 'ACTIVE', 'ACTIVE', 'EXPIRED'][index % 6];
        const number = String(index + 7).padStart(3, '0');
        const start = `${index < 12 ? 2025 : 2026}-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 20) + 1).padStart(2, '0')}`;
        const end = type === 'UNLIMITED' ? null : index === 1 ? date('2027-03-31') : date('2026-08-31');
        return {
            contract_id: `contract-extra-${number}`, ...stamp(start), contract_no: `HD-2026-${number}`, contract_date: date(start), signer_id: 'emp-001',
            signer_name: 'Bui Xuan Thuc', signer_position: 'Giam doc', employee_id: employee.employee_id, employee_position: 'Chuyen vien nghiep vu', contract_type: type,
            sign_date: date(start), start_date: date(start), end_date: end, has_probation: type === 'PROBATION' ? 1 : 0,
            probation_from_date: type === 'PROBATION' ? date(start) : null, probation_to_date: type === 'PROBATION' ? (end || date('2026-09-01')) : null,
            probation_salary_rate: type === 'PROBATION' ? 0.85 : null, job_description: 'Thuc hien cong viec theo vi tri', salary_scale: 'G5', salary_grade: 'G5',
            allowance_details: json({ meal: 730000 }), base_salary: 15000000 + index * 100000, social_insurance_salary: type === 'PROBATION' ? 0 : 13000000 + index * 100000,
            salary: 15000000 + index * 100000, status, attachment_url: null, note: status === 'TERMINATED' ? 'Cham dut theo quyet dinh' : null
        };
    }));
    add('ContractProposal', [
        { proposal_id: 'contract-proposal-001', ...stamp('2026-01-20'), proposal_code: 'CP-2026-001', employee_id: 'emp-003', contract_type: 'FIXED_36', proposed_salary: 20000000, proposed_start_date: date('2026-03-07'), reason: 'Ky hop dong chinh thuc', status: 'APPROVED' },
        { proposal_id: 'contract-proposal-002', ...stamp('2026-08-10'), proposal_code: 'CP-2026-002', employee_id: 'emp-008', contract_type: 'FIXED_12', proposed_salary: 22000000, proposed_start_date: date('2026-10-15'), reason: 'Chuyen hop dong sau thu viec', status: 'PENDING' }
    ]);
    add('ContractProposal', Array.from({ length: 6 }, (_, index) => ({
        proposal_id: `contract-proposal-extra-${String(index + 3).padStart(3, '0')}`, ...stamp(`2026-0${(index % 8) + 1}-20`),
        proposal_code: `CP-2026-${String(index + 3).padStart(3, '0')}`, employee_id: tables.Employee[10 + index].employee_id,
        contract_type: ['FIXED_12', 'FIXED_36', 'UNLIMITED'][index % 3], proposed_salary: 18000000 + index * 500000,
        proposed_start_date: date(index % 2 ? '2026-09-20' : '2026-08-25'), reason: 'De xuat cap nhat hop dong dinh ky', status: ['PENDING', 'APPROVED', 'REJECTED'][index % 3]
    })));
    add('ContractExtension', [
        { extension_id: 'extension-001', ...stamp('2026-01-15'), extension_code: 'EXT-2026-001', contract_id: 'contract-002', employee_id: 'emp-002', new_end_date: date('2028-02-02'), new_salary: 35000000, extension_term: '12 thang', reason: 'Tiep tuc bo nhiem', status: 'APPROVED' },
        { extension_id: 'extension-002', ...stamp('2026-08-20'), extension_code: 'EXT-2026-002', contract_id: 'contract-006', employee_id: 'emp-008', new_end_date: date('2027-08-15'), new_salary: 22000000, extension_term: '12 thang', reason: 'Du kien sau thu viec', status: 'PENDING' }
    ]);
    add('ContractExtension', Array.from({ length: 4 }, (_, index) => {
        const contractNumber = String(index + 7).padStart(3, '0');
        return {
            extension_id: `extension-extra-${String(index + 3).padStart(3, '0')}`, ...stamp(`2026-0${(index % 8) + 2}-10`), extension_code: `EXT-2026-${String(index + 3).padStart(3, '0')}`,
            contract_id: `contract-extra-${contractNumber}`, employee_id: tables.Employee[8 + index].employee_id, new_end_date: date(`2027-0${(index % 8) + 3}-15`),
            new_salary: 18000000 + index * 500000, extension_term: '12 thang', reason: 'Gia han theo ket qua cong viec', status: ['APPROVED', 'PENDING', 'REJECTED', 'APPROVED'][index]
        };
    }));
    add('ContractAppendix', [
        { appendix_id: 'appendix-001', contract_id: 'contract-002', appendix_no: 'PL-2026-001', signed_date: date('2026-02-01'), appendix_type: 'DIEU CHINH LUONG', effective_date: date('2026-02-01'), changed_content: json({ salary: 35000000 }), signer_id: 'emp-001', signer_name: 'Bui Xuan Thuc', attachment_url: null, note: 'Dieu chinh luong nam 2026', status: 'ACTIVE', ...stamp('2026-02-01') },
        { appendix_id: 'appendix-002', contract_id: 'contract-005', appendix_no: 'PL-2025-005', signed_date: date('2025-02-01'), appendix_type: 'DIEU CHINH NOI DUNG', effective_date: date('2025-02-01'), changed_content: 'Cap nhat pham vi cong viec', signer_id: 'emp-004', signer_name: 'Le Hoang Nam', attachment_url: null, note: null, status: 'EXPIRED', ...stamp('2025-02-01') }
    ]);
    add('ContractAppendix', Array.from({ length: 4 }, (_, index) => {
        const contractNumber = String(index + 9).padStart(3, '0');
        return {
            appendix_id: `appendix-extra-${String(index + 3).padStart(3, '0')}`, contract_id: `contract-extra-${contractNumber}`, appendix_no: `PL-2026-${String(index + 3).padStart(3, '0')}`,
            signed_date: date(`2026-0${(index % 8) + 3}-05`), appendix_type: index % 2 ? 'DIEU CHINH NOI DUNG' : 'DIEU CHINH LUONG',
            effective_date: date(`2026-0${(index % 8) + 3}-10`), changed_content: json({ updated: index % 2 ? 'job_description' : 'salary' }), signer_id: 'emp-001', signer_name: 'Bui Xuan Thuc',
            attachment_url: null, note: 'Phu luc hop dong bo sung', status: index === 3 ? 'EXPIRED' : 'ACTIVE', ...stamp(`2026-0${(index % 8) + 3}-05`)
        };
    }));
    add('PositionContractPathway', [
        { pathway_id: 'pathway-eng-01', position_id: 'pos-eng-specialist', contract_type_id: 'ctype-probation', step_order: 1, note: 'Thu viec 60 ngay', created_date: date('2026-01-04') },
        { pathway_id: 'pathway-eng-02', position_id: 'pos-eng-specialist', contract_type_id: 'ctype-36m', step_order: 2, note: 'Hop dong chinh thuc 36 thang', created_date: date('2026-01-04') },
        { pathway_id: 'pathway-platform-01', position_id: 'pos-platform-specialist', contract_type_id: 'ctype-probation', step_order: 1, note: 'Thu viec ky su ha tang', created_date: date('2026-01-04') },
        { pathway_id: 'pathway-platform-02', position_id: 'pos-platform-specialist', contract_type_id: 'ctype-12m', step_order: 2, note: 'Hop dong xac dinh thoi han', created_date: date('2026-01-04') },
        { pathway_id: 'pathway-hr-01', position_id: 'pos-hr-specialist', contract_type_id: 'ctype-probation', step_order: 1, note: 'Thu viec chuyen vien HR', created_date: date('2026-01-04') },
        { pathway_id: 'pathway-hr-02', position_id: 'pos-hr-specialist', contract_type_id: 'ctype-unlimited', step_order: 2, note: 'Chuyen hop dong khong xac dinh', created_date: date('2026-01-04') }
    ]);
    add('WorkHistory', [
        { work_history_id: 'history-001', ...stamp('2025-03-03'), employee_id: 'emp-005', department_id: 'dept-engineering', position_id: 'pos-eng-specialist', decision_type: 'JOIN', effective_date: date('2025-03-03'), source_type: 'EMPLOYEE', source_id: 'emp-005', reason: 'Tiep nhan moi', note: null },
        { work_history_id: 'history-002', ...stamp('2026-07-01'), employee_id: 'emp-005', department_id: 'dept-platform', position_id: 'pos-platform-specialist', decision_type: 'TRANSFER', effective_date: date('2026-07-01'), source_type: 'TRANSFER_DECISION', source_id: 'transfer-decision-001', reason: 'Bo sung nhan su Ha tang', note: 'Cho cap nhat ho so chinh' },
        { work_history_id: 'history-003', ...stamp('2026-06-30'), employee_id: 'emp-007', department_id: 'dept-engineering', position_id: 'pos-eng-specialist', decision_type: 'RESIGN', effective_date: date('2026-06-30'), source_type: 'RESIGNATION_DECISION', source_id: 'resign-decision-001', reason: 'Ly do ca nhan', note: 'Da ban giao' }
    ]);

    add('InterviewSchedule', [
        { schedule_id: 'schedule-platform-001', ...stamp('2026-08-08'), schedule_code: 'SCH-PLAT-001', recruitment_request_id: 'req-platform-001', round_type: 'TECHNICAL', format_type: 'ONLINE', location: 'Microsoft Teams', start_time: date('2026-08-18') + 9 * 60 * 60 * 1000, end_time: date('2026-08-18') + 10 * 60 * 60 * 1000, duration_minutes: 60, note: 'Phong van ky su ha tang', candidate_note: 'Chuan bi tinh huong xu ly su co', candidates_json: json([{ candidate_id: 'cand-interview', slot: '09:00' }, { candidate_id: 'cand-rejected', slot: '10:00' }]), council_json: json([{ employee_id: 'emp-004', role: 'Chu tri' }, { employee_id: 'emp-006', role: 'Thanh vien' }]), tests_json: json([{ name: 'Cloud troubleshooting', duration: 30 }]), status: 'COMPLETED' },
        { schedule_id: 'schedule-hr-001', ...stamp('2026-04-02'), schedule_code: 'SCH-HR-001', recruitment_request_id: 'req-hr-001', round_type: 'HR', format_type: 'OFFLINE', location: 'Phong hop 2', start_time: date('2026-04-10') + 14 * 60 * 60 * 1000, end_time: date('2026-04-10') + 15 * 60 * 60 * 1000, duration_minutes: 60, note: 'Phong van HR', candidate_note: 'Mang ban goc', candidates_json: json([{ candidate_id: 'cand-new', slot: '14:00' }]), council_json: json([{ employee_id: 'emp-002', role: 'Chu tri' }]), tests_json: json([]), status: 'Đã lên lịch' },
        { schedule_id: 'schedule-hire-001', ...stamp('2026-07-06'), schedule_code: 'SCH-PLAT-HIRE', recruitment_request_id: 'req-platform-001', round_type: 'TECHNICAL', format_type: 'ONLINE', location: 'Microsoft Teams', start_time: date('2026-07-07') + 9 * 60 * 60 * 1000, end_time: date('2026-07-07') + 10 * 60 * 60 * 1000, duration_minutes: 60, note: 'Chuoi phong van ung vien da duoc chuyen doi', candidate_note: 'Phong van bo sung', candidates_json: json([{ candidate_id: 'cand-hired', slot: '09:00' }]), council_json: json([{ employee_id: 'emp-004', role: 'Chu tri' }]), tests_json: json([{ name: 'Linux and networking', duration: 30 }]), status: 'COMPLETED' }
    ]);
    const extraScheduleRequests = ['req-extra-005', 'req-extra-006', 'req-extra-007', 'req-extra-008', 'req-extra-009', 'req-extra-010', 'req-platform-001', 'req-hr-001'];
    add('InterviewSchedule', Array.from({ length: 8 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        const candidateId = `cand-extra-${String(index + 9).padStart(3, '0')}`;
        const day = String((index % 8) + 1).padStart(2, '0');
        const start = date(`2026-0${(index % 8) + 1}-${day}`) + (9 + index % 3) * 60 * 60 * 1000;
        return {
            schedule_id: `schedule-extra-${number}`, ...stamp(`2026-0${(index % 8) + 1}-${day}`), schedule_code: `SCH-2026-${number}`,
            recruitment_request_id: extraScheduleRequests[index], round_type: index % 2 ? 'HR' : 'TECHNICAL', format_type: index % 3 ? 'ONLINE' : 'OFFLINE',
            location: index % 3 ? 'Microsoft Teams' : 'Phong hop 3', start_time: start, end_time: start + 60 * 60 * 1000, duration_minutes: 60,
            note: 'Lich phong van bo sung', candidate_note: 'Chuan bi ho so va bai test', candidates_json: json([{ candidate_id: candidateId, slot: `${9 + index % 3}:00` }]),
            council_json: json([{ employee_id: `emp-extra-${String(index + 9).padStart(3, '0')}`, role: 'Thanh vien' }]), tests_json: json([{ name: 'Bai test nghiep vu', duration: 30 }]),
            status: index % 2 ? 'Đã lên lịch' : 'COMPLETED'
        };
    }));
    add('InterviewScheduleCandidate', [
        { schedule_candidate_id: 'schedule-candidate-001', schedule_id: 'schedule-platform-001', candidate_id: 'cand-interview', start_time: date('2026-08-18') + 9 * 60 * 60 * 1000, end_time: date('2026-08-18') + 10 * 60 * 60 * 1000, note: 'Ung vien chinh', status: 'COMPLETED', created_date: date('2026-08-08') },
        { schedule_candidate_id: 'schedule-candidate-002', schedule_id: 'schedule-platform-001', candidate_id: 'cand-rejected', start_time: date('2026-08-18') + 10 * 60 * 60 * 1000, end_time: date('2026-08-18') + 11 * 60 * 60 * 1000, note: null, status: 'NO_SHOW', created_date: date('2026-08-08') },
        { schedule_candidate_id: 'schedule-candidate-003', schedule_id: 'schedule-hr-001', candidate_id: 'cand-new', start_time: date('2026-04-10') + 14 * 60 * 60 * 1000, end_time: date('2026-04-10') + 15 * 60 * 60 * 1000, note: null, status: 'SCHEDULED', created_date: date('2026-04-02') },
        { schedule_candidate_id: 'schedule-candidate-004', schedule_id: 'schedule-hire-001', candidate_id: 'cand-hired', start_time: date('2026-07-07') + 9 * 60 * 60 * 1000, end_time: date('2026-07-07') + 10 * 60 * 60 * 1000, note: 'Ung vien da duoc tiep nhan', status: 'COMPLETED', created_date: date('2026-07-06') }
    ]);
    add('InterviewScheduleCandidate', Array.from({ length: 8 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        const day = String((index % 8) + 1).padStart(2, '0');
        const start = date(`2026-0${(index % 8) + 1}-${day}`) + (9 + index % 3) * 60 * 60 * 1000;
        return {
            schedule_candidate_id: `schedule-candidate-extra-${number}`, schedule_id: `schedule-extra-${number}`, candidate_id: `cand-extra-${String(index + 9).padStart(3, '0')}`,
            start_time: start, end_time: start + 60 * 60 * 1000, note: null, status: index % 3 === 0 ? 'COMPLETED' : 'SCHEDULED', created_date: date(`2026-0${(index % 8) + 1}-${day}`)
        };
    }));
    add('InterviewSchedulePanel', [
        { panel_member_id: 'panel-001', schedule_id: 'schedule-platform-001', employee_id: 'emp-004', is_decision_maker: 1, note: 'Quan ly ky thuat', created_date: date('2026-08-08') },
        { panel_member_id: 'panel-002', schedule_id: 'schedule-platform-001', employee_id: 'emp-006', is_decision_maker: 0, note: 'Chuyen gia cloud', created_date: date('2026-08-08') },
        { panel_member_id: 'panel-003', schedule_id: 'schedule-hr-001', employee_id: 'emp-002', is_decision_maker: 1, note: 'Truong phong HR', created_date: date('2026-04-02') },
        { panel_member_id: 'panel-004', schedule_id: 'schedule-hire-001', employee_id: 'emp-004', is_decision_maker: 1, note: 'Quan ly ky thuat', created_date: date('2026-07-06') }
    ]);
    add('InterviewSchedulePanel', Array.from({ length: 8 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        return {
            panel_member_id: `panel-extra-${number}`, schedule_id: `schedule-extra-${number}`, employee_id: `emp-extra-${String(index + 10).padStart(3, '0')}`,
            is_decision_maker: index % 2, note: 'Thanh vien hoi dong tuyen dung', created_date: date(`2026-0${(index % 8) + 1}-${String((index % 8) + 1).padStart(2, '0')}`)
        };
    }));
    add('Interview', [
        { interview_id: 'interview-001', ...stamp('2026-08-18'), candidate_id: 'cand-interview', recruitment_round_id: 'round-platform-interview', interviewer_id: 'emp-004', interview_date: date('2026-08-18'), score: 8.5, result: 'PASSED', comment: 'Co kinh nghiem van hanh cloud' },
        { interview_id: 'interview-002', ...stamp('2026-08-18'), candidate_id: 'cand-rejected', recruitment_round_id: 'round-platform-interview', interviewer_id: 'emp-006', interview_date: date('2026-08-18'), score: 4.5, result: 'FAILED', comment: 'Chua dat yeu cau ky thuat' },
        { interview_id: 'interview-003', ...stamp('2026-04-10'), candidate_id: 'cand-new', recruitment_round_id: 'round-hr-interview', interviewer_id: 'emp-002', interview_date: date('2026-04-10'), score: null, result: 'PENDING', comment: null },
        { interview_id: 'interview-004', ...stamp('2026-07-07'), candidate_id: 'cand-hired', recruitment_round_id: 'round-platform-interview', interviewer_id: 'emp-004', interview_date: date('2026-07-07'), score: 9, result: 'PASSED', comment: 'Dat yeu cau, de xuat tuyen dung' }
    ]);
    add('Interview', Array.from({ length: 16 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        const day = String((index % 8) + 1).padStart(2, '0');
        return {
            interview_id: `interview-extra-${number}`, ...stamp(`2026-0${(index % 8) + 1}-${day}`), candidate_id: `cand-extra-${String(index + 9).padStart(3, '0')}`,
            recruitment_round_id: `round-extra-${number}`, interviewer_id: `emp-extra-${String(index + 9).padStart(3, '0')}`, interview_date: date(`2026-0${(index % 8) + 1}-${day}`),
            score: index % 4 === 0 ? null : 6 + (index % 5), result: index % 4 === 0 ? 'PENDING' : (index % 3 === 0 ? 'FAILED' : 'PASSED'), comment: 'Ket qua phong van bo sung'
        };
    }));
    add('PreScreening', [
        { pre_screening_id: 'screening-001', screening_code: 'PS-001', candidate_id: 'cand-screened', received_date: date('2026-02-08'), culture_level: '12/12', education_level: 'Dai hoc', education_school: 'Dai hoc Cong nghe', position_id: 'pos-eng-specialist', department_id: 'dept-engineering', screening_date: date('2026-02-10'), level_score: 8, screening_result: 'PASSED', comment: 'Du dieu kien phong van', ...stamp('2026-02-10') },
        { pre_screening_id: 'screening-002', screening_code: 'PS-002', candidate_id: 'cand-cv-rejected', received_date: date('2026-02-09'), culture_level: '12/12', education_level: 'Cao dang', education_school: 'Cao dang FPT', position_id: 'pos-eng-specialist', department_id: 'dept-engineering', screening_date: date('2026-02-11'), level_score: 4, screening_result: 'FAILED', comment: 'Thieu kinh nghiem', ...stamp('2026-02-11') },
        { pre_screening_id: 'screening-003', screening_code: 'PS-003', candidate_id: 'cand-new', received_date: date('2026-03-18'), culture_level: '12/12', education_level: 'Dai hoc', education_school: 'Dai hoc Cong nghe', position_id: 'pos-hr-specialist', department_id: 'dept-people', screening_date: null, level_score: 5, screening_result: 'PENDING', comment: null, ...stamp('2026-03-18') },
        { pre_screening_id: 'screening-004', screening_code: 'PS-004', candidate_id: 'cand-hired', received_date: date('2026-07-05'), culture_level: '12/12', education_level: 'Dai hoc', education_school: 'Dai hoc Bach Khoa', position_id: 'pos-platform-specialist', department_id: 'dept-platform', screening_date: date('2026-07-06'), level_score: 9, screening_result: 'PASSED', comment: 'Du dieu kien chuyen doi', ...stamp('2026-07-06') }
    ]);
    add('PreScreening', Array.from({ length: 16 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        const positionIndex = (index + 4) % 24;
        const day = String((index % 8) + 1).padStart(2, '0');
        const screeningDate = date(`2026-0${(index % 8) + 1}-${day}`);
        return {
            pre_screening_id: `screening-extra-${number}`, screening_code: `PS-${number}`, candidate_id: `cand-extra-${String(index + 9).padStart(3, '0')}`,
            received_date: screeningDate - 2 * 86400000, culture_level: '12/12', education_level: 'Dai hoc', education_school: 'Dai hoc Cong nghe',
            position_id: `pos-extra-${String(positionIndex + 1).padStart(2, '0')}`, department_id: extraPositionDepartments[positionIndex], screening_date: index % 4 === 0 ? null : screeningDate,
            level_score: index % 4 === 0 ? 5 : 6 + (index % 5), screening_result: index % 4 === 0 ? 'PENDING' : (index % 3 === 0 ? 'FAILED' : 'PASSED'),
            comment: 'Ket qua so loai bo sung', ...stamp(`2026-0${(index % 8) + 1}-${day}`)
        };
    }));
    add('PreScreeningCriteria', [
        { criteria_detail_id: 'screening-criteria-001', pre_screening_id: 'screening-001', row_order: 1, criteria_type: 'EDUCATION', required_from: 'Dai hoc', required_description: 'Tot nghiep dai hoc', candidate_value: 'Dai hoc', candidate_description: 'Dai hoc Cong nghe', is_passed: 1, note: null },
        { criteria_detail_id: 'screening-criteria-002', pre_screening_id: 'screening-001', row_order: 2, criteria_type: 'EXPERIENCE', required_from: '2 nam', required_description: 'Kinh nghiem phat trien', candidate_value: '3 nam', candidate_description: 'Kinh nghiem phat trien ERP', is_passed: 1, note: null },
        { criteria_detail_id: 'screening-criteria-003', pre_screening_id: 'screening-002', row_order: 1, criteria_type: 'EXPERIENCE', required_from: '2 nam', required_description: 'Kinh nghiem phat trien', candidate_value: '0 nam', candidate_description: 'Chua co kinh nghiem', is_passed: 0, note: 'Khong dat' },
        { criteria_detail_id: 'screening-criteria-004', pre_screening_id: 'screening-004', row_order: 1, criteria_type: 'EDUCATION', required_from: 'Dai hoc', required_description: 'Tot nghiep dai hoc', candidate_value: 'Dai hoc', candidate_description: 'Dai hoc Bach Khoa', is_passed: 1, note: null }
    ]);
    add('PreScreeningCriteria', Array.from({ length: 16 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        return {
            criteria_detail_id: `screening-criteria-extra-${number}`, pre_screening_id: `screening-extra-${number}`, row_order: 1, criteria_type: index % 2 ? 'EXPERIENCE' : 'EDUCATION',
            required_from: 'Dai hoc', required_description: 'Dap ung yeu cau vi tri', candidate_value: index % 3 ? 'Dai hoc' : 'Cao dang',
            candidate_description: 'Ho so ung vien da kiem tra', is_passed: index % 4 === 0 ? 0 : 1, note: null
        };
    }));
    add('InterviewEvaluation', [
        { interview_eval_id: 'interview-eval-001', eval_code: 'IE-001', evaluation_date: date('2026-08-18'), schedule_id: 'schedule-platform-001', candidate_id: 'cand-interview', evaluator_id: 'emp-004', duration_minutes: 60, level_score: 9, overall_result: 'PASSED', overall_comment: 'Dat yeu cau va co the nhan viec sau thu tuc', ...stamp('2026-08-18') },
        { interview_eval_id: 'interview-eval-002', eval_code: 'IE-002', evaluation_date: date('2026-08-18'), schedule_id: 'schedule-platform-001', candidate_id: 'cand-rejected', evaluator_id: 'emp-006', duration_minutes: 60, level_score: 4, overall_result: 'FAILED', overall_comment: 'Can bo sung kien thuc cloud', ...stamp('2026-08-18') },
        { interview_eval_id: 'interview-eval-003', eval_code: 'IE-003', evaluation_date: null, schedule_id: 'schedule-hr-001', candidate_id: 'cand-new', evaluator_id: 'emp-002', duration_minutes: null, level_score: 5, overall_result: 'PENDING', overall_comment: null, ...stamp('2026-04-02') },
        { interview_eval_id: 'interview-eval-004', eval_code: 'IE-004', evaluation_date: date('2026-07-07'), schedule_id: 'schedule-hire-001', candidate_id: 'cand-hired', evaluator_id: 'emp-004', duration_minutes: 60, level_score: 9, overall_result: 'PASSED', overall_comment: 'Dat yeu cau tuyen dung', ...stamp('2026-07-07') }
    ]);
    add('InterviewEvaluation', Array.from({ length: 16 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        const day = String((index % 8) + 1).padStart(2, '0');
        const pending = index % 4 === 0;
        return {
            interview_eval_id: `interview-eval-extra-${number}`, eval_code: `IE-${number}`, evaluation_date: pending ? null : date(`2026-0${(index % 8) + 1}-${day}`),
            schedule_id: `schedule-extra-${String((index % 8) + 5).padStart(3, '0')}`, candidate_id: `cand-extra-${String(index + 9).padStart(3, '0')}`,
            evaluator_id: `emp-extra-${String(index + 9).padStart(3, '0')}`, duration_minutes: pending ? null : 60, level_score: pending ? 5 : 6 + (index % 5),
            overall_result: pending ? 'PENDING' : (index % 3 === 0 ? 'FAILED' : 'PASSED'), overall_comment: 'Danh gia phong van bo sung', ...stamp(`2026-0${(index % 8) + 1}-${day}`)
        };
    }));
    add('InterviewEvaluationScript', [
        { script_id: 'script-001', interview_eval_id: 'interview-eval-001', row_order: 1, question: 'Xu ly su co mat ket noi nhu the nao?', expectation: 'Co quy trinh phan tich va khoi phuc', answer: 'Phan tich log, khoanh vung va rollback' },
        { script_id: 'script-002', interview_eval_id: 'interview-eval-001', row_order: 2, question: 'Kinh nghiem lam viec voi Azure?', expectation: 'Da van hanh he thong thuc te', answer: 'Da van hanh Azure App Service va Monitor' },
        { script_id: 'script-003', interview_eval_id: 'interview-eval-002', row_order: 1, question: 'Kiem tra backup?', expectation: 'Neu ro RPO/RTO', answer: 'Tra loi chua day du' },
        { script_id: 'script-004', interview_eval_id: 'interview-eval-004', row_order: 1, question: 'Giam sat he thong nhu the nao?', expectation: 'Su dung log va canh bao', answer: 'Su dung Azure Monitor va alert policy' }
    ]);
    add('InterviewEvaluationScript', Array.from({ length: 16 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        return {
            script_id: `script-extra-${number}`, interview_eval_id: `interview-eval-extra-${number}`, row_order: 1,
            question: 'Mo ta kinh nghiem xu ly tinh huong thuc te?', expectation: 'Trinh bay quy trinh ro rang', answer: 'Ung vien trinh bay kinh nghiem phu hop'
        };
    }));
    add('InterviewEvaluationCriteria', [
        { criteria_detail_id: 'interview-criteria-001', interview_eval_id: 'interview-eval-001', row_order: 1, criteria_type: 'TECHNICAL', required_from: '7', required_description: 'Ky nang ky thuat', candidate_value: '9', candidate_description: 'Nam vung cloud', is_passed: 1, note: null },
        { criteria_detail_id: 'interview-criteria-002', interview_eval_id: 'interview-eval-001', row_order: 2, criteria_type: 'COMMUNICATION', required_from: '6', required_description: 'Giao tiep', candidate_value: '8', candidate_description: 'Trinh bay ro rang', is_passed: 1, note: null },
        { criteria_detail_id: 'interview-criteria-003', interview_eval_id: 'interview-eval-002', row_order: 1, criteria_type: 'TECHNICAL', required_from: '7', required_description: 'Ky nang ky thuat', candidate_value: '4', candidate_description: 'Thieu kien thuc', is_passed: 0, note: null },
        { criteria_detail_id: 'interview-criteria-004', interview_eval_id: 'interview-eval-004', row_order: 1, criteria_type: 'TECHNICAL', required_from: '7', required_description: 'Ky nang ha tang', candidate_value: '9', candidate_description: 'Nam vung Linux va mang', is_passed: 1, note: null }
    ]);
    add('InterviewEvaluationCriteria', Array.from({ length: 16 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        return {
            criteria_detail_id: `interview-criteria-extra-${number}`, interview_eval_id: `interview-eval-extra-${number}`, row_order: 1,
            criteria_type: index % 2 ? 'COMMUNICATION' : 'TECHNICAL', required_from: '6', required_description: 'Dap ung tieu chi phong van',
            candidate_value: String(6 + (index % 5)), candidate_description: 'Ket qua danh gia theo mau', is_passed: index % 4 === 0 ? 0 : 1, note: null
        };
    }));
    add('Offer', [
        { offer_id: 'offer-001', ...stamp('2026-08-22'), candidate_id: 'cand-interview', offer_date: date('2026-08-22'), expected_start_date: date('2026-09-15'), probation_salary: 17850000, official_salary: 22000000, salary_offer: 17850000, offer_status: 'ACCEPTED', note: 'Ung vien xac nhan qua email' },
        { offer_id: 'offer-002', ...stamp('2026-06-05'), candidate_id: 'cand-passed', offer_date: date('2026-06-05'), expected_start_date: date('2026-06-20'), probation_salary: 14000000, official_salary: 17500000, salary_offer: 14000000, offer_status: 'SENT', note: 'Cho ung vien phan hoi' },
        { offer_id: 'offer-003', ...stamp('2026-08-24'), candidate_id: 'cand-rejected', offer_date: null, expected_start_date: null, probation_salary: 0, official_salary: 0, salary_offer: 0, offer_status: 'PENDING', note: null },
        { offer_id: 'offer-004', ...stamp('2026-07-08'), candidate_id: 'cand-hired', offer_date: date('2026-07-08'), expected_start_date: date('2026-08-15'), probation_salary: 17850000, official_salary: 22000000, salary_offer: 17850000, offer_status: 'ACCEPTED', note: 'Ung vien da nhan viec' }
    ]);
    add('Offer', Array.from({ length: 8 }, (_, index) => {
        const number = String(index + 5).padStart(3, '0');
        const sent = index % 4 !== 3;
        return {
            offer_id: `offer-extra-${number}`, ...stamp(`2026-0${(index % 8) + 2}-10`), candidate_id: `cand-extra-${String(index + 9).padStart(3, '0')}`,
            offer_date: sent ? date(`2026-0${(index % 8) + 2}-21`) : null, expected_start_date: sent ? date(index % 2 ? '2026-09-18' : '2026-08-28') : null,
            probation_salary: 15000000 + index * 250000, official_salary: 19000000 + index * 300000, salary_offer: 15000000 + index * 250000,
            offer_status: ['SENT', 'ACCEPTED', 'DECLINED', 'PENDING'][index % 4], note: 'Thu moi bo sung theo ke hoach'
        };
    }));
    add('RecruitmentDecision', [
        { decision_id: 'recruitment-decision-001', ...stamp('2026-08-20'), decision_number: 'QD-TD-2026-001', candidate_id: 'cand-interview', interview_eval_id: 'interview-eval-001', decision_date: date('2026-08-20'), result: 'ĐẠT', rejection_reason: null, overall_comment: 'Tuyen dung ky su ha tang', decision_by_id: 'emp-004', decision_by_name: 'Le Hoang Nam', status: 'COMPLETED', attachment_url: null },
        { decision_id: 'recruitment-decision-002', ...stamp('2026-08-20'), decision_number: 'QD-TD-2026-002', candidate_id: 'cand-rejected', interview_eval_id: 'interview-eval-002', decision_date: date('2026-08-20'), result: 'KHÔNG ĐẠT', rejection_reason: 'Diem ky thuat thap', overall_comment: 'Khong phu hop dot nay', decision_by_id: 'emp-004', decision_by_name: 'Le Hoang Nam', status: 'COMPLETED', attachment_url: null },
        { decision_id: 'recruitment-decision-003', ...stamp('2026-07-08'), decision_number: 'QD-TD-2026-003', candidate_id: 'cand-hired', interview_eval_id: 'interview-eval-004', decision_date: date('2026-07-08'), result: 'ĐẠT', rejection_reason: null, overall_comment: 'Hoan tat chuoi chuyen doi nhan vien', decision_by_id: 'emp-002', decision_by_name: 'Tran Thu Ha', status: 'COMPLETED', attachment_url: null }
    ]);
    add('RecruitmentDecision', Array.from({ length: 8 }, (_, index) => {
        const number = String(index + 4).padStart(3, '0');
        const rejected = index % 3 === 0;
        return {
            decision_id: `recruitment-decision-extra-${number}`, ...stamp(`2026-0${(index % 8) + 2}-10`), decision_number: `QD-TD-2026-${number}`,
            candidate_id: `cand-extra-${String(index + 9).padStart(3, '0')}`, interview_eval_id: `interview-eval-extra-${number === '012' ? '012' : String(index + 5).padStart(3, '0')}`,
            decision_date: date(`2026-0${(index % 8) + 2}-10`), result: rejected ? 'KHÔNG ĐẠT' : 'ĐẠT', rejection_reason: rejected ? 'Ket qua danh gia chua dat' : null,
            overall_comment: 'Quyet dinh tuyen dung bo sung', decision_by_id: 'emp-004', decision_by_name: 'Le Hoang Nam', status: 'COMPLETED', attachment_url: null
        };
    }));

    add('LeaveApplication', [
        { leave_id: 'leave-001', ...stamp('2026-02-10'), leave_code: 'P-2026-001', employee_id: 'emp-003', employee_code: 'NV-2024-003', employee_name: 'Nguyen Thuy Linh', department_id: 'dept-people', department_name: 'Phong Nhan su', approver_id: 'emp-002', approver_name: 'Tran Thu Ha', related_person_id: null, related_person_name: null, start_date: date('2026-02-16'), end_date: date('2026-02-17'), total_days: 2, leave_type: 'ANNUAL', leave_year: 2026, entitled_days: 12, used_days_before: 0, remaining_days_before: 12, remaining_days_after: 10, reason: 'Viec gia dinh', details_json: json({ handover: 'emp-002' }), approver_note: 'Da phe duyet', status: 'APPROVED' },
        { leave_id: 'leave-002', ...stamp('2026-05-05'), leave_code: 'P-2026-002', employee_id: 'emp-005', employee_code: 'NV-2024-005', employee_name: 'Pham Duc Duy', department_id: 'dept-engineering', department_name: 'Phong Ky thuat', approver_id: 'emp-004', approver_name: 'Le Hoang Nam', related_person_id: null, related_person_name: null, start_date: date('2026-05-12'), end_date: date('2026-05-12'), total_days: 1, leave_type: 'SICK', leave_year: 2026, entitled_days: 12, used_days_before: 0, remaining_days_before: 12, remaining_days_after: 11, reason: 'Kham benh', details_json: json({ certificate: true }), approver_note: null, status: 'PENDING' },
        { leave_id: 'leave-003', ...stamp('2026-06-01'), leave_code: 'P-2026-003', employee_id: 'emp-006', employee_code: 'NV-2024-006', employee_name: 'Vu Khanh Linh', department_id: 'dept-platform', department_name: 'Phong Ha tang', approver_id: 'emp-004', approver_name: 'Le Hoang Nam', related_person_id: null, related_person_name: null, start_date: date('2026-06-10'), end_date: date('2026-06-12'), total_days: 3, leave_type: 'ANNUAL', leave_year: 2026, entitled_days: 12, used_days_before: 1, remaining_days_before: 11, remaining_days_after: 8, reason: 'Nghi phep ca nhan', details_json: json({ handover: 'emp-005' }), approver_note: 'Khong duoc duyet do ke hoach du an', status: 'REJECTED' }
    ]);
    add('LeaveApplication', Array.from({ length: 17 }, (_, index) => {
        const activeEmployees = tables.Employee.filter((employee) => employee.is_active === 1);
        const employee = activeEmployees[index % activeEmployees.length];
        const number = String(index + 4).padStart(3, '0');
        const leaveType = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY'][index % 4];
        const start = date(`2026-0${(index % 8) + 1}-${String((index % 20) + 1).padStart(2, '0')}`);
        const totalDays = index % 3 === 0 ? 2 : 1;
        const before = 12;
        return {
            leave_id: `leave-extra-${number}`, ...stamp(`2026-0${(index % 8) + 1}-${String((index % 20) + 1).padStart(2, '0')}`), leave_code: `P-2026-${number}`,
            employee_id: employee.employee_id, employee_code: employee.employee_code, employee_name: employee.full_name, department_id: employee.department_id,
            department_name: 'Phong ban BRAVO', approver_id: 'emp-004', approver_name: 'Le Hoang Nam', related_person_id: null, related_person_name: null,
            start_date: start, end_date: start + (totalDays - 1) * 86400000, total_days: totalDays, leave_type: leaveType, leave_year: 2026,
            entitled_days: 12, used_days_before: 0, remaining_days_before: before, remaining_days_after: before - totalDays, reason: 'Nghi phep theo ke hoach',
            details_json: json({ handover: 'Da phan cong nguoi thay the' }), approver_note: null, status: ['APPROVED', 'PENDING', 'REJECTED'][index % 3]
        };
    }));
    add('EmployeeLeaveBalance', tables.Employee.filter((employee) => employee.is_active === 1).map((employee) => {
        const used = tables.LeaveApplication
            .filter((leave) => leave.employee_id === employee.employee_id && leave.leave_year === 2026 && leave.leave_type === 'ANNUAL' && leave.status === 'APPROVED')
            .reduce((sum, leave) => sum + Number(leave.total_days || 0), 0);
        const entitled = employee.join_date > date('2026-01-01') ? 4 : 12;
        return {
            leave_balance_id: `balance-${employee.employee_id}-2026`, employee_id: employee.employee_id, leave_year: 2026, entitled_days: entitled,
            carried_forward_days: 0, used_days: used, remaining_days: Math.max(0, entitled - used), calculation_note: 'So du phep nam tinh den 2026-09-12',
            last_calculated_date: date('2026-09-12'), ...stamp('2026-01-05')
        };
    }));

    add('TransferProposal', [
        { proposal_id: 'transfer-proposal-001', ...stamp('2026-06-10'), proposal_code: 'TTP-2026-001', employee_id: 'emp-005', proposal_date: date('2026-06-10'), current_department_id: 'dept-engineering', target_department_id: 'dept-platform', current_position_id: 'pos-eng-specialist', target_position_id: 'pos-platform-specialist', proposed_effective_date: date('2026-07-01'), decision_type: 'INTERNAL_TRANSFER', proposer_id: 'emp-004', proposer_name: 'Le Hoang Nam', proposer_position: 'Truong phong Ky thuat', proposer_department: 'Phong Ky thuat', detail_items: json([{ field: 'department', from: 'ENG', to: 'PLAT' }]), description: 'Dieu chuyen sang doi Ha tang', reason: 'Phu hop nang luc cloud', note: null, status: 'APPROVED' },
        { proposal_id: 'transfer-proposal-002', ...stamp('2026-08-15'), proposal_code: 'TTP-2026-002', employee_id: 'emp-003', proposal_date: date('2026-08-15'), current_department_id: 'dept-people', target_department_id: 'dept-engineering', current_position_id: 'pos-hr-specialist', target_position_id: 'pos-eng-specialist', proposed_effective_date: date('2026-10-01'), decision_type: 'INTERNAL_TRANSFER', proposer_id: 'emp-002', proposer_name: 'Tran Thu Ha', proposer_position: 'Truong phong Nhan su', proposer_department: 'Phong Nhan su', detail_items: json([]), description: 'De xuat chuyen doi nghe nghiep', reason: 'Nhu cau ca nhan', note: 'Cho xem xet', status: 'PENDING' }
    ]);
    const transferContexts = [
        ['emp-extra-013', 'dept-pmk', 'pos-extra-05', 'dept-kd', 'pos-extra-06'],
        ['emp-extra-014', 'dept-kd', 'pos-extra-06', 'dept-gptv', 'pos-extra-07'],
        ['emp-extra-015', 'dept-gptv', 'pos-extra-07', 'dept-kttk-1', 'pos-extra-08'],
        ['emp-extra-016', 'dept-kttk-1', 'pos-extra-08', 'dept-kttk-2', 'pos-extra-09']
    ];
    add('TransferProposal', transferContexts.map(([employee, currentDepartment, currentPosition, targetDepartment, targetPosition], index) => {
        const number = String(index + 3).padStart(3, '0');
        return {
            proposal_id: `transfer-proposal-extra-${number}`, ...stamp(`2026-0${index + 3}-10`), proposal_code: `TTP-2026-${number}`, employee_id: employee,
            proposal_date: date(`2026-0${index + 3}-10`), current_department_id: currentDepartment, target_department_id: targetDepartment, current_position_id: currentPosition,
            target_position_id: targetPosition, proposed_effective_date: date(index % 2 ? '2026-09-20' : '2026-08-20'), decision_type: 'INTERNAL_TRANSFER',
            proposer_id: 'emp-002', proposer_name: 'Tran Thu Ha', proposer_position: 'Truong phong Nhan su', proposer_department: 'Phong Nhan su',
            detail_items: json([{ employee_id: employee }]), description: 'Dieu chuyen noi bo theo ke hoach', reason: 'Can doi nhan su', note: null,
            status: ['APPROVED', 'PENDING', 'REJECTED', 'APPROVED'][index]
        };
    }));
    add('TransferProposalDetail', [
        { detail_id: 'transfer-proposal-detail-001', proposal_id: 'transfer-proposal-001', employee_id: 'emp-005', current_department_id: 'dept-engineering', current_position_id: 'pos-eng-specialist', target_department_id: 'dept-platform', target_position_id: 'pos-platform-specialist', manager_id: 'emp-004', note: 'Nhan su chuyen mot nguoi', created_date: date('2026-06-10') }
    ]);
    add('TransferProposalDetail', [
        { detail_id: 'transfer-proposal-detail-002', proposal_id: 'transfer-proposal-002', employee_id: 'emp-003', current_department_id: 'dept-people', current_position_id: 'pos-hr-specialist', target_department_id: 'dept-engineering', target_position_id: 'pos-eng-specialist', manager_id: 'emp-004', note: null, created_date: date('2026-08-15') },
        ...transferContexts.map(([employee, currentDepartment, currentPosition, targetDepartment, targetPosition], index) => ({
            detail_id: `transfer-proposal-detail-extra-${String(index + 3).padStart(3, '0')}`, proposal_id: `transfer-proposal-extra-${String(index + 3).padStart(3, '0')}`, employee_id: employee,
            current_department_id: currentDepartment, current_position_id: currentPosition, target_department_id: targetDepartment, target_position_id: targetPosition,
            manager_id: 'emp-004', note: 'Chi tiet dieu chuyen', created_date: date(`2026-0${index + 3}-10`)
        }))
    ]);
    add('TransferDecision', [
        { decision_id: 'transfer-decision-001', ...stamp('2026-06-20'), decision_number: 'QDC-2026-001', proposal_id: 'transfer-proposal-001', employee_id: 'emp-005', current_department_id: 'dept-engineering', current_position_id: 'pos-eng-specialist', target_department_id: 'dept-platform', target_position_id: 'pos-platform-specialist', manager_id: 'emp-004', decision_date: date('2026-06-20'), effective_date: date('2026-07-01'), decision_type: 'INTERNAL_TRANSFER', creator_id: 'emp-002', creator_name: 'Tran Thu Ha', creator_position: 'Truong phong Nhan su', creator_department: 'Phong Nhan su', signed_by: 'Bui Xuan Thuc', description: 'Quyet dinh dieu chuyen noi bo', reason: 'Bo sung nhan su Ha tang', note: null, detail_items: json([{ employee_id: 'emp-005' }]), status: 'EXECUTED' }
    ]);
    add('TransferDecision', [
        { decision_id: 'transfer-decision-002', ...stamp('2026-08-20'), decision_number: 'QDC-2026-002', proposal_id: 'transfer-proposal-002', employee_id: 'emp-003', current_department_id: 'dept-people', current_position_id: 'pos-hr-specialist', target_department_id: 'dept-engineering', target_position_id: 'pos-eng-specialist', manager_id: 'emp-004', decision_date: date('2026-08-20'), effective_date: null, decision_type: 'INTERNAL_TRANSFER', creator_id: 'emp-002', creator_name: 'Tran Thu Ha', creator_position: 'Truong phong Nhan su', creator_department: 'Phong Nhan su', signed_by: null, description: 'Tam dung de xuat', reason: 'Chua co nhu cau', note: null, detail_items: json([]), status: 'CANCELLED' },
        ...transferContexts.map(([employee, currentDepartment, currentPosition, targetDepartment, targetPosition], index) => {
            const number = String(index + 3).padStart(3, '0');
            return {
                decision_id: `transfer-decision-extra-${number}`, ...stamp(`2026-0${index + 4}-15`), decision_number: `QDC-2026-${number}`, proposal_id: `transfer-proposal-extra-${number}`,
                employee_id: employee, current_department_id: currentDepartment, current_position_id: currentPosition, target_department_id: targetDepartment, target_position_id: targetPosition,
                manager_id: 'emp-004', decision_date: date(`2026-0${index + 4}-15`), effective_date: date(`2026-0${index + 5}-01`), decision_type: 'INTERNAL_TRANSFER',
                creator_id: 'emp-002', creator_name: 'Tran Thu Ha', creator_position: 'Truong phong Nhan su', creator_department: 'Phong Nhan su', signed_by: 'Bui Xuan Thuc',
                description: 'Quyet dinh dieu chuyen bo sung', reason: 'Can doi nhan su', note: null, detail_items: json([{ employee_id: employee }]), status: 'EXECUTED'
            };
        })
    ]);
    add('TransferDecisionDetail', [
        { detail_id: 'transfer-decision-detail-001', decision_id: 'transfer-decision-001', employee_id: 'emp-005', current_department_id: 'dept-engineering', current_position_id: 'pos-eng-specialist', target_department_id: 'dept-platform', target_position_id: 'pos-platform-specialist', manager_id: 'emp-004', note: 'Da ban giao cong viec', created_date: date('2026-06-20') }
    ]);
    add('TransferDecisionDetail', [
        { detail_id: 'transfer-decision-detail-002', decision_id: 'transfer-decision-002', employee_id: 'emp-003', current_department_id: 'dept-people', current_position_id: 'pos-hr-specialist', target_department_id: 'dept-engineering', target_position_id: 'pos-eng-specialist', manager_id: 'emp-004', note: null, created_date: date('2026-08-20') },
        ...transferContexts.map(([employee, currentDepartment, currentPosition, targetDepartment, targetPosition], index) => ({
            detail_id: `transfer-decision-detail-extra-${String(index + 3).padStart(3, '0')}`, decision_id: `transfer-decision-extra-${String(index + 3).padStart(3, '0')}`, employee_id: employee,
            current_department_id: currentDepartment, current_position_id: currentPosition, target_department_id: targetDepartment, target_position_id: targetPosition, manager_id: 'emp-004',
            note: 'Da thong bao cho nhan su', created_date: date(`2026-0${index + 4}-15`)
        }))
    ]);
    add('ResignationApplication', [
        { application_id: 'resign-app-001', ...stamp('2026-06-01'), application_code: 'NVO-2026-001', employee_id: 'emp-007', desired_resign_date: date('2026-06-30'), reason: 'Ly do ca nhan', handover_notes: 'Ban giao tai lieu du an cho emp-005', status: 'APPROVED' },
        { application_id: 'resign-app-002', ...stamp('2026-08-20'), application_code: 'NVO-2026-002', employee_id: 'emp-006', desired_resign_date: date('2026-10-01'), reason: 'Thay doi cong viec', handover_notes: 'Chua lap ke hoach ban giao', status: 'PENDING' }
    ]);
    add('ResignationApplication', [
        { application_id: 'resign-app-003', ...stamp('2026-07-10'), application_code: 'NVO-2026-003', employee_id: 'emp-extra-017', desired_resign_date: date('2026-08-15'), reason: 'Ly do gia dinh', handover_notes: 'Da lap danh sach ban giao', status: 'APPROVED' },
        { application_id: 'resign-app-004', ...stamp('2026-08-01'), application_code: 'NVO-2026-004', employee_id: 'emp-extra-018', desired_resign_date: date('2026-09-01'), reason: 'Co hoi moi', handover_notes: 'Cho phe duyet', status: 'REJECTED' },
        { application_id: 'resign-app-005', ...stamp('2026-08-25'), application_code: 'NVO-2026-005', employee_id: 'emp-extra-019', desired_resign_date: date('2026-10-15'), reason: 'Ly do ca nhan', handover_notes: 'Du kien ban giao trong thang 9', status: 'PENDING' }
    ]);
    add('ResignationDecision', [
        { decision_id: 'resign-decision-001', ...stamp('2026-06-15'), decision_number: 'QDNV-2026-001', application_id: 'resign-app-001', employee_id: 'emp-007', official_resign_date: date('2026-06-30'), handover_status: 'COMPLETED', signed_by: 'Bui Xuan Thuc', reason: 'Ly do ca nhan', status: 'EXECUTED' }
    ]);
    add('ResignationDecision', [
        { decision_id: 'resign-decision-002', ...stamp('2026-08-25'), decision_number: 'QDNV-2026-002', application_id: 'resign-app-002', employee_id: 'emp-006', official_resign_date: null, handover_status: 'PENDING', signed_by: null, reason: 'Chua du dieu kien', status: 'CANCELLED' },
        { decision_id: 'resign-decision-003', ...stamp('2026-07-20'), decision_number: 'QDNV-2026-003', application_id: 'resign-app-003', employee_id: 'emp-extra-017', official_resign_date: date('2026-08-15'), handover_status: 'COMPLETED', signed_by: 'Bui Xuan Thuc', reason: 'Ly do gia dinh', status: 'EXECUTED' },
        { decision_id: 'resign-decision-004', ...stamp('2026-08-10'), decision_number: 'QDNV-2026-004', application_id: 'resign-app-004', employee_id: 'emp-extra-018', official_resign_date: null, handover_status: 'PENDING', signed_by: null, reason: 'Khong chap thuan', status: 'CANCELLED' },
        { decision_id: 'resign-decision-005', ...stamp('2026-08-28'), decision_number: 'QDNV-2026-005', application_id: 'resign-app-005', employee_id: 'emp-extra-019', official_resign_date: null, handover_status: 'PENDING', signed_by: null, reason: 'Dang cho phe duyet', status: 'CANCELLED' }
    ]);

    add('EvaluationCriteria', [
        { criteria_id: 'eval-criteria-quality', ...stamp('2026-01-10'), criteria_code: 'QUALITY', criteria_name: 'Chat luong cong viec', weight: 35, description: 'Do chinh xac va chat luong', status: 1 },
        { criteria_id: 'eval-criteria-delivery', ...stamp('2026-01-10'), criteria_code: 'DELIVERY', criteria_name: 'Tien do', weight: 25, description: 'Hoan thanh dung han', status: 1 },
        { criteria_id: 'eval-criteria-teamwork', ...stamp('2026-01-10'), criteria_code: 'TEAMWORK', criteria_name: 'Phối hop', weight: 20, description: 'Lam viec nhom', status: 1 },
        { criteria_id: 'eval-criteria-growth', ...stamp('2026-01-10'), criteria_code: 'GROWTH', criteria_name: 'Phat trien', weight: 20, description: 'Hoc hoi va cai tien', status: 1 }
    ]);
    add('EvaluationScale', [
        { scale_id: 'scale-quality-a', criteria_id: 'eval-criteria-quality', grade_name: 'Tot', min_score: 8, max_score: 10, description: 'Vuot ky vong' },
        { scale_id: 'scale-quality-b', criteria_id: 'eval-criteria-quality', grade_name: 'Dat', min_score: 5, max_score: 7.99, description: 'Dat yeu cau' },
        { scale_id: 'scale-delivery-a', criteria_id: 'eval-criteria-delivery', grade_name: 'Tot', min_score: 8, max_score: 10, description: 'Dung tien do' },
        { scale_id: 'scale-teamwork-a', criteria_id: 'eval-criteria-teamwork', grade_name: 'Tot', min_score: 8, max_score: 10, description: 'Phoi hop tot' },
        { scale_id: 'scale-growth-a', criteria_id: 'eval-criteria-growth', grade_name: 'Tot', min_score: 8, max_score: 10, description: 'Tien bo ro net' }
    ]);
    add('EvaluationScale', [
        { scale_id: 'scale-quality-c', criteria_id: 'eval-criteria-quality', grade_name: 'Chua dat', min_score: 0, max_score: 4.99, description: 'Can cai thien' },
        { scale_id: 'scale-quality-b-plus', criteria_id: 'eval-criteria-quality', grade_name: 'Kha', min_score: 5, max_score: 7.99, description: 'Dat yeu cau' },
        { scale_id: 'scale-delivery-b', criteria_id: 'eval-criteria-delivery', grade_name: 'Dat', min_score: 5, max_score: 7.99, description: 'Hoan thanh co ban' },
        { scale_id: 'scale-delivery-c', criteria_id: 'eval-criteria-delivery', grade_name: 'Chua dat', min_score: 0, max_score: 4.99, description: 'Cham tien do' },
        { scale_id: 'scale-teamwork-b', criteria_id: 'eval-criteria-teamwork', grade_name: 'Dat', min_score: 5, max_score: 7.99, description: 'Phoi hop co ban' },
        { scale_id: 'scale-teamwork-c', criteria_id: 'eval-criteria-teamwork', grade_name: 'Chua dat', min_score: 0, max_score: 4.99, description: 'Can cai thien' },
        { scale_id: 'scale-growth-b', criteria_id: 'eval-criteria-growth', grade_name: 'Dat', min_score: 5, max_score: 7.99, description: 'Co tien bo' },
        { scale_id: 'scale-growth-c', criteria_id: 'eval-criteria-growth', grade_name: 'Chua dat', min_score: 0, max_score: 4.99, description: 'Can ke hoach phat trien' },
        { scale_id: 'scale-delivery-a-plus', criteria_id: 'eval-criteria-delivery', grade_name: 'Kha', min_score: 8, max_score: 10, description: 'Vuot tien do' },
        { scale_id: 'scale-teamwork-a-plus', criteria_id: 'eval-criteria-teamwork', grade_name: 'Kha', min_score: 8, max_score: 10, description: 'Phoi hop chu dong' },
        { scale_id: 'scale-growth-a-plus', criteria_id: 'eval-criteria-growth', grade_name: 'Kha', min_score: 8, max_score: 10, description: 'Chu dong hoc hoi' }
    ]);
    add('EmployeeEvaluation', [
        { evaluation_id: 'employee-eval-001', ...stamp('2026-06-30'), evaluation_code: 'DG-2026-Q2-005', evaluation_date: date('2026-06-30'), year: 2026, evaluation_quarter: 2, evaluator_id: 'emp-004', employee_id: 'emp-005', department_id: 'dept-engineering', position_id: 'pos-eng-specialist', total_score: 8.6, grade_result: 'Tot', description: 'Danh gia quy 2', manager_comment: 'Hoan thanh tot nhiem vu', recommendation: 'Thuong theo quy', status: 'COMPLETED' },
        { evaluation_id: 'employee-eval-002', ...stamp('2026-06-30'), evaluation_code: 'DG-2026-Q2-006', evaluation_date: date('2026-06-30'), year: 2026, evaluation_quarter: 2, evaluator_id: 'emp-004', employee_id: 'emp-006', department_id: 'dept-platform', position_id: 'pos-platform-specialist', total_score: 7.4, grade_result: 'Dat', description: 'Danh gia quy 2', manager_comment: 'Can tang cuong tai lieu hoa', recommendation: 'Ke hoach dao tao', status: 'COMPLETED' },
        { evaluation_id: 'employee-eval-003', ...stamp('2026-06-30'), evaluation_code: 'DG-2026-Q2-007', evaluation_date: date('2026-06-30'), year: 2026, evaluation_quarter: 2, evaluator_id: 'emp-004', employee_id: 'emp-007', department_id: 'dept-engineering', position_id: 'pos-eng-specialist', total_score: 6.2, grade_result: 'Dat', description: 'Danh gia truoc khi nghi viec', manager_comment: 'Da hoan tat ban giao', recommendation: null, status: 'COMPLETED' }
    ]);
    add('EmployeeEvaluation', Array.from({ length: 17 }, (_, index) => {
        const employee = tables.Employee[8 + index];
        const number = String(index + 4).padStart(3, '0');
        const day = String((index % 8) + 1).padStart(2, '0');
        return {
            evaluation_id: `employee-eval-extra-${number}`, ...stamp(`2026-0${(index % 8) + 1}-${day}`), evaluation_code: `DG-2026-${number}`,
            evaluation_date: date(`2026-0${(index % 8) + 1}-${day}`), year: 2026, evaluation_quarter: (index % 3) + 1, evaluator_id: 'emp-004', employee_id: employee.employee_id,
            department_id: employee.department_id, position_id: employee.position_id, total_score: 6 + (index % 35) / 10, grade_result: index % 3 ? 'Dat' : 'Tot',
            description: 'Danh gia nhan su theo quy', manager_comment: 'Ket qua duoc ghi nhan trong ky', recommendation: index % 2 ? 'Tiep tuc dao tao' : 'Xem xet ghi nhan', status: 'COMPLETED'
        };
    }));
    add('EmployeeEvaluationDetail', [
        { detail_id: 'employee-eval-detail-001', evaluation_id: 'employee-eval-001', criteria_id: 'eval-criteria-quality', criteria_code: 'QUALITY', criteria_name: 'Chat luong cong viec', weight: 35, score: 9, note: 'It loi' },
        { detail_id: 'employee-eval-detail-002', evaluation_id: 'employee-eval-001', criteria_id: 'eval-criteria-delivery', criteria_code: 'DELIVERY', criteria_name: 'Tien do', weight: 25, score: 8, note: null },
        { detail_id: 'employee-eval-detail-003', evaluation_id: 'employee-eval-001', criteria_id: 'eval-criteria-teamwork', criteria_code: 'TEAMWORK', criteria_name: 'Phối hop', weight: 20, score: 8, note: null },
        { detail_id: 'employee-eval-detail-004', evaluation_id: 'employee-eval-001', criteria_id: 'eval-criteria-growth', criteria_code: 'GROWTH', criteria_name: 'Phat trien', weight: 20, score: 9, note: 'Chu dong hoc Azure' },
        { detail_id: 'employee-eval-detail-005', evaluation_id: 'employee-eval-002', criteria_id: 'eval-criteria-quality', criteria_code: 'QUALITY', criteria_name: 'Chat luong cong viec', weight: 35, score: 8, note: null },
        { detail_id: 'employee-eval-detail-006', evaluation_id: 'employee-eval-002', criteria_id: 'eval-criteria-delivery', criteria_code: 'DELIVERY', criteria_name: 'Tien do', weight: 25, score: 7, note: null }
    ]);
    add('EmployeeEvaluationDetail', [
        { detail_id: 'employee-eval-detail-007', evaluation_id: 'employee-eval-002', criteria_id: 'eval-criteria-teamwork', criteria_code: 'TEAMWORK', criteria_name: 'Phối hop', weight: 20, score: 7, note: null },
        { detail_id: 'employee-eval-detail-008', evaluation_id: 'employee-eval-002', criteria_id: 'eval-criteria-growth', criteria_code: 'GROWTH', criteria_name: 'Phat trien', weight: 20, score: 7, note: null },
        ...['QUALITY', 'DELIVERY', 'TEAMWORK', 'GROWTH'].map((code, index) => ({
            detail_id: `employee-eval-detail-00${9 + index}`, evaluation_id: 'employee-eval-003', criteria_id: `eval-criteria-${code.toLowerCase()}`,
            criteria_code: code, criteria_name: code === 'QUALITY' ? 'Chat luong cong viec' : code === 'DELIVERY' ? 'Tien do' : code === 'TEAMWORK' ? 'Phối hop' : 'Phat trien',
            weight: [35, 25, 20, 20][index], score: 6 + index / 2, note: null
        }))
    ]);
    add('EmployeeEvaluationDetail', Array.from({ length: 17 * 4 }, (_, offset) => {
        const evaluationIndex = Math.floor(offset / 4);
        const criteriaIndex = offset % 4;
        const evaluationNumber = String(evaluationIndex + 4).padStart(3, '0');
        const code = ['QUALITY', 'DELIVERY', 'TEAMWORK', 'GROWTH'][criteriaIndex];
        return {
            detail_id: `employee-eval-detail-extra-${String(offset + 1).padStart(3, '0')}`, evaluation_id: `employee-eval-extra-${evaluationNumber}`,
            criteria_id: `eval-criteria-${code.toLowerCase()}`, criteria_code: code, criteria_name: code === 'QUALITY' ? 'Chat luong cong viec' : code === 'DELIVERY' ? 'Tien do' : code === 'TEAMWORK' ? 'Phối hop' : 'Phat trien',
            weight: [35, 25, 20, 20][criteriaIndex], score: 6 + ((evaluationIndex + criteriaIndex) % 35) / 10, note: null
        };
    }));
    add('RewardDisciplineProposal', [
        { proposal_id: 'reward-proposal-001', ...stamp('2026-07-05'), proposal_code: 'RDP-2026-001', record_type: 'REWARD', employee_id: 'emp-005', proposed_amount: 5000000, payment_method: 'PAYROLL', proposal_date: date('2026-07-05'), reason: 'Hoan thanh vuot muc tieu', content: 'Thuong dot xuat cho dong gop san pham', proposed_by_employee_id: 'emp-004', proposed_by: 'Le Hoang Nam', attachment_url: null, status: 'APPROVED' },
        { proposal_id: 'discipline-proposal-001', ...stamp('2026-05-10'), proposal_code: 'RDP-2026-002', record_type: 'DISCIPLINE', employee_id: 'emp-006', proposed_amount: 1000000, payment_method: null, proposal_date: date('2026-05-10'), reason: 'Vi pham quy trinh truc', content: 'Nhac nho va khau tru theo quy dinh', proposed_by_employee_id: 'emp-004', proposed_by: 'Le Hoang Nam', attachment_url: null, status: 'APPROVED' },
        { proposal_id: 'reward-proposal-002', ...stamp('2026-09-01'), proposal_code: 'RDP-2026-003', record_type: 'REWARD', employee_id: 'emp-008', proposed_amount: 2000000, payment_method: 'PAYROLL', proposal_date: date('2026-09-01'), reason: 'Ho tro on-call', content: 'De xuat thuong sau khi ket thuc thu viec', proposed_by_employee_id: 'emp-002', proposed_by: 'Tran Thu Ha', attachment_url: null, status: 'PENDING' }
    ]);
    add('RewardDisciplineProposal', Array.from({ length: 8 }, (_, index) => {
        const number = String(index + 4).padStart(3, '0');
        const discipline = index % 3 === 1;
        return {
            proposal_id: `reward-proposal-extra-${number}`, ...stamp(`2026-0${(index % 8) + 2}-12`), proposal_code: `RDP-2026-${number}`, record_type: discipline ? 'DISCIPLINE' : 'REWARD',
            employee_id: tables.Employee[16 + index].employee_id, proposed_amount: discipline ? 500000 + index * 100000 : 1500000 + index * 250000, payment_method: discipline ? null : 'PAYROLL',
            proposal_date: date(`2026-0${(index % 8) + 2}-12`), reason: discipline ? 'Vi pham quy trinh noi bo' : 'Hoan thanh muc tieu cong viec',
            content: discipline ? 'De xuat xu ly theo quy dinh' : 'De xuat ghi nhan dong gop', proposed_by_employee_id: 'emp-002', proposed_by: 'Tran Thu Ha', attachment_url: null, status: 'APPROVED'
        };
    }));
    add('RewardDiscipline', [
        { reward_discipline_id: 'reward-discipline-001', ...stamp('2026-07-10'), employee_id: 'emp-005', decision_no: 'KTKL-2026-001', decision_type: 'REWARD', decision_date: date('2026-07-10'), effective_date: date('2026-07-31'), reason: 'Dong gop noi bat', content: 'Thuong dot xuat', decision_by: 'Bui Xuan Thuc', proposal_id: 'reward-proposal-001', amount: 5000000, status: 'COMPLETED', attachment_url: null },
        { reward_discipline_id: 'reward-discipline-002', ...stamp('2026-05-20'), employee_id: 'emp-006', decision_no: 'KTKL-2026-002', decision_type: 'DISCIPLINE', decision_date: date('2026-05-20'), effective_date: date('2026-05-25'), reason: 'Vi pham quy trinh truc', content: 'Khau tru theo quy dinh', decision_by: 'Bui Xuan Thuc', proposal_id: 'discipline-proposal-001', amount: 1000000, status: 'COMPLETED', attachment_url: null }
    ]);
    add('RewardDiscipline', Array.from({ length: 8 }, (_, index) => {
        const number = String(index + 3).padStart(3, '0');
        const discipline = index % 3 === 1;
        return {
            reward_discipline_id: `reward-discipline-extra-${number}`, ...stamp(`2026-0${(index % 7) + 3}-10`), employee_id: tables.Employee[16 + index].employee_id,
            decision_no: `KTKL-2026-${number}`, decision_type: discipline ? 'DISCIPLINE' : 'REWARD', decision_date: date(`2026-0${(index % 7) + 3}-10`),
            effective_date: date(`2026-0${(index % 7) + 3}-12`), reason: discipline ? 'Vi pham quy trinh noi bo' : 'Dong gop hieu qua', content: discipline ? 'Khau tru theo quy dinh' : 'Thuong theo ket qua',
            decision_by: 'Bui Xuan Thuc', proposal_id: `reward-proposal-extra-${number === '003' ? '004' : String(index + 4).padStart(3, '0')}`, amount: discipline ? 500000 + index * 100000 : 1500000 + index * 250000,
            status: 'COMPLETED', attachment_url: null
        };
    }));

    add('ApprovalHistory', [
        { approval_id: 'approval-req-001', document_type: 'RECRUITMENT_REQUEST', document_id: 'req-eng-001', level_order: 1, required_role: 'Trưởng Phòng', department_scope: 'dept-engineering', approver_employee_id: 'emp-004', approver_name: 'Le Hoang Nam', status: 'APPROVED', comment: 'Dong y nhu cau', submitted_date: date('2026-02-02'), decided_date: date('2026-02-03'), created_date: date('2026-02-01') },
        { approval_id: 'approval-req-002', document_type: 'RECRUITMENT_REQUEST', document_id: 'req-eng-001', level_order: 2, required_role: 'Ban Giám Đốc', department_scope: null, approver_employee_id: 'emp-001', approver_name: 'Bui Xuan Thuc', status: 'APPROVED', comment: 'Duyet ngan sach', submitted_date: date('2026-02-04'), decided_date: date('2026-02-05'), created_date: date('2026-02-01') },
        { approval_id: 'approval-leave-001', document_type: 'LEAVE_APPLICATION', document_id: 'leave-002', level_order: 1, required_role: 'Trưởng Phòng', department_scope: 'dept-engineering', approver_employee_id: null, approver_name: null, status: 'PENDING', comment: null, submitted_date: date('2026-05-05'), decided_date: null, created_date: date('2026-05-05') },
        { approval_id: 'approval-transfer-001', document_type: 'TRANSFER_PROPOSAL', document_id: 'transfer-proposal-001', level_order: 1, required_role: 'Trưởng Phòng', department_scope: 'dept-engineering', approver_employee_id: 'emp-004', approver_name: 'Le Hoang Nam', status: 'APPROVED', comment: 'Ho so day du', submitted_date: date('2026-06-11'), decided_date: date('2026-06-15'), created_date: date('2026-06-10') }
    ]);
    add('AuditLog', [
        { audit_id: 'audit-001', user_id: 'user-hr', username: 'hr.ha', action: 'CREATE', entity_type: 'RecruitmentRequest', entity_id: 'req-platform-001', entity_name: 'RR-PLAT-001', details: json({ status: 'PENDING' }), created_date: date('2026-07-20') },
        { audit_id: 'audit-002', user_id: 'user-manager', username: 'eng.nam', action: 'APPROVE', entity_type: 'TransferProposal', entity_id: 'transfer-proposal-001', entity_name: 'TTP-2026-001', details: json({ target: 'dept-platform' }), created_date: date('2026-06-15') },
        { audit_id: 'audit-003', user_id: 'user-admin', username: 'admin', action: 'CONVERT', entity_type: 'Candidate', entity_id: 'cand-hired', entity_name: 'UV-007', details: json({ employee_id: 'emp-008' }), created_date: date('2026-08-15') }
    ]);
    add('AuditLog', Array.from({ length: 5 }, (_, index) => ({
        audit_id: `audit-extra-${String(index + 4).padStart(3, '0')}`, user_id: index % 2 ? 'user-hr' : 'user-admin', username: index % 2 ? 'hr.ha' : 'admin',
        action: ['UPDATE', 'APPROVE', 'CREATE', 'UPDATE', 'APPROVE'][index], entity_type: ['Employee', 'LeaveApplication', 'Offer', 'EmployeeEvaluation', 'RecruitmentDecision'][index],
        entity_id: ['emp-extra-013', 'leave-002', 'offer-004', 'employee-eval-001', 'recruitment-decision-003'][index], entity_name: 'Audit nghiep vu v2', details: json({ source: 'dataset-v2' }),
        created_date: date(`2026-0${index + 2}-15`)
    })));

    const employeeReferenceFields = [
        ['employee_id', 'employee_name'], ['signer_id', 'signer_name'], ['approver_id', 'approver_name'],
        ['requested_by', 'requested_by_name'], ['interviewer_id', 'interviewer_name'], ['evaluator_id', 'evaluator_name'],
        ['decision_by_id', 'decision_by_name'], ['proposer_id', 'proposer_name'], ['creator_id', 'creator_name'],
        ['proposed_by_employee_id', 'proposed_by'], ['approver_employee_id', 'approver_name'], ['manager_id', 'manager_name']
    ];
    for (const rows of Object.values(tables)) {
        for (const row of rows) {
            for (const [idField, nameField] of employeeReferenceFields) {
                if (Object.prototype.hasOwnProperty.call(row, nameField) && row[idField]) {
                    row[nameField] = employeeName(row[idField]) || row[nameField];
                }
            }
            if (row.employee_id && Object.prototype.hasOwnProperty.call(row, 'employee_position')) {
                row.employee_position = employeePositionName(row.employee_id) || row.employee_position;
            }
            if (row.proposer_id && Object.prototype.hasOwnProperty.call(row, 'proposer_position')) {
                row.proposer_position = employeePositionName(row.proposer_id) || row.proposer_position;
            }
            if (row.proposer_id && Object.prototype.hasOwnProperty.call(row, 'proposer_department')) {
                row.proposer_department = employeeDepartmentName(row.proposer_id) || row.proposer_department;
            }
            if (row.creator_id && Object.prototype.hasOwnProperty.call(row, 'creator_position')) {
                row.creator_position = employeePositionName(row.creator_id) || row.creator_position;
            }
            if (row.creator_id && Object.prototype.hasOwnProperty.call(row, 'creator_department')) {
                row.creator_department = employeeDepartmentName(row.creator_id) || row.creator_department;
            }
            if (row.employee_id && Object.prototype.hasOwnProperty.call(row, 'employee_code')) {
                row.employee_code = employeeById.get(row.employee_id)?.employee_code || row.employee_code;
            }
            if (row.employee_id && Object.prototype.hasOwnProperty.call(row, 'department_name')) {
                row.department_name = employeeDepartmentName(row.employee_id) || row.department_name;
            }
            if (row.decision_by && (row.reward_discipline_id || row.reward_discipline_id === '')) row.decision_by = employeeName('emp-001') || row.decision_by;
            if (row.signed_by) row.signed_by = employeeName('emp-001') || row.signed_by;
        }
    }

    return { version: 'v2', asOf: AS_OF, maxDate: MAX_DATE, tables };
}

module.exports = {
    AS_OF,
    MAX_DATE,
    ROLE_NAMES,
    CANDIDATE_STATUS_VALUES,
    TABLES,
    PRIMARY_KEYS,
    FOREIGN_KEYS,
    UNIQUE_KEYS,
    STATUS_RULES,
    INSERT_ORDER,
    CLEAR_ORDER,
    CLEAR_PRELUDE,
    buildDatasetV2
};
