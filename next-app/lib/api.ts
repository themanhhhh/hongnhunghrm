import { canAccess, defaultSession, DEMO_USERS, type Action, type Resource, type Role, type Session } from "./permissions";
import { dashboardData, moduleData } from "./mock-data";
import { isMockMode, mockApiRequest, mockUploadEmployeeAvatar } from "./mock-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export type DashboardData = {
  kpis: Array<{
    label: string;
    value: number | string;
    trend: string;
    tone: "teal" | "amber" | "violet" | "rose";
    detail: string;
  }>;
  departments: Array<{ name: string; count: number; target?: number }>;
  approvals: Array<{
    id?: string;
    code: string;
    type: string;
    title: string;
    owner: string;
    age: string;
    priority: string;
  }>;
  pipeline: Array<{ label: string; count: number }>;
  pipelineFunnel?: Array<{ code: string; label: string; description?: string; count: number }>;
  recruitmentByPosition?: Array<{ position_name: string; department_name?: string; target_headcount: number; hired_count: number }>;
  hrSummary?: HRDashboardSummary;
  hiredCandidates?: HiredCandidate[];
  inProgressCandidates?: InProgressCandidate[];
  focus?: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{
      label: string;
      value: number | string;
      detail: string;
      tone: "teal" | "amber" | "violet" | "rose";
    }>;
  };
  workforce?: WorkforceDashboardData;
};

export type HRDashboardSummary = {
  currentEmployees: number;
  headcountTarget: number;
  fulfillmentRate: number;
  expiringContractsCount: number;
};

export type HiredCandidate = {
  id: string;
  candidate_name: string;
  position_name: string;
  department_name: string;
  hired_date: string | number;
  status_label: string;
};

export type InProgressCandidate = {
  id: string;
  candidate_name: string;
  position_name: string;
  current_stage: string;
  updated_date: string | number;
};

export type WorkforceDashboardData = {
  scopeName: string;
  currentEmployees: number;
  headcountTarget: number;
  fulfillmentRate: number;
  expiringContractsCount: number;
  departments: Array<{ department_name: string; count: number; target?: number }>;
  statuses: Array<{ code: string; label: string; count: number }>;
  expiringContracts: Array<{
    id: string;
    employee_code?: string;
    employee_name: string;
    position_name?: string;
    contract_type: string;
    end_date: string | number;
    days_remaining: number;
    status_label: string;
  }>;
};

export type ReportQueryResult = {
  success: boolean;
  reportId: string;
  filters: Record<string, string>;
  data: Array<Record<string, unknown>>;
  summary: Record<string, unknown>;
};

