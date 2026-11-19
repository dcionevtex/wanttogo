import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <section className="empty-state">
      <p className="eyebrow">A little off the beaten path</p>
      <h1>This place isn’t on the map.</h1>
      <p>The page may have moved. Let’s head back.</p>
      <Button asChild>
        <Link href="/">Back to overview</Link>
      </Button>
    </section>
  );
}
