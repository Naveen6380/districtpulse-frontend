/** Same-origin gateway for the built Node server. The upstream comes from server configuration only. */
export async function proxyApiRequest(request: Request, target: string): Promise<Response> {
  const source = new URL(request.url),
    origin = request.headers.get("origin"),
    forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (origin) {
    try {
      const host = new URL(origin).host;
      if (host !== source.host && host !== forwarded)
        return Response.json({ message: "Cross-origin API request rejected" }, { status: 403 });
    } catch {
      return Response.json({ message: "Invalid request origin" }, { status: 403 });
    }
  }
  const upstream = new URL(target);
  upstream.pathname = source.pathname;
  upstream.search = source.search;
  // The upstream is another public CDN origin. Replaying its incoming CDN-loop,
  // Cloudflare and browser transport headers can make the second hop fail.
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept", "x-district-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let body: Uint8Array<ArrayBuffer> | undefined;
  if (request.body && request.method !== "GET" && request.method !== "HEAD") {
    const reader = request.body.getReader(),
      chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 12 * 1024 * 1024) {
        await reader.cancel();
        return Response.json({ message: "Request exceeds 12MB" }, { status: 413 });
      }
      chunks.push(part.value);
    }
    body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
  }
  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
      redirect: "manual",
      signal: AbortSignal.timeout(125000),
    });
    const resultHeaders = new Headers(response.headers);
    for (const name of ["connection", "transfer-encoding", "content-encoding", "content-length"])
      resultHeaders.delete(name);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resultHeaders,
    });
  } catch (error) {
    const failure = error as { name?: string; cause?: { code?: string } };
    console.warn("API upstream connection failed", source.pathname, failure.name, failure.cause?.code);
    return Response.json(
      { message: "Backend is unavailable. Start the DistrictPulse API on its configured port." },
      { status: 502 },
    );
  }
}