const fallbackWorkforce: WorkforceDashboardData = {
  scopeName: "Toàn công ty",
  currentEmployees: 146,
  headcountTarget: 175,
  fulfillmentRate: 83,
  expiringContractsCount: 2,
  departments: [
    { department_name: "Khối Kỹ thuật triển khai", count: 42, target: 48 },
    { department_name: "Phòng Kinh doanh", count: 31, target: 36 },
    { department_name: "Phòng Nhân sự", count: 8, target: 8 },
    { department_name: "Phòng Phát triển sản phẩm", count: 27, target: 30 },
  ],
  statuses: [
    { code: "WORKING", label: "Đang làm việc", count: 85 },
    { code: "RESIGNED", label: "Đã nghỉ việc", count: 12 },
    { code: "PROBATION", label: "Đang thử việc", count: 5 },
    { code: "WAITING_FOR_WORK", label: "Chờ nhận việc", count: 3 },
  ],
  expiringContracts: [
    { id: "contract-fallback-01", employee_code: "NV-2024-027", employee_name: "Phạm Quốc Tuấn", position_name: "Trưởng phòng Kinh doanh", contract_type: "HĐLĐ xác định thời hạn", end_date: "2026-09-15", days_remaining: 4, status_label: "Còn 4 ngày" },
    { id: "contract-fallback-02", employee_code: "NV-2024-005", employee_name: "Nguyễn Thùy Linh", position_name: "Nhân viên Nhân sự", contract_type: "HĐLĐ xác định thời hạn", end_date: "2026-09-28", days_remaining: 17, status_label: "Còn 17 ngày" },
  ],
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

function readSession(): Session {
  if (typeof window === "undefined") return defaultSession();
  const raw = window.localStorage.getItem("bravo_next_session");
  return raw ? JSON.parse(raw) : defaultSession();
}

type ApiEnvelope<T> = { success: boolean; data?: T; message?: string; token?: string; user?: Record<string, unknown> };

function toSession(user: Record<string, unknown>): Session {
  return {
    id: String(user.id ?? user.user_id ?? "backend-user"),
    name: String(user.fullName ?? user.full_name ?? "Người dùng BRAVO"),
    username: String(user.username ?? ""),
    role: String(user.roleName ?? user.role_name ?? "Nhân viên") as Session["role"],
    department: String(user.deptName ?? user.department_name ?? ""),
    employeeId: user.employeeId ? String(user.employeeId) : null,
  };
}

function storeSession(session: Session, token?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("bravo_next_session", JSON.stringify(session));
  if (token) window.localStorage.setItem("bravo_next_token", token);
  else window.localStorage.removeItem("bravo_next_token");
}

function demoLogin(username: string, password: string) {
  const user = DEMO_USERS.find((item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password);
  if (!user) return { success: false, message: "Tài khoản demo hoặc mật khẩu không hợp lệ." };
  const { password: _password, ...session } = user;
  storeSession(session);
  return { success: true, session };
}

function unwrap<T>(response: unknown): T | null {
  if (!response || typeof response !== "object") return null;
  if ("data" in response) return (response as ApiEnvelope<T>).data ?? null;
  return response as T;
}

function roleResource(name: keyof typeof moduleData): Resource {
  return name === "people" ? "people" : name;
}

function fallbackDashboard(role: Role): DashboardData {
  const base = dashboardData as DashboardData;
  if (["Administrator", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng"].includes(role)) {
    return {
      ...base,
      kpis: [
        { label: "Nhân sự hiện tại", value: fallbackWorkforce.currentEmployees, trend: fallbackWorkforce.scopeName, tone: "teal", detail: "Tổng số nhân viên đang làm việc" },
        { label: "Định biên nhân sự", value: fallbackWorkforce.headcountTarget, trend: "Được phê duyệt", tone: "violet", detail: "Tổng số nhân sự theo định biên" },
        { label: "Tỷ lệ đáp ứng định biên", value: `${fallbackWorkforce.fulfillmentRate}%`, trend: "Nhân sự hiện tại / định biên", tone: "amber", detail: "Mức độ đáp ứng nguồn lực" },
        { label: "HĐLĐ sắp hết hạn", value: fallbackWorkforce.expiringContractsCount, trend: "Trong 60 ngày", tone: "rose", detail: "Cần rà soát và xử lý" },
      ],
      workforce: fallbackWorkforce,
    };
  }
  if (role === "HR Staff") {
    return {
      ...base,
      kpis: [
        { label: "Yêu cầu tuyển dụng", value: 24, trend: "6 chờ duyệt", tone: "teal", detail: "Điều phối tuyển dụng" },
        { label: "Ứng viên đang xử lý", value: 64, trend: "12 lịch phỏng vấn", tone: "violet", detail: "Theo pipeline tuyển dụng" },
        { label: "Offer cần theo dõi", value: 4, trend: "Trong tháng này", tone: "amber", detail: "Chờ ứng viên phản hồi" },
        { label: "Hồ sơ cần xử lý", value: 9, trend: "Cần ưu tiên", tone: "rose", detail: "Các tác vụ nghiệp vụ HR" },
      ],
      pipelineFunnel: [
        { code: "candidates", label: "Ứng viên", count: 120 },
        { code: "screened", label: "Sơ loại", count: 85 },
        { code: "interviewing", label: "Phỏng vấn", description: "đang phỏng vấn", count: 50 },
        { code: "passed", label: "Đạt", count: 25 },
        { code: "selected", label: "Nhận việc", description: "quyết định tuyển dụng", count: 15 },
        { code: "working", label: "Chính thức", description: "đi làm", count: 12 },
      ],
      recruitmentByPosition: [
        { position_name: "Nhân viên Kinh doanh", department_name: "Kinh doanh", target_headcount: 20, hired_count: 12 },
        { position_name: "Tester", department_name: "Công nghệ", target_headcount: 15, hired_count: 9 },
        { position_name: "Chuyên viên BA", department_name: "Sản phẩm", target_headcount: 10, hired_count: 6 },
      ],
    };
  }
  if (role === "Nhân viên") {
    return {
      ...base,
      kpis: [
        { label: "Phép còn lại", value: 8, trend: "Năm 2026", tone: "teal", detail: "Ngày phép khả dụng" },
        { label: "Đơn nghỉ phép", value: 1, trend: "Đang chờ duyệt", tone: "amber", detail: "Của bạn" },
        { label: "Điểm đánh giá gần nhất", value: "8.7 / 10", trend: "Loại A", tone: "violet", detail: "Kỳ đánh giá gần nhất" },
        { label: "Hợp đồng", value: "Hiệu lực", trend: "Đang làm việc", tone: "rose", detail: "Tình trạng hồ sơ" },
      ],
      departments: [],
      pipeline: [],
    };
  }
  return {
    ...base,
    kpis: [
      { label: "Nhân sự trong đơn vị", value: 31, trend: "Đang làm việc", tone: "teal", detail: "Phạm vi quản lý" },
      { label: "Yêu cầu tuyển dụng", value: 5, trend: "2 đang xử lý", tone: "amber", detail: "Của đơn vị" },
      { label: "Ứng viên đang xử lý", value: 12, trend: "Trong pipeline", tone: "violet", detail: "Theo nhu cầu đơn vị" },
      { label: "Phiếu cần phê duyệt", value: 3, trend: "Cần xử lý", tone: "rose", detail: "Trong phạm vi đơn vị" },
    ],
  };
}

export const api = {
  async request<T>(path: string, init: RequestInit = {}, permission?: { resource: Resource; action?: Action }): Promise<T> {
    const session = readSession();
    if (permission && !canAccess(session, permission.resource, permission.action)) {
      throw new ApiError("Bạn không có quyền thực hiện thao tác này.", 403);
    }

    if (isMockMode()) return mockApiRequest<T>(path, init, session);

    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    const token = typeof window !== "undefined" ? window.localStorage.getItem("bravo_next_token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    try {
      const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as ApiEnvelope<unknown> | null;
      if (response.status >= 500) return mockApiRequest<T>(path, init, session);
        throw new ApiError(body?.message ?? `API request failed: ${response.status}`, response.status);
      }
      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) throw error;
      return mockApiRequest<T>(path, init, session);
    }
  },
  async dashboard(): Promise<DashboardData> {
    const session = readSession();
    const endpoint = ["Administrator", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng"].includes(session.role) ? "/reports/dashboard/workforce" : session.role === "HR Staff" ? "/reports/dashboard/hr" : session.role === "Nhân viên" ? "/reports/dashboard/employee" : "/reports/dashboard/summary";
    const result = await this.request<ApiEnvelope<Record<string, unknown>>>(endpoint, {}, { resource: "dashboard" });
    const source = unwrap<Record<string, unknown>>(result);
    if (!source) return fallbackDashboard(session.role);
    const sourceKpi = (source.kpi ?? source) as Record<string, number>;
    if (source.workforce && typeof source.workforce === "object") {
      const raw = source.workforce as Record<string, unknown>;
      const departments = Array.isArray(raw.departments)
        ? raw.departments.map((item) => {
            const row = item as Record<string, unknown>;
            return { department_name: String(row.department_name ?? "Chưa phân loại"), count: Number(row.count ?? 0), target: row.target === undefined ? undefined : Number(row.target ?? 0) };
          })
        : [];
      const statuses = Array.isArray(raw.statuses)
        ? raw.statuses.map((item) => {
            const row = item as Record<string, unknown>;
            return { code: String(row.code ?? ""), label: String(row.label ?? "Trạng thái"), count: Number(row.count ?? 0) };
          })
        : [];
      const expiringContracts = Array.isArray(raw.expiringContracts)
        ? raw.expiringContracts.map((item) => {
            const row = item as Record<string, unknown>;
            return { id: String(row.id ?? ""), employee_code: row.employee_code ? String(row.employee_code) : undefined, employee_name: String(row.employee_name ?? "-"), position_name: row.position_name ? String(row.position_name) : undefined, contract_type: String(row.contract_type ?? "-"), end_date: (row.end_date ?? "") as string | number, days_remaining: Number(row.days_remaining ?? 0), status_label: String(row.status_label ?? "") };
          })
        : [];
      const workforce: WorkforceDashboardData = { scopeName: String(source.scopeName ?? "Toàn công ty"), currentEmployees: Number(raw.currentEmployees ?? 0), headcountTarget: Number(raw.headcountTarget ?? 0), fulfillmentRate: Number(raw.fulfillmentRate ?? 0), expiringContractsCount: Number(raw.expiringContractsCount ?? expiringContracts.length), departments, statuses, expiringContracts };
      return { kpis: [{ label: "Nhân sự hiện tại", value: workforce.currentEmployees, trend: workforce.scopeName, tone: "teal", detail: "Tổng số nhân viên đang làm việc" }, { label: "Định biên nhân sự", value: workforce.headcountTarget, trend: "Được phê duyệt", tone: "violet", detail: "Tổng số nhân sự theo định biên" }, { label: "Tỷ lệ đáp ứng định biên", value: `${workforce.fulfillmentRate}%`, trend: "Nhân sự hiện tại / định biên", tone: "amber", detail: "Mức độ đáp ứng nguồn lực" }, { label: "HĐLĐ sắp hết hạn", value: workforce.expiringContractsCount, trend: "Trong 60 ngày", tone: "rose", detail: "Cần rà soát và xử lý" }], departments: workforce.departments.map((item) => ({ name: item.department_name, count: item.count, target: item.target })), approvals: [], pipeline: [], workforce };
    }
    if (sourceKpi && "totalUsers" in sourceKpi) {
      return { kpis: [{ label: "Tổng số tài khoản", value: sourceKpi.totalUsers ?? 0, trend: `${sourceKpi.activeUsers ?? 0} hoạt động`, tone: "teal", detail: "Quản trị hệ thống" }, { label: "Tài khoản bị khóa", value: sourceKpi.lockedUsers ?? 0, trend: "Cần theo dõi", tone: "rose", detail: "Bảo mật tài khoản" }, { label: "Tổng số phòng ban", value: sourceKpi.totalDepartments ?? 0, trend: `${sourceKpi.totalEmployees ?? 0} nhân sự`, tone: "violet", detail: "Sơ đồ tổ chức" }, { label: "Tổng số vị trí", value: sourceKpi.totalPositions ?? 0, trend: "Danh mục dùng chung", tone: "amber", detail: "Vị trí công việc" }], departments: ((source.employeesByDept ?? []) as Array<Record<string, unknown>>).map((item) => ({ name: String(item.department_name ?? "Chưa phân loại"), count: Number(item.count ?? 0) })), approvals: [], pipeline: [], focus: { eyebrow: "SYSTEM CONTROL", title: "Sức khỏe hệ thống", description: "Theo dõi người dùng, danh mục và cấu trúc tổ chức trong một màn hình quản trị.", items: [{ label: "Tài khoản hoạt động", value: sourceKpi.activeUsers ?? 0, detail: `Trên ${sourceKpi.totalUsers ?? 0} tài khoản`, tone: "teal" }, { label: "Tài khoản bị khóa", value: sourceKpi.lockedUsers ?? 0, detail: "Cần rà soát bảo mật", tone: "rose" }, { label: "Phòng ban", value: sourceKpi.totalDepartments ?? 0, detail: "Đang hoạt động", tone: "violet" }, { label: "Vị trí công việc", value: sourceKpi.totalPositions ?? 0, detail: "Danh mục dùng chung", tone: "amber" }] } };
    }
    if (session.role === "Ban Giám Đốc") {
      const recruitment = source.recruitmentOverview as Record<string, number> | undefined;
      const pendingApprovals = (source.pendingApprovals ?? []) as Array<Record<string, unknown>>;
      return { kpis: [{ label: "Nhân sự đang làm việc", value: sourceKpi.activeEmployees ?? sourceKpi.totalEmployees ?? 0, trend: `+${sourceKpi.newEmployeesPeriod ?? 0} từ đầu năm`, tone: "teal", detail: "Toàn doanh nghiệp" }, { label: "Tuyển dụng đang mở", value: sourceKpi.openPositionsCount ?? 0, trend: `${sourceKpi.pendingRequestsCount ?? 0} yêu cầu chờ duyệt`, tone: "amber", detail: "Theo kế hoạch nhân sự" }, { label: "Nghỉ việc từ đầu năm", value: sourceKpi.resignedEmployeesPeriod ?? 0, trend: "Cần theo dõi", tone: "rose", detail: "Biến động nhân sự" }, { label: "Phiếu chờ phê duyệt", value: sourceKpi.pendingApprovalsCount ?? pendingApprovals.length, trend: "Cấp Ban Giám Đốc", tone: "violet", detail: "Quyết định cần xem xét" }], departments: ((source.deptStructure ?? []) as Array<Record<string, unknown>>).map((item) => ({ name: String(item.department_name ?? "Chưa phân loại"), count: Number(item.count ?? 0) })), approvals: pendingApprovals.map((item) => ({ id: String(item.id ?? ""), code: String(item.code ?? "CHỜ DUYỆT"), type: String(item.typeName ?? item.type ?? "Nghiệp vụ"), title: String(item.title ?? item.reason ?? item.employeeName ?? "Chứng từ cần xem xét"), owner: String(item.employeeName ?? item.currentLevel ?? "Cấp Ban Giám Đốc"), age: String(item.status ?? "Đang chờ xử lý"), priority: "Cần phê duyệt" })), pipeline: [], focus: { eyebrow: "EXECUTIVE VIEW", title: "Tình hình nhân sự và tuyển dụng", description: "Tập trung vào quy mô, biến động và các quyết định cần Ban Giám Đốc xem xét.", items: [{ label: "Tuyển mới từ đầu năm", value: sourceKpi.newEmployeesPeriod ?? 0, detail: "Nhân sự gia nhập", tone: "teal" }, { label: "Nghỉ việc từ đầu năm", value: sourceKpi.resignedEmployeesPeriod ?? 0, detail: "Biến động cần theo dõi", tone: "rose" }, { label: "Đã tuyển / mục tiêu", value: `${recruitment?.totalHired ?? 0} / ${recruitment?.totalTarget ?? 0}`, detail: `${recruitment?.completionRate ?? 0}% hoàn thành`, tone: "violet" }, { label: "Còn thiếu nhân sự", value: recruitment?.remainingShortfall ?? 0, detail: "Theo nhu cầu tuyển dụng", tone: "amber" }] } };
    }
    if (session.role === "Nhân viên") {
      const personal = source.personal as Record<string, unknown> | undefined;
      const pendingLeaves = (source.pendingApprovals ?? []) as Array<Record<string, unknown>>;
      return { kpis: [{ label: "Phép còn lại", value: sourceKpi.remainingLeave ?? 0, trend: `Năm ${String(personal?.leaveYear ?? new Date().getFullYear())}`, tone: "teal", detail: "Ngày phép khả dụng" }, { label: "Đơn nghỉ phép", value: sourceKpi.pendingLeaveCount ?? pendingLeaves.length, trend: "Đang chờ duyệt", tone: "amber", detail: "Của bạn" }, { label: "Điểm đánh giá gần nhất", value: personal?.latestScore ? `${String(personal.latestScore)} / 10` : "Chưa có", trend: String(personal?.latestGrade ?? "Chưa xếp loại"), tone: "violet", detail: "Kỳ đánh giá gần nhất" }, { label: "Hợp đồng", value: String(personal?.contractStatus ?? "Chưa cập nhật"), trend: String(personal?.employmentStatus ?? ""), tone: "rose", detail: "Tình trạng hồ sơ" }], departments: [], approvals: pendingLeaves.map((item) => ({ id: String(item.id ?? ""), code: String(item.code ?? "ĐƠN PHÉP"), type: "Nghỉ phép", title: String(item.title ?? item.reason ?? "Đơn nghỉ phép"), owner: "Hồ sơ của bạn", age: String(item.status ?? "Đang chờ xử lý"), priority: "Theo dõi" })), pipeline: [], focus: { eyebrow: "MY WORKSPACE", title: "Thông tin cá nhân", description: "Theo dõi ngày phép, đánh giá và hồ sơ lao động của chính bạn.", items: [{ label: "Phép đã dùng", value: Number(personal?.usedLeave ?? 0), detail: `Trên ${String(personal?.entitledLeave ?? 0)} ngày được hưởng`, tone: "amber" }, { label: "Ngày vào làm", value: String(personal?.joinDate ?? "Chưa cập nhật"), detail: String(personal?.department ?? ""), tone: "teal" }, { label: "Đánh giá gần nhất", value: personal?.latestScore ? `${String(personal.latestScore)} / 10` : "Chưa có", detail: String(personal?.latestGrade ?? "Chưa xếp loại"), tone: "violet" }, { label: "Quản lý trực tiếp", value: String(personal?.managerName ?? "Chưa cập nhật"), detail: "Liên hệ khi cần hỗ trợ", tone: "rose" }] } };
    }
    if ("totalEmployees" in sourceKpi || "totalRequests" in sourceKpi) {
      const kpi = sourceKpi;
      const actionNeeded = source.actionNeeded as Record<string, Record<string, unknown[]>> | undefined;
      const charts = source.charts as Record<string, unknown[]> | undefined;
      const pendingApprovals = (source.pendingApprovals ?? source.pendingTasks ?? actionNeeded?.recruitment?.pendingRequests ?? []) as Array<Record<string, unknown>>;
      const actionCount = pendingApprovals.length || Number(kpi.pendingApprovalsCount ?? kpi.pendingRequests ?? 0);
      const pipelineFunnel = Array.isArray(source.pipelineFunnel)
        ? source.pipelineFunnel.map((item) => {
            const row = item as Record<string, unknown>;
            return { code: String(row.code ?? ""), label: String(row.label ?? "Giai đoạn"), description: row.description ? String(row.description) : undefined, count: Number(row.count ?? 0) };
          })
        : undefined;
      const recruitmentByPosition = Array.isArray(source.recruitmentByPosition)
        ? source.recruitmentByPosition.map((item) => {
            const row = item as Record<string, unknown>;
            return { position_name: String(row.position_name ?? "Chưa xác định"), department_name: row.department_name ? String(row.department_name) : undefined, target_headcount: Number(row.target_headcount ?? 0), hired_count: Number(row.hired_count ?? 0) };
          })
        : undefined;
      const hiredCandidates = Array.isArray(actionNeeded?.recruitment?.hiredCandidates)
        ? actionNeeded.recruitment.hiredCandidates.map((item) => {
            const row = item as Record<string, unknown>;
            return { id: String(row.id ?? ""), candidate_name: String(row.candidate_name ?? "-"), position_name: String(row.position_name ?? "-"), department_name: String(row.department_name ?? "-"), hired_date: (row.hired_date ?? "") as string | number, status_label: String(row.status_label ?? "-") };
          })
        : undefined;
      const inProgressCandidates = Array.isArray(actionNeeded?.recruitment?.inProgressCandidates)
        ? actionNeeded.recruitment.inProgressCandidates.map((item) => {
            const row = item as Record<string, unknown>;
            return { id: String(row.id ?? ""), candidate_name: String(row.candidate_name ?? "-"), position_name: String(row.position_name ?? "-"), current_stage: String(row.current_stage ?? "-"), updated_date: (row.updated_date ?? "") as string | number };
          })
        : undefined;
      const hrSummary = session.role === "HR Staff" ? {
        currentEmployees: Number(kpi.currentEmployees ?? 0),
        headcountTarget: Number(kpi.headcountTarget ?? 0),
        fulfillmentRate: Number(kpi.fulfillmentRate ?? 0),
        expiringContractsCount: Number(kpi.expiringContractsCount ?? actionNeeded?.hr?.expiringContracts?.length ?? 0),
      } : undefined;
      const dashboardKpis = session.role === "HR Staff" && hrSummary ? [
        { label: "Định biên", value: hrSummary.headcountTarget, trend: "Theo các vị trí", tone: "violet" as const, detail: "Tổng số định biên theo các vị trí" },
        { label: "Nhân sự hiện tại", value: hrSummary.currentEmployees, trend: "Đang làm việc", tone: "teal" as const, detail: "Tổng số nhân viên đang làm việc" },
        { label: "Số lượng cần tuyển", value: `${hrSummary.fulfillmentRate}%`, trend: "Mức độ đáp ứng", tone: "amber" as const, detail: "Nhân sự hiện tại / Định biên × 100%" },
        { label: "Ứng viên đang tuyển", value: Number(kpi.processingCandidates ?? 0), trend: "Trong quy trình", tone: "teal" as const, detail: "Ứng viên đang trong quy trình tuyển dụng" },
        { label: "HĐLĐ sắp hết hạn", value: hrSummary.expiringContractsCount, trend: "Trong 60 ngày", tone: "rose" as const, detail: "Cảnh báo cần xử lý" },
      ] : session.role === "HR Staff" ? [
        { label: "Yêu cầu tuyển dụng", value: kpi.totalRequests ?? 0, trend: `${kpi.pendingRequests ?? 0} chờ duyệt`, tone: "teal" as const, detail: "Điều phối tuyển dụng" },
        { label: "Ứng viên đang xử lý", value: kpi.processingCandidates ?? kpi.totalCandidates ?? 0, trend: `${kpi.upcomingInterviews ?? 0} lịch phỏng vấn`, tone: "violet" as const, detail: "Theo pipeline tuyển dụng" },
        { label: "Offer cần theo dõi", value: kpi.pendingOffers ?? 0, trend: "Chờ ứng viên phản hồi", tone: "amber" as const, detail: "Công việc tuyển dụng" },
        { label: "Hồ sơ cần xử lý", value: actionCount, trend: actionCount ? "Cần ưu tiên" : "Không có phiếu tồn", tone: "rose" as const, detail: "Các tác vụ nghiệp vụ HR" },
      ] : [
        { label: "Nhân sự trong đơn vị", value: kpi.activeEmployees ?? kpi.totalEmployees ?? 0, trend: "Đang làm việc", tone: "teal" as const, detail: "Phạm vi quản lý" },
        { label: "Yêu cầu tuyển dụng", value: kpi.openPositionsCount ?? kpi.recruitingRequests ?? kpi.totalRequests ?? 0, trend: `${kpi.pendingRequests ?? 0} đang xử lý`, tone: "amber" as const, detail: "Của đơn vị" },
        { label: "Ứng viên đang xử lý", value: kpi.processingCandidates ?? kpi.totalCandidates ?? 0, trend: "Trong pipeline", tone: "violet" as const, detail: "Theo nhu cầu đơn vị" },
        { label: "Phiếu cần phê duyệt", value: actionCount, trend: actionCount ? "Cần xử lý" : "Không có phiếu tồn", tone: "rose" as const, detail: "Trong phạm vi đơn vị" },
      ];
      return {
        kpis: dashboardKpis,
        departments: ((charts?.deptStructure ?? source.deptStructure ?? []) as Array<Record<string, unknown>>).map((item) => ({ name: String(item.department_name ?? "Chưa phân loại"), count: Number(item.count ?? 0) })),
        approvals: pendingApprovals.map((item) => ({ id: String(item.id ?? ""), code: String(item.code ?? "CHỜ DUYỆT"), type: String(item.typeName ?? item.type ?? "Nghiệp vụ"), title: String(item.title ?? item.reason ?? item.positionName ?? item.employeeName ?? "Chứng từ cần xem xét"), owner: String(item.deptName ?? item.employeeName ?? item.currentLevel ?? "Chưa xác định"), age: String(item.status ?? "Đang chờ xử lý"), priority: String(item.priority ?? "Chờ duyệt") })),
        pipeline: ((source.pipelineStages ?? []) as Array<Record<string, unknown>>).map((item) => ({ label: String(item.label ?? item.status ?? "Giai đoạn"), count: Number(item.count ?? 0) })),
        pipelineFunnel,
        recruitmentByPosition,
        hrSummary,
        hiredCandidates,
        inProgressCandidates,
        focus: { eyebrow: session.role === "HR Staff" ? "HR OPERATIONS" : "TEAM MANAGEMENT", title: session.role === "HR Staff" ? "Bảng điều phối nhân sự" : `Tình hình ${session.department || "đơn vị"}`, description: session.role === "HR Staff" ? "Ưu tiên các hồ sơ tuyển dụng và tác vụ nhân sự cần xử lý trong ngày." : "Theo dõi nhân sự, tuyển dụng và các phiếu đang chờ trong phạm vi đơn vị.", items: session.role === "HR Staff" ? [{ label: "Yêu cầu chờ duyệt", value: kpi.pendingRequests ?? 0, detail: "Cần rà soát", tone: "amber" }, { label: "Ứng viên cần xử lý", value: kpi.processingCandidates ?? 0, detail: "Trong pipeline", tone: "violet" }, { label: "Phỏng vấn sắp tới", value: kpi.upcomingInterviews ?? 0, detail: "Đã lên lịch", tone: "teal" }, { label: "Offer đang mở", value: kpi.pendingOffers ?? 0, detail: "Chờ phản hồi", tone: "rose" }] : [{ label: "Nhân sự đang làm việc", value: kpi.activeEmployees ?? kpi.totalEmployees ?? 0, detail: "Trong phạm vi quản lý", tone: "teal" }, { label: "Tuyển dụng đang mở", value: kpi.openPositionsCount ?? 0, detail: "Theo nhu cầu đơn vị", tone: "amber" }, { label: "Ứng viên đang xử lý", value: kpi.processingCandidates ?? 0, detail: "Trong pipeline", tone: "violet" }, { label: "Phiếu chờ xử lý", value: actionCount, detail: "Cần xem xét", tone: "rose" }] },
      };
    }
    return fallbackDashboard(session.role);
  },
  async queryReport(reportId: string, filters: Record<string, string>) {
    return this.request<ReportQueryResult>(
      "/reports/query",
      { method: "POST", body: JSON.stringify({ reportId, filters }) },
      { resource: "reports" },
    );
  },
  async uploadEmployeeAvatar(employeeId: string, file: File) {
    const session = readSession();
    if (!canAccess(session, "people", "edit")) {
      throw new ApiError("Bạn không có quyền thay ảnh hồ sơ nhân viên.", 403);
    }
    if (isMockMode()) return mockUploadEmployeeAvatar(employeeId, file);

    const formData = new FormData();
    formData.append("avatar", file);
    const headers = new Headers();
    const token = typeof window !== "undefined" ? window.localStorage.getItem("bravo_next_token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    try {
      const response = await fetch(`${API_URL}/hr/employees/${employeeId}/avatar`, {
        method: "POST",
        headers,
        body: formData,
      });
      const body = await response.json().catch(() => null) as ApiEnvelope<{ avatarUrl: string }> | null;
      if (response.status >= 500) return { avatarUrl: URL.createObjectURL(file) };
      if (!response.ok || !body?.success || !body.data?.avatarUrl) {
        throw new ApiError(body?.message ?? "Không thể tải ảnh hồ sơ.", response.status);
      }
      return body.data;
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) throw error;
      return { avatarUrl: URL.createObjectURL(file) };
    }
  },
  async login(username: string, password: string) {
    if (isMockMode()) return demoLogin(username, password);
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const body = await response.json() as ApiEnvelope<unknown>;
      if (response.status >= 500) return demoLogin(username, password);
      if (!response.ok || !body.success || !body.user) return { success: false, message: body.message ?? "Đăng nhập thất bại." };
      const session = toSession(body.user);
      storeSession(session, body.token);
      return { success: true, session };
    } catch {
      return demoLogin(username, password);
    }
  },
  async module(name: keyof typeof moduleData) {
    const permission = { resource: roleResource(name) } as const;
    if (name === "recruitment") {
      const response = await this.request<ApiEnvelope<Array<Record<string, unknown>>>>("/recruitment/requests", {}, permission);
      const rows = unwrap<Array<Record<string, unknown>>>(response);
      if (rows && rows.length > 0) return { ...moduleData.recruitment, rows: rows.map((item) => [String(item.request_code ?? "YCTD"), String(item.position_name ?? "Vị trí tuyển dụng"), String(item.department_name ?? "-"), String(item.quantity ?? 0), Number(item.is_outside_headcount) ? "Ngoài định biên" : "Trong định biên", String(item.status ?? "PENDING")]) };
    }
    if (name === "people") {
      const response = await this.request<ApiEnvelope<Array<Record<string, unknown>>>>("/hr/employees", {}, permission);
      const rows = unwrap<Array<Record<string, unknown>>>(response);
      if (rows && rows.length > 0) return { ...moduleData.people, rows: rows.map((item) => [String(item.employee_code ?? "NV"), String(item.full_name ?? "-"), String(item.department_name ?? "-"), String(item.level ?? item.position_name ?? "Nhân viên"), item.join_date ? new Date(Number(item.join_date)).toLocaleDateString("vi-VN") : "-", "Đang làm việc"]) };
    }
    if (name === "rewards") {
      const response = await this.request<ApiEnvelope<Array<Record<string, unknown>>>>("/reward-discipline/evaluations", {}, permission);
      const rows = unwrap<Array<Record<string, unknown>>>(response);
      if (rows && rows.length > 0) return { ...moduleData.rewards, rows: rows.map((item) => [String(item.evaluation_code ?? "PĐG"), String(item.employee_name ?? "-"), String(item.department_name ?? "-"), `${item.total_score ?? 0} / 10`, String(item.grade_result ?? "-"), "Đã hoàn tất"]) };
    }
    if (name === "reports") {
      const response = await this.request<ApiEnvelope<Array<Record<string, unknown>>>>("/reports/query", { method: "POST", body: JSON.stringify({ reportId: "hr_summary", filters: {} }) }, permission);
      const rows = unwrap<Array<Record<string, unknown>>>(response);
      if (rows && rows.length > 0) return { ...moduleData.reports, rows: rows.map((item) => [String(item.dept_code ?? "BC-HR"), String(item.dept_name ?? "-"), String(item.total_emp ?? 0), String(item.male_count ?? 0), String(item.female_count ?? 0), "Sẵn sàng"]) };
    }
    return moduleData[name];
  },
  async admin() {
    const getList = async (path: string) => unwrap<Array<Record<string, unknown>>>(await this.request<ApiEnvelope<Array<Record<string, unknown>>>>(path, {}, { resource: "admin" })) ?? [];
    const [users, departments, positions, contractTypes, roles, employees] = await Promise.all([getList("/admin/users"), getList("/admin/departments"), getList("/admin/positions"), getList("/admin/contract-types"), getList("/admin/roles"), getList("/hr/employees")]);
    return { users: users.length ? users.length : 24, departments: departments.length ? departments.length : 14, positions: positions.length ? positions.length : 38, contractTypes: contractTypes.length ? contractTypes.length : 6, userRows: users, departmentsList: departments, positionsList: positions, rolesList: roles, employeesList: employees };
  },
  async list(path: string, permission?: { resource: Resource; action?: Action }) {
    const response = await this.request<ApiEnvelope<unknown>>(path, {}, permission);
    const value = unwrap<unknown>(response);
    if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
    return value && typeof value === "object" ? [value as Record<string, unknown>] : [];
  },
  async write(path: string, method: "POST" | "PUT", payload: Record<string, unknown>, permission?: { resource: Resource; action?: Action }) {
    const response = await this.request<ApiEnvelope<unknown>>(path, { method, body: JSON.stringify(payload) }, permission);
    if (response && typeof response === "object" && "success" in response && !(response as ApiEnvelope<unknown>).success) {
      throw new ApiError((response as ApiEnvelope<unknown>).message ?? "Không thể lưu dữ liệu.", 400);
    }
    return response;
  },
  async remove(path: string, permission?: { resource: Resource; action?: Action }) {
    return this.request<ApiEnvelope<unknown>>(path, { method: "DELETE" }, permission);
  },
  create(name: keyof typeof moduleData, payload: Record<string, string>) {
    if (name === "recruitment") return this.request("/recruitment/requests", { method: "POST", body: JSON.stringify({ request_code: `YCTD/${Date.now()}`, department_id: "dept-hr", position_id: "pos-hr-emp", requested_by: "emp-hr-02", quantity: 1, reason: payload.title, expected_date: new Date(Date.now() + 30 * 86400000).toISOString(), note: payload.note ?? "" }) }, { resource: "recruitment", action: "create" });
    if (name === "people") return this.request("/hr/employees", { method: "POST", body: JSON.stringify({ full_name: payload.title, email: `${Date.now()}@bravo.com.vn`, phone: "0900000000", department_id: "dept-hr", position_id: "pos-hr-emp", employment_status: "WORKING" }) }, { resource: "people", action: "create" });
    return this.request("/reward-discipline/proposals", { method: "POST", body: JSON.stringify({ record_type: "KHEN_THUONG", employee_id: "emp-hr-02", reason: payload.title, payment_method: "CASH", proposed_by: readSession().name }) }, { resource: "rewards", action: "create" });
  },
};
