const { exec, query, queryOne, run } = require('./connection');

const identifier = (name) => `[${name.replace(/]/g, ']]')}]`;

const tableDefinitions = {
    SchemaMigration: `
        [migration_key] NVARCHAR(100) NOT NULL,
        [applied_date] BIGINT NOT NULL`,
    Role: `
        [role_id] NVARCHAR(36) NOT NULL,
        [role_name] NVARCHAR(50) NOT NULL,
        [description] NVARCHAR(255),
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [status] INT NOT NULL DEFAULT 1`,
    User: `
        [user_id] NVARCHAR(36) NOT NULL,
        [username] NVARCHAR(50) NOT NULL,
        [password_hash] NVARCHAR(255) NOT NULL,
        [full_name] NVARCHAR(100) NOT NULL,
        [email] NVARCHAR(100) NOT NULL,
        [phone] NVARCHAR(20),
        [role_id] NVARCHAR(36) NOT NULL,
        [department_id] NVARCHAR(36),
        [employee_id] NVARCHAR(36),
        [avatar_url] NVARCHAR(255),
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [status] INT NOT NULL DEFAULT 1`,
    Department: `
        [department_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [department_code] NVARCHAR(20) NOT NULL,
        [department_name] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(255),
        [manager_id] NVARCHAR(36),
        [parent_department_id] NVARCHAR(36),
        [target_headcount] INT NOT NULL DEFAULT 0,
        [status] INT NOT NULL DEFAULT 1`,
    Position: `
        [position_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [position_code] NVARCHAR(20) NOT NULL,
        [position_name] NVARCHAR(100) NOT NULL,
        [department_id] NVARCHAR(36),
        [description] NVARCHAR(255),
        [target_headcount] INT NOT NULL DEFAULT 0,
        [is_assistant] INT NOT NULL DEFAULT 0,
        [salary_grade] NVARCHAR(50),
        [status] INT NOT NULL DEFAULT 1`,
    Employee: `
        [employee_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [employee_code] NVARCHAR(20) NOT NULL,
        [short_name] NVARCHAR(100),
        [full_name] NVARCHAR(100) NOT NULL,
        [gender] NVARCHAR(10),
        [date_of_birth] BIGINT,
        [place_of_birth] NVARCHAR(255),
        [is_foreign] INT NOT NULL DEFAULT 0,
        [hometown] NVARCHAR(255),
        [nationality] NVARCHAR(100),
        [ethnicity] NVARCHAR(100),
        [religion] NVARCHAR(100),
        [marital_status] NVARCHAR(50),
        [citizen_id] NVARCHAR(20),
        [citizen_issue_date] BIGINT,
        [citizen_issue_place] NVARCHAR(100),
        [phone] NVARCHAR(20),
        [email] NVARCHAR(100),
        [personal_email] NVARCHAR(100),
        [company_email] NVARCHAR(100),
        [address] NVARCHAR(255),
        [permanent_address] NVARCHAR(255),
        [department_id] NVARCHAR(36),
        [position_id] NVARCHAR(36),
        [manager_id] NVARCHAR(36),
        [level] NVARCHAR(50) NOT NULL DEFAULT N'Nhân viên',
        [join_date] BIGINT,
        [official_date] BIGINT,
        [resignation_date] BIGINT,
        [employment_status] NVARCHAR(30) NOT NULL DEFAULT 'WORKING',
        [avatar_url] NVARCHAR(255),
        [note] NVARCHAR(255),
        [is_active] INT NOT NULL DEFAULT 1`,
    EmployeeContract: `
        [contract_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [contract_no] NVARCHAR(50) NOT NULL,
        [contract_date] BIGINT,
        [signer_id] NVARCHAR(36),
        [signer_name] NVARCHAR(100),
        [signer_position] NVARCHAR(100),
        [employee_id] NVARCHAR(36) NOT NULL,
        [employee_position] NVARCHAR(100),
        [contract_type] NVARCHAR(100) NOT NULL,
        [sign_date] BIGINT,
        [start_date] BIGINT,
        [end_date] BIGINT,
        [probation_from_date] BIGINT,
        [probation_to_date] BIGINT,
        [job_description] NVARCHAR(MAX),
        [salary_scale] NVARCHAR(100),
        [salary_grade] NVARCHAR(50),
        [allowance_details] NVARCHAR(MAX),
        [base_salary] DECIMAL(18, 2),
        [social_insurance_salary] DECIMAL(18, 2),
        [salary] DECIMAL(18, 2) NOT NULL,
        [status] NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        [attachment_url] NVARCHAR(255),
        [note] NVARCHAR(255)`,
    WorkHistory: `
        [work_history_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [department_id] NVARCHAR(36),
        [position_id] NVARCHAR(36),
        [decision_type] NVARCHAR(50) NOT NULL,
        [effective_date] BIGINT,
        [reason] NVARCHAR(255),
        [note] NVARCHAR(255)`,
    RewardDiscipline: `
        [reward_discipline_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [decision_no] NVARCHAR(50) NOT NULL,
        [decision_type] NVARCHAR(20) NOT NULL,
        [decision_date] BIGINT,
        [effective_date] BIGINT,
        [reason] NVARCHAR(255),
        [content] NVARCHAR(500),
        [decision_by] NVARCHAR(100),
        [attachment_url] NVARCHAR(255)`,
    RecruitmentRequest: `
        [recruitment_request_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [request_code] NVARCHAR(30) NOT NULL,
        [department_id] NVARCHAR(36) NOT NULL,
        [position_id] NVARCHAR(36) NOT NULL,
        [requested_by] NVARCHAR(36),
        [quantity] INT NOT NULL,
        [reason] NVARCHAR(255),
        [expected_date] BIGINT,
        [priority] NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        [status] NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        [is_outside_headcount] INT NOT NULL DEFAULT 0,
        [note] NVARCHAR(255)`,
    RecruitmentPlan: `
        [recruitment_plan_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [recruitment_request_id] NVARCHAR(36) NOT NULL,
        [plan_name] NVARCHAR(100) NOT NULL,
        [start_date] BIGINT,
        [end_date] BIGINT,
        [budget] DECIMAL(18, 2) NOT NULL DEFAULT 0,
        [status] NVARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
        [note] NVARCHAR(255)`,
    RecruitmentRound: `
        [recruitment_round_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [recruitment_plan_id] NVARCHAR(36) NOT NULL,
        [round_name] NVARCHAR(100) NOT NULL,
        [round_order] INT NOT NULL DEFAULT 1,
        [description] NVARCHAR(255),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE'`,
    Candidate: `
        [candidate_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [candidate_code] NVARCHAR(20) NOT NULL,
        [full_name] NVARCHAR(100) NOT NULL,
        [gender] NVARCHAR(10),
        [date_of_birth] BIGINT,
        [citizen_id] NVARCHAR(20),
        [phone] NVARCHAR(20),
        [email] NVARCHAR(100),
        [address] NVARCHAR(255),
        [culture_level] NVARCHAR(50) NOT NULL DEFAULT '12/12',
        [education_level] NVARCHAR(100),
        [education_school] NVARCHAR(150),
        [major] NVARCHAR(100),
        [skill_level] NVARCHAR(50),
        [experience] NVARCHAR(255),
        [recruitment_plan_id] NVARCHAR(36) NOT NULL,
        [position_id] NVARCHAR(36),
        [source] NVARCHAR(100),
        [recruitment_unit] NVARCHAR(100),
        [referrer] NVARCHAR(100),
        [cv_url] NVARCHAR(255),
        [received_date] BIGINT,
        [eval_date] BIGINT,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
        [rejection_reason] NVARCHAR(255),
        [note] NVARCHAR(255),
        [attachments_json] NVARCHAR(MAX)`,
    DepartmentQuota: `
        [quota_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [quota_code] NVARCHAR(50) NOT NULL,
        [effective_date] BIGINT NOT NULL,
        [department_id] NVARCHAR(36) NOT NULL,
        [creator_id] NVARCHAR(36),
        [creator_name] NVARCHAR(100),
        [target_headcount] INT NOT NULL DEFAULT 0,
        [max_capacity] INT NOT NULL DEFAULT 0,
        [current_headcount] INT NOT NULL DEFAULT 0,
        [budget] DECIMAL(18, 2) NOT NULL DEFAULT 0,
        [budget_details] NVARCHAR(MAX),
        [description] NVARCHAR(500),
        [status] NVARCHAR(30) NOT NULL DEFAULT N'Tạo phiếu'`,
    DepartmentQuotaDetail: `
        [detail_id] NVARCHAR(36) NOT NULL,
        [quota_id] NVARCHAR(36) NOT NULL,
        [position_id] NVARCHAR(36),
        [position_code] NVARCHAR(50),
        [position_name] NVARCHAR(100),
        [target_headcount] INT NOT NULL DEFAULT 0,
        [resignation_count] INT NOT NULL DEFAULT 0,
        [maternity_count] INT NOT NULL DEFAULT 0,
        [current_headcount] INT NOT NULL DEFAULT 0,
        [needed_headcount] INT NOT NULL DEFAULT 0,
        [note] NVARCHAR(255)`,
    Interview: `
        [interview_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [candidate_id] NVARCHAR(36) NOT NULL,
        [recruitment_round_id] NVARCHAR(36) NOT NULL,
        [interviewer_id] NVARCHAR(36),
        [interview_date] BIGINT,
        [score] DECIMAL(10, 2),
        [result] NVARCHAR(30),
        [comment] NVARCHAR(500)`,
    InterviewSchedule: `
        [schedule_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [schedule_code] NVARCHAR(50) NOT NULL,
        [round_type] NVARCHAR(50) NOT NULL,
        [format_type] NVARCHAR(50) NOT NULL,
        [location] NVARCHAR(255),
        [start_time] BIGINT,
        [end_time] BIGINT,
        [note] NVARCHAR(MAX),
        [candidate_note] NVARCHAR(MAX),
        [candidates_json] NVARCHAR(MAX),
        [council_json] NVARCHAR(MAX),
        [tests_json] NVARCHAR(MAX),
        [status] NVARCHAR(30) NOT NULL DEFAULT N'Đã lên lịch'`,
    LeaveApplication: `
        [leave_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [leave_code] NVARCHAR(50) NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [employee_code] NVARCHAR(50),
        [employee_name] NVARCHAR(100),
        [department_id] NVARCHAR(36),
        [department_name] NVARCHAR(100),
        [approver_id] NVARCHAR(36),
        [approver_name] NVARCHAR(100),
        [related_person_id] NVARCHAR(36),
        [related_person_name] NVARCHAR(100),
        [start_date] BIGINT NOT NULL,
        [end_date] BIGINT NOT NULL,
        [total_days] DECIMAL(10, 2) NOT NULL DEFAULT 1.0,
        [reason] NVARCHAR(500),
        [details_json] NVARCHAR(MAX),
        [approver_note] NVARCHAR(255),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'PENDING'`,
    AuditLog: `
        [audit_id] NVARCHAR(36) NOT NULL,
        [user_id] NVARCHAR(36),
        [username] NVARCHAR(100),
        [action] NVARCHAR(50) NOT NULL,
        [entity_type] NVARCHAR(50) NOT NULL,
        [entity_id] NVARCHAR(36),
        [entity_name] NVARCHAR(255),
        [details] NVARCHAR(MAX),
        [created_date] BIGINT NOT NULL`,
    InterviewEvaluation: `
        [interview_eval_id] NVARCHAR(36) NOT NULL,
        [eval_code] NVARCHAR(50),
        [evaluation_date] BIGINT,
        [schedule_id] NVARCHAR(36),
        [candidate_id] NVARCHAR(36) NOT NULL,
        [duration_minutes] INT,
        [level_score] INT NOT NULL DEFAULT 5,
        [overall_result] NVARCHAR(20),
        [overall_comment] NVARCHAR(1000),
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL`,
    InterviewEvaluationScript: `
        [script_id] NVARCHAR(36) NOT NULL,
        [interview_eval_id] NVARCHAR(36) NOT NULL,
        [row_order] INT NOT NULL DEFAULT 1,
        [question] NVARCHAR(500),
        [expectation] NVARCHAR(500),
        [answer] NVARCHAR(1000)`,
    InterviewEvaluationCriteria: `
        [criteria_detail_id] NVARCHAR(36) NOT NULL,
        [interview_eval_id] NVARCHAR(36) NOT NULL,
        [row_order] INT NOT NULL DEFAULT 1,
        [criteria_type] NVARCHAR(100),
        [required_from] NVARCHAR(255),
        [required_description] NVARCHAR(500),
        [candidate_value] NVARCHAR(255),
        [candidate_description] NVARCHAR(500),
        [is_passed] INT NOT NULL DEFAULT 0,
        [note] NVARCHAR(500)`,
    PreScreening: `
        [pre_screening_id] NVARCHAR(36) NOT NULL,
        [screening_code] NVARCHAR(50),
        [candidate_id] NVARCHAR(36) NOT NULL,
        [received_date] BIGINT,
        [culture_level] NVARCHAR(50),
        [education_level] NVARCHAR(100),
        [education_school] NVARCHAR(150),
        [position_id] NVARCHAR(36),
        [department_id] NVARCHAR(36),
        [screening_date] BIGINT,
        [level_score] INT NOT NULL DEFAULT 5,
        [screening_result] NVARCHAR(20),
        [comment] NVARCHAR(1000),
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL`,
    PreScreeningCriteria: `
        [criteria_detail_id] NVARCHAR(36) NOT NULL,
        [pre_screening_id] NVARCHAR(36) NOT NULL,
        [row_order] INT NOT NULL DEFAULT 1,
        [criteria_type] NVARCHAR(100),
        [required_from] NVARCHAR(255),
        [required_description] NVARCHAR(500),
        [candidate_value] NVARCHAR(255),
        [candidate_description] NVARCHAR(500),
        [is_passed] INT NOT NULL DEFAULT 0,
        [note] NVARCHAR(500)`,
    ApprovalHistory: `
        [approval_id] NVARCHAR(36) NOT NULL,
        [document_type] NVARCHAR(50) NOT NULL,
        [document_id] NVARCHAR(36) NOT NULL,
        [level_order] INT NOT NULL,
        [required_role] NVARCHAR(50) NOT NULL,
        [department_scope] NVARCHAR(36),
        [approver_employee_id] NVARCHAR(36),
        [approver_name] NVARCHAR(100),
        [status] NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        [comment] NVARCHAR(500),
        [submitted_date] BIGINT,
        [decided_date] BIGINT,
        [created_date] BIGINT NOT NULL`,
    Offer: `
        [offer_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [candidate_id] NVARCHAR(36) NOT NULL,
        [offer_date] BIGINT,
        [expected_start_date] BIGINT,
        [probation_salary] DECIMAL(18, 2) NOT NULL DEFAULT 0,
        [official_salary] DECIMAL(18, 2) NOT NULL DEFAULT 0,
        [salary_offer] DECIMAL(18, 2) NOT NULL DEFAULT 0,
        [offer_status] NVARCHAR(30) NOT NULL DEFAULT 'SENT',
        [note] NVARCHAR(255)`,
    ContractProposal: `
        [proposal_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [proposal_code] NVARCHAR(30) NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [contract_type] NVARCHAR(50) NOT NULL,
        [proposed_salary] DECIMAL(18, 2) NOT NULL DEFAULT 0,
        [proposed_start_date] BIGINT,
        [reason] NVARCHAR(255),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'PENDING'`,
    ContractExtension: `
        [extension_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [extension_code] NVARCHAR(30) NOT NULL,
        [contract_id] NVARCHAR(36) NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [new_end_date] BIGINT,
        [new_salary] DECIMAL(18, 2) NOT NULL DEFAULT 0,
        [extension_term] NVARCHAR(50),
        [reason] NVARCHAR(255),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'APPROVED'`,
    TransferProposal: `
        [proposal_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [proposal_code] NVARCHAR(30) NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [proposal_date] BIGINT,
        [current_department_id] NVARCHAR(36),
        [target_department_id] NVARCHAR(36),
        [current_position_id] NVARCHAR(36),
        [target_position_id] NVARCHAR(36),
        [proposed_effective_date] BIGINT,
        [decision_type] NVARCHAR(50),
        [proposer_id] NVARCHAR(36),
        [proposer_name] NVARCHAR(100),
        [proposer_position] NVARCHAR(100),
        [proposer_department] NVARCHAR(100),
        [detail_items] NVARCHAR(MAX),
        [reason] NVARCHAR(255),
        [note] NVARCHAR(255),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'PENDING'`,
    TransferDecision: `
        [decision_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [decision_number] NVARCHAR(50) NOT NULL,
        [proposal_id] NVARCHAR(36),
        [employee_id] NVARCHAR(36) NOT NULL,
        [target_department_id] NVARCHAR(36),
        [target_position_id] NVARCHAR(36),
        [effective_date] BIGINT,
        [signed_by] NVARCHAR(100),
        [reason] NVARCHAR(255),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'EXECUTED'`,
    ResignationApplication: `
        [application_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [application_code] NVARCHAR(30) NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [desired_resign_date] BIGINT,
        [reason] NVARCHAR(500),
        [handover_notes] NVARCHAR(500),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'PENDING'`,
    ResignationDecision: `
        [decision_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [decision_number] NVARCHAR(50) NOT NULL,
        [application_id] NVARCHAR(36),
        [employee_id] NVARCHAR(36) NOT NULL,
        [official_resign_date] BIGINT,
        [handover_status] NVARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
        [signed_by] NVARCHAR(100),
        [reason] NVARCHAR(255),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'EXECUTED'`,
    EvaluationCriteria: `
        [criteria_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [criteria_code] NVARCHAR(30) NOT NULL,
        [criteria_name] NVARCHAR(150) NOT NULL,
        [weight] DECIMAL(10, 2) NOT NULL DEFAULT 25,
        [description] NVARCHAR(255),
        [status] INT NOT NULL DEFAULT 1`,
    EvaluationScale: `
        [scale_id] NVARCHAR(36) NOT NULL,
        [criteria_id] NVARCHAR(36) NOT NULL,
        [grade_name] NVARCHAR(50) NOT NULL,
        [min_score] DECIMAL(10, 2) NOT NULL DEFAULT 0,
        [max_score] DECIMAL(10, 2) NOT NULL DEFAULT 10,
        [description] NVARCHAR(255)`,
    EmployeeEvaluation: `
        [evaluation_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [evaluation_code] NVARCHAR(30) NOT NULL,
        [evaluation_date] BIGINT,
        [year] INT NOT NULL DEFAULT 2026,
        [evaluator_id] NVARCHAR(36) NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [department_id] NVARCHAR(36),
        [position_id] NVARCHAR(36),
        [total_score] DECIMAL(10, 2) NOT NULL DEFAULT 0,
        [grade_result] NVARCHAR(50),
        [description] NVARCHAR(500),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'COMPLETED'`,
    EmployeeEvaluationDetail: `
        [detail_id] NVARCHAR(36) NOT NULL,
        [evaluation_id] NVARCHAR(36) NOT NULL,
        [criteria_id] NVARCHAR(36) NOT NULL,
        [criteria_code] NVARCHAR(30),
        [criteria_name] NVARCHAR(150),
        [weight] DECIMAL(10, 2) NOT NULL DEFAULT 0,
        [score] DECIMAL(10, 2) NOT NULL DEFAULT 0,
        [note] NVARCHAR(255)`,
    RewardDisciplineProposal: `
        [proposal_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [proposal_code] NVARCHAR(30) NOT NULL,
        [record_type] NVARCHAR(20) NOT NULL,
        [employee_id] NVARCHAR(36) NOT NULL,
        [proposed_amount] DECIMAL(18, 2) NOT NULL DEFAULT 0,
        [reason] NVARCHAR(500),
        [proposed_by] NVARCHAR(100),
        [status] NVARCHAR(30) NOT NULL DEFAULT 'PENDING'`,
    ContractType: `
        [contract_type_id] NVARCHAR(36) NOT NULL,
        [created_date] BIGINT NOT NULL,
        [last_modified_date] BIGINT NOT NULL,
        [contract_type_code] NVARCHAR(50) NOT NULL,
        [contract_type_name] NVARCHAR(100) NOT NULL,
        [duration_months] INT NOT NULL DEFAULT 0,
        [has_probation] INT NOT NULL DEFAULT 0,
        [probation_days] INT NOT NULL DEFAULT 0,
        [status] INT NOT NULL DEFAULT 1`,
    PositionContractPathway: `
        [pathway_id] NVARCHAR(36) NOT NULL,
        [position_id] NVARCHAR(36) NOT NULL,
        [contract_type_id] NVARCHAR(36) NOT NULL,
        [step_order] INT NOT NULL DEFAULT 1,
        [note] NVARCHAR(255),
        [created_date] BIGINT NOT NULL`
};

