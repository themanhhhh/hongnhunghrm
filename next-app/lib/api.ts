import { canAccess, defaultSession, DEMO_USERS, type Action, type Resource, type Session } from "./permissions";
import { dashboardData, moduleData } from "./mock-data";
import { isMockMode, mockApiRequest } from "./mock-api";

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

export const api = {
  async request<T>(path: string, init: RequestInit = {}, permission?: { resource: Resource; action?: Action }): Promise<T> {
    const session = readSession();
    if (permission && !canAccess(session, permission.resource, permission.action)) {
      throw new ApiError("Bạn không có quyền thực hiện thao tác này.", 403);
    }

    if (isMockMode()) return mockApiRequest<T>(path, init);

    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    headers.set("X-HRM-Role", session.role);
    const token = typeof window !== "undefined" ? window.localStorage.getItem("bravo_next_token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    try {
      const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as ApiEnvelope<unknown> | null;
        throw new ApiError(body?.message ?? `API request failed: ${response.status}`, response.status);
      }
      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      return mockApiRequest<T>(path, init);
    }
  },
  async dashboard(): Promise<DashboardData> {
    const session = readSession();
    const endpoint = session.role === "Administrator" ? "/reports/dashboard/admin" : session.role === "HR Staff" ? "/reports/dashboard/hr" : session.role === "Ban Giám Đốc" ? "/reports/dashboard/bgd" : "/reports/dashboard/summary";
    const result = await this.request<ApiEnvelope<Record<string, unknown>>>(endpoint, {}, { resource: "dashboard" });
    const source = unwrap<Record<string, unknown>>(result);
    if (!source) return dashboardData;
    const sourceKpi = (source.kpi ?? source) as Record<string, number>;
    if (sourceKpi && "totalUsers" in sourceKpi) {
      return { kpis: [{ label: "Tổng số tài khoản", value: sourceKpi.totalUsers ?? 0, trend: `${sourceKpi.activeUsers ?? 0} hoạt động`, tone: "teal", detail: "Quản trị hệ thống" }, { label: "Tài khoản bị khóa", value: sourceKpi.lockedUsers ?? 0, trend: "Cần theo dõi", tone: "rose", detail: "Bảo mật tài khoản" }, { label: "Tổng số nhân sự", value: sourceKpi.totalEmployees ?? 0, trend: `${sourceKpi.totalDepartments ?? 0} phòng ban`, tone: "violet", detail: "Sơ đồ tổ chức" }, { label: "Tổng số vị trí", value: sourceKpi.totalPositions ?? 0, trend: "Danh mục dùng chung", tone: "amber", detail: "Vị trí công việc" }], departments: ((source.employeesByDept ?? []) as Array<Record<string, unknown>>).map((item) => ({ name: String(item.department_name ?? "Chưa phân loại"), count: Number(item.count ?? 0) })), approvals: [], pipeline: [] };
    }
    if ("totalEmployees" in sourceKpi || "totalRequests" in sourceKpi) {
      const kpi = sourceKpi;
      const actionNeeded = source.actionNeeded as Record<string, Record<string, unknown[]>> | undefined;
      const charts = source.charts as Record<string, unknown[]> | undefined;
      const pendingApprovals = (source.pendingApprovals ?? source.pendingTasks ?? actionNeeded?.recruitment?.pendingRequests ?? []) as Array<Record<string, unknown>>;
      const actionCount = pendingApprovals.length || Number(kpi.pendingApprovalsCount ?? kpi.pendingRequests ?? 0);
      return {
        kpis: [{ label: "Nhân sự đang làm việc", value: kpi.activeEmployees ?? kpi.totalEmployees ?? 0, trend: `${kpi.totalEmployees ?? 0} hồ sơ nhân sự`, tone: "teal", detail: "Theo dữ liệu hiện tại" }, { label: "Vị trí đang tuyển", value: kpi.openPositionsCount ?? kpi.recruitingRequests ?? kpi.totalRequests ?? 0, trend: `${kpi.pendingRequests ?? 0} yêu cầu chờ duyệt`, tone: "amber", detail: "Theo nhu cầu tuyển dụng" }, { label: "Ứng viên đang xử lý", value: kpi.processingCandidates ?? kpi.totalCandidates ?? 0, trend: `${kpi.upcomingInterviews ?? 0} lịch phỏng vấn sắp tới`, tone: "violet", detail: "Trong pipeline tuyển dụng" }, { label: "Việc cần xử lý", value: actionCount, trend: actionCount ? "Cần được xem xét" : "Không có phiếu tồn", tone: "rose", detail: "Theo workflow hiện tại" }],
        departments: ((charts?.deptStructure ?? source.deptStructure ?? []) as Array<Record<string, unknown>>).map((item) => ({ name: String(item.department_name ?? "Chưa phân loại"), count: Number(item.count ?? 0) })),
        approvals: pendingApprovals.map((item) => ({ id: String(item.id ?? ""), code: String(item.code ?? "CHỜ DUYỆT"), type: String(item.typeName ?? item.type ?? "Nghiệp vụ"), title: String(item.title ?? item.reason ?? item.positionName ?? item.employeeName ?? "Chứng từ cần xem xét"), owner: String(item.deptName ?? item.employeeName ?? item.currentLevel ?? "Chưa xác định"), age: String(item.status ?? "Đang chờ xử lý"), priority: String(item.priority ?? "Chờ duyệt") })),
        pipeline: ((source.pipelineStages ?? []) as Array<Record<string, unknown>>).map((item) => ({ label: String(item.label ?? item.status ?? "Giai đoạn"), count: Number(item.count ?? 0) })),
      };
    }
    return dashboardData;
  },
  async login(username: string, password: string) {
    if (isMockMode()) return demoLogin(username, password);
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const body = await response.json() as ApiEnvelope<unknown>;
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
    const [users, departments, positions, contractTypes] = await Promise.all([getList("/admin/users"), getList("/admin/departments"), getList("/admin/positions"), getList("/admin/contract-types")]);
    return { users: users.length ? users.length : 24, departments: departments.length ? departments.length : 14, positions: positions.length ? positions.length : 38, contractTypes: contractTypes.length ? contractTypes.length : 6 };
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
    return this.request("/reward-discipline/proposals", { method: "POST", body: JSON.stringify({ record_type: "KHEN_THUONG", employee_id: "emp-hr-02", reason: payload.title, proposed_by: readSession().name }) }, { resource: "rewards", action: "create" });
  },
};
