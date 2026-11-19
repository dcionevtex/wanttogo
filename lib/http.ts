import { z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter: number | null = 60,
  ) {
    super(message);
  }
}
export function assertSameOrigin(request: Request) {
  const allowed = process.env.NEXT_PUBLIC_APP_URL
    ? [new URL(process.env.NEXT_PUBLIC_APP_URL).origin]
    : ["http://localhost:3000", "http://127.0.0.1:3000"];
  const origin = request.headers.get("origin");
  if (!origin || !allowed.includes(origin))
    throw new HttpError(403, "This request must come from WantToGo.");
  return origin;
}
export async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new HttpError(415, "Send a JSON request.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "A request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new HttpError(413, "The request is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new HttpError(400, "Send valid JSON.");
  }
}
export function json(data: unknown, status = 200, extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "private, no-store");
  return Response.json(data, { status, headers });
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return json(
      { error: error.message },
      error.status,
      error.status === 429 && error.retryAfter !== null
        ? { "Retry-After": String(error.retryAfter) }
        : undefined,
    );
  if (error instanceof z.ZodError)
    return json({ error: "Please check the submitted information." }, 400);
  return json(
    { error: "The service is temporarily unavailable. Please try again." },
    503,
  );
}
