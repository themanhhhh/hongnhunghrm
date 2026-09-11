import type { Session } from "@/lib/permissions";

let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;
const USER_COOKIE_NAME = "bravo_hrm_user";
const USER_COOKIE_MAX_AGE = 60 * 60 * 24;

function cookieSecurity() {
  return window.location.protocol === "https:" ? "; Secure" : "";
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
    cachedSession = null;
    return null;
  }
  try {
    cachedSession = JSON.parse(raw) as Session;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

export function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
