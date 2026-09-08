import { reportDefinitions } from "./report-config";

type MockRow = Record<string, unknown>;
type MockStore = Record<string, MockRow[]>;

const MOCK_STORE_KEY = "bravo_next_mock_store";

const idFields: Record<string, string> = {
  "/admin/departments": "department_id",
  "/admin/positions": "position_id",
  "/hr/employees": "employee_id",
  "/hr/quotas": "quota_id",
  "/hr/contracts": "contract_id",
  "/hr/contract-proposals": "proposal_id",
  "/hr/contract-extensions": "extension_id",
  "/hr/expiring-contracts": "contract_id",
  "/hr/leave-applications": "leave_id",
  "/hr/transfer-proposals": "proposal_id",
  "/hr/transfer-decisions": "decision_id",
  "/hr/resignation-applications": "application_id",
  "/hr/resignation-decisions": "decision_id",
  "/hr/work-history": "work_history_id",
  "/recruitment/requests": "recruitment_request_id",
  "/recruitment/plans": "recruitment_plan_id",
  "/recruitment/candidates": "candidate_id",
  "/recruitment/pre-screenings": "pre_screening_id",
  "/recruitment/interview-schedules": "schedule_id",
  "/recruitment/interview-evaluations": "interview_eval_id",
  "/recruitment/offers": "offer_id",
  "/recruitment/decisions": "decision_id",
  "/reward-discipline/criteria": "criteria_id",
  "/reward-discipline/evaluations": "evaluation_id",
  "/reward-discipline/proposals": "proposal_id",
  "/reward-discipline": "reward_discipline_id",
};

