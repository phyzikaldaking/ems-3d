# EMS Production Readiness Blueprint

## Current State

This repository now contains a launch-oriented Epic MusicSpace city experience:

- Next.js App Router shell
- Babylon.js 3D city scene with lite rendering mode
- typed district, building, and navigation models
- HUD, onboarding, minimap, and interior overlays
- marketplace checkout API backed by Stripe configuration
- live studio data proxy API with timeout and payload validation
- runtime health endpoint at `/api/health`
- branded error and not-found fallbacks
- CI prelaunch validation

## Production-Ready Now

- Client/server separation is in place for Babylon.js.
- Core city navigation has typed state and deep-link support.
- Interior flows cover booking, licensing, demo submission, membership, listening rooms, and artist follow actions.
- Checkout and live studio APIs degrade cleanly when env vars or upstream systems are unavailable.
- Mobile overlays, reduced-motion behavior, and lite rendering mode are accounted for.
- Build, lint, and typecheck are bundled into `npm run prelaunch`.

## Current Risks

- No automated browser smoke tests exist yet.
- Stripe and live EMS data must still be validated against production credentials.
- Analytics env vars are documented, but client-side telemetry is not wired yet.
- Auth, persistence, order fulfillment, booking storage, and demo submission storage still need real backend ownership.

## Recommended Next Steps

1. Add Playwright smoke coverage for city load, search, district navigation, building entry, and one interior flow.
2. Wire client telemetry for load time, city navigation events, checkout errors, and interior conversions.
3. Promote marketplace, booking, membership, and demo actions from local UI state to durable backend records.
4. Add production monitoring for `/api/health`, checkout failures, and studio feed failures.
5. Test the deployed site on physical iPhone and Android devices before investor demos.

## Launch Checklist

- [x] Project builds in CI
- [x] Project lints in CI
- [x] Typecheck is part of prelaunch validation
- [x] Runtime health endpoint exists
- [x] Branded app error screen exists
- [x] Branded not-found screen exists
- [x] Required env vars are documented
- [ ] UI smoke tests exist
- [ ] Production env vars are configured
- [ ] Stripe checkout is tested with production or test-mode credentials
- [ ] Live studio feed is tested against deployed EMS API
- [ ] Client telemetry is configured
- [ ] Backend persistence is defined for booking, demos, and memberships