// Names that do not follow the table_id convention.
const primaryKeyColumns = {
    SchemaMigration: 'migration_key', User: 'user_id', Role: 'role_id', Department: 'department_id',
    Position: 'position_id', Employee: 'employee_id', EmployeeContract: 'contract_id', WorkHistory: 'work_history_id',
    RewardDiscipline: 'reward_discipline_id', RecruitmentRequest: 'recruitment_request_id', RecruitmentPlan: 'recruitment_plan_id',
    RecruitmentRound: 'recruitment_round_id', Candidate: 'candidate_id', DepartmentQuota: 'quota_id', DepartmentQuotaDetail: 'detail_id',
    Interview: 'interview_id', InterviewSchedule: 'schedule_id', LeaveApplication: 'leave_id', AuditLog: 'audit_id',
    InterviewEvaluation: 'interview_eval_id', InterviewEvaluationScript: 'script_id', InterviewEvaluationCriteria: 'criteria_detail_id',
    PreScreening: 'pre_screening_id', PreScreeningCriteria: 'criteria_detail_id', ApprovalHistory: 'approval_id', Offer: 'offer_id',
    ContractProposal: 'proposal_id', ContractExtension: 'extension_id', TransferProposal: 'proposal_id', TransferDecision: 'decision_id',
    ResignationApplication: 'application_id', ResignationDecision: 'decision_id', EvaluationCriteria: 'criteria_id', EvaluationScale: 'scale_id',
    EmployeeEvaluation: 'evaluation_id', EmployeeEvaluationDetail: 'detail_id', RewardDisciplineProposal: 'proposal_id',
    ContractType: 'contract_type_id', PositionContractPathway: 'pathway_id'
};

