"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Inbox, Map, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/places", label: "My places", icon: Bookmark },
  { href: "/map", label: "Map", icon: Map },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="main-nav">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn("nav-link", pathname === href && "active")}
        >
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
