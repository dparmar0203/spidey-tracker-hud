# Web-Sense

A Spider-Man game/movie-inspired HUD for the same 18-month vigilante-sighting dataset used by
[spidey-tracker](https://github.com/dparmar0203/spidey-tracker) — same Supabase database, a
completely different visual identity: a dusk NYC skyline, a literal web-network "scan" instead of
a chart, a glitching comic-style title, and a hexagon-button nav instead of a plain sidebar list.

**Live:** https://spidey-tracker-hud.vercel.app

> This is a fork of [spidey-tracker](https://github.com/dparmar0203/spidey-tracker), kept as a
> separate app/deployment so both designs stay live side by side. Original: dashboard-style
> sidebar app. This one: an in-universe HUD, avoiding any actual Marvel-branded assets (no logo,
> no suit palette recreation) in favor of a generic "surveillance/game-menu" aesthetic that still
> reads as *about* a web-slinger.

## What's here

- **Web Scan (`/`)** — the HUD home screen. Five borough nodes render first; tapping one fetches
  that borough's real recent sightings from Supabase and draws them as case nodes branching off
  it like a spider's web, color-coded by verification status (confirmed / unclear / flagged).
  Tapping a case node opens its full report in the "Sighting File" panel.
- **Boroughs (`/boroughs`)**, **Reports (`/reports`)**, **Trends (`/trends`)**, **Web Map
  (`/map`)** — carried over from spidey-tracker and re-themed to match: same real, live-queried
  data (filterable report feed, aggregate charts, lat/long scatter map), same red/blue/glass
  visual language as the HUD.
- A shared **cosmic background** (gradient sky + skyline silhouette + halftone texture) renders
  behind every page from the root layout, and the **sidebar** doubles as the HUD's hexagon-button
  nav — so the HUD front page and the rest of the app read as one product, not two.

## Data

Same dataset and schema as spidey-tracker: ~86,600 sightings from January 2025 – June 2026 across
the five NYC boroughs, queried live via `app/actions.ts`. It's historical/static, not a live feed
— the "Last Logged" readout is the dataset's actual last timestamp (a fact), not a "time ago"
computed from random demo data.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with **shadcn/ui** (`base-nova` preset) for Card, Table, Badge, Select,
  Button, Chart, Skeleton, Tabs
- **Recharts** (via shadcn's chart wrapper) for the Trends page
- Custom HUD layer (`app/hud.css`) for the glass panels, glitch title, and web-scan SVG — scoped
  under a single `.websense` class so it doesn't leak into the rest of the app's styling
- **Supabase** (`@supabase/supabase-js`) as the data source — same project as spidey-tracker
- **lucide-react** for icons (matched 1:1 between the sidebar and the HUD)
- Deployed on **Vercel**, as its own project (`d7-245c/spidey-tracker-hud`)

## Getting started

```bash
npm install
```

Create `.env.local` with the **same Supabase credentials as spidey-tracker**:

```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

This project is linked to its own Vercel project (GitHub-connected to
`dparmar0203/spidey-tracker-hud`: pushing to `main` triggers a production deploy).
`SUPABASE_URL` and `SUPABASE_ANON_KEY` must also be set in that Vercel project's Environment
Variables (Production, Preview, and Development) — see `vercel env add <NAME> <environment>`.

```bash
vercel --prod
```
