/** Poll only public health: credentials are sent once, after the sleeping API is ready. */
export async function waitForBackend(baseUrl: string, onWaiting: () => void, budgetMs = 240000) {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "omit",
        signal: AbortSignal.timeout(Math.min(10000, Math.max(1, deadline - Date.now()))),
      });
      if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const body = await response.json() as { status?: string };
        if (body.status === "up") return;
      } else await response.body?.cancel();
    } catch {
      // Render may return HTML/502 or drop the connection during a cold start.
    }
    onWaiting();
    const delay = Math.min(2000, deadline - Date.now());
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("The server is still starting or unavailable. Your password has not been submitted. Please try again shortly.");
}
