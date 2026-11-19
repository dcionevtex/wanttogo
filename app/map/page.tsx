import type { Metadata } from "next";
import { CollectionPreview } from "@/components/collection-preview";
import { requireUser } from "@/lib/auth";
export const metadata: Metadata = { title: "Map" };
export default async function MapPage() {
  await requireUser();
  return <CollectionPreview kind="map" />;
}
