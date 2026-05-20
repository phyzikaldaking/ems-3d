'use client';

import { type TelemetryEventName, type TelemetryPayload } from '@/lib/telemetry-events';

const SESSION_KEY = 'ems-telemetry-session';

function createSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `ems-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const nextId = createSessionId();
    window.localStorage.setItem(SESSION_KEY, nextId);
    return nextId;
  } catch {
    return createSessionId();
  }
}

export function trackEvent(event: TelemetryEventName, properties: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  const payload: TelemetryPayload = {
    event,
    properties,
    sessionId: getSessionId(),
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    timestamp: new Date().toISOString(),
  };
  const body = JSON.stringify(payload);

  if ('sendBeacon' in navigator) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/telemetry', blob);
    return;
  }

  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Telemetry must never interrupt the experience.
  });
}
