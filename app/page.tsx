import Link from "next/link";
import { ArrowRight, Link2, MapPin, Route, Bookmark } from "lucide-react";
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
            <p className="eyebrow">From inspiration to out the door</p>
            <h2 id="journey-title">Less lost in your saved posts.</h2>
          </div>
          <span className="section-aside">
            A little intention goes a long way.
          </span>
        </div>
        <div className="steps">
          {[
            {
              n: "01",
              icon: Link2,
              title: "Find it. Keep it.",
              text: "A link from your feed, a blog, or a friend. Your Inbox will be its first stop.",
            },
            {
              n: "02",
              icon: MapPin,
              title: "Make it a place.",
              text: "Turn inspiration into a collection of real places, with the original links close by.",
            },
            {
              n: "03",
              icon: Route,
              title: "Go when it feels right.",
              text: "Find what’s nearby, revisit an old idea, and make someday a little sooner.",
            },
          ].map(({ n, icon: Icon, title, text }) => (
            <article key={n} className="step">
              <div className="step-top">
                <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
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
