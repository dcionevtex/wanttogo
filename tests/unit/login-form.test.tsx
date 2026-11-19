import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("sign-in methods", () => {
  it("defaults to password and removes that field when switching to email link", () => {
    render(<LoginForm configured />);
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    fireEvent.click(screen.getByRole("button", { name: "Email link" }));
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send me a sign-in link" }),
    ).toBeInTheDocument();
  });
  it("only sends an email address for explicitly chosen link sign-in", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(Response.json({ message: "Check your email." }));
    vi.stubGlobal("fetch", fetch);
    render(<LoginForm configured />);
    fireEvent.click(screen.getByRole("button", { name: "Email link" }));
    fireEvent.change(screen.getByLabelText("Your email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send me a sign-in link" }),
    );
    await screen.findByRole("status");
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        body: JSON.stringify({ email: "person@example.com" }),
      }),
    );
  });
  it("does not turn failed password sign-in into an email request", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ error: "Could not sign in." }, { status: 401 }),
      );
    vi.stubGlobal("fetch", fetch);
    render(<LoginForm configured />);
    fireEvent.change(screen.getByLabelText("Your email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "test-only password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("alert");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe("/api/auth/password");
  });
});
