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
    { quota_id: "quota-demo-01", quota_code: "DB/2026-001", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", target_headcount: 10, current_headcount: 7, needed_headcount: 3, max_capacity: 12, budget: 180000000, status: "Đang duyệt" },
  ],
  "/recruitment/requests": [
    { recruitment_request_id: "req-demo-01", request_code: "YCTD/2026-018", department_id: "dept-cloud", department_name: "Phòng Cloud và Hạ tầng", position_id: "pos-cloud-emp", position_name: "Kỹ sư Cloud và Hạ tầng", requested_by: "emp-cloud-01", quantity: 3, priority: "HIGH", status: "PENDING", reason: "Bổ sung nhân sự trực vận hành." },
    { recruitment_request_id: "req-demo-02", request_code: "YCTD/2026-019", department_id: "dept-kd", department_name: "Phòng Kinh doanh", position_id: "pos-kd-emp", position_name: "Nhân viên Kinh doanh", requested_by: "emp-kd-01", quantity: 2, priority: "MEDIUM", status: "APPROVED", reason: "Mở rộng khách hàng doanh nghiệp." },
  ],
  "/recruitment/plans": [
    { recruitment_plan_id: "plan-demo-01", recruitment_request_id: "req-demo-01", request_code: "YCTD/2026-018", plan_name: "Kế hoạch tuyển Kỹ sư Cloud Quý IV", department_name: "Phòng Cloud và Hạ tầng", start_date: "2026-09-01", end_date: "2026-10-31", budget: 45000000, status: "IN_PROGRESS" },
  ],
  "/recruitment/candidates": [
    { candidate_id: "cand-demo-01", candidate_code: "UV-2026-001", full_name: "Lê Bảo Trâm", apply_position_name: "Kỹ sư Cloud và Hạ tầng", position_id: "pos-cloud-emp", phone: "0909123456", email: "tram.lb@example.test", source: "LinkedIn", status: "S2: Phỏng vấn" },
    { candidate_id: "cand-demo-02", candidate_code: "UV-2026-002", full_name: "Vũ Minh Khôi", apply_position_name: "Nhân viên Kinh doanh", position_id: "pos-kd-emp", phone: "0903812345", email: "khoi.vm@example.test", source: "Referral", status: "S5: Trúng tuyển" },
  ],
  "/recruitment/pre-screenings": [
    { pre_screening_id: "screen-demo-01", screening_code: "SL/2026-001", candidate_name: "Lê Bảo Trâm", position_name: "Kỹ sư Cloud và Hạ tầng", level_score: 8, screening_result: "ĐẠT", screening_date: "2026-09-02" },
  ],
  "/recruitment/interview-schedules": [
    { schedule_id: "schedule-demo-01", schedule_code: "PV/2026-012", round_type: "Vòng phỏng vấn", format_type: "Online", start_time: "2026-09-10T09:00", location: "Microsoft Teams", status: "Đã lên lịch" },
  ],
  "/recruitment/interview-evaluations": [
    { interview_eval_id: "interview-demo-01", eval_code: "DGPV/2026-001", candidate_name: "Vũ Minh Khôi", schedule_code: "PV/2026-011", level_score: 8.5, overall_result: "ĐẠT", overall_comment: "Kỹ năng tư vấn tốt, phù hợp vị trí." },
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
    return saved ? JSON.parse(saved) as MockStore : cloneInitialStore();
  } catch {
    return cloneInitialStore();
  }
}

function saveStore(store: MockStore) {
  if (typeof window !== "undefined") window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
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
    saveStore(store);
    return envelope(row) as T;
  }

  Object.assign(row, payload);
  if (action === "approve" || action === "status") row.status = payload.status ?? "APPROVED";
  saveStore(store);
  return envelope(row) as T;
}

function dashboardResponse() {
  return {
    kpi: {
      totalEmployees: 3,
      activeEmployees: 3,
      openPositionsCount: 3,
      processingCandidates: 2,
      pendingApprovalsCount: 3,
    },
    charts: { deptStructure: loadStore()["/admin/departments"].map((department) => ({ department_name: department.department_name, count: 1 })) },
    pipelineStages: [{ label: "Mới tiếp nhận", count: 1 }, { label: "Phỏng vấn", count: 1 }, { label: "Offer", count: 1 }],
  };
}
