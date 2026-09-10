import Link from "next/link";
import { getOverviewStats } from "@/app/actions";
import "@/app/hud.css";

export default async function TitleScreen() {
  const stats = await getOverviewStats();

  return (
    <div className="websense flex-1 flex items-center justify-center">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          [ Spidey Tracker — System Online ]
        </p>

        <h1 className="ws-glitch" data-text="SPIDEY-TRACKER">
          SPIDEY<em>-TRACKER</em>
          <span className="animate-pulse text-secondary">_</span>
        </h1>

        <p className="text-base text-muted-foreground">
          For 18 months, a city-wide tracker has been logging reports of a masked
          vigilante swinging across a New York-inspired city. The case is still open.
        </p>

        <p className="font-mono text-2xl">
          <span className="text-secondary">{stats.totalSightings.toLocaleString()}</span>{" "}
          sightings logged.
        </p>

        <nav className="mt-6 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row">
          <Link href="/investigation" className="title-menu-btn primary">
            Begin Investigation
          </Link>
          <Link href="/case-files" className="title-menu-btn">
            Case Files
          </Link>
          <Link href="/about" className="title-menu-btn">
            About This Case
          </Link>
        </nav>
      </div>
    </div>
  );
}
