import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Inbox, Bookmark, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

const content = {
  inbox: {
    icon: Inbox,
    kicker: "A home for every discovery",
    title: "Your Inbox",
    empty: "Every adventure starts with a link.",
    description:
      "Soon, you’ll be able to drop a link here and keep the original close, even while its place is being found.",
    note: "Link saving will be available after sign-in and private storage are connected.",
  },
  places: {
    icon: Bookmark,
    kicker: "Your own little field guide",
    title: "My places",
    empty: "Leave room for a little discovery.",
    description:
      "The tiny cafés, the weekend escapes, the places worth a detour. Your personal collection will live here.",
    note: "Your collection will become available as saved links are connected to real places.",
  },
  map: {
    icon: Map,
    kicker: "Someday, somewhere",
    title: "Your map",
    empty: "A world of possibilities ahead.",
    description:
      "See your collection from a new perspective and find a saved place just around the corner.",
    note: "The interactive map arrives later. No location permission is needed for this preview.",
  },
};

export function CollectionPreview({ kind }: { kind: keyof typeof content }) {
  const item = content[kind];
  const Icon = item.icon;
  return (
    <section className="collection-page">
      <div className="collection-heading">
        <div>
          <p className="eyebrow">{item.kicker}</p>
          <h1>
            {item.title}
            <span className="brand-period">.</span>
          </h1>
        </div>
        <span className="preview-label">Early preview</span>
      </div>
      <div className="empty-state">
        <div className="empty-illustration">
          <span className="orbit" />
          <Icon size={48} strokeWidth={1.2} aria-hidden="true" />
          <ArrowUpRight className="empty-arrow" size={20} aria-hidden="true" />
        </div>
        <h2>{item.empty}</h2>
        <p>{item.description}</p>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Back to overview
          </Link>
        </Button>
        <p className="availability-note">{item.note}</p>
      </div>
    </section>
  );
}
