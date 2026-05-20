import { NextRequest, NextResponse } from 'next/server';

import { TELEMETRY_EVENTS, type TelemetryPayload } from '@/lib/telemetry-events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_EVENTS = new Set<string>(TELEMETRY_EVENTS);
const MAX_PROPERTY_KEYS = 24;
const MAX_STRING_LENGTH = 300;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 2) return '[truncated]';
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH);

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((entry) => sanitizeValue(entry, depth + 1));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, MAX_PROPERTY_KEYS)
        .map(([key, entry]) => [key.slice(0, 80), sanitizeValue(entry, depth + 1)]),
    );
  }

  return String(value).slice(0, MAX_STRING_LENGTH);
}

function sanitizeProperties(properties: unknown) {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return {};
  return sanitizeValue(properties) as Record<string, unknown>;
}

function parsePayload(body: unknown): TelemetryPayload | null {
  if (!body || typeof body !== 'object') return null;

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.event !== 'string' || !ALLOWED_EVENTS.has(candidate.event)) return null;

  return {
    event: candidate.event as TelemetryPayload['event'],
    sessionId: typeof candidate.sessionId === 'string' ? candidate.sessionId.slice(0, 120) : undefined,
    path: typeof candidate.path === 'string' ? candidate.path.slice(0, 500) : undefined,
    timestamp: typeof candidate.timestamp === 'string' ? candidate.timestamp.slice(0, 80) : undefined,
    properties: sanitizeProperties(candidate.properties),
  };
}

async function forwardToPostHog(payload: TelemetryPayload) {
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (!apiKey) return false;

  const response = await fetch(`${host.replace(/\/$/, '')}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      event: payload.event,
      distinct_id: payload.sessionId ?? 'anonymous',
      properties: {
        ...payload.properties,
        path: payload.path,
        sent_at: payload.timestamp,
        source: 'ems-3d',
      },
    }),
  });

  return response.ok;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid telemetry payload.' }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Unsupported telemetry event.' }, { status: 400 });
  }

  try {
    const forwarded = await forwardToPostHog(payload);
    return NextResponse.json({ ok: true, forwarded });
  } catch (error) {
    console.error('[ems-3d] telemetry forward failed:', error);
    return NextResponse.json({ ok: true, forwarded: false });
  }
}
