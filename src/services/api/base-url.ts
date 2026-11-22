/** Loopback APIs must be reached through the web server, including on phones and HTTPS tunnels. */
export function resolveApiBaseUrl(configured?: string): string {
  const value = configured?.trim();
  if (!value) return "/api";
  try {
    const url = new URL(value);
    if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      return url.pathname.replace(/\/$/, "") || "/api";
  } catch {
    /* Relative paths are valid Axios base URLs. */
  }
  return value.replace(/\/$/, "");
}
