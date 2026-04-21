# EMS (Epic Music Space) — Production Readiness Blueprint

## Current repository state

This repository now contains a working front-end prototype:

- Next.js App Router shell
- Babylon.js 3D city experience
- typed district/building content model
- HUD and interior overlays
- GitHub Actions validation for install, lint, and production build

The current scope is still **front-end only**. There is no backend, auth layer, persistence layer, deployment config, or runtime observability stack in this repo yet.

---

## What is production-ready now

1. **Build validation exists**
   - GitHub Actions now checks install, lint, and production build on push and PR.

2. **Client/server separation is correct**
   - Babylon scene code is loaded client-side only, which prevents SSR/runtime crashes.

3. **Navigation model is typed**
   - District/building content and navigation state are centralized and strongly typed.

4. **Basic UX flow is coherent**
   - City → district → building → interior transitions now behave predictably.

---

## Current risks and gaps

1. **No automated UI or interaction tests**
   - Rendering and interaction regressions can still slip through despite lint/build passing.

2. **No deployment/runtime config**
   - There is no Vercel/Netlify/Render deployment definition, preview workflow, or environment policy.

3. **No application telemetry**
   - Errors, performance, and engagement cannot yet be observed in production.

4. **No backend or identity model**
   - All marketplace, session, fan club, and artist interactions are static placeholders.

---

## Recommended next steps

### 1) Front-end hardening
- Add Playwright smoke coverage for city load, district zoom, building selection, and interior entry.
- Add a reduced-motion fallback and mobile interaction pass.
- Add an error boundary around the interactive shell.

### 2) Platform baseline
- Add preview deployment on pull requests.
- Add Dependabot or Renovate for dependency patching.
- Add secret scanning and dependency audit gates in CI.

### 3) Product architecture
- Introduce `apps/api` or equivalent backend surface.
- Define auth roles for listener, artist, moderator, and admin.
- Move mock building/interior content behind typed API contracts.

### 4) Observability
- Add client error tracking.
- Capture Web Vitals and route performance.
- Define logging, alerting, and rollback expectations before launch.

---

## Launch checklist

- [x] Project builds in CI
- [x] Project lints in CI
- [x] Core city navigation works locally
- [ ] UI smoke tests exist
- [ ] Production hosting is configured
- [ ] Dependency update policy is automated
- [ ] Error monitoring is configured
- [ ] Backend/API contracts exist
- [ ] Auth and permissions are defined
