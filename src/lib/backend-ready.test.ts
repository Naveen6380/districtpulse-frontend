import { afterEach, expect, it, vi } from "vitest";
import { waitForBackend } from "./backend-ready";
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it("waits through a gateway failure and Render HTML before accepting actual API readiness", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response("Bad gateway", { status: 502 }))
    .mockResolvedValueOnce(new Response("Application loading", { headers: { "content-type": "text/html" } }))
    .mockResolvedValueOnce(Response.json({ status: "up" }));
  vi.stubGlobal("fetch", fetcher);
  const waiting = vi.fn();
  const ready = waitForBackend("/api", waiting);
  await vi.advanceTimersByTimeAsync(4000);
  await ready;
  expect(waiting).toHaveBeenCalledTimes(2);
  expect(fetcher).toHaveBeenCalledTimes(3);
  for (const [url, options] of fetcher.mock.calls) {
    expect(url).toBe("/api/health");
    expect(options.credentials).toBe("omit");
    expect(options.body).toBeUndefined();
  }
});
it("stops waiting at the deadline without submitting credentials", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
  vi.stubGlobal("fetch", fetcher);
  const result = expect(waitForBackend("/api", vi.fn(), 2000)).rejects.toThrow("password has not been submitted");
  await vi.advanceTimersByTimeAsync(2000);
  await result;
  expect(fetcher).toHaveBeenCalledTimes(1);
});