const foreignKeys = [
    ['User', 'role_id', 'Role', 'role_id'], ['User', 'department_id', 'Department', 'department_id'], ['User', 'employee_id', 'Employee', 'employee_id', 'SET NULL'],
    ['Department', 'manager_id', 'Employee', 'employee_id', 'SET NULL'], ['Department', 'parent_department_id', 'Department', 'department_id', 'SET NULL'],
    ['Position', 'department_id', 'Department', 'department_id', 'SET NULL'], ['Employee', 'department_id', 'Department', 'department_id'],
    ['Employee', 'position_id', 'Position', 'position_id'], ['Employee', 'manager_id', 'Employee', 'employee_id'],
    ['EmployeeContract', 'employee_id', 'Employee', 'employee_id', 'CASCADE'], ['EmployeeContract', 'signer_id', 'Employee', 'employee_id', 'SET NULL'],
    ['WorkHistory', 'employee_id', 'Employee', 'employee_id', 'CASCADE'], ['WorkHistory', 'department_id', 'Department', 'department_id'], ['WorkHistory', 'position_id', 'Position', 'position_id'],
    ['RewardDiscipline', 'employee_id', 'Employee', 'employee_id', 'CASCADE'], ['RecruitmentRequest', 'department_id', 'Department', 'department_id'],
    ['RecruitmentRequest', 'position_id', 'Position', 'position_id'], ['RecruitmentRequest', 'requested_by', 'Employee', 'employee_id'],
    ['RecruitmentPlan', 'recruitment_request_id', 'RecruitmentRequest', 'recruitment_request_id', 'CASCADE'],
    ['RecruitmentRound', 'recruitment_plan_id', 'RecruitmentPlan', 'recruitment_plan_id', 'CASCADE'],
    ['Candidate', 'recruitment_plan_id', 'RecruitmentPlan', 'recruitment_plan_id'], ['Candidate', 'position_id', 'Position', 'position_id', 'SET NULL'],
    ['DepartmentQuota', 'department_id', 'Department', 'department_id'], ['DepartmentQuotaDetail', 'quota_id', 'DepartmentQuota', 'quota_id', 'CASCADE'],
    ['DepartmentQuotaDetail', 'position_id', 'Position', 'position_id', 'SET NULL'], ['Interview', 'candidate_id', 'Candidate', 'candidate_id'],
    ['Interview', 'recruitment_round_id', 'RecruitmentRound', 'recruitment_round_id'], ['Interview', 'interviewer_id', 'Employee', 'employee_id', 'SET NULL'],
    ['LeaveApplication', 'employee_id', 'Employee', 'employee_id'], ['LeaveApplication', 'department_id', 'Department', 'department_id', 'SET NULL'],
    ['LeaveApplication', 'approver_id', 'Employee', 'employee_id', 'SET NULL'], ['LeaveApplication', 'related_person_id', 'Employee', 'employee_id', 'SET NULL'],
    ['AuditLog', 'user_id', 'User', 'user_id', 'SET NULL'], ['InterviewEvaluation', 'candidate_id', 'Candidate', 'candidate_id'],
    ['InterviewEvaluation', 'schedule_id', 'InterviewSchedule', 'schedule_id'], ['InterviewEvaluationScript', 'interview_eval_id', 'InterviewEvaluation', 'interview_eval_id'],
    ['InterviewEvaluationCriteria', 'interview_eval_id', 'InterviewEvaluation', 'interview_eval_id'], ['PreScreening', 'candidate_id', 'Candidate', 'candidate_id'],
    ['PreScreening', 'position_id', 'Position', 'position_id'], ['PreScreening', 'department_id', 'Department', 'department_id'],
    ['PreScreeningCriteria', 'pre_screening_id', 'PreScreening', 'pre_screening_id'], ['ApprovalHistory', 'department_scope', 'Department', 'department_id', 'SET NULL'],
    ['ApprovalHistory', 'approver_employee_id', 'Employee', 'employee_id', 'SET NULL'], ['Offer', 'candidate_id', 'Candidate', 'candidate_id'],
    ['ContractProposal', 'employee_id', 'Employee', 'employee_id', 'CASCADE'], ['ContractExtension', 'contract_id', 'EmployeeContract', 'contract_id', 'CASCADE'],
    ['ContractExtension', 'employee_id', 'Employee', 'employee_id', 'CASCADE'], ['TransferProposal', 'employee_id', 'Employee', 'employee_id', 'CASCADE'],
    ['TransferProposal', 'current_department_id', 'Department', 'department_id', 'SET NULL'], ['TransferProposal', 'target_department_id', 'Department', 'department_id', 'SET NULL'],
    ['TransferProposal', 'current_position_id', 'Position', 'position_id', 'SET NULL'], ['TransferProposal', 'target_position_id', 'Position', 'position_id', 'SET NULL'],
    ['TransferProposal', 'proposer_id', 'Employee', 'employee_id', 'SET NULL'], ['TransferDecision', 'proposal_id', 'TransferProposal', 'proposal_id', 'SET NULL'],
    ['TransferDecision', 'employee_id', 'Employee', 'employee_id', 'CASCADE'], ['TransferDecision', 'target_department_id', 'Department', 'department_id', 'SET NULL'],
    ['TransferDecision', 'target_position_id', 'Position', 'position_id', 'SET NULL'], ['ResignationApplication', 'employee_id', 'Employee', 'employee_id', 'CASCADE'],
    ['ResignationDecision', 'application_id', 'ResignationApplication', 'application_id', 'SET NULL'], ['ResignationDecision', 'employee_id', 'Employee', 'employee_id', 'CASCADE'],
    ['EvaluationScale', 'criteria_id', 'EvaluationCriteria', 'criteria_id', 'CASCADE'], ['EmployeeEvaluation', 'evaluator_id', 'Employee', 'employee_id'],
    ['EmployeeEvaluation', 'employee_id', 'Employee', 'employee_id', 'CASCADE'], ['EmployeeEvaluation', 'department_id', 'Department', 'department_id', 'SET NULL'],
    ['EmployeeEvaluation', 'position_id', 'Position', 'position_id', 'SET NULL'], ['EmployeeEvaluationDetail', 'evaluation_id', 'EmployeeEvaluation', 'evaluation_id', 'CASCADE'],
    ['EmployeeEvaluationDetail', 'criteria_id', 'EvaluationCriteria', 'criteria_id'], ['RewardDisciplineProposal', 'employee_id', 'Employee', 'employee_id', 'CASCADE'],
    ['PositionContractPathway', 'position_id', 'Position', 'position_id', 'CASCADE'], ['PositionContractPathway', 'contract_type_id', 'ContractType', 'contract_type_id']
];

