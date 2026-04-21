# EMS 3D

Interactive Next.js + Babylon.js prototype for Epic MusicSpace.

## What is here

- `app/` — Next.js app shell and metadata
- `components/City3D.tsx` — 3D city scene, camera motion, and click navigation
- `components/HUD.tsx` — on-screen navigation and building prompts
- `components/InteriorOverlay.tsx` — interior experience overlays per building type
- `lib/districts.ts` — typed district and building content model
- `lib/navigation.ts` — shared navigation state contract
- `apps/web/` — static fallback/status surface kept for baseline governance checks

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

## Current behavior

- Starts in a full-city overview
- Click a district to zoom in
- Click a building to open its detail prompt
- Enter a building to view its interior overlay

## Notes

- Babylon is loaded client-side only via dynamic import to avoid SSR/runtime issues.
- GitHub Actions now runs dependency install, lint, and production build on pushes and PRs.
