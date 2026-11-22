import { afterEach, expect, it, vi } from "vitest";
import { proxyApiRequest } from "./api-proxy";
afterEach(() => vi.unstubAllGlobals());
it("forwards tunnel-origin auth requests to the configured backend without exposing tunnel cookies", async () => {
  const send = vi.fn(async () => Response.json({ status: "up" }));
  vi.stubGlobal("fetch", send);
  const response = await proxyApiRequest(
    new Request("http://localhost:8080/api/health", {
      headers: {
        Origin: "https://phone.example",
        "X-Forwarded-Host": "phone.example",
        Authorization: "Bearer test-only",
        Cookie: "tunnel=test-only",
      },
    }),
    "http://127.0.0.1:8091",
  );
  expect(response.status).toBe(200);
  const [url, options] = send.mock.calls[0] as unknown as [URL, RequestInit];
  expect(url.href).toBe("http://127.0.0.1:8091/api/health");
  const headers = new Headers(options.headers);
  expect(headers.get("authorization")).toBe("Bearer test-only");
  expect(headers.has("cookie")).toBe(false);
  expect(headers.has("origin")).toBe(false);
});
it("does not proxy a cross-origin request", async () => {
  const send = vi.fn();
  vi.stubGlobal("fetch", send);
  const response = await proxyApiRequest(
    new Request("http://localhost:8080/api/health", {
      headers: { Origin: "https://other.example" },
    }),
    "http://127.0.0.1:8091",
  );
  expect(response.status).toBe(403);
  expect(send).not.toHaveBeenCalled();
});
