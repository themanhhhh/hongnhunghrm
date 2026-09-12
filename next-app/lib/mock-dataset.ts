type MockRow = Record<string, unknown>;
type DatasetTables = Record<string, MockRow[]>;

type DatasetModule = {
  buildDatasetV2: () => { tables: DatasetTables };
};

// The backend fixture is deliberately shared so the API and browser mocks cannot drift.
// @ts-expect-error The CommonJS fixture is consumed by the Next bundle without server-only dependencies.
import * as datasetModule from "../../server/src/db/dataset-v2.js";

const { buildDatasetV2 } = datasetModule as unknown as DatasetModule;

const asRows = (tables: DatasetTables, name: string) => tables[name] ?? [];
const byId = (rows: MockRow[], field: string) => new Map(rows.map((row) => [String(row[field]), row]));

function parseJson(value: unknown): MockRow[] {
  if (Array.isArray(value)) return value.filter((item): item is MockRow => Boolean(item && typeof item === "object"));
  if (typeof value !== "string") return [];
  try {
    return parseJson(JSON.parse(value));
  } catch {
    return [];
  }
}

function parseJsonValue(value: unknown) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function buildStore() {
  const tables = buildDatasetV2().tables;
  const departments = byId(asRows(tables, "Department"), "department_id");
  const positions = byId(asRows(tables, "Position"), "position_id");
  const employees = byId(asRows(tables, "Employee"), "employee_id");
  const candidates = byId(asRows(tables, "Candidate"), "candidate_id");
  const requests = byId(asRows(tables, "RecruitmentRequest"), "recruitment_request_id");
  const plans = byId(asRows(tables, "RecruitmentPlan"), "recruitment_plan_id");
  const contracts = byId(asRows(tables, "EmployeeContract"), "contract_id");

  const departmentName = (id: unknown) => String(departments.get(String(id))?.department_name ?? "");
  const positionName = (id: unknown) => String(positions.get(String(id))?.position_name ?? "");
  const employeeName = (id: unknown) => String(employees.get(String(id))?.full_name ?? "");

  const withEmployee = (row: MockRow) => {
    const employee = employees.get(String(row.employee_id));
    return {
      ...row,
      id: row.employee_id ?? row.contract_id ?? row.proposal_id ?? row.decision_id ?? row.application_id,
      employee_name: row.employee_name ?? employee?.full_name,
      employee_code: row.employee_code ?? employee?.employee_code,
      department_name: row.department_name ?? departmentName(employee?.department_id),
      position_name: row.position_name ?? positionName(employee?.position_id),
    };
  };

  const quotaDetails = new Map<string, MockRow[]>();
  for (const detail of asRows(tables, "DepartmentQuotaDetail")) {
    const key = String(detail.quota_id);
    quotaDetails.set(key, [...(quotaDetails.get(key) ?? []), detail]);
  }

  const planRows = asRows(tables, "RecruitmentPlan").map((row) => {
    const request = requests.get(String(row.recruitment_request_id));
    return {
      ...row,
      id: row.recruitment_plan_id,
      request_code: request?.request_code,
      department_id: request?.department_id,
      department_name: departmentName(request?.department_id),
      position_id: request?.position_id,
      position_name: positionName(request?.position_id),
    };
  });
  const planById = byId(planRows, "recruitment_plan_id");

  const candidateRows = asRows(tables, "Candidate").map((row) => {
    const plan = planById.get(String(row.recruitment_plan_id));
    const request = requests.get(String(row.recruitment_request_id ?? plan?.recruitment_request_id));
    return {
      ...row,
      id: row.candidate_id,
      plan_name: plan?.plan_name,
      apply_position_name: positionName(row.position_id ?? request?.position_id),
      department_name: departmentName(row.department_id ?? request?.department_id),
    };
  });

  const scheduleCandidates = new Map<string, MockRow[]>();
  for (const row of asRows(tables, "InterviewScheduleCandidate")) {
    const candidate = candidates.get(String(row.candidate_id));
    const item = { ...row, candidate_code: candidate?.candidate_code, full_name: candidate?.full_name, apply_position_name: positionName(candidate?.position_id) };
    const key = String(row.schedule_id);
    scheduleCandidates.set(key, [...(scheduleCandidates.get(key) ?? []), item]);
  }
  const schedulePanels = new Map<string, MockRow[]>();
  for (const row of asRows(tables, "InterviewSchedulePanel")) {
    const employee = employees.get(String(row.employee_id));
    const item = { ...row, employee_code: employee?.employee_code, full_name: employee?.full_name, position_name: positionName(employee?.position_id) };
    const key = String(row.schedule_id);
    schedulePanels.set(key, [...(schedulePanels.get(key) ?? []), item]);
  }

  const schedules = asRows(tables, "InterviewSchedule").map((row) => ({
    ...row,
    id: row.schedule_id,
    candidates: scheduleCandidates.get(String(row.schedule_id)) ?? parseJson(row.candidates_json),
    council: schedulePanels.get(String(row.schedule_id)) ?? parseJson(row.council_json),
    tests: parseJson(row.tests_json),
  }));
  const scheduleById = byId(schedules, "schedule_id");

  const evaluationScripts = new Map<string, MockRow[]>();
  for (const row of asRows(tables, "InterviewEvaluationScript")) {
    const key = String(row.interview_eval_id);
    evaluationScripts.set(key, [...(evaluationScripts.get(key) ?? []), row]);
  }
  const evaluationCriteria = new Map<string, MockRow[]>();
  for (const row of asRows(tables, "InterviewEvaluationCriteria")) {
    const key = String(row.interview_eval_id);
    evaluationCriteria.set(key, [...(evaluationCriteria.get(key) ?? []), row]);
  }
  const interviewEvaluations = asRows(tables, "InterviewEvaluation").map((row) => {
    const candidate = candidates.get(String(row.candidate_id));
    const schedule = scheduleById.get(String(row.schedule_id));
    return {
      ...row,
      id: row.interview_eval_id,
      candidate_name: candidate?.full_name,
      candidate_code: candidate?.candidate_code,
      schedule_code: schedule?.schedule_code,
      evaluator_name: employeeName(row.evaluator_id),
      script: evaluationScripts.get(String(row.interview_eval_id)) ?? [],
      criteria: evaluationCriteria.get(String(row.interview_eval_id)) ?? [],
    };
  });

  const evaluationDetails = new Map<string, MockRow[]>();
  for (const row of asRows(tables, "EmployeeEvaluationDetail")) {
    const key = String(row.evaluation_id);
    evaluationDetails.set(key, [...(evaluationDetails.get(key) ?? []), row]);
  }

  const store: Record<string, MockRow[]> = {
    "/admin/roles": asRows(tables, "Role").map((row) => ({ ...row, id: row.role_id })),
    "/admin/users": asRows(tables, "User").map((row) => ({
      ...row,
      id: row.user_id,
      role_name: asRows(tables, "Role").find((role) => String(role.role_id) === String(row.role_id))?.role_name,
      department_name: departmentName(row.department_id) || "Toàn hệ thống",
      employee_name: employeeName(row.employee_id),
    })),
    "/admin/departments": asRows(tables, "Department").map((row) => ({
      ...row,
      id: row.department_id,
      manager_name: employeeName(row.manager_id),
      parent_department_name: departmentName(row.parent_department_id) || "-",
      current_count: asRows(tables, "Employee").filter((employee) => employee.department_id === row.department_id && employee.employment_status === "WORKING").length,
    })),
    "/admin/positions": asRows(tables, "Position").map((row) => ({
      ...row,
      id: row.position_id,
      department_name: departmentName(row.department_id),
      current_count: asRows(tables, "Employee").filter((employee) => employee.position_id === row.position_id && employee.employment_status === "WORKING").length,
    })),
    "/admin/contract-types": asRows(tables, "ContractType").map((row) => ({ ...row, id: row.contract_type_id })),
    "/hr/employees": asRows(tables, "Employee").map((row) => ({
      ...row,
      id: row.employee_id,
      department_name: departmentName(row.department_id),
      position_name: positionName(row.position_id),
      manager_name: employeeName(row.manager_id),
    })),
    "/hr/quotas": asRows(tables, "DepartmentQuota").map((row) => {
      const current = Number(row.current_headcount ?? 0);
      return {
        ...row,
        id: row.quota_id,
        department_code: departments.get(String(row.department_id))?.department_code,
        department_name: departmentName(row.department_id),
        current_headcount: current,
        needed_headcount: Math.max(0, Number(row.target_headcount ?? 0) - current),
        details: quotaDetails.get(String(row.quota_id)) ?? [],
        budget_details: parseJsonValue(row.budget_details) ?? [],
      };
    }),
    "/hr/contracts": asRows(tables, "EmployeeContract").map(withEmployee),
    "/hr/expiring-contracts": asRows(tables, "EmployeeContract").filter((row) => Number(row.end_date) > Date.UTC(2026, 8, 12)).map(withEmployee),
    "/hr/contract-proposals": asRows(tables, "ContractProposal").map(withEmployee),
    "/hr/contract-extensions": asRows(tables, "ContractExtension").map((row) => ({ ...withEmployee(row), contract_no: contracts.get(String(row.contract_id))?.contract_no })),
    "/hr/contract-appendices": asRows(tables, "ContractAppendix").map((row) => ({ ...row, id: row.appendix_id, employee_name: employeeName(contracts.get(String(row.contract_id))?.employee_id) })),
    "/hr/leave-applications": asRows(tables, "LeaveApplication").map((row) => ({ ...row, id: row.leave_id })),
    "/hr/transfer-proposals": asRows(tables, "TransferProposal").map((row) => ({
      ...withEmployee(row),
      current_dept_name: departmentName(row.current_department_id),
      target_dept_name: departmentName(row.target_department_id),
      current_pos_name: positionName(row.current_position_id),
      target_pos_name: positionName(row.target_position_id),
      detail_items: parseJson(row.detail_items),
    })),
    "/hr/transfer-decisions": asRows(tables, "TransferDecision").map((row) => ({
      ...withEmployee(row),
      current_dept_name: departmentName(row.current_department_id),
      target_dept_name: departmentName(row.target_department_id),
      current_pos_name: positionName(row.current_position_id),
      target_pos_name: positionName(row.target_position_id),
      manager_name: employeeName(row.manager_id),
      detail_items: parseJson(row.detail_items),
    })),
    "/hr/resignation-applications": asRows(tables, "ResignationApplication").map(withEmployee),
    "/hr/resignation-decisions": asRows(tables, "ResignationDecision").map(withEmployee),
    "/hr/work-history": asRows(tables, "WorkHistory").map((row) => ({ ...withEmployee(row), department_name: departmentName(row.department_id), position_name: positionName(row.position_id) })),
    "/recruitment/requests": asRows(tables, "RecruitmentRequest").map((row) => ({
      ...row,
      id: row.recruitment_request_id,
      department_name: departmentName(row.department_id),
      position_name: positionName(row.position_id),
      requested_by_name: employeeName(row.requested_by),
    })),
    "/recruitment/plans": planRows,
    "/recruitment/candidates": candidateRows,
    "/recruitment/pre-screenings": asRows(tables, "PreScreening").map((row) => ({
      ...row,
      id: row.pre_screening_id,
      candidate_name: candidates.get(String(row.candidate_id))?.full_name,
      candidate_code: candidates.get(String(row.candidate_id))?.candidate_code,
      position_name: positionName(row.position_id),
      department_name: departmentName(row.department_id),
      criteria: asRows(tables, "PreScreeningCriteria").filter((criteria) => criteria.pre_screening_id === row.pre_screening_id),
    })),
    "/recruitment/interviews": asRows(tables, "Interview").map((row) => ({ ...row, id: row.interview_id, candidate_name: candidates.get(String(row.candidate_id))?.full_name, interviewer_name: employeeName(row.interviewer_id) })),
    "/recruitment/interview-schedules": schedules,
    "/recruitment/interview-evaluations": interviewEvaluations,
    "/recruitment/offers": asRows(tables, "Offer").map((row) => ({ ...row, id: row.offer_id, candidate_name: candidates.get(String(row.candidate_id))?.full_name, candidate_code: candidates.get(String(row.candidate_id))?.candidate_code })),
    "/recruitment/decisions": asRows(tables, "RecruitmentDecision").map((row) => ({ ...row, id: row.decision_id, candidate_name: candidates.get(String(row.candidate_id))?.full_name, candidate_code: candidates.get(String(row.candidate_id))?.candidate_code })),
    "/reward-discipline/criteria": asRows(tables, "EvaluationCriteria").map((row) => ({ ...row, id: row.criteria_id, scales: asRows(tables, "EvaluationScale").filter((scale) => scale.criteria_id === row.criteria_id) })),
    "/reward-discipline/evaluations": asRows(tables, "EmployeeEvaluation").map((row) => ({
      ...withEmployee(row),
      id: row.evaluation_id,
      evaluation_code: row.evaluation_code,
      evaluator_name: employeeName(row.evaluator_id),
      details: evaluationDetails.get(String(row.evaluation_id)) ?? [],
    })),
    "/reward-discipline/proposals": asRows(tables, "RewardDisciplineProposal").map((row) => ({
      ...withEmployee(row),
      id: row.proposal_id,
      record_type: row.record_type === "REWARD" ? "KHEN_THUONG" : "KY_LUAT",
      department_manager_id: departments.get(String(employees.get(String(row.employee_id))?.department_id))?.manager_id,
      department_manager_name: employeeName(departments.get(String(employees.get(String(row.employee_id))?.department_id))?.manager_id),
    })),
    "/reward-discipline": asRows(tables, "RewardDiscipline").map((row) => ({
      ...withEmployee(row),
      decision_type: row.decision_type === "REWARD" ? "KHEN_THUONG" : "KY_LUAT",
    })),
  };

  return store;
}

export function createMockStoreV2() {
  return buildStore();
}
