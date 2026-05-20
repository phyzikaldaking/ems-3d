import { NextResponse } from 'next/server';

import { getRuntimeHealth } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const health = getRuntimeHealth();
  const { checks } = health;
  const ready = checks.siteUrlConfigured;

  return NextResponse.json(
    {
      status: ready ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      launchMode: health.launchMode,
      checks,
    },
    { status: ready ? 200 : 503 },
  );
}
