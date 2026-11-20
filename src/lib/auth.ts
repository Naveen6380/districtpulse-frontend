import { useSyncExternalStore } from "react";
import { redirect } from "@tanstack/react-router";
import type { Role } from "@/types";
import { authService } from "@/services/auth.service";
import { clearSession, getSession, setSession, subscribeSession } from "@/services/auth/session";

export function useSession() {
  return useSyncExternalStore(subscribeSession, getSession, () => null);
}

export async function login(email: string, password: string, remember: boolean) {
  const session = await authService.login(email, password);
  setSession(session, remember);
  return session;
}

export async function logout() {
  try {
    await authService.logout();
  } finally {
    clearSession();
  }
}

/**
 * UI-only role gating for navigation. This is NOT security: the backend must enforce
 * authorization on every endpoint.
 */
export function canAccess(role: Role | undefined, roles?: Role[]) {
  if (!roles) return true;
  return !!role && roles.includes(role);
}

/** beforeLoad helper: hides a page from roles that do not use it (UI convenience, not security). */
export function requireRoles(roles: Role[]) {
  return () => {
    const s = getSession();
    if (!canAccess(s?.user.role, roles)) throw redirect({ to: "/overview" });
  };
}
