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
};

export type ReportQueryResult = {
  success: boolean;
  reportId: string;
  filters: Record<string, string>;
  data: Array<Record<string, unknown>>;
  summary: Record<string, unknown>;
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
  if (role === "Administrator") {
    return {
      ...base,
      kpis: [
        { label: "Tổng số tài khoản", value: 24, trend: "22 hoạt động", tone: "teal", detail: "Quản trị hệ thống" },
        { label: "Tài khoản bị khóa", value: 2, trend: "Cần theo dõi", tone: "rose", detail: "Bảo mật tài khoản" },
        { label: "Tổng số phòng ban", value: 14, trend: "Sơ đồ tổ chức", tone: "violet", detail: "Danh mục hệ thống" },
        { label: "Tổng số vị trí", value: 38, trend: "Danh mục dùng chung", tone: "amber", detail: "Định biên nhân sự" },
      ],
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
    };
  }
  if (role === "Ban Giám Đốc") {
    return {
      ...base,
      kpis: [
        { label: "Nhân sự đang làm việc", value: 146, trend: "+9 từ đầu năm", tone: "teal", detail: "Toàn doanh nghiệp" },
        { label: "Tuyển dụng đang mở", value: 18, trend: "6 yêu cầu chờ duyệt", tone: "amber", detail: "Theo kế hoạch nhân sự" },
        { label: "Nghỉ việc từ đầu năm", value: 3, trend: "Cần theo dõi", tone: "rose", detail: "Biến động nhân sự" },
        { label: "Phiếu chờ phê duyệt", value: 9, trend: "Cấp Ban Giám Đốc", tone: "violet", detail: "Quyết định cần xem xét" },
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
    const endpoint = session.role === "Administrator" ? "/reports/dashboard/admin" : session.role === "HR Staff" ? "/reports/dashboard/hr" : session.role === "Ban Giám Đốc" ? "/reports/dashboard/bgd" : session.role === "Nhân viên" ? "/reports/dashboard/employee" : ["Trưởng Khối", "Trưởng Phòng"].includes(session.role) ? "/reports/dashboard/manager" : "/reports/dashboard/summary";
    const result = await this.request<ApiEnvelope<Record<string, unknown>>>(endpoint, {}, { resource: "dashboard" });
    const source = unwrap<Record<string, unknown>>(result);
    if (!source) return fallbackDashboard(session.role);
    const sourceKpi = (source.kpi ?? source) as Record<string, number>;
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
      return {
        kpis: session.role === "HR Staff" ? [{ label: "Yêu cầu tuyển dụng", value: kpi.totalRequests ?? 0, trend: `${kpi.pendingRequests ?? 0} chờ duyệt`, tone: "teal", detail: "Điều phối tuyển dụng" }, { label: "Ứng viên đang xử lý", value: kpi.processingCandidates ?? kpi.totalCandidates ?? 0, trend: `${kpi.upcomingInterviews ?? 0} lịch phỏng vấn`, tone: "violet", detail: "Theo pipeline tuyển dụng" }, { label: "Offer cần theo dõi", value: kpi.pendingOffers ?? 0, trend: "Chờ ứng viên phản hồi", tone: "amber", detail: "Công việc tuyển dụng" }, { label: "Hồ sơ cần xử lý", value: actionCount, trend: actionCount ? "Cần ưu tiên" : "Không có phiếu tồn", tone: "rose", detail: "Các tác vụ nghiệp vụ HR" }] : [{ label: "Nhân sự trong đơn vị", value: kpi.activeEmployees ?? kpi.totalEmployees ?? 0, trend: "Đang làm việc", tone: "teal", detail: "Phạm vi quản lý" }, { label: "Yêu cầu tuyển dụng", value: kpi.openPositionsCount ?? kpi.recruitingRequests ?? kpi.totalRequests ?? 0, trend: `${kpi.pendingRequests ?? 0} đang xử lý`, tone: "amber", detail: "Của đơn vị" }, { label: "Ứng viên đang xử lý", value: kpi.processingCandidates ?? kpi.totalCandidates ?? 0, trend: "Trong pipeline", tone: "violet", detail: "Theo nhu cầu đơn vị" }, { label: "Phiếu cần phê duyệt", value: actionCount, trend: actionCount ? "Cần xử lý" : "Không có phiếu tồn", tone: "rose", detail: "Trong phạm vi đơn vị" }],
        departments: ((charts?.deptStructure ?? source.deptStructure ?? []) as Array<Record<string, unknown>>).map((item) => ({ name: String(item.department_name ?? "Chưa phân loại"), count: Number(item.count ?? 0) })),
        approvals: pendingApprovals.map((item) => ({ id: String(item.id ?? ""), code: String(item.code ?? "CHỜ DUYỆT"), type: String(item.typeName ?? item.type ?? "Nghiệp vụ"), title: String(item.title ?? item.reason ?? item.positionName ?? item.employeeName ?? "Chứng từ cần xem xét"), owner: String(item.deptName ?? item.employeeName ?? item.currentLevel ?? "Chưa xác định"), age: String(item.status ?? "Đang chờ xử lý"), priority: String(item.priority ?? "Chờ duyệt") })),
        pipeline: ((source.pipelineStages ?? []) as Array<Record<string, unknown>>).map((item) => ({ label: String(item.label ?? item.status ?? "Giai đoạn"), count: Number(item.count ?? 0) })),
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
    return this.request("/reward-discipline/proposals", { method: "POST", body: JSON.stringify({ record_type: "KHEN_THUONG", employee_id: "emp-hr-02", reason: payload.title, proposed_by: readSession().name }) }, { resource: "rewards", action: "create" });
  },
};
