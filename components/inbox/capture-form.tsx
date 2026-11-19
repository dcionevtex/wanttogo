"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export function CaptureForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [expired, setExpired] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFeedback("");
    setFailed(false);
    setExpired(false);
    try {
      const response = await fetch("/api/v1/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        setExpired(response.status === 401);
        throw new Error(
          result.error || "Your link could not be saved. Please try again.",
        );
      }
      setFeedback(
        result.duplicate
          ? "Already in your Inbox. Your original link is still safe."
          : "Saved to your Inbox. You can come back to it anytime.",
      );
      setUrl("");
      router.replace("/inbox");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setFeedback(
        error instanceof Error
          ? error.message
          : "Connection failed. Your link has not been confirmed saved. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="capture-panel" aria-labelledby="capture-heading">
      <div>
        <p className="eyebrow">A good place to start</p>
        <h2 id="capture-heading">Keep that link.</h2>
        <p>
          A reel, a recommendation, a little discovery. Save it here for later.
        </p>
      </div>
      <form onSubmit={submit} className="entry-form" aria-busy={busy}>
        <label htmlFor="capture-url">Link to save</label>
        <div className="capture-row">
          <div className="input-wrap">
            <Link2 size={18} aria-hidden="true" />
            <input
              id="capture-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
              maxLength={4096}
              required
              disabled={busy}
              aria-describedby="capture-help"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save link"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
        <p id="capture-help" className="form-help">
          Your original link stays safe. Place identification is coming later.
        </p>
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
    </section>
  );
}
