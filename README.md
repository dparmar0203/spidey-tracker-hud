# Spidey-Tracker

A HUD-styled investigation into an 18-month, city-wide dataset of reported sightings of a masked
vigilante swinging across a New York-inspired city — built with Next.js and backed by a live
Supabase database. Rather than a conventional multi-page dashboard, the app is one open mystery:
a title screen, a single dense "investigation" view of every sighting at once, a browsable case
file table, and an honest explainer page — all styled as an in-universe surveillance HUD (dusk
NYC skyline, glitching comic-style title, chamfered HUD buttons) while deliberately avoiding any
actual Marvel-branded assets (no logo, no suit-palette recreation).

**Live:** https://spidey-tracker-hud.vercel.app

## What's here

- **Title (`/`)** — the HUD home screen: the "SYSTEM ONLINE" hook, a live count of logged
  sightings pulled from Supabase, and a menu into the rest of the case.
- **Investigation (`/investigation`)** — the core experience. All 86,631 sightings render at once
  as a canvas point cloud, color-coded by verification status (confirmed / unclear / flagged).
  Toggles — verified-only, late-night (10pm–5am), first/last sighting of each day, clear weather —
  animate the non-matching points down to a faint glow rather than snapping them away. A district
  activity overlay draws each district's patrol activity and nightlife score from the `locations`
  table. The page ends with a "lock in your theory" guess for where the hidden base might be — and
  says plainly that Mission 05 has no published correct answer; it's a real open question, not a
  quiz with a hidden key.
- **Case Files (`/case-files`)** — the full sightings feed, filterable by borough, report type,
  and verification status, with evidence icons (photo/video/audio) and paginated browsing.
- **About This Case (`/about`)** — discloses that the dataset is synthetic and that the project is
  not affiliated with, endorsed by, or connected to Marvel, Sony Pictures, or The Walt Disney
  Company, plus a link to the source dataset.
- A shared **cosmic background** (gradient sky + skyline silhouette + halftone texture) renders
  behind every page from the root layout, with a top nav across all four routes.

## Data

Source: [Spidey Tracker: Spider-Man Dataset on Kaggle](https://www.kaggle.com/datasets/umuttuygurr/spidey-tracker-spiderman-dataset),
loaded into Supabase. The dataset spans **January 2025 – June 2026** (~86,600 sightings) across the five NYC boroughs,
with fields for report type, witness/source counts, tracker confidence, evidence flags, weather,
and a labeled verification outcome (`verified`, `mistaken_identity`, `impersonator`,
`social_media_hoax`, `duplicate_report`, `sensor_error`, `deliberate_fake`). It's served from
Supabase Postgres tables (`sightings`, `locations`, `weather`) via the queries in `app/actions.ts`,
including a full 86k-row fetch (paged past Supabase's 1000-row cap) that's classified server-side
and cached for an hour via ISR. The dataset is historical/static, not live.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with **shadcn/ui** (`base-nova` preset) for Table, Badge, Select, Button,
  Skeleton
- HTML5 Canvas for the Investigation page's 86k-point renderer (typed arrays + a
  `requestAnimationFrame` easing loop for the filter fade transitions)
- Custom HUD layer (`app/hud.css`) for the glass panels, glitch title, and investigation grid —
  scoped under a single `.websense` class so it doesn't leak into the rest of the app's styling
- **Supabase** (`@supabase/supabase-js`) as the data source
- **lucide-react** for icons
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
