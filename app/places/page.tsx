import type { Metadata } from "next";
import { CollectionPreview } from "@/components/collection-preview";
import { requireUser } from "@/lib/auth";
export const metadata: Metadata = { title: "My places" };
export default async function PlacesPage() {
  await requireUser();
  return <CollectionPreview kind="places" />;
}
