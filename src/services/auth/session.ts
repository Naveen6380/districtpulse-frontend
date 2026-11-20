// Client-side session holder. The backend is the source of truth for authentication and roles;
// this only caches the issued token + profile so the UI can render. Prefer httpOnly cookies in production.
import type { AuthSession } from "@/types";

const KEY = "dp.session";
const listeners = new Set<() => void>();
let cached: AuthSession | null | undefined;

function read(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    if (new Date(s.expiresAt).getTime() < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  if (cached === undefined || (cached && new Date(cached.expiresAt).getTime() <= Date.now()))
    cached = read();
  return cached;
}

export const getToken = () => getSession()?.token ?? null;

export function setSession(session: AuthSession, remember: boolean) {
  const store = remember ? window.localStorage : window.sessionStorage;
  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
  store.setItem(KEY, JSON.stringify(session));
  cached = session;
  listeners.forEach((l) => l());
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
  cached = null;
  listeners.forEach((l) => l());
}

export function subscribeSession(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
