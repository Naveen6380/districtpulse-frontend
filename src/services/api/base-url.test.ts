import { describe, it, expect } from "vitest";
import { resolveApiBaseUrl } from "./base-url";
describe("forwarded API routing", () => {
  it("keeps laptop loopback addresses out of mobile requests", () => {
    expect(resolveApiBaseUrl("http://localhost:8091/api")).toBe("/api");
    expect(resolveApiBaseUrl("http://127.0.0.1:8091/api/")).toBe("/api");
    expect(resolveApiBaseUrl("http://[::1]:8091/api")).toBe("/api");
    expect(resolveApiBaseUrl()).toBe("/api");
  });
  it("preserves explicit externally reachable APIs and relative paths", () => {
    expect(resolveApiBaseUrl("https://api.example.org/api/")).toBe("https://api.example.org/api");
    expect(resolveApiBaseUrl("/api")).toBe("/api");
  });
});
