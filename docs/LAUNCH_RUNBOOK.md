# Launch Runbook

## 1. Configure environment variables

Set these in the deployment environment before promoting the site:

- `NEXT_PUBLIC_SITE_URL`
- `EMS_API_URL`
- `STRIPE_SECRET_KEY`

Optional:

- `NEXT_PUBLIC_LAUNCH_MODE=true`
- `POSTHOG_API_KEY`
- `POSTHOG_HOST`

## 2. Build validation

Run before deployment:

```bash
npm run check:env:strict
npm run prelaunch
```

## 3. Post-deploy smoke test

Verify runtime health:

```bash
curl https://your-domain.com/api/health
```

Expected:

- `status` is `ok`
- `siteUrlConfigured` is `true`
- `stripeConfigured` matches the intended environment
- `emsApiConfigured` is `true`

Also check that unknown URLs render the branded not-found screen instead of a raw framework page:

```bash
curl -I https://your-domain.com/not-a-real-route
```

## 4. Manual walkthrough

Check these flows in the live deployment:

- City loads and onboarding opens correctly
- Search opens districts and buildings
- Minimap behaves correctly on mobile
- Studio booking flow validates contact info
- Marketplace checkout redirects correctly
- Label demo flow validates link input
- Club membership flow validates email input

## 5. Launch blockers

Do not promote if any of these are true:

- `/api/health` returns `degraded`
- checkout fails to create a Stripe session
- live studios endpoint is empty because `EMS_API_URL` is misconfigured
- mobile overlays hide primary actions or close controls
