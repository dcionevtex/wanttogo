"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [expired, setExpired] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get("password") || "");
    if (password !== values.get("confirmation")) {
      setFailed(true);
      setFeedback("The passwords do not match.");
      return;
    }
    setBusy(true);
    setFeedback("");
    setFailed(false);
    setExpired(false);
    try {
      const response = await fetch("/api/auth/password/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setExpired(response.status === 401);
        throw new Error(result.error || "Your password could not be saved.");
      }
      form.reset();
      setFeedback(result.message);
    } catch {
      setFailed(true);
      setFeedback(
        "Your password could not be saved. Please try again or sign in again if your session expired.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="entry-form" aria-busy={busy}>
      <label htmlFor="new-password">New password</label>
      <div className="input-wrap">
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          disabled={busy}
          aria-describedby="password-help"
        />
      </div>
      <label htmlFor="confirm-password">Confirm new password</label>
      <div className="input-wrap">
        <input
          id="confirm-password"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          disabled={busy}
        />
      </div>
      <p id="password-help" className="form-help">
        Use at least 12 characters. Keep your password private; never send it in
        chat.
      </p>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save password"}
      </Button>
      {feedback && (
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "form-error" : "form-success"}
        >
          {feedback}
        </p>
      )}
      {expired && (
        <Link href="/login" className="text-link">
          Sign in again
        </Link>
      )}
    </form>
  );
}
