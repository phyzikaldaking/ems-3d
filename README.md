# EMS 3D

Interactive 3D city built with Next.js + Babylon.js — the spatial launch surface for [Epic Music Space](https://epic-music-space-phyzikaldakings-projects.vercel.app).

> **Add a GIF here** — record a 15-second clip of the city pan → district zoom → building entry and drop it in `/public/demo.gif`, then replace this line with `![EMS 3D demo](public/demo.gif)`.

## What it is

A navigable 3D city divided into 6 genre districts. Each district has studios, labels, marketplaces, clubs, and artist residences. Clicking a building opens its interior overlay and (when `EMS_API_URL` is configured) pulls live data from the main EMS app — artist profiles, beat listings, and studio availability.

Navigation flows in four levels:

```text
City overview → District zoom → Building prompt → Interior overlay
```

## Districts

| District | Genre | Landmark buildings |
| --- | --- | --- |
| **Trap Ave** | Trap | Studio 808, Cartel Records |
| **R&B Blvd** | R&B | Velvet Studios, After Midnight |
| **Drill District** | Drill | Steel Factory, Sliding Hats HQ |
| **Hip-Hop Highway** | Hip-Hop | Boom Bap Studio, Label Row HQ |
| **Pop Plaza** | Pop | Hit Factory, The Stage, Fan Club HQ |
| **Afrobeats Alley** | Afrobeats | Lagos Studios, Naija Records |

## Building types

| Type | Icon | What happens inside |
| --- | --- | --- |
| Recording Studio | 🎙 | Stream live artist sessions from EMS; book studio time |
| Listening Room | 🎵 | Curated playlist overlays; group listening sessions |
| Marketplace | 🛍 | Browse and license beats; Stripe checkout |
| Label Office | 🏢 | Artist roster, signing info, label contact |
| Club / Lounge | 🎪 | Event listings, listening parties, fan drops |
| Artist Residence | 🏠 | Artist profile, discography, follow |

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in values — see below
npm run dev
```

Open `http://localhost:3000`. Babylon.js loads client-side only — the first load takes a moment while the WASM runtime initialises.

## Environment variables

**Required for full functionality:**

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL of this app — used for Stripe redirect paths and OG metadata |
| `EMS_API_URL` | Deployed Epic Music Space URL — 3D city fetches live studios, beats, and artist data from here |
| `STRIPE_SECRET_KEY` | Stripe secret — powers marketplace checkout inside building interiors |

**Optional:**

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_LAUNCH_MODE` | Set to `true` in production to enable launch gating and observability |
| `POSTHOG_API_KEY` | PostHog key for 3D navigation analytics (district views, building entries) |
| `POSTHOG_HOST` | PostHog host (default: `https://us.i.posthog.com`) |

Copy [.env.local.example](.env.local.example) as your starting point.

## EMS data flow

```text
EMS 3D (/api/studios)
  └── GET EMS_API_URL/api/studios        ← live studio listings
      └── renders in City3D + InteriorOverlay

Building interior (marketplace type)
  └── POST /api/checkout
      └── Stripe → EMS_API_URL/api/stripe/webhook
```

When `EMS_API_URL` is not set or unreachable, buildings fall back to static content from `lib/districts.ts`.

## What's live vs. placeholder

| Feature | Status |
| --- | --- |
| 3D city render + camera navigation | ✅ Live |
| District zoom + building click | ✅ Live |
| Interior overlays (all 6 building types) | ✅ Live |
| Ambient audio | ✅ Live |
| Minimap | ✅ Live |
| Onboarding flow | ✅ Live |
| Studio feed from EMS app | ✅ Live when `EMS_API_URL` is set |
| Marketplace checkout | ✅ Live when `STRIPE_SECRET_KEY` is set |
| PostHog navigation analytics | ✅ Live when `POSTHOG_API_KEY` is set |

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run prelaunch
```

Check env wiring locally:

```bash
npm run check:env          # warn on missing vars
npm run check:env:strict   # fail if any required var is missing
```

## Health check

```bash
curl http://localhost:3000/api/health
```

Returns `status: "ok"` when `NEXT_PUBLIC_SITE_URL`, `EMS_API_URL`, and `STRIPE_SECRET_KEY` are all configured. Verify this on the deployed environment before a launch demo.

## Notes

- Babylon is loaded client-side only via dynamic import to avoid SSR/runtime issues.
- GitHub Actions runs `npm run prelaunch` on every push and PR.
- `apps/web/` is a static fallback surface kept for baseline governance checks.
