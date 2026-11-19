import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, ArrowUpRight, ArrowRight, RefreshCw } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listSources } from "@/lib/captures/service";
import { normalizeCaptureUrl } from "@/lib/captures/url";
import { HttpError } from "@/lib/http";
import { CaptureForm } from "@/components/inbox/capture-form";
import { SignOut } from "@/components/auth/sign-out";
import { Button } from "@/components/ui/button";
import type { SourceStatus } from "@/lib/supabase/types";
export const metadata: Metadata = { title: "Inbox" };
const statuses: Record<SourceStatus, string> = {
  pending: "Saved · awaiting processing",
  processing: "Finding places…",
  resolved: "Places found",
  review_required: "Needs your review",
  failed: "Processing interrupted · link kept",
};
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { client, user } = await requireUser();
  const { cursor } = await searchParams;
  let page;
  let failure = "";
  try {
    page = await listSources(client, user.id, cursor);
  } catch (error) {
    failure =
      error instanceof HttpError
        ? error.message
        : "Your Inbox could not be loaded. Please try again.";
  }
  return (
    <section className="inbox-page">
      <div className="collection-heading">
        <div>
          <p className="eyebrow">A home for every discovery</p>
          <h1>
            Your Inbox<span className="brand-period">.</span>
          </h1>
          <p className="account-label">Signed in as {user.email}</p>
        </div>
        <div className="account-actions">
          <Link className="text-link" href="/account/password">
            Password settings
          </Link>
          <SignOut />
        </div>
      </div>
      <CaptureForm />
      <div className="inbox-list-heading">
        <h2>{cursor ? "Earlier discoveries" : "Your discoveries"}</h2>
        <Link href="/inbox" className="text-link">
          <RefreshCw size={14} aria-hidden="true" />
          Refresh
        </Link>
      </div>
      {failure ? (
        <div className="form-notice" role="alert">
          <p>{failure}</p>
          <Link className="text-link" href="/inbox">
            Reload your Inbox
          </Link>
        </div>
      ) : page?.sources.length ? (
        <ul className="source-list">
          {page.sources.map((source) => {
            let href: string | null = null;
            let domain = "Saved link";
            try {
              href = normalizeCaptureUrl(source.original_url);
              domain = new URL(href).hostname;
            } catch {
              /* Render records inserted outside the API safely. */
            }
            return (
              <li className="source-card" key={source.id}>
                <div className="source-icon">
                  <Inbox size={21} aria-hidden="true" />
                </div>
                <div className="source-copy">
                  <h3>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                      >
                        {domain}
                        <ArrowUpRight size={15} aria-hidden="true" />
                        <span className="sr-only">
                          {" "}
                          (opens original link in a new tab)
                        </span>
                      </a>
                    ) : (
                      domain
                    )}
                  </h3>
                  <p className="source-url">{source.original_url}</p>
                  <div className="source-meta">
                    <span>{source.platform.replace("_", " ")}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={source.created_at}>
                      {new Intl.DateTimeFormat("en", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(source.created_at))}
                    </time>
                  </div>
                </div>
                <span className={`source-status status-${source.status}`}>
                  {statuses[source.status]}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="inbox-empty">
          <Inbox size={32} strokeWidth={1.3} aria-hidden="true" />
          <h2>Your next discovery belongs here.</h2>
          <p>Save your first link above. It will be waiting when you return.</p>
        </div>
      )}
      <div className="pagination">
        {cursor && (
          <Button variant="outline" asChild>
            <Link href="/inbox">Back to latest</Link>
          </Button>
        )}
        {page?.nextCursor && (
          <Button variant="outline" asChild>
            <Link href={`/inbox?cursor=${page.nextCursor}`}>
              Earlier links
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
