import * as datasetModule from '../../../server/src/db/dataset-v2.js';

const { buildDatasetV2 } = datasetModule;
const tables = buildDatasetV2().tables;
const rows = (name) => tables[name] || [];
const mapBy = (name, field) => new Map(rows(name).map(row => [String(row[field]), row]));
const departments = mapBy('Department', 'department_id');
const positions = mapBy('Position', 'position_id');
const employees = mapBy('Employee', 'employee_id');
const candidates = mapBy('Candidate', 'candidate_id');
const requests = mapBy('RecruitmentRequest', 'recruitment_request_id');
const plans = mapBy('RecruitmentPlan', 'recruitment_plan_id');
const contracts = mapBy('EmployeeContract', 'contract_id');

const departmentName = id => departments.get(String(id))?.department_name || '';
const positionName = id => positions.get(String(id))?.position_name || '';
const employeeName = id => employees.get(String(id))?.full_name || '';
const parseJson = value => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    try { return parseJson(JSON.parse(value)); } catch (error) { return []; }
};
const withEmployee = row => {
    const employee = employees.get(String(row.employee_id));
    return {
        ...row,
        id: row.employee_id ?? row.contract_id ?? row.proposal_id ?? row.decision_id ?? row.application_id,
        employee_name: row.employee_name ?? employee?.full_name,
        employee_code: row.employee_code ?? employee?.employee_code,
        department_name: row.department_name ?? departmentName(employee?.department_id),
        position_name: row.position_name ?? positionName(employee?.position_id)
    };
};

const planRows = rows('RecruitmentPlan').map(row => {
    const request = requests.get(String(row.recruitment_request_id));
    return { ...row, id: row.recruitment_plan_id, request_code: request?.request_code, department_id: request?.department_id, department_name: departmentName(request?.department_id), position_id: request?.position_id, position_name: positionName(request?.position_id) };
});
const planById = new Map(planRows.map(row => [String(row.recruitment_plan_id), row]));
const candidateRows = rows('Candidate').map(row => {
    const plan = planById.get(String(row.recruitment_plan_id));
    const request = requests.get(String(row.recruitment_request_id ?? plan?.recruitment_request_id));
    return { ...row, id: row.candidate_id, plan_name: plan?.plan_name, apply_position_name: positionName(row.position_id ?? request?.position_id), department_name: departmentName(row.department_id ?? request?.department_id) };
});

const quotaDetails = new Map();
rows('DepartmentQuotaDetail').forEach(row => quotaDetails.set(String(row.quota_id), [...(quotaDetails.get(String(row.quota_id)) || []), row]));
const scheduleCandidates = new Map();
rows('InterviewScheduleCandidate').forEach(row => {
    const candidate = candidates.get(String(row.candidate_id));
    const item = { ...row, candidate_code: candidate?.candidate_code, full_name: candidate?.full_name, apply_position_name: positionName(candidate?.position_id) };
    scheduleCandidates.set(String(row.schedule_id), [...(scheduleCandidates.get(String(row.schedule_id)) || []), item]);
});
const schedulePanels = new Map();
rows('InterviewSchedulePanel').forEach(row => {
    const employee = employees.get(String(row.employee_id));
    const item = { ...row, employee_code: employee?.employee_code, full_name: employee?.full_name, position_name: positionName(employee?.position_id) };
    schedulePanels.set(String(row.schedule_id), [...(schedulePanels.get(String(row.schedule_id)) || []), item]);
});
const schedules = rows('InterviewSchedule').map(row => ({ ...row, id: row.schedule_id, candidates: scheduleCandidates.get(String(row.schedule_id)) || parseJson(row.candidates_json), council: schedulePanels.get(String(row.schedule_id)) || parseJson(row.council_json), tests: parseJson(row.tests_json) }));
const scheduleById = new Map(schedules.map(row => [String(row.schedule_id), row]));
const evaluationScripts = new Map();
rows('InterviewEvaluationScript').forEach(row => evaluationScripts.set(String(row.interview_eval_id), [...(evaluationScripts.get(String(row.interview_eval_id)) || []), row]));
const evaluationCriteria = new Map();
rows('InterviewEvaluationCriteria').forEach(row => evaluationCriteria.set(String(row.interview_eval_id), [...(evaluationCriteria.get(String(row.interview_eval_id)) || []), row]));
const interviewEvaluations = rows('InterviewEvaluation').map(row => {
    const candidate = candidates.get(String(row.candidate_id));
    const schedule = scheduleById.get(String(row.schedule_id));
    return { ...row, id: row.interview_eval_id, candidate_name: candidate?.full_name, candidate_code: candidate?.candidate_code, schedule_code: schedule?.schedule_code, evaluator_name: employeeName(row.evaluator_id), script: evaluationScripts.get(String(row.interview_eval_id)) || [], criteria: evaluationCriteria.get(String(row.interview_eval_id)) || [] };
});
const evaluationDetails = new Map();
rows('EmployeeEvaluationDetail').forEach(row => evaluationDetails.set(String(row.evaluation_id), [...(evaluationDetails.get(String(row.evaluation_id)) || []), row]));

