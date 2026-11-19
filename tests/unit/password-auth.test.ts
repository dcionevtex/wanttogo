import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { POST as login } from "@/app/api/auth/password/route";
import { POST as update } from "@/app/api/auth/password/update/route";
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const signInWithPassword = vi.fn();
const updateUser = vi.fn();
const getUser = vi.fn();
const fixturePassword = "test-only password 123";
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3000");
  signInWithPassword.mockResolvedValue({
    data: {
      user: { id: "fixture-user" },
      session: { access_token: "never-return-test-token" },
    },
    error: null,
  });
  getUser.mockResolvedValue({
    data: { user: { id: "fixture-user" } },
    error: null,
  });
  updateUser.mockResolvedValue({ error: null });
  vi.mocked(createClient).mockResolvedValue({
    auth: { signInWithPassword, getUser, updateUser },
  } as unknown as NonNullable<Awaited<ReturnType<typeof createClient>>>);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
function request(
  body: unknown = { email: "person@example.com", password: fixturePassword },
  origin = "http://127.0.0.1:3000",
) {
  return new Request("http://127.0.0.1:3000/api/auth/password", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
describe("password authentication", () => {
  it("uses Supabase password verification and never returns credentials or tokens", async () => {
    const response = await login(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedIn: true });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "person@example.com",
      password: fixturePassword,
    });
  });
  it.each(["invalid_credentials", "email_not_confirmed", "user_banned"])(
    "does not bypass Supabase rejection: %s",
    async (code) => {
      signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { code, status: 400, message: "private provider detail" },
      });
      const response = await login(request());
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error:
          "Could not sign in. Check your email and password, and make sure your email is confirmed.",
      });
    },
  );
  it("keeps password sign-in subject to Auth rate limits", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { status: 429 } });
    const response = await login(request());
    expect(response.status).toBe(429);
    expect(response.headers.has("Retry-After")).toBe(false);
  });
  it("rejects invalid input and cross-site requests before verification", async () => {
    expect(
      (await login(request({ email: "person@example.com", password: "" })))
        .status,
    ).toBe(400);
    expect(
      (await login(request(undefined, "https://attacker.example"))).status,
    ).toBe(403);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
  it("does not report successful sign-in without a session", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: {}, session: null },
      error: null,
    });
    expect((await login(request())).status).toBe(503);
  });
});
describe("password setup", () => {
  it("requires a verified existing session", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "expired" },
    });
    expect((await update(request({ password: fixturePassword }))).status).toBe(
      401,
    );
    expect(updateUser).not.toHaveBeenCalled();
  });
  it("updates only the signed-in account through the public session client", async () => {
    const response = await update(request({ password: fixturePassword }));
    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith({ password: fixturePassword });
    expect(await response.text()).not.toContain(fixturePassword);
  });
  it("rejects weak inputs, owner overrides and cross-site changes", async () => {
    expect((await update(request({ password: "short" }))).status).toBe(400);
    expect(
      (await update(request({ password: fixturePassword, user_id: "other" })))
        .status,
    ).toBe(400);
    expect(
      (
        await update(
          request({ password: fixturePassword }, "https://attacker.example"),
        )
      ).status,
    ).toBe(403);
    expect(updateUser).not.toHaveBeenCalled();
  });
  it("preserves provider reauthentication requirements", async () => {
    updateUser.mockResolvedValue({
      error: { code: "reauthentication_needed" },
    });
    expect((await update(request({ password: fixturePassword }))).status).toBe(
      401,
    );
  });
});