const initialStore: MockStore = {
  "/admin/departments": [
    { department_id: "dept-hr", department_code: "PHR", department_name: "Phòng Nhân sự", parent_department_name: "-", manager_name: "Trần Thị Thu Hà", target_headcount: 8 },
    { department_id: "dept-kd", department_code: "PKD", department_name: "Phòng Kinh doanh", parent_department_name: "-", manager_name: "Phạm Quốc Tuấn", target_headcount: 20 },
    { department_id: "dept-cloud", department_code: "CLOUD", department_name: "Phòng Cloud và Hạ tầng", parent_department_name: "Khối Công nghệ", manager_name: "Hoàng Trọng Nghĩa", target_headcount: 10 },
  ],
  "/admin/positions": [
    { position_id: "pos-hr-emp", position_code: "PHR_EMP", position_name: "Nhân viên Nhân sự", department_id: "dept-hr", department_name: "Phòng Nhân sự", target_headcount: 5, description: "Tuyển dụng và C&B" },
    { position_id: "pos-kd-emp", position_code: "PKD_EMP", position_name: "Nhân viên Kinh doanh", department_id: "dept-kd", department_name: "Phòng Kinh doanh", target_headcount: 17, description: "Tư vấn giải pháp ERP" },
    { position_id: "pos-cloud-emp", position_code: "CLOUD_EMP", position_name: "Kỹ sư Cloud và Hạ tầng", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", target_headcount: 7, description: "Vận hành hạ tầng" },
  ],
  "/hr/employees": [
    { employee_id: "emp-hr-02", employee_code: "NV-2024-005", full_name: "Nguyễn Thùy Linh", department_id: "dept-hr", department_name: "Phòng Nhân sự", position_id: "pos-hr-emp", position_name: "Nhân viên Nhân sự", level: "Nhân viên", join_date: "2024-03-15", employment_status: "WORKING", email: "linh.nt@example.test", phone: "0966123456" },
    { employee_id: "emp-kd-01", employee_code: "NV-2024-027", full_name: "Phạm Quốc Tuấn", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Trưởng Phòng Kinh doanh", level: "Trưởng phòng", join_date: "2023-04-01", employment_status: "WORKING", email: "tuan.pq@example.test", phone: "0911223344" },
    { employee_id: "emp-cloud-04", employee_code: "NV-2024-100", full_name: "Đặng Việt Dũng", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", position_id: "pos-cloud-emp", position_name: "Kỹ sư Cloud và Hạ tầng", level: "Nhân viên", join_date: "2024-06-10", employment_status: "WORKING", email: "dung.dv@example.test", phone: "0966554433" },
  ],
  "/hr/quotas": [
    {
      quota_id: "quota-demo-01",
      quota_code: "DB/2026-001",
      created_date: "2026-08-01",
      effective_date: "2026-08-05",
      creator_id: "emp-hr-02",
      creator_name: "Nguyễn Thùy Linh",
      department_id: "dept-cloud",
      department_code: "CLOUD",
      department_name: "Phòng Cloud và Hạ tầng",
      target_headcount: 10,
      current_headcount: 7,
      needed_headcount: 3,
      max_capacity: 12,
      budget: 180000000,
      description: "Bổ sung nhân sự cho kế hoạch vận hành hạ tầng Cloud.",
      details: [
        { position_id: "pos-cloud-emp", position_code: "CLOUD_EMP", position_name: "Kỹ sư Cloud và Hạ tầng", target_headcount: 7, resignation_count: 0, maternity_count: 0, current_headcount: 5, needed_headcount: 2, note: "Bổ sung nhân sự trực vận hành." },
        { position_id: "pos-cloud-lead", position_code: "CLOUD_LEAD", position_name: "Trưởng Nhóm Cloud và Hạ tầng", target_headcount: 2, resignation_count: 1, maternity_count: 0, current_headcount: 1, needed_headcount: 2, note: "Dự kiến thay thế nhân sự nghỉ việc." },
        { position_id: "pos-cloud-mgr", position_code: "CLOUD_MGR", position_name: "Trưởng Phòng Cloud và Hạ tầng", target_headcount: 1, resignation_count: 0, maternity_count: 0, current_headcount: 1, needed_headcount: 0, note: "" },
      ],
      budget_details: [
        { cost_type: "Chi phí đăng tin tuyển dụng", source: "TopCV", estimated_cost: 5000000 },
        { cost_type: "Chi phí giới thiệu nhân sự nội bộ", source: "Bạn bè giới thiệu", estimated_cost: 3000000 },
      ],
      status: "Đang duyệt",
    },
  ],
  "/recruitment/requests": [
    { recruitment_request_id: "req-demo-01", request_code: "YCTD/2026-018", created_date: "2026-09-01", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", position_id: "pos-cloud-emp", position_name: "Kỹ sư Cloud và Hạ tầng", requested_by: "emp-cloud-04", requested_by_name: "Đặng Việt Dũng", quota_id: "quota-demo-01", quantity: 2, expected_date: "2026-10-01", is_outside_headcount: 0, status: "PENDING", reason: "Bổ sung nhân sự trực vận hành.", note: "" },
    { recruitment_request_id: "req-demo-02", request_code: "YCTD/2026-019", created_date: "2026-09-02", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Nhân viên Kinh doanh", requested_by: "emp-kd-01", requested_by_name: "Phạm Quốc Tuấn", quota_id: "", quantity: 2, expected_date: "2026-10-15", is_outside_headcount: 1, status: "APPROVED", reason: "Mở rộng khách hàng doanh nghiệp.", note: "" },
  ],
  "/recruitment/plans": [
    { recruitment_plan_id: "plan-demo-01", recruitment_request_id: "req-demo-01", request_code: "YCTD/2026-018", plan_name: "Kế hoạch tuyển Kỹ sư Cloud Quý IV", department_name: "Phòng Cloud và Hạ tầng", start_date: "2026-09-01", end_date: "2026-10-31", budget: 45000000, status: "IN_PROGRESS" },
  ],
  "/recruitment/candidates": [
    { candidate_id: "cand-demo-01", candidate_code: "UV-2026-001", full_name: "Lê Bảo Trâm", citizen_id: "079206001234", date_of_birth: "1998-04-12", gender: "Nữ", phone: "0909123456", email: "tram.lb@example.test", address: "Hà Nội", culture_level: "12/12", education_level: "Cử nhân", education_school: "Đại học Bách khoa", major: "Công nghệ thông tin", gpa: 8.2, experience: "3 năm vận hành Cloud", referrer: "Nguyễn Thùy Linh", referrer_employee_id: "emp-hr-02", source: "LinkedIn", created_date: "2026-08-28", received_date: "2026-08-28", recruitment_request_id: "req-demo-01", apply_position_name: "Kỹ sư Cloud và Hạ tầng", position_id: "pos-cloud-emp", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", attachments_json: [{ name: "CV_LeBaoTram.pdf", file: "CV_LeBaoTram.pdf", note: "CV bản tiếng Việt" }], status: "S2: Phỏng vấn" },
    { candidate_id: "cand-demo-02", candidate_code: "UV-2026-002", full_name: "Vũ Minh Khôi", citizen_id: "001203009876", date_of_birth: "1996-11-03", gender: "Nam", phone: "0903812345", email: "khoi.vm@example.test", address: "Hồ Chí Minh", culture_level: "12/12", education_level: "Thạc sĩ", education_school: "Đại học Kinh tế", major: "Quản trị kinh doanh", gpa: 8.5, experience: "5 năm kinh doanh B2B", referrer: "Phạm Quốc Tuấn", referrer_employee_id: "emp-kd-01", source: "Giới thiệu nội bộ", created_date: "2026-08-25", received_date: "2026-08-25", recruitment_request_id: "req-demo-02", apply_position_name: "Nhân viên Kinh doanh", position_id: "pos-kd-emp", department_id: "dept-kd", department_name: "Phòng Kinh doanh", attachments_json: [], status: "S5: Trúng tuyển" },
  ],
  "/recruitment/pre-screenings": [
    { pre_screening_id: "screen-demo-01", candidate_id: "cand-demo-01", screening_code: "SL/2026-001", candidate_name: "Lê Bảo Trâm", position_name: "Kỹ sư Cloud và Hạ tầng", level_score: 8, screening_result: "ĐẠT", screening_date: "2026-09-02" },
  ],
  "/recruitment/interview-schedules": [
    { schedule_id: "schedule-demo-01", schedule_code: "PV/2026-012", round_type: "Vòng phỏng vấn", format_type: "Online", start_time: "2026-09-10T09:00", location: "Microsoft Teams", status: "Đã lên lịch" },
  ],
  "/recruitment/interview-evaluations": [
    {
      interview_eval_id: "interview-demo-01",
      eval_code: "DGPV/2026-001",
      evaluation_date: "2026-09-03",
      schedule_id: "schedule-demo-01",
      candidate_id: "cand-demo-02",
      candidate_name: "Vũ Minh Khôi",
      schedule_code: "PV/2026-011",
      duration_minutes: 60,
      level_score: 8.5,
      overall_result: "ĐẠT",
      overall_comment: "Kỹ năng tư vấn tốt, phù hợp vị trí.",
      script: [
        {
          script_id: "script-demo-01",
          row_order: 1,
          question: "Hãy mô tả quy trình tư vấn khách hàng doanh nghiệp.",
          expectation: "Trình bày được các bước khám phá nhu cầu và đề xuất giải pháp.",
          answer: "Ứng viên trình bày rõ ràng, có ví dụ thực tế.",
        },
      ],
      criteria: [
        {
          criteria_detail_id: "criteria-detail-demo-01",
          row_order: 1,
          criteria_type: "Năng lực chuyên môn",
          required_from: "Kinh nghiệm tư vấn ERP",
          required_description: "Hiểu quy trình bán hàng giải pháp phần mềm.",
          candidate_value: "Tốt",
          candidate_description: "Có kinh nghiệm tư vấn khách hàng doanh nghiệp.",
          is_passed: 1,
          note: "Đáp ứng yêu cầu",
        },
      ],
    },
  ],
  "/recruitment/decisions": [
    { decision_id: "decision-demo-01", decision_number: "QDTD/2026-001", candidate_id: "cand-demo-02", candidate_name: "Vũ Minh Khôi", decision_date: "2026-09-05", result: "ĐẠT", status: "COMPLETED" },
  ],
  "/recruitment/offers": [
    { offer_id: "offer-demo-01", candidate_code: "UV-2026-002", candidate_name: "Vũ Minh Khôi", offer_date: "2026-09-03", expected_start_date: "2026-09-15", salary_offer: 18000000, offer_status: "Đã chấp nhận" },
  ],
  "/hr/contracts": [
    { contract_id: "contract-demo-01", contract_no: "HDLD/2026/001", employee_id: "emp-hr-02", employee_name: "Nguyễn Thùy Linh", contract_type: "HĐLĐ Xác định thời hạn 12 tháng", start_date: "2026-01-15", end_date: "2027-01-14", status: "ACTIVE" },
  ],
  "/hr/expiring-contracts": [
    { contract_id: "contract-demo-01", contract_no: "HDLD/2026/001", employee_name: "Nguyễn Thùy Linh", department_name: "Phòng Nhân sự", end_date: "2027-01-14", contract_type: "HĐLĐ Xác định thời hạn 12 tháng", status: "ACTIVE" },
  ],
  "/hr/contract-proposals": [
    { proposal_id: "proposal-demo-01", proposal_code: "DXHD/2026-001", employee_name: "Nguyễn Thùy Linh", contract_type: "HĐLĐ Xác định thời hạn 12 tháng", proposed_salary: 18000000, status: "PENDING" },
  ],
  "/hr/contract-extensions": [
    { extension_id: "extension-demo-01", extension_code: "GHD/2026-001", employee_name: "Nguyễn Thùy Linh", contract_no: "HDLD/2026/001", new_end_date: "2028-01-14", new_salary: 20000000, status: "APPROVED" },
  ],
  "/hr/leave-applications": [
    { leave_id: "leave-demo-01", leave_code: "DXNP/2026-001", employee_id: "emp-kd-01", employee_name: "Phạm Quốc Tuấn", start_date: "2026-09-08", end_date: "2026-09-09", total_days: 2, status: "PENDING", reason: "Việc gia đình" },
    { leave_id: "leave-demo-02", leave_code: "DXNP/2026-002", employee_id: "emp-hr-02", employee_name: "Nguyễn Thùy Linh", start_date: "2026-08-29", end_date: "2026-08-29", total_days: 0.5, status: "APPROVED", reason: "Khám sức khỏe" },
  ],
  "/hr/transfer-proposals": [
    { proposal_id: "transfer-demo-01", proposal_code: "DXDC/2026-001", employee_name: "Đặng Việt Dũng", decision_type: "Thuyên chuyển", effective_date: "2026-10-01", status: "PENDING" },
  ],
  "/hr/transfer-decisions": [
    { decision_id: "transfer-decision-demo-01", decision_number: "QDDC/2026-001", employee_name: "Đặng Việt Dũng", target_dept_name: "Phòng Cloud và Hạ tầng", target_pos_name: "Kỹ sư Cloud và Hạ tầng", effective_date: "2026-10-01", status: "DRAFT" },
  ],
  "/hr/resignation-applications": [
    { application_id: "resign-demo-01", application_code: "DXNV/2026-001", employee_name: "Đặng Việt Dũng", desired_resign_date: "2026-10-15", reason: "Thay đổi định hướng cá nhân", status: "PENDING" },
  ],
  "/hr/resignation-decisions": [
    { decision_id: "resign-decision-demo-01", decision_number: "QDNV/2026-001", employee_name: "Đặng Việt Dũng", official_resign_date: "2026-10-15", handover_status: "PENDING", status: "DRAFT" },
  ],
  "/hr/work-history": [
    { work_history_id: "history-demo-01", employee_code: "NV-2024-100", employee_name: "Đặng Việt Dũng", department_name: "Phòng Cloud và Hạ tầng", position_name: "Kỹ sư Cloud và Hạ tầng", decision_type: "Tuyển mới", effective_date: "2024-06-10" },
  ],
  "/reward-discipline/criteria": [
    { criteria_id: "criteria-demo-01", criteria_code: "KPI", criteria_name: "Hoàn thành chỉ tiêu công việc", weight: 40, description: "Kết quả công việc và chất lượng bàn giao" },
    { criteria_id: "criteria-demo-02", criteria_code: "TEAMWORK", criteria_name: "Phối hợp đội nhóm", weight: 20, description: "Tinh thần hợp tác và hỗ trợ đồng đội" },
  ],
  "/reward-discipline/evaluations": [
    { evaluation_id: "evaluation-demo-01", evaluation_code: "DG/2026-001", employee_name: "Nguyễn Thùy Linh", evaluator_name: "Trần Thị Thu Hà", year: 2026, total_score: 9.2, grade_result: "Loại A - Xuất sắc" },
  ],
  "/reward-discipline/proposals": [
    { proposal_id: "reward-proposal-demo-01", proposal_code: "DXKT/2026-001", record_type: "KHEN_THUONG", employee_name: "Nguyễn Thùy Linh", proposed_amount: 5000000, reason: "Hoàn thành vượt chỉ tiêu tuyển dụng Quý III", status: "PENDING" },
  ],
  "/reward-discipline": [
    { reward_discipline_id: "reward-demo-01", decision_no: "QDKT/2026-001", decision_type: "KHEN_THUONG", employee_name: "Nguyễn Thùy Linh", decision_date: "2026-08-30", decision_by: "Bùi Xuân Thức" },
  ],
};

function cloneInitialStore(): MockStore {
  return JSON.parse(JSON.stringify(initialStore)) as MockStore;
}

function loadStore(): MockStore {
  if (typeof window === "undefined") return cloneInitialStore();
  try {
    const saved = window.localStorage.getItem(MOCK_STORE_KEY);
    if (!saved) return cloneInitialStore();
    const store = JSON.parse(saved) as MockStore;
    const quotaDefaults = initialStore["/hr/quotas"]?.[0] ?? {};
    store["/hr/quotas"] = (store["/hr/quotas"] ?? []).map((quota) => ({
      ...quotaDefaults,
      ...quota,
      details: quota.details ?? quotaDefaults.details,
      budget_details: quota.budget_details ?? quotaDefaults.budget_details,
    }));
    return store;
  } catch {
    return cloneInitialStore();
  }
}

function saveStore(store: MockStore) {
  if (typeof window !== "undefined") window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
}

function mockReportResult(reportId: string, filters: Record<string, string>) {
  const definition = reportDefinitions.find((item) => item.id === reportId);
  if (!definition) return { success: false, message: "Không tìm thấy mẫu báo cáo." };
  const makeRow = (index: number) => Object.fromEntries(
    definition.columns.map((column) => {
      if (column.key.includes("date") || column.key.includes("_date") || column.key === "dob" || column.key === "join_date") return [column.key, filters.startDate || "2026-01-01"] as const;
      if (column.key.includes("count") || column.key.includes("quantity") || column.key === "weight" || column.key === "amount" || column.key === "budget") return [column.key, index === 1 ? 8 : 5] as const;
      if (column.key.includes("rate") || column.key === "percentage") return [column.key, "82%"] as const;
      if (column.key.includes("score")) return [column.key, "8.5"] as const;
      return [column.key, index === 1 ? "Dữ liệu mẫu 1" : "Dữ liệu mẫu 2"] as const;
    }),
  );
  return {
    success: true,
    reportId,
    filters,
    data: [makeRow(1), makeRow(2)],
    summary: { total: 2, mock: true },
  };
}

function routeFor(path: string) {
  return Object.keys(idFields).sort((a, b) => b.length - a.length).find((route) => path === route || path.startsWith(`${route}/`)) ?? path;
}

function payloadFor(init: RequestInit): MockRow {
  if (!init.body || typeof init.body !== "string") return {};
  try {
    return JSON.parse(init.body) as MockRow;
  } catch {
    return {};
  }
}

function envelope(data: unknown) {
  return { success: true, data };
}

function failure(message: string) {
  return { success: false, message };
}

function normalized(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function duplicateCandidate(
  candidates: MockRow[],
  payload: MockRow,
  candidateId?: string,
) {
  const fields = ["citizen_id", "phone", "email"];
  return candidates.find(
    (candidate) =>
      String(candidate.candidate_id) !== candidateId &&
      fields.some((field) => {
        const value = normalized(payload[field]);
        return value !== "" && normalized(candidate[field]) === value;
      }),
  );
}

function canConvertCandidate(candidate: MockRow) {
  return ["S5: Trúng tuyển", "PASSED", "ĐẠT"].includes(
    String(candidate.status),
  );
}

export function isMockMode() {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
}

export async function mockApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (path.includes("dashboard")) return dashboardResponse() as T;
  if (path.endsWith("/approval-history") || path.endsWith("/pathway")) return envelope([]) as T;
  if (path === "/reports/query" && (init.method ?? "GET") === "POST") {
    const payload = payloadFor(init);
    return mockReportResult(String(payload.reportId ?? ""), (payload.filters ?? {}) as Record<string, string>) as T;
  }
  if (path === "/reports/departments" && (init.method ?? "GET") === "GET") {
    return envelope(loadStore()["/admin/departments"] ?? []) as T;
  }
  if (path.includes("/employees") && path.includes("/admin/departments/")) {
    const departmentId = path.split("/")[3];
    return envelope(loadStore()["/hr/employees"].filter((employee) => employee.department_id === departmentId)) as T;
  }

  const store = loadStore();
  const route = routeFor(path);
  const idField = idFields[route];
  const segments = path.slice(route.length).split("/").filter(Boolean);
  const id = segments[0];
  const action = segments[1];
  const method = init.method ?? "GET";
  const rows = store[route] ?? [];

  if (path === "/hr/employees/me" && method === "GET") {
    const employee = store["/hr/employees"].find((row) => row.employee_id === "emp-kd-02") ?? store["/hr/employees"][0];
    return envelope(employee ?? null) as T;
  }

  if (method === "GET") {
    if (id) return envelope(rows.find((row) => String(row[idField]) === id) ?? null) as T;
    return envelope(rows) as T;
  }

  const payload = payloadFor(init);
  if (path === "/recruitment/convert-to-employee") {
    const candidate = store["/recruitment/candidates"].find((row) => row.candidate_id === payload.candidate_id);
    if (!candidate) return failure("Không tìm thấy thông tin ứng viên.") as T;
    if (!canConvertCandidate(candidate))
      return failure("Chỉ ứng viên đã trúng tuyển mới được chuyển thành nhân viên.") as T;
    const decision = (store["/recruitment/decisions"] ?? []).find((row) => row.candidate_id === payload.candidate_id && String(row.result ?? "").trim().toUpperCase() === "ĐẠT" && row.status === "COMPLETED");
    if (!decision)
      return failure("Chỉ ứng viên có quyết định trúng tuyển kết quả Đạt mới được chuyển thành nhân viên.") as T;

    const now = new Date();
    const timestamp = now.getTime();
    const offer = store["/recruitment/offers"].find(
      (item) => item.candidate_id === candidate.candidate_id,
    );
    const joinDate = String(
      offer?.expected_start_date ?? now.toISOString().slice(0, 10),
    );
    const position = store["/admin/positions"].find(
      (item) => item.position_id === candidate.position_id,
    );
    const department = store["/admin/departments"].find(
      (item) => item.department_id === position?.department_id,
    );
    const employeeId = `emp-${timestamp}`;
    const contractId = `contract-${timestamp}`;

    candidate.status = "HIRED";
    store["/hr/employees"].unshift({
      employee_id: employeeId,
      employee_code: `NV-${String(timestamp).slice(-6)}`,
      full_name: candidate.full_name,
      citizen_id: candidate.citizen_id,
      phone: candidate.phone,
      email: candidate.email,
      department_id: position?.department_id,
      department_name: department?.department_name,
      position_id: candidate.position_id,
      position_name: candidate.apply_position_name ?? position?.position_name,
      level: "Nhân viên",
      employment_status: "WORKING",
      join_date: joinDate,
    });
    store["/hr/contracts"].unshift({
      contract_id: contractId,
      contract_no: `HDTV/${now.getFullYear()}/${String(timestamp).slice(-6)}`,
      employee_id: employeeId,
      employee_name: candidate.full_name,
      contract_type: "Hợp đồng thử việc (2 tháng)",
      start_date: joinDate,
      end_date: new Date(
        new Date(joinDate).setMonth(new Date(joinDate).getMonth() + 2),
      )
        .toISOString()
        .slice(0, 10),
      base_salary: offer?.official_salary ?? offer?.salary_offer ?? 15000000,
      status: "ACTIVE",
      note: "Tự động tạo khi chuyển từ ứng viên.",
    });
    saveStore(store);
    return envelope({ candidate, employee_id: employeeId, contract_id: contractId }) as T;
  }

  if (route === "/recruitment/candidates" && (method === "POST" || method === "PUT")) {
    const duplicate = duplicateCandidate(rows, payload, method === "PUT" ? id : undefined);
    if (duplicate)
      return failure(
        `Thông tin ứng viên trùng với ${String(duplicate.candidate_code ?? duplicate.full_name)}.`,
      ) as T;
  }

  if (route === "/recruitment/pre-screenings" && (method === "POST" || method === "PUT")) {
    const candidate = store["/recruitment/candidates"].find((item) => String(item.candidate_id) === String(payload.candidate_id));
    if (!candidate) return failure("Không tìm thấy thông tin ứng viên.") as T;
    if (method === "POST" && rows.some((item) => String(item.candidate_id) === String(payload.candidate_id))) return failure("Ứng viên này đã có Phiếu Sơ loại.") as T;
    const screening = method === "PUT" ? rows.find((item) => String(item[idField]) === id) : undefined;
    const nextRow = {
      ...(screening ?? {}),
      ...payload,
      [idField]: String(screening?.[idField] ?? payload[idField] ?? `mock-screening-${Date.now()}`),
      screening_code: String(screening?.screening_code ?? `PSL/${new Date().getFullYear().toString().slice(-2)}-${String(rows.length + 1).padStart(3, "0")}`),
      candidate_name: candidate.full_name,
      candidate_code: candidate.candidate_code,
      position_name: candidate.apply_position_name,
      department_name: candidate.department_name,
    };
    if (method === "POST") rows.unshift(nextRow);
    else {
      const index = rows.findIndex((item) => String(item[idField]) === id);
      if (index < 0) return failure("Không tìm thấy Phiếu Sơ loại.") as T;
      rows[index] = nextRow;
    }
    candidate.status = String(payload.screening_result ?? "").trim().toUpperCase() === "ĐẠT" ? "Đã sơ loại, Đạt" : "Đã sơ loại, Không đạt";
    store[route] = rows;
    saveStore(store);
    return envelope(nextRow) as T;
  }

  if (method === "POST") {
    const newRow = { ...payload, [idField]: String(payload[idField] ?? `mock-${Date.now()}`) };
    rows.unshift(newRow);
    store[route] = rows;
    saveStore(store);
    return envelope(newRow) as T;
  }

  const row = rows.find((item) => String(item[idField]) === id);
  if (!row) return envelope(null) as T;

  if (method === "DELETE") {
    store[route] = rows.filter((item) => String(item[idField]) !== id);
    if (route === "/recruitment/pre-screenings") {
      const candidate = store["/recruitment/candidates"].find((item) => String(item.candidate_id) === String(row.candidate_id));
      if (candidate && !store[route].some((item) => String(item.candidate_id) === String(row.candidate_id))) candidate.status = "Đã tiếp nhận hồ sơ";
    }
    saveStore(store);
    return envelope(row) as T;
  }

  Object.assign(row, payload);
  if (action === "approve" || action === "status") row.status = payload.status ?? "APPROVED";
  saveStore(store);
  return envelope(row) as T;
}

function dashboardResponse() {
  const store = loadStore();
  const employees = store["/hr/employees"];
  const candidates = store["/recruitment/candidates"];
  const requests = store["/recruitment/requests"];
  const pendingItems = [
    ...requests.filter((item) => item.status === "PENDING").map((item) => ({ id: item.recruitment_request_id, code: item.request_code, typeName: "Tuyển dụng", title: item.reason ?? item.position_name, deptName: item.department_name, status: "Chờ duyệt" })),
    ...store["/hr/leave-applications"].filter((item) => item.status === "PENDING").map((item) => ({ id: item.leave_id, code: item.leave_code, typeName: "Nghỉ phép", title: item.reason, employeeName: item.employee_name, status: "Chờ duyệt" })),
    ...store["/hr/transfer-proposals"].filter((item) => item.status === "PENDING").map((item) => ({ id: item.proposal_id, code: item.proposal_code, typeName: "Thuyên chuyển", title: item.decision_type, employeeName: item.employee_name, status: "Chờ duyệt" })),
  ];
  const countByDepartment = store["/admin/departments"].map((department) => ({
    department_name: department.department_name,
    count: employees.filter((employee) => employee.department_id === department.department_id && employee.employment_status === "WORKING").length,
  }));
  return {
    kpi: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((item) => item.employment_status === "WORKING").length,
      openPositionsCount: requests.filter((item) => item.status === "APPROVED" || item.status === "IN_PROGRESS").length,
      processingCandidates: candidates.filter((item) => !["HIRED", "REJECTED"].includes(String(item.status))).length,
      pendingApprovalsCount: pendingItems.length,
    },
    charts: { deptStructure: countByDepartment },
    pendingApprovals: pendingItems,
    pipelineStages: [
      { label: "Mới tiếp nhận", count: candidates.filter((item) => ["NEW", "SUBMITTED"].includes(String(item.status))).length },
      { label: "Phỏng vấn", count: candidates.filter((item) => String(item.status).includes("Phỏng vấn") || item.status === "INTERVIEWED").length },
      { label: "Trúng tuyển", count: candidates.filter((item) => ["S5: Trúng tuyển", "OFFER_ACCEPTED"].includes(String(item.status))).length },
      { label: "Đã tiếp nhận", count: candidates.filter((item) => item.status === "HIRED").length },
    ],
  };
}
