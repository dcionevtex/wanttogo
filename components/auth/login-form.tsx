"use client";
import { useState, type FormEvent } from "react";
import { ArrowRight, Mail, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
export function LoginForm({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<"password" | "link">("password");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    setBusy(true);
    setFeedback("");
    setFailed(false);
    try {
      const response = await fetch(
        mode === "password" ? "/api/auth/password" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "password" ? { email, password } : { email },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not sign in. Please try again.");
      if (mode === "password") {
        window.location.replace("/inbox");
        return;
      }
      setFeedback(result.message);
    } catch (error) {
      setFailed(true);
      setFeedback(
        error instanceof Error
          ? error.message
          : "Connection failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="entry-form" aria-busy={busy}>
      <div className="auth-methods" role="group" aria-label="Sign-in method">
        <button
          type="button"
          aria-pressed={mode === "password"}
          disabled={busy}
          onClick={() => {
            setMode("password");
            setFeedback("");
            setFailed(false);
          }}
        >
          Password
        </button>
        <button
          type="button"
          aria-pressed={mode === "link"}
          disabled={busy}
          onClick={() => {
            setMode("link");
            setFeedback("");
            setFailed(false);
          }}
        >
          Email link
        </button>
      </div>
      <label htmlFor="email">Your email</label>
      <div className="input-wrap">
        <Mail size={18} aria-hidden="true" />
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          maxLength={254}
          required
          disabled={!configured || busy}
          aria-describedby="login-help"
        />
      </div>
      {mode === "password" && (
        <>
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1024}
              disabled={!configured || busy}
              aria-describedby="login-help"
            />
          </div>
        </>
      )}
      <Button type="submit" disabled={!configured || busy}>
        {busy
          ? mode === "password"
            ? "Signing in…"
            : "Sending your link…"
          : mode === "password"
            ? "Sign in"
            : "Send me a sign-in link"}
        <ArrowRight aria-hidden="true" />
      </Button>
      <p id="login-help" className="form-help">
        {mode === "password"
          ? "Use the password for your WantToGo account. If you haven’t set one yet, sign in with an email link first, then choose Password settings in your Inbox."
          : "Open your email link in this same browser to finish signing in. Email sending limits may apply."}
      </p>
      {feedback && (
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "form-error" : "form-success"}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}
