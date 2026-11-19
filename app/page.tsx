import Link from "next/link";
import { ArrowRight, Link2, Inbox, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapArt } from "@/components/map-art";

export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> Your someday starts here
          </p>
          <h1 id="hero-title">
            Good places.
            <br />
            Keep them <em>close.</em>
          </h1>
          <p className="hero-description">
            The café in that reel. The little bookshop. That place a friend
            swears by. Give every discovery a place to land.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link href="/inbox">
                Explore your Inbox <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <a href="#how-it-works" className="text-link">
              How it works <span aria-hidden="true">↘</span>
            </a>
          </div>
          <p className="quiet-note">
            <Bookmark size={14} aria-hidden="true" /> Save now. Go later. Make
            it your own.
          </p>
        </div>
        <div className="hero-visual">
          <span className="visual-caption">YOUR NEXT CHAPTER, MAPPED OUT</span>
          <MapArt />
          <span className="visual-footnote">
            A whole world of “let’s go there.”
          </span>
        </div>
      </section>
      <section
        className="journey"
        id="how-it-works"
        aria-labelledby="journey-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="journey-title">
              Your next discovery, saved in three steps.
            </h2>
          </div>
          <span className="section-aside">
            Find it. Save it. Come back to it.
          </span>
        </div>
        <ol className="steps" role="list">
          {[
            {
              n: "Step 1",
              icon: Link2,
              title: "Copy a link you love.",
              text: "See a café, a restaurant, or somewhere you’d love to go? Copy its link from a post, a website, or a message.",
            },
            {
              n: "Step 2",
              icon: Inbox,
              title: "Save it to your Inbox.",
              text: "Sign in, paste the link into your Inbox, and tap “Save link.” That’s it — your discovery has a home.",
            },
            {
              n: "Step 3",
              icon: Bookmark,
              title: "Come back when you’re ready.",
              text: "Open your private Inbox anytime. Tap the original link to revisit the place and pick up where you left off.",
            },
          ].map(({ n, icon: Icon, title, text }) => (
            <li key={n} className="step">
              <div className="step-top">
                <span>{n}</span>
                <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <div className="journey-action">
          <p>Something caught your eye?</p>
          <Button variant="outline" asChild>
            <Link href="/inbox">
              Save your first link <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
      <aside className="foundation-note">
        <span className="status-dot" />
        <p>
          <strong>A new collection is taking shape.</strong> Sign in to save
          your links. Place identification and maps are coming later.
        </p>
        <Link href="/places">
          Take a look around <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </aside>
    </>
  );
}
