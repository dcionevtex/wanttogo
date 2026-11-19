import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as callback } from "@/app/auth/callback/route";
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const signInWithOtp = vi.fn();
const signOut = vi.fn();
const exchangeCodeForSession = vi.fn();
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3000");
  signInWithOtp.mockResolvedValue({ error: null });
  signOut.mockResolvedValue({ error: null });
  exchangeCodeForSession.mockResolvedValue({ error: null });
  vi.mocked(createClient).mockResolvedValue({
    auth: { signInWithOtp, signOut, exchangeCodeForSession },
  } as unknown as NonNullable<Awaited<ReturnType<typeof createClient>>>);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
const request = (
  email = "person@example.com",
  origin = "http://127.0.0.1:3000",
) =>
  new Request("http://127.0.0.1:3000/api/auth/login", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
describe("auth boundaries", () => {
  it("uses a fixed same-origin callback and a generic confirmation", async () => {
    const response = await login(request());
    expect(response.status).toBe(200);
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "person@example.com",
      options: { emailRedirectTo: "http://127.0.0.1:3000/auth/callback" },
    });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
  it("rejects invalid email and cross-site login before contacting Auth", async () => {
    expect((await login(request("invalid"))).status).toBe(400);
    expect(
      (await login(request("person@example.com", "https://attacker.example")))
        .status,
    ).toBe(403);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });
  it("handles provider throttling without exposing upstream details", async () => {
    signInWithOtp.mockResolvedValue({
      error: { status: 429, message: "private provider details" },
    });
    const response = await login(request());
    expect(response.status).toBe(429);
    expect(await response.text()).not.toContain("private provider details");
  });
  it("distinguishes exhausted email quota from a short request cooldown", async () => {
    signInWithOtp.mockResolvedValue({
      error: {
        status: 429,
        code: "over_email_send_rate_limit",
        message: "private upstream quota details",
      },
    });
    const response = await login(request());
    expect(response.status).toBe(429);
    expect(response.headers.has("Retry-After")).toBe(false);
    expect(await response.json()).toEqual({
      error:
        "The sign-in email limit has been reached. Please try again later.",
    });
  });
  it("does not invent a one-minute reset time for other Auth limits", async () => {
    signInWithOtp.mockResolvedValue({
      error: { status: 429, code: "over_request_rate_limit" },
    });
    const response = await login(request());
    expect(response.headers.has("Retry-After")).toBe(false);
    expect(await response.json()).toEqual({
      error: "Too many sign-in requests. Please wait before trying again.",
    });
  });
  it("only allows same-origin sign-out and does not claim success on failure", async () => {
    expect(
      (await logout(request("person@example.com", "https://attacker.example")))
        .status,
    ).toBe(403);
    expect(signOut).not.toHaveBeenCalled();
    signOut.mockResolvedValue({ error: { message: "failure" } });
    expect((await logout(request())).status).toBe(503);
  });
  it("does not turn callback parameters into an open redirect", async () => {
    const response = await callback(
      new Request(
        "http://127.0.0.1:3000/auth/callback?code=test&next=https://attacker.example",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:3000/inbox",
    );
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });
  it("clears auth codes from error redirects", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "expired" } });
    const response = await callback(
      new Request("http://127.0.0.1:3000/auth/callback?code=private-code"),
    );
    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:3000/login?reason=link",
    );
  });
});
