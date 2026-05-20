export const TELEMETRY_EVENTS = [
  'city_loaded',
  'studio_feed_checked',
  'checkout_returned',
  'district_opened',
  'building_opened',
  'interior_entered',
  'search_result_opened',
  'share_copied',
  'booking_confirmed',
  'checkout_started',
  'checkout_failed',
  'checkout_redirected',
  'demo_submitted',
  'membership_started',
  'rsvp_confirmed',
  'artist_followed',
  'surprise_me',
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number];

export interface TelemetryPayload {
  event: TelemetryEventName;
  sessionId?: string;
  path?: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}