const uniqueIndexes = [
    ['Role', 'role_name'], ['User', 'username'], ['Department', 'department_code'], ['Position', 'position_code'],
    ['Employee', 'employee_code'], ['EmployeeContract', 'contract_no'], ['RewardDiscipline', 'decision_no'],
    ['RecruitmentRequest', 'request_code'], ['Candidate', 'candidate_code'], ['DepartmentQuota', 'quota_code'],
    ['InterviewSchedule', 'schedule_code'], ['LeaveApplication', 'leave_code'], ['EvaluationCriteria', 'criteria_code'],
    ['EmployeeEvaluation', 'evaluation_code'], ['RewardDisciplineProposal', 'proposal_code'], ['ContractType', 'contract_type_code'],
    ['ContractProposal', 'proposal_code'], ['ContractExtension', 'extension_code'], ['TransferProposal', 'proposal_code'],
    ['TransferDecision', 'decision_number'], ['ResignationApplication', 'application_code'], ['ResignationDecision', 'decision_number']
];

const columnsToEnsure = [
    ['Department', 'target_headcount', 'INT NOT NULL DEFAULT 0'], ['Department', 'parent_department_id', 'NVARCHAR(36)'],
    ['Position', 'target_headcount', 'INT NOT NULL DEFAULT 0'], ['Position', 'is_assistant', 'INT NOT NULL DEFAULT 0'], ['Position', 'salary_grade', 'NVARCHAR(50)'],
    ['RecruitmentRequest', 'is_outside_headcount', 'INT NOT NULL DEFAULT 0'], ['Employee', 'short_name', 'NVARCHAR(100)'],
    ['Employee', 'place_of_birth', 'NVARCHAR(255)'], ['Employee', 'is_foreign', 'INT NOT NULL DEFAULT 0'], ['Employee', 'hometown', 'NVARCHAR(255)'],
    ['Employee', 'nationality', 'NVARCHAR(100)'], ['Employee', 'ethnicity', 'NVARCHAR(100)'], ['Employee', 'religion', 'NVARCHAR(100)'],
    ['Employee', 'marital_status', 'NVARCHAR(50)'], ['Employee', 'personal_email', 'NVARCHAR(100)'], ['Employee', 'company_email', 'NVARCHAR(100)'],
    ['Employee', 'resignation_date', 'BIGINT'], ['Employee', 'level', "NVARCHAR(50) NOT NULL DEFAULT N'Nhân viên'"], ['EmployeeContract', 'contract_date', 'BIGINT'],
    ['EmployeeContract', 'signer_id', 'NVARCHAR(36)'], ['EmployeeContract', 'signer_name', 'NVARCHAR(100)'], ['EmployeeContract', 'signer_position', 'NVARCHAR(100)'],
    ['EmployeeContract', 'employee_position', 'NVARCHAR(100)'], ['EmployeeContract', 'probation_from_date', 'BIGINT'], ['EmployeeContract', 'probation_to_date', 'BIGINT'],
    ['EmployeeContract', 'job_description', 'NVARCHAR(MAX)'], ['EmployeeContract', 'salary_scale', 'NVARCHAR(100)'], ['EmployeeContract', 'salary_grade', 'NVARCHAR(50)'],
    ['EmployeeContract', 'allowance_details', 'NVARCHAR(MAX)'], ['EmployeeContract', 'base_salary', 'DECIMAL(18, 2)'], ['EmployeeContract', 'social_insurance_salary', 'DECIMAL(18, 2)'],
    ['User', 'employee_id', 'NVARCHAR(36)'], ['Candidate', 'position_id', 'NVARCHAR(36)'], ['Candidate', 'attachments_json', 'NVARCHAR(MAX)'],
    ['DepartmentQuota', 'budget_details', 'NVARCHAR(MAX)'], ['TransferProposal', 'proposal_date', 'BIGINT'], ['TransferProposal', 'decision_type', 'NVARCHAR(50)'],
    ['TransferProposal', 'proposer_id', 'NVARCHAR(36)'], ['TransferProposal', 'proposer_name', 'NVARCHAR(100)'], ['TransferProposal', 'proposer_position', 'NVARCHAR(100)'],
    ['TransferProposal', 'proposer_department', 'NVARCHAR(100)'], ['TransferProposal', 'detail_items', 'NVARCHAR(MAX)'], ['TransferProposal', 'note', 'NVARCHAR(255)']
];

