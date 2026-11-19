import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { GET, POST } from "@/app/api/v1/captures/route";
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const rpc = vi.fn();
const getUser = vi.fn();
const from = vi.fn();
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3000");
  getUser.mockResolvedValue({
    data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
    error: null,
  });
  rpc.mockResolvedValue({
    data: [
      {
        source_id: "source-id",
        source_status: "pending",
        duplicate: false,
        rate_limited: false,
      },
    ],
    error: null,
  });
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser },
    rpc,
    from,
  } as unknown as NonNullable<Awaited<ReturnType<typeof createClient>>>);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
function request(
  body: unknown = { url: "https://example.com/place" },
  origin = "http://127.0.0.1:3000",
) {
  return new Request("http://127.0.0.1:3000/api/v1/captures", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
describe("capture API", () => {
  it("returns 201 only after the transaction succeeds and never caches a private response", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      sourceId: "source-id",
      status: "pending",
      duplicate: false,
    });
    expect(rpc).toHaveBeenCalledWith("capture_url", {
      p_original_url: "https://example.com/place",
      p_normalized_url: "https://example.com/place",
    });
  });
  it("does not trust caller-supplied ownership", async () => {
    const response = await POST(
      request({ url: "https://example.com/place", user_id: "other-user" }),
    );
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("returns an existing source as 200", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          source_id: "source-id",
          source_status: "resolved",
          duplicate: true,
          rate_limited: false,
        },
      ],
      error: null,
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      duplicate: true,
      status: "resolved",
    });
  });
  it("rejects expired sessions before writing or reading", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "expired" },
    });
    expect((await POST(request())).status).toBe(401);
    expect(
      (await GET(new Request("http://127.0.0.1:3000/api/v1/captures"))).status,
    ).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
  it.each(["https://attacker.example", "null", ""])(
    "rejects cross-origin/missing-origin requests: %s",
    async (origin) => {
      expect((await POST(request(undefined, origin))).status).toBe(403);
      expect(getUser).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
    },
  );
  it("rejects private URLs without persisting or fetching them", async () => {
    expect(
      (await POST(request({ url: "http://169.254.169.254/latest/meta-data" })))
        .status,
    ).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("returns a controlled failure without leaking database details", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "private internal secret" },
    });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private internal secret");
  });
  it("returns rate limiting with retry guidance", async () => {
    rpc.mockResolvedValue({
      data: [{ source_id: null, source_status: null, rate_limited: true }],
      error: null,
    });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });
  it("bounds request bytes even without Content-Length", async () => {
    expect(
      (
        await POST(
          request({ url: "https://example.com/", extra: "x".repeat(9000) }),
        )
      ).status,
    ).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });
});
