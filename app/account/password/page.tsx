import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/auth/password-form";
export const metadata: Metadata = { title: "Password settings" };
export default async function PasswordPage() {
  await requireUser();
  return (
    <section className="account-page">
      <Link className="text-link" href="/inbox">
        ← Back to your Inbox
      </Link>
      <div className="login-panel">
        <p className="eyebrow">Your account</p>
        <h1>Password settings</h1>
        <p className="form-help">
          Set a password for future sign-ins. Your saved links and email sign-in
          option stay with this same account.
        </p>
        <PasswordForm />
      </div>
    </section>
  );
}