async function tableExists(tableName) {
    const row = await queryOne('SELECT OBJECT_ID(?) AS object_id', [`dbo.${tableName}`]);
    return Boolean(row && row.object_id);
}

async function columnExists(tableName, columnName) {
    return Boolean(await queryOne(
        `SELECT 1 AS present FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?`,
        [`dbo.${tableName}`, columnName]
    ));
}

async function ensurePrimaryKey(table, column) {
    const name = `PK_${table}`;
    const exists = await queryOne('SELECT 1 AS present FROM sys.indexes WHERE object_id = OBJECT_ID(?) AND is_primary_key = 1', [`dbo.${table}`]);
    if (!exists) {
        await exec(`ALTER TABLE ${identifier(table)} ADD CONSTRAINT ${identifier(name)} PRIMARY KEY (${identifier(column)})`);
    }
}

async function ensureUniqueIndex(table, column) {
    const name = `UX_${table}_${column}`;
    const exists = await queryOne('SELECT 1 AS present FROM sys.indexes WHERE name = ? AND object_id = OBJECT_ID(?)', [name, `dbo.${table}`]);
    if (!exists) {
        await exec(`CREATE UNIQUE INDEX ${identifier(name)} ON ${identifier(table)} (${identifier(column)})`);
    }
}

async function ensureForeignKey([table, from, target, to, onDelete]) {
    const name = `FK_${table}_${from}_${target}`;
    const exists = await queryOne('SELECT 1 AS present FROM sys.foreign_keys WHERE name = ?', [name]);
    if (exists) return;

    const action = onDelete ? ` ON DELETE ${onDelete}` : '';
    await exec(
        `ALTER TABLE ${identifier(table)} WITH NOCHECK ADD CONSTRAINT ${identifier(name)} FOREIGN KEY (${identifier(from)}) REFERENCES ${identifier(target)} (${identifier(to)})${action}`
    );
}

