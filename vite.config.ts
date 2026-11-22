// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { ProxyOptions } from "vite";

const apiTarget = process.env["DP_API_PROXY_TARGET"] ?? "http://127.0.0.1:8091";
const proxy: Record<string, ProxyOptions> = {
  "/api": {
    target: apiTarget,
    changeOrigin: true,
    configure(proxy) {
      proxy.on("proxyReq", (outgoing, request) => {
        const origin = request.headers.origin;
        if (!origin) return;
        const forwarded = request.headers["x-forwarded-host"];
        const host =
          typeof forwarded === "string" ? forwarded.split(",")[0]!.trim() : request.headers.host;
        try {
          if (new URL(origin).host === host) outgoing.removeHeader("origin");
        } catch {
          /* Invalid/cross-origin requests retain their origin for backend validation. */
        }
      });
    },
  },
};

export default defineConfig({
  nitro: { preset: "node-server" },
  vite: { server: { proxy }, preview: { proxy } },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
