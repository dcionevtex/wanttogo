import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "WantToGo — Save now. Go later.",
    short_name: "WantToGo",
    description: "A home for the places you don’t want to forget.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f5ed",
    theme_color: "#f6f5ed",
    lang: "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
