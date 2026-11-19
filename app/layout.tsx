import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { parsePublicEnvironment } from "@/lib/env";

const env = parsePublicEnvironment({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "WantToGo — Save now. Go later.",
    template: "%s | WantToGo",
  },
  description:
    "A home for the places you don't want to forget. Save now. Go later.",
  applicationName: "WantToGo",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "WantToGo" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f6f5ed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="site-shell">
          <header className="site-header">
            <Link href="/" className="wordmark" aria-label="WantToGo home">
              <span className="brand-icon">
                <MapPin size={22} strokeWidth={2} aria-hidden="true" />
              </span>
              WantToGo<span className="brand-period">.</span>
            </Link>
            <Navigation />
            <Link className="header-note" href="/login">
              Your private collection{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </header>
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <footer className="site-footer">
            <span>Less scrolling. More going.</span>
            <span>
              Made for a curious life <span aria-hidden="true">↗</span>
            </span>
          </footer>
        </div>
      </body>
    </html>
  );
}
