"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  MapPinned,
  ListFilter,
  TrendingUp,
  Radar,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Web Scan", icon: LayoutGrid },
  { href: "/boroughs", label: "Boroughs", icon: MapPinned },
  { href: "/reports", label: "Reports", icon: ListFilter },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/map", label: "Web Map", icon: Radar },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-heading text-xl tracking-wide text-primary">
          Spidey Tracker
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-64 flex-col gap-6 bg-background p-4 border-r border-border/60">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xl tracking-wide text-primary">
                Spidey Tracker
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-border/60 bg-background p-4 md:flex">
        <div className="px-2 pt-2">
          <span className="font-heading text-2xl tracking-wide text-primary">
            Web-Sense
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            Field intelligence, borough by borough.
          </p>
        </div>
        <NavLinks />
      </aside>
    </>
  );
}
