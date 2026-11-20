import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { AuthSession } from "@/types";

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-16T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());
describe("session expiry", () => {
  it("rejects a cached session after it expires without requiring a reload", async () => {
    const s = await import("@/services/auth/session");
    const session: AuthSession = {
      token: "test-only-token",
      user: {
        id: "test",
        name: "Test",
        email: "test@example.invalid",
        role: "collector",
        designation: "Test",
      },
      expiresAt: "2026-11-16T00:00:01Z",
    };
    s.setSession(session, false);
    expect(s.getToken()).toBe("test-only-token");
    vi.advanceTimersByTime(2000);
    expect(s.getSession()).toBeNull();
    expect(s.getToken()).toBeNull();
  });
  it("clears remembered and transient storage on logout", async () => {
    const s = await import("@/services/auth/session");
    window.localStorage.setItem("dp.session", "bad");
    window.sessionStorage.setItem("dp.session", "bad");
    s.clearSession();
    expect(s.getSession()).toBeNull();
    expect(window.localStorage.getItem("dp.session")).toBeNull();
    expect(window.sessionStorage.getItem("dp.session")).toBeNull();
  });
});
