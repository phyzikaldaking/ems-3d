const truthyValues = new Set(['1', 'true', 'yes', 'on']);

function normalizeBoolean(value: string | undefined) {
  return truthyValues.has((value ?? '').trim().toLowerCase());
}

function sanitizeUrl(value: string | undefined) {
  if (!value?.trim()) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getSiteOrigin() {
  return sanitizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function getRuntimeHealth() {
  const siteUrl = getSiteOrigin();
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const emsApiConfigured = Boolean(process.env.EMS_API_URL?.trim());
  const analyticsConfigured = Boolean(process.env.POSTHOG_API_KEY?.trim() && process.env.POSTHOG_HOST?.trim());
  const launchMode = normalizeBoolean(process.env.NEXT_PUBLIC_LAUNCH_MODE);

  return {
    siteUrl,
    launchMode,
    checks: {
      siteUrlConfigured: Boolean(siteUrl),
      stripeConfigured,
      emsApiConfigured,
      analyticsConfigured,
    },
  };
}
