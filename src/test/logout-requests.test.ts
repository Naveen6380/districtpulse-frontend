import axios from "axios";
import { beforeEach, expect, it, vi } from "vitest";
import type { AuthSession } from "@/types";

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

it("does not send protected background requests after logout", async () => {
  const { api } = await import("@/services/api/client");
  const adapter = vi.fn();
  api.defaults.adapter = adapter;
  for (const url of [
    "/districts/pudukkottai/notifications",
    "/districts/pudukkottai/overview",
    "/sources",
  ]) {
    await expect(api.get(url)).rejects.toSatisfy(axios.isCancel);
  }
  expect(adapter).not.toHaveBeenCalled();
});

it("still sends login requests without a session", async () => {
  const { api } = await import("@/services/api/client");
  const adapter = vi.fn(async (config) => ({
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  }));
  api.defaults.adapter = adapter;
  await api.post("/auth/login", { email: "test@example.invalid", password: "test-only" });
  expect(adapter).toHaveBeenCalledOnce();
});

it("does not clear a new session when an old request returns 401", async () => {
  const { api } = await import("@/services/api/client");
  const { setSession, getToken } = await import("@/services/auth/session");
  const session: AuthSession = {
    token: "old-token",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    user: {
      id: "test",
      name: "Test",
      email: "test@example.invalid",
      role: "collector",
      designation: "Test",
    },
  };
  setSession(session, false);
  api.defaults.adapter = async (config) => {
    setSession({ ...session, token: "new-token" }, false);
    throw new axios.AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
      data: {},
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
    });
  };
  await expect(api.get("/sources")).rejects.toMatchObject({ status: 401 });
  expect(getToken()).toBe("new-token");
});