export const datasetV2Defaults = {
    users: rows('User').map(row => ({ ...row, id: row.user_id, role_name: rows('Role').find(role => String(role.role_id) === String(row.role_id))?.role_name, department_name: departmentName(row.department_id) || 'Toàn hệ thống', employee_name: employeeName(row.employee_id) })),
    departments: rows('Department').map(row => ({ ...row, id: row.department_id, manager_name: employeeName(row.manager_id), parent_department_name: departmentName(row.parent_department_id) || '-', current_count: rows('Employee').filter(employee => employee.department_id === row.department_id && employee.employment_status === 'WORKING').length })),
    positions: rows('Position').map(row => ({ ...row, id: row.position_id, department_name: departmentName(row.department_id), current_count: rows('Employee').filter(employee => employee.position_id === row.position_id && employee.employment_status === 'WORKING').length })),
    quotas: rows('DepartmentQuota').map(row => ({ ...row, id: row.quota_id, department_code: departments.get(String(row.department_id))?.department_code, department_name: departmentName(row.department_id), details: quotaDetails.get(String(row.quota_id)) || [], budget_details: parseJson(row.budget_details) })),
    employees: rows('Employee').map(row => ({ ...row, id: row.employee_id, department_name: departmentName(row.department_id), position_name: positionName(row.position_id), manager_name: employeeName(row.manager_id) })),
    employee_contracts: rows('EmployeeContract').map(withEmployee),
    requests: rows('RecruitmentRequest').map(row => ({ ...row, id: row.recruitment_request_id, department_name: departmentName(row.department_id), position_name: positionName(row.position_id), requested_by_name: employeeName(row.requested_by) })),
    plans: planRows,
    candidates: candidateRows,
    interviews: rows('Interview').map(row => ({ ...row, id: row.interview_id, candidate_name: candidates.get(String(row.candidate_id))?.full_name, interviewer_name: employeeName(row.interviewer_id) })),
    interview_evaluations: interviewEvaluations,
    recruitment_decisions: rows('RecruitmentDecision').map(row => ({ ...row, id: row.decision_id, candidate_name: candidates.get(String(row.candidate_id))?.full_name, candidate_code: candidates.get(String(row.candidate_id))?.candidate_code })),
    offers: rows('Offer').map(row => ({ ...row, id: row.offer_id, candidate_name: candidates.get(String(row.candidate_id))?.full_name, candidate_code: candidates.get(String(row.candidate_id))?.candidate_code })),
    rewards: rows('RewardDiscipline').filter(row => row.decision_type === 'REWARD').map(row => ({ ...withEmployee(row), decision_type: 'KHEN_THUONG' })),
    disciplines: rows('RewardDiscipline').filter(row => row.decision_type === 'DISCIPLINE').map(row => ({ ...withEmployee(row), decision_type: 'KY_LUAT' })),
    leave_applications: rows('LeaveApplication').map(row => ({ ...row, id: row.leave_id })),
    interview_schedules: schedules,
    criteria: rows('EvaluationCriteria').map(row => ({ ...row, id: row.criteria_id, scales: rows('EvaluationScale').filter(scale => scale.criteria_id === row.criteria_id) })),
    evaluations: rows('EmployeeEvaluation').map(row => ({ ...withEmployee(row), id: row.evaluation_id, evaluator_name: employeeName(row.evaluator_id), details: evaluationDetails.get(String(row.evaluation_id)) || [] }))
};
