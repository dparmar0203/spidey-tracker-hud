"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Title" },
  { href: "/investigation", label: "Investigation" },
  { href: "/case-files", label: "Case Files" },
  { href: "/about", label: "About This Case" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border/60 bg-background/60 px-5 py-3 backdrop-blur-md">
      <Link
        href="/"
        className="font-heading text-lg tracking-wide text-primary shrink-0"
      >
        Spidey-Tracker
      </Link>
      <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`rounded px-2.5 py-1.5 font-label text-xs tracking-wider uppercase transition-colors sm:text-sm ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
