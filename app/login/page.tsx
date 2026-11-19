import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MapPin, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const client = await createClient();
  if (client) {
    const { data } = await client.auth.getUser();
    if (data.user) redirect("/inbox");
  }
  const { reason } = await searchParams;
  return (
    <section className="login-page">
      <div className="login-intro">
        <p className="eyebrow">Your next place is waiting</p>
        <h1>
          A little space
          <br />
          for your <em>someday.</em>
        </h1>
        <p>
          Sign in to keep your discoveries together, wherever life takes you.
        </p>
        <span className="privacy-note">
          <LockKeyhole size={16} aria-hidden="true" />
          Your Inbox is yours alone.
        </span>
        <MapPin
          className="login-pin"
          size={120}
          strokeWidth={0.7}
          aria-hidden="true"
        />
      </div>
      <div className="login-panel">
        <p className="eyebrow">Welcome to WantToGo</p>
        <h2>Make yourself at home.</h2>
        {!client && (
          <p role="status" className="form-notice">
            Sign-in is not connected yet. This preview needs its Supabase
            configuration before you can save links.
          </p>
        )}
        {reason === "session" && (
          <p className="form-notice" role="status">
            Sign in to open your private collection. If your session expired,
            your saved links are still safe.
          </p>
        )}
        {reason === "link" && (
          <p className="form-error" role="alert">
            That sign-in link could not be verified. It may have expired or
            opened in a different browser. Request a new one below.
          </p>
        )}
        <LoginForm configured={!!client} />
      </div>
    </section>
  );
}
