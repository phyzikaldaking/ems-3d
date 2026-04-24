# EMS 3D — Epic MusicSpace: The City

A Babylon.js walkable 3D city for [Epic MusicSpace](https://epicmusicspace.com). Deployed on Vercel.

## Overview

Six neon-lit music districts form a bird's-eye 3D city. Click any building for district info. The city is a placeholder ("skeleton") — leasing and artist profiles arrive in Phase 2.

| District | Genre | Color |
|---|---|---|
| Trap Ave | Trap | 🟣 Purple |
| R&B Blvd | R&B | 🩷 Magenta |
| Drill District | Drill | 🩵 Cyan |
| Hip-Hop Highway | Hip-Hop | 🟡 Gold |
| Pop Plaza | Pop | 🟠 Orange |
| Afrobeats Alley | Afrobeats | 🟢 Green |

## Controls

| Input | Action |
|---|---|
| Drag | Orbit camera |
| Scroll / pinch | Zoom |
| Click building | Show district info |

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Babylon.js 7](https://www.babylonjs.com/)
- [Vercel Analytics](https://vercel.com/analytics)
- TypeScript

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

## Deployment

Push to `main` → auto-deploys on Vercel.

