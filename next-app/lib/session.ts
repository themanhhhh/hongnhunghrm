import type { Session } from "@/lib/permissions";

let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;
const USER_COOKIE_NAME = "bravo_hrm_user";
const USER_COOKIE_MAX_AGE = 60 * 60 * 24;

function cookieSecurity() {
  return window.location.protocol === "https:" ? "; Secure" : "";
}

function getUserCookie(): Partial<Session> | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${USER_COOKIE_NAME}=`));
  if (!cookie) return null;

  try {
    const value = JSON.parse(
      decodeURIComponent(cookie.slice(USER_COOKIE_NAME.length + 1)),
    ) as Record<string, unknown>;
    const employeeId = value.employeeId ?? value.employee_id;
    return {
      id: String(value.id ?? value.user_id ?? "cookie-user"),
      name: String(value.name ?? value.fullName ?? value.full_name ?? "Người dùng BRAVO"),
      username: String(value.username ?? ""),
      role: String(value.role ?? value.roleName ?? value.role_name ?? "Nhân viên") as Session["role"],
      department: String(value.department ?? value.deptName ?? value.department_name ?? ""),
      employeeId: employeeId ? String(employeeId) : null,
    };
  } catch {
    return null;
  }
}

export function setUserCookie(session: Session) {
  if (typeof window === "undefined") return;
  document.cookie = `${USER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(session))}; Max-Age=${USER_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${cookieSecurity()}`;
}

export function clearUserCookie() {
  if (typeof window === "undefined") return;
  document.cookie = `${USER_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${cookieSecurity()}`;
}

export function getStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("bravo_next_session");
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  if (!raw) {
    cachedSession = getUserCookie() as Session | null;
    if (cachedSession) window.localStorage.setItem("bravo_next_session", JSON.stringify(cachedSession));
    return cachedSession;
  }
  try {
    cachedSession = JSON.parse(raw) as Session;
  } catch {
    cachedSession = getUserCookie() as Session | null;
    if (cachedSession) window.localStorage.setItem("bravo_next_session", JSON.stringify(cachedSession));
  }
  return cachedSession;
}

export function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
