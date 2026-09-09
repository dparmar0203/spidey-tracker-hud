# Spidey Tracker

A HUD-style tracker for an 18-month, city-wide dataset of reported sightings of a masked
vigilante swinging across a New York-inspired city — built with Next.js and backed by a live
Supabase database. Instead of a conventional dashboard, the whole app is styled as an in-universe
surveillance/game-menu HUD: a dusk NYC skyline, a literal web-network "scan" in place of a map, a
glitching comic-style title, and a hexagon-button nav — while deliberately avoiding any actual
Marvel-branded assets (no logo, no suit-palette recreation).

**Live:** https://spidey-tracker-hud.vercel.app

## What's here

- **Web Scan (`/`)** — the HUD home screen. Five borough nodes render first; tapping one fetches
  that borough's real recent sightings from Supabase and draws them as case nodes branching off
  it like a spider's web, color-coded by verification status (confirmed / unclear / flagged).
  Tapping a case node opens its full report in the "Sighting File" panel.
- **Boroughs (`/boroughs`)** — five borough cards; click one to drill into its recent field
  reports, paginated.
- **Reports (`/reports`)** — the full sightings feed, filterable by borough, report type, and
  verification status, with evidence icons (photo/video/audio, crime-nearby flag).
- **Trends (`/trends`)** — charts built from live aggregate queries: monthly sighting volume
  (total vs. verified), report type breakdown, verification outcome breakdown, weather at time of
  report.
- **Web Map (`/map`)** — a scatter plot of real sightings by latitude/longitude, colored by
  borough, with a borough filter and click-to-inspect detail panel.
- A shared **cosmic background** (gradient sky + skyline silhouette + halftone texture) renders
  behind every page from the root layout, and the **sidebar** doubles as the HUD's hexagon-button
  nav, so the whole app reads as one consistent product.

## Data

Source: [Spidey Tracker: Spider-Man Dataset on Kaggle](https://www.kaggle.com/datasets/umuttuygurr/spidey-tracker-spiderman-dataset),
loaded into Supabase. The dataset spans **January 2025 – June 2026** (~86,600 sightings) across the five NYC boroughs,
with fields for report type, witness/source counts, tracker confidence, evidence flags, weather,
and a labeled verification outcome (`verified`, `mistaken_identity`, `impersonator`,
`social_media_hoax`, `duplicate_report`, `sensor_error`, `deliberate_fake`). It's served from a
Supabase Postgres table (`sightings`) via the queries in `app/actions.ts`. The dataset is
historical/static, not live — the "Last Logged" readout is the dataset's actual last timestamp (a
fact), not a "time ago" implying real-time activity.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with **shadcn/ui** (`base-nova` preset) for Card, Table, Badge, Select,
  Button, Chart, Skeleton, Tabs
- **Recharts** (via shadcn's chart wrapper) for the Trends page
- Custom HUD layer (`app/hud.css`) for the glass panels, glitch title, and web-scan SVG — scoped
  under a single `.websense` class so it doesn't leak into the rest of the app's styling
- **Supabase** (`@supabase/supabase-js`) as the data source
- **lucide-react** for icons (matched 1:1 between the sidebar and the HUD)
- Deployed on **Vercel**

## Getting started

```bash
npm install
```

Create `.env.local` with your Supabase credentials:

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

This project is linked to a Vercel project (GitHub-connected: pushing to `main` triggers a
production deploy). `SUPABASE_URL` and `SUPABASE_ANON_KEY` must also be set in the Vercel
project's Environment Variables (Production, Preview, and Development) — see
`vercel env add <NAME> <environment>`.

```bash
vercel --prod
```
