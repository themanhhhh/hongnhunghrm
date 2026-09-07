export type Role =
  | "Administrator"
  | "HR Staff"
  | "Ban Giám Đốc"
  | "Trưởng Khối"
  | "Trưởng Phòng"
  | "Nhân viên";

export type Resource =
  | "dashboard"
  | "admin"
  | "recruitment"
  | "people"
  | "rewards"
  | "reports"
  | "leave";

export type Action = "view" | "create" | "edit" | "delete" | "approve";

export type Session = {
  id: string;
  name: string;
  username: string;
  role: Role;
  department: string;
  employeeId?: string | null;
};

export const DEMO_USERS: Array<Session & { password: string }> = [
  { id: "u-admin", name: "Nguyễn Hồng Nhung", username: "admin", password: "123456", role: "Administrator", department: "Toàn hệ thống" },
  { id: "u-hr", name: "Nguyễn Thùy Linh", username: "HANT", password: "123456", role: "HR Staff", department: "Phòng Nhân sự" },
  { id: "u-ceo", name: "Bùi Xuân Thức", username: "ceo", password: "123456", role: "Ban Giám Đốc", department: "Ban Giám Đốc" },
  { id: "u-manager", name: "Phạm Quốc Tuấn", username: "mgr_kd", password: "123456", role: "Trưởng Phòng", department: "Phòng Kinh doanh", employeeId: "emp-kd-01" },
  { id: "u-employee", name: "Đặng Đình Hùng", username: "emp_kd", password: "123456", role: "Nhân viên", department: "Phòng Kinh doanh", employeeId: "emp-kd-02" },
];

const resourceRoles: Record<Resource, Role[]> = {
  dashboard: ["Administrator", "HR Staff", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng"],
  admin: ["Administrator"],
  recruitment: ["Administrator", "HR Staff", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng"],
  people: ["Administrator", "HR Staff", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng", "Nhân viên"],
  rewards: ["Administrator", "HR Staff", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng"],
  reports: ["Administrator", "HR Staff", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng"],
  leave: ["Administrator", "HR Staff", "Ban Giám Đốc", "Trưởng Khối", "Trưởng Phòng", "Nhân viên"],
};

export function canAccess(session: Session | null, resource: Resource, action: Action = "view") {
  if (!session || !resourceRoles[resource].includes(session.role)) return false;
  if (session.role === "Nhân viên") return resource === "leave" || (resource === "people" && action === "view");
  if (resource === "rewards" && action === "create") {
    return ["Administrator", "HR Staff", "Trưởng Khối", "Trưởng Phòng"].includes(session.role);
  }
  if ((resource === "people" || resource === "rewards") && ["create", "edit", "delete"].includes(action)) {
    return session.role === "Administrator" || session.role === "HR Staff";
  }
  if (resource === "recruitment" && action === "approve") {
    return session.role === "Administrator" || session.role === "HR Staff";
  }
  if (action === "delete" && session.role !== "Administrator" && resource === "admin") return false;
  return true;
}

export function defaultSession(): Session {
  const { password: _password, ...session } = DEMO_USERS[0];
  return session;
}
