"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state">
      <h1>A small detour.</h1>
      <p role="alert">
        We couldn’t load this page. Check your connection and try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