async function initSchema() {
    for (const [table, definition] of Object.entries(tableDefinitions)) {
        const exists = await tableExists(table);
        if (!exists) {
            await exec(`CREATE TABLE ${identifier(table)} (${definition})`);
        }
        await ensurePrimaryKey(table, primaryKeyColumns[table]);
    }

    for (const [table, column, type] of columnsToEnsure) {
        if (await tableExists(table) && !(await columnExists(table, column))) {
            await exec(`ALTER TABLE ${identifier(table)} ADD ${identifier(column)} ${type}`);
        }
    }

    for (const uniqueIndex of uniqueIndexes) {
        await ensureUniqueIndex(...uniqueIndex);
    }
    if (!(await queryOne('SELECT 1 AS present FROM sys.indexes WHERE name = ?', ['UX_PositionContractPathway_position_step']))) {
        await exec('CREATE UNIQUE INDEX [UX_PositionContractPathway_position_step] ON [PositionContractPathway] ([position_id], [step_order])');
    }

    // Keep the migration idempotent and preserve existing rows during startup.
    const scoreMigrationKey = 'normalize-evaluation-score-v1';
    if (await tableExists('EmployeeEvaluation') && !(await queryOne('SELECT migration_key FROM [SchemaMigration] WHERE migration_key = ?', [scoreMigrationKey]))) {
        await run('UPDATE [EmployeeEvaluation] SET total_score = total_score * 1.0 / 10 WHERE total_score > 10');
        await run(`UPDATE [EmployeeEvaluation]
                   SET total_score = CASE evaluation_id
                       WHEN 'eval-01' THEN 9.2 WHEN 'eval-02' THEN 8.8 WHEN 'eval-03' THEN 8.5
                       WHEN 'eval-04' THEN 9.5 WHEN 'eval-05' THEN 8.6 ELSE total_score END
                   WHERE evaluation_id IN ('eval-01', 'eval-02', 'eval-03', 'eval-04', 'eval-05')`);
        await run(`UPDATE [EmployeeEvaluation]
                   SET position_id = (SELECT TOP (1) employee.position_id FROM [Employee] employee WHERE employee.employee_id = [EmployeeEvaluation].employee_id)
                   WHERE position_id IS NULL`);
        await run('INSERT INTO [SchemaMigration] (migration_key, applied_date) VALUES (?, ?)', [scoreMigrationKey, Date.now()]);
    }

    if (await tableExists('DepartmentQuotaDetail')) {
        await run(`UPDATE [DepartmentQuotaDetail]
                   SET position_id = CASE position_code
                       WHEN 'BP20002_TP' THEN 'pos-hr-mgr' WHEN 'BP20002_NV' THEN 'pos-hr-emp'
                       WHEN 'BP10002_TP' THEN 'pos-mkt-mgr' WHEN 'BP10002_NV' THEN 'pos-mkt-emp'
                       WHEN 'BP30001_TP' THEN 'pos-kd-mgr' WHEN 'BP30001_TN' THEN 'pos-kd-lead'
                       WHEN 'BP30001_NV' THEN 'pos-kd-emp' WHEN 'BP40001_NV' THEN 'pos-kt-emp'
                       WHEN 'BP50001_NV' THEN 'pos-cloud-emp' ELSE position_id END
                   WHERE position_code IN ('BP20002_TP', 'BP20002_NV', 'BP10002_TP', 'BP10002_NV', 'BP30001_TP', 'BP30001_TN', 'BP30001_NV', 'BP40001_NV', 'BP50001_NV')`);
        await run(`UPDATE [DepartmentQuotaDetail]
                   SET position_code = (SELECT TOP (1) position_code FROM [Position] WHERE position_id = [DepartmentQuotaDetail].position_id),
                       position_name = (SELECT TOP (1) position_name FROM [Position] WHERE position_id = [DepartmentQuotaDetail].position_id)
                   WHERE position_id IS NOT NULL`);
    }

    if (await tableExists('LeaveApplication')) {
        await run(`UPDATE [LeaveApplication]
                   SET approver_id = (SELECT TOP (1) employee.employee_id
                                      FROM [Employee] employee JOIN [Position] position ON position.position_id = employee.position_id
                                      WHERE employee.department_id = [LeaveApplication].department_id
                                        AND position.position_name LIKE N'%Trưởng Phòng%')
                   WHERE approver_id IS NULL AND approver_name LIKE N'Trưởng phòng%'`);
    }

    for (const relation of foreignKeys) {
        await ensureForeignKey(relation);
    }

    for (const [table, from] of foreignKeys) {
        const name = `IX_${table}_${from}`;
        if (!(await queryOne('SELECT 1 AS present FROM sys.indexes WHERE name = ? AND object_id = OBJECT_ID(?)', [name, `dbo.${table}`]))) {
            await exec(`CREATE INDEX ${identifier(name)} ON ${identifier(table)} (${identifier(from)})`);
        }
    }

    console.log('BRAVO HRM SQL Server schema initialized and migrations applied without clearing data.');
}

module.exports = { initSchema };
