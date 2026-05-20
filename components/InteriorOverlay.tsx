'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { DISTRICTS } from '@/lib/districts';
import { BUILDING_TYPE_ICONS, type NavigationState } from '@/lib/navigation';
import { trackEvent } from '@/lib/telemetry';
import {
  getArtistByBuilding,
  getStudioSessions,
  getMarketplaceListings,
  getLabelRoster,
  getClubEvents,
  getRoomNowPlaying,
  type StudioSession,
  type MarketplaceListing,
} from '@/lib/catalog';

// ─── Shared sub-components ────────────────────────────────────────────────

interface FlowStepsProps { steps: string[]; current: number; }

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isLikelyUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('www.');
}

function FlowSteps({ steps, current }: FlowStepsProps) {
  return (
    <div className="flow-steps" role="list" aria-label="Progress">
      {steps.map((label, i) => {
        const isDone   = i < current;
        const isActive = i === current;
        return (
          <div
            key={label}
            role="listitem"
            className={`flow-step ${isActive ? 'flow-step--active' : ''} ${isDone ? 'flow-step--done' : ''}`}
          >
            {i > 0 && <span className="flow-step-line" aria-hidden="true" />}
            <span className="flow-step-dot">{isDone ? '✓' : i + 1}</span>
            <span className="flow-step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    recording: 'Recording',
    mixing:    'Mixing',
    mastering: 'Mastering',
    available: 'Open',
    live:      '● Live',
    upcoming:  'Upcoming',
    'sold-out':'Sold Out',
  };
  return (
    <span className={`status-badge status-badge--${status}`}>
      {map[status] ?? status}
    </span>
  );
}

function EventBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

// ─── Studio booking flow ──────────────────────────────────────────────────

type BookingStep = 'sessions' | 'slots' | 'confirm' | 'success';

const BOOKING_SLOTS = [
  { id: 'tod-4', time: 'Today · 4 PM',     sub: 'Available now' },
  { id: 'tod-7', time: 'Today · 7 PM',     sub: 'Limited' },
  { id: 'tom-2', time: 'Tomorrow · 2 PM',  sub: 'Available' },
  { id: 'tom-6', time: 'Tomorrow · 6 PM',  sub: 'Available' },
];

const DURATIONS = [2, 3, 4, 6];

function StudioContent({ buildingId }: { buildingId: string }) {
  const sessions = getStudioSessions(buildingId);
  const availableSession = sessions.find((s) => s.status === 'available');

  const [step, setStep]         = useState<BookingStep>('sessions');
  const [selected, setSelected] = useState<StudioSession | null>(availableSession ?? null);
  const [slot, setSlot]         = useState(BOOKING_SLOTS[0]!.id);
  const [hours, setHours]       = useState(2);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [ref] = useState(`EMS-${Math.floor(10000 + Math.random() * 89999)}`);

  const rate = selected?.ratePerHour ?? 120;
  const total = rate * hours;
  const emailValid = isValidEmail(email);

  return (
    <div>
      {step === 'sessions' && (
        <div className="step-pane">
          <div className="session-grid">
            {sessions.map((s) => (
              <div
                key={s.roomId}
                className={`session-card ${s.status === 'available' ? 'session-card--available' : ''}`}
              >
                <div className="session-left">
                  <div className="session-room">{s.roomName}</div>
                  <div className="session-artist">{s.artist ?? 'Open Studio'}</div>
                  {s.bpm && <div className="session-bpm">{s.bpm} BPM · {s.genre}</div>}
                  {s.engineerName && <div className="session-engineer">Eng: {s.engineerName}</div>}
                </div>
                <div className="session-right">
                  <StatusBadge status={s.status} />
                  {s.status === 'available' && (
                    <button
                      type="button"
                      className="int-btn int-btn--sm"
                      onClick={() => { setSelected(s); setStep('slots'); }}
                    >
                      Book · ${s.ratePerHour}/hr
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="flow-desc">Select an available room to start the booking flow.</p>
        </div>
      )}

      {step === 'slots' && (
        <div className="step-pane">
          <FlowSteps steps={['Room', 'Slot', 'Confirm']} current={1} />
          <p className="flow-section-title">{selected?.roomName}</p>
          <p className="flow-desc" style={{ margin: '4px 0 16px' }}>
            ${selected?.ratePerHour}/hr · Pick a session time and duration
          </p>

          <div className="flow-form-field">
            <span className="flow-label">Available Slots</span>
            <div className="slot-grid">
              {BOOKING_SLOTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`slot-btn ${slot === s.id ? 'slot-btn--selected' : ''}`}
                  onClick={() => setSlot(s.id)}
                >
                  <span className="slot-time">{s.time}</span>
                  <span className="slot-sub">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flow-form-field" style={{ marginTop: 14 }}>
            <span className="flow-label">Duration</span>
            <div className="duration-grid">
              {DURATIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`duration-btn ${hours === h ? 'duration-btn--selected' : ''}`}
                  onClick={() => setHours(h)}
                >
                  {h}hr
                  <span className="duration-price">${rate * h}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('sessions')}>Back</button>
            <button type="button" className="int-btn" onClick={() => setStep('confirm')}>Continue</button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="step-pane">
          <FlowSteps steps={['Room', 'Slot', 'Confirm']} current={2} />
          <p className="flow-section-title" style={{ marginBottom: 14 }}>Confirm Booking</p>

          <div className="confirm-card" style={{ marginBottom: 16 }}>
            <div className="confirm-row">
              <span className="confirm-label">Room</span>
              <span className="confirm-value">{selected?.roomName}</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Slot</span>
              <span className="confirm-value">{BOOKING_SLOTS.find((s) => s.id === slot)?.time}</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Duration</span>
              <span className="confirm-value">{hours} hours</span>
            </div>
            <div className="confirm-row confirm-row--total">
              <span className="confirm-label">Total</span>
              <span className="confirm-value confirm-value--accent">${total}</span>
            </div>
          </div>

          <div className="flow-form">
            <div className="int-form-row">
              <div className="flow-form-field">
                <label className="flow-label" htmlFor="book-name">Your Name</label>
                <input
                  id="book-name"
                  className="flow-input"
                  placeholder="Artist / Producer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flow-form-field">
                <label className="flow-label" htmlFor="book-email">Email</label>
                <input
                  id="book-email"
                  className="flow-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {email.trim() && !emailValid && (
                  <span className="flow-input-hint flow-input-hint--error">Enter a valid email so the booking confirmation can be delivered.</span>
                )}
              </div>
            </div>
          </div>

          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('slots')}>Back</button>
            <button
              type="button"
              className="int-btn"
              disabled={!name.trim() || !emailValid}
              onClick={() => {
                trackEvent('booking_confirmed', {
                  buildingId,
                  roomId: selected?.roomId,
                  slot,
                  hours,
                  total,
                });
                setStep('success');
              }}
            >
              Confirm · ${total}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flow-success">
          <div className="success-icon">✓</div>
          <h3 className="success-title">Booking Confirmed</h3>
          <p className="success-desc">
            Your session is booked. A confirmation has been sent to your email.
          </p>
          <div className="success-ref">{ref}</div>
          <div className="success-detail">
            <span>{selected?.roomName}</span>
            <span>·</span>
            <span>{BOOKING_SLOTS.find((s) => s.id === slot)?.time}</span>
            <span>·</span>
            <span>{hours}hr</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Listening room flow ──────────────────────────────────────────────────

type RoomStep = 'listening' | 'joining' | 'joined';

function RoomContent({ buildingId }: { buildingId: string }) {
  const np = getRoomNowPlaying(buildingId);
  const [step, setStep]             = useState<RoomStep>('listening');
  const [queueOpen, setQueue]       = useState(false);
  const [listenerCount, setListeners] = useState(np.listeners);

  const joinSession = useCallback(() => {
    setStep('joining');
    setTimeout(() => {
      setStep('joined');
      setListeners((c) => c + 1);
    }, 1600);
  }, []);

  return (
    <div>
      <div className="now-playing-card">
        <p className="np-label">Now Playing</p>
        <p className="np-title">{np.title}</p>
        <p className="np-artist">{np.artist}</p>
        <div className="np-meta">
          <span><span className="np-stat">{np.bpm}</span> BPM</span>
          <span>Key: <span className="np-stat">{np.key}</span></span>
          <span><span className="np-stat">{listenerCount}</span> listening</span>
        </div>

        <div className={`waveform-vis${step === 'joining' ? ' waveform-vis--paused' : ''}`} aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="waveform-vis-bar" />
          ))}
        </div>
        <div className="waveform-times">
          <span>1:24</span>
          <span>3:18</span>
        </div>
      </div>

      {step === 'listening' && (
        <div className="int-btn-row">
          <button type="button" className="int-btn" onClick={joinSession}>Join Session</button>
          <button
            type="button"
            className={`int-btn int-btn--outline ${queueOpen ? 'int-btn--active' : ''}`}
            onClick={() => setQueue((v) => !v)}
          >
            {queueOpen ? 'Close Queue' : 'View Queue'}
          </button>
        </div>
      )}

      {step === 'joining' && (
        <div className="joining-state">
          <div className="joining-spinner" aria-hidden="true" />
          <span>Joining session…</span>
        </div>
      )}

      {step === 'joined' && (
        <div className="step-pane">
          <div className="joined-badge">✓ You are now in the listening room · {listenerCount} people here</div>
          <div className="int-btn-row">
            <button
              type="button"
              className={`int-btn int-btn--outline ${queueOpen ? 'int-btn--active' : ''}`}
              onClick={() => setQueue((v) => !v)}
            >
              {queueOpen ? 'Close Queue' : 'View Queue'}
            </button>
          </div>
        </div>
      )}

      {queueOpen && (
        <div className="queue-list">
          <p className="queue-label">Up Next</p>
          {[
            `${np.artist} — Unreleased Track`,
            'Freestyle Session (Open)',
            'DJ Set · Guest host pending',
          ].map((item, i) => (
            <div key={item} className="queue-item">
              <span>{item}</span>
              <span className="queue-item-num">{i + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Marketplace checkout flow ────────────────────────────────────────────

type CheckoutStep = 'browse' | 'license' | 'payment' | 'success';

const LICENSE_TIERS = (listing: MarketplaceListing) => [
  {
    key: 'basic',
    name: 'Basic License',
    price: `$${listing.price}`,
    features: ['MP3 Download', 'Non-exclusive', 'Up to 3,000 streams', 'Music videos OK', 'No resale'],
  },
  {
    key: 'premium',
    name: 'Premium License',
    price: `$${listing.premiumPrice}`,
    features: ['WAV + MP3', 'Non-exclusive', 'Unlimited streams', 'Radio broadcast OK', 'No resale'],
  },
  {
    key: 'exclusive',
    name: 'Exclusive',
    price: `$${listing.exclusivePrice}`,
    features: ['Full Stems + WAV', 'Exclusive rights', 'Unlimited everything', 'Commercial TV / Film', 'Producer credits you'],
  },
];

function MarketplaceContent({ buildingId }: { buildingId: string }) {
  const listings = getMarketplaceListings(buildingId);
  const [step, setStep]                   = useState<CheckoutStep>('browse');
  const [activeListing, setActiveListing] = useState<MarketplaceListing | null>(null);
  const [licenseKey, setLicenseKey]       = useState('basic');
  const [loading, setLoading]             = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutMode, setCheckoutMode]   = useState<'ready' | 'unavailable'>('ready');
  const [ref] = useState(`ORD-${Math.floor(10000 + Math.random() * 89999)}`);

  const tiers = activeListing ? LICENSE_TIERS(activeListing) : [];
  const selectedTier = tiers.find((t) => t.key === licenseKey);

  async function handleStripeCheckout() {
    if (!activeListing) return;
    setLoading(true);
    setCheckoutError('');
    trackEvent('checkout_started', {
      buildingId,
      listingId: activeListing.id,
      tier: licenseKey,
      price: selectedTier?.price,
    });

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: licenseKey,
          trackName: activeListing.name,
          producer: activeListing.producer,
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        trackEvent('checkout_failed', {
          buildingId,
          listingId: activeListing.id,
          tier: licenseKey,
          status: res.status,
          reason: data.error ?? 'missing-checkout-url',
        });
        setCheckoutMode(res.status === 503 ? 'unavailable' : 'ready');
        setCheckoutError(
          res.status === 503
            ? 'Stripe is not configured for this environment yet. The licensing flow is live, but card checkout is currently offline.'
            : data.error ?? 'Checkout unavailable. Try again.',
        );
        setLoading(false);
        return;
      }

      setCheckoutMode('ready');
      trackEvent('checkout_redirected', {
        buildingId,
        listingId: activeListing.id,
        tier: licenseKey,
      });
      window.location.href = data.checkoutUrl;
    } catch {
      trackEvent('checkout_failed', {
        buildingId,
        listingId: activeListing.id,
        tier: licenseKey,
        reason: 'network-error',
      });
      setCheckoutError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div>
      {step === 'browse' && (
        <div className="step-pane">
          <div className="listing-grid">
            {listings.map((l) => (
              <div key={l.id} className={`listing-card ${l.sold ? 'listing-card--sold' : ''}`}>
                <div className="listing-left">
                  <div className="listing-meta">{l.id} · {l.type} · {l.genre}</div>
                  <div className="listing-name">{l.name}</div>
                  {l.bpm && <div className="listing-bpm">{l.bpm} BPM · {l.key}</div>}
                  <div className="listing-plays">{l.plays.toLocaleString()} plays · {l.producer}</div>
                </div>
                <div className="listing-right">
                  {l.sold ? (
                    <span className="listing-sold">Sold</span>
                  ) : (
                    <>
                      <span className="listing-price listing-price--accent">${l.price}</span>
                      <button
                        type="button"
                        className="int-btn int-btn--sm"
                        onClick={() => { setActiveListing(l); setLicenseKey('basic'); setStep('license'); }}
                      >
                        License
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'license' && activeListing && (
        <div className="step-pane">
          <FlowSteps steps={['Browse', 'License', 'Payment']} current={1} />
          <p className="flow-section-title" style={{ marginBottom: 4 }}>{activeListing.name}</p>
          <p className="flow-desc" style={{ marginBottom: 16 }}>by {activeListing.producer}</p>
          <div className="license-grid">
            {tiers.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`license-card ${licenseKey === t.key ? 'license-card--selected' : ''}`}
                onClick={() => setLicenseKey(t.key)}
              >
                <div className="license-name">{t.name}</div>
                <div className="license-price">{t.price}</div>
                <ul className="license-features">
                  {t.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </button>
            ))}
          </div>
          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('browse')}>Back</button>
            <button type="button" className="int-btn" onClick={() => setStep('payment')}>
              Continue · {selectedTier?.price}
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && activeListing && (
        <div className="step-pane">
          <FlowSteps steps={['Browse', 'License', 'Payment']} current={2} />
          <div className="payment-summary" style={{ marginBottom: 24 }}>
            <span>{activeListing.name} · {selectedTier?.name}</span>
            <span className="payment-price">{selectedTier?.price}</span>
          </div>
          <div className="payment-note">
            You&apos;ll be redirected to Stripe to complete payment securely, then returned to the city with purchase confirmation.
          </div>
          {checkoutError && (
            <div className={`flow-alert ${checkoutMode === 'unavailable' ? 'flow-alert--warning' : 'flow-alert--error'}`}>
              {checkoutError}
            </div>
          )}
          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => { setStep('license'); setCheckoutError(''); }}>Back</button>
            <button
              type="button"
              className="int-btn"
              disabled={loading}
              onClick={handleStripeCheckout}
            >
              {loading ? 'Redirecting…' : `Pay ${selectedTier?.price} via Stripe`}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && activeListing && (
        <div className="flow-success">
          <div className="success-icon">✓</div>
          <h3 className="success-title">Purchase Complete</h3>
          <p className="success-desc">Your license is ready to download. Check your email for the full package.</p>
          <div className="success-ref">{ref}</div>
          <div className="success-detail">
            <span>{activeListing.name}</span>
            <span>·</span>
            <span>{selectedTier?.name}</span>
            <span>·</span>
            <span>{selectedTier?.price}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Artist profile + follow flow ─────────────────────────────────────────

type FollowStep = 'profile' | 'followed' | 'notifications';

const NOTIF_OPTIONS = [
  { key: 'all',      icon: '🔔', label: 'All Activity' },
  { key: 'releases', icon: '🎵', label: 'New Releases' },
  { key: 'off',      icon: '🔕', label: 'Off' },
];

function ApartmentContent({ buildingId, buildingName }: { buildingId: string; buildingName: string }) {
  const artist = getArtistByBuilding(buildingId);
  const [step, setStep]   = useState<FollowStep>('profile');
  const [notif, setNotif] = useState('all');

  const displayName  = artist?.name    ?? buildingName;
  const displayRole  = artist?.role    ?? 'Artist · EMS';
  const displayBio   = artist?.bio     ?? 'Independent artist based in Epic MusicSpace.';
  const followers    = artist?.followers ?? 0;
  const monthly      = artist?.monthlyListeners ?? 0;
  const verified     = artist?.verified ?? false;
  const tracks       = artist?.tracks  ?? [];

  return (
    <div>
      <div className="artist-header">
        <div className="artist-avatar" aria-hidden="true">🎤</div>
        <div className="artist-info">
          <div className="artist-name">
            {displayName}
            {verified && <span className="artist-verified" title="Verified">✓</span>}
          </div>
          <div className="artist-role">{displayRole}</div>
          <div className="artist-stats">
            <span><strong>{followers.toLocaleString()}</strong> followers</span>
            <span><strong>{monthly.toLocaleString()}</strong> monthly listeners</span>
          </div>
        </div>
      </div>

      {step === 'profile' && (
        <div className="step-pane">
          <p className="artist-bio">{displayBio}</p>
          {tracks.length > 0 && (
            <div className="track-list">
              {tracks.map((t, i) => (
                <div key={t.title} className="track-row">
                  <div className="track-left">
                    <span className="track-num">{i + 1}</span>
                    <div>
                      <div className="track-title">{t.title}</div>
                      {t.feat && <div className="track-feat">{t.feat}</div>}
                    </div>
                  </div>
                  <div className="track-right">
                    {t.bpm && <span className="track-bpm">{t.bpm} BPM</span>}
                    <span className="track-plays">{t.plays}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="int-btn int-btn--full int-btn--mt"
            onClick={() => {
              trackEvent('artist_followed', {
                buildingId,
                artist: displayName,
              });
              setStep('followed');
            }}
          >
            + Follow {displayName}
          </button>
        </div>
      )}

      {step === 'followed' && (
        <div className="step-pane">
          <p className="artist-bio">{displayBio}</p>
          <div className="joined-badge">✓ You are now following {displayName}</div>
          <p className="flow-section-title" style={{ margin: '14px 0 10px' }}>Notification preferences</p>
          <div className="notif-grid">
            {NOTIF_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                className={`notif-btn ${notif === o.key ? 'notif-btn--selected' : ''}`}
                onClick={() => { setNotif(o.key); setStep('notifications'); }}
              >
                <span className="notif-icon">{o.icon}</span>
                <span className="notif-label">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'notifications' && (
        <div className="flow-success">
          <div className="success-icon">✓</div>
          <h3 className="success-title">Following {displayName}</h3>
          <p className="success-desc">
            You&apos;ll be notified about {NOTIF_OPTIONS.find((o) => o.key === notif)?.label.toLowerCase()}.
          </p>
          <div className="success-detail">
            <span>{(followers + 1).toLocaleString()} followers now</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Label demo submission flow ───────────────────────────────────────────

type DemoStep = 'roster' | 'track' | 'artist-info' | 'message' | 'review' | 'success';

function LabelContent({ buildingId }: { buildingId: string }) {
  const data = getLabelRoster(buildingId);
  const [step, setStep]         = useState<DemoStep>('roster');
  const [trackName, setTrack]   = useState('');
  const [trackLink, setLink]    = useState('');
  const [trackBpm, setBpm]      = useState('');
  const [trackGenre, setGenre]  = useState('');
  const [artistName, setAName]  = useState('');
  const [socialHandle, setSoc]  = useState('');
  const [message, setMessage]   = useState('');
  const [ref] = useState(`DEMO-${Math.floor(10000 + Math.random() * 89999)}`);

  const platinum   = data.artists.filter((a) => a.tier === 'Platinum').length;
  const rising     = data.artists.filter((a) => a.tier === 'Rising').length;
  const newSigning = data.artists.filter((a) => a.tier === 'New Signing').length;

  const STEP_LABELS = ['Roster', 'Track', 'Artist', 'Message', 'Review'];
  const stepIndex: Record<DemoStep, number> = { roster: 0, track: 1, 'artist-info': 2, message: 3, review: 4, success: 5 };
  const trackLinkValid = isLikelyUrl(trackLink);

  return (
    <div>
      {step === 'roster' && (
        <div className="step-pane">
          <p className="label-desc">{data.description}</p>
          <div className="roster-stats">
            <div className="roster-stat"><strong>{platinum}</strong><span>Platinum</span></div>
            <div className="roster-stat"><strong>{rising}</strong><span>Rising</span></div>
            <div className="roster-stat"><strong>{newSigning}</strong><span>New Signings</span></div>
          </div>
          <div className="roster-list">
            {[...data.artists].sort((a, b) => {
              const order: Record<string, number> = { Platinum: 0, Rising: 1, 'New Signing': 2 };
              return (order[a.tier] ?? 3) - (order[b.tier] ?? 3);
            }).map((a) => (
              <div key={a.name} className={`roster-row roster-row--${a.tier.toLowerCase().replace(' ', '-')}`}>
                <div className="roster-left">
                  <span className="roster-name">{a.name}</span>
                  <span className="roster-genre">{a.genre} · {a.dealType}</span>
                </div>
                <div className="roster-right">
                  <span className="roster-streams">{a.streams}</span>
                  <span className={`roster-tier roster-tier--${a.tier.toLowerCase().replace(' ', '-')}`}>{a.tier}</span>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="int-btn int-btn--full int-btn--mt" onClick={() => setStep('track')}>
            Submit Demo
          </button>
        </div>
      )}

      {step === 'track' && (
        <div className="step-pane">
          <FlowSteps steps={STEP_LABELS} current={stepIndex[step]} />
          <div className="flow-form">
            <p className="flow-section-title">Track Information</p>
            <div className="flow-form-field">
              <label className="flow-label" htmlFor="demo-name">Track Name</label>
              <input id="demo-name" className="flow-input" placeholder="e.g. No Fear (prod. 8LACK)" value={trackName} onChange={(e) => setTrack(e.target.value)} />
            </div>
            <div className="flow-form-field">
              <label className="flow-label" htmlFor="demo-link">Stream / Download Link</label>
              <input id="demo-link" className="flow-input" placeholder="SoundCloud, YouTube, Drive…" value={trackLink} onChange={(e) => setLink(e.target.value)} />
              {trackLink.trim() && !trackLinkValid && (
                <span className="flow-input-hint flow-input-hint--error">Use a full link so A&amp;R can review the track without follow-up.</span>
              )}
            </div>
            <div className="int-form-row">
              <div className="flow-form-field">
                <label className="flow-label" htmlFor="demo-bpm">BPM</label>
                <input id="demo-bpm" className="flow-input" placeholder="e.g. 140" value={trackBpm} onChange={(e) => setBpm(e.target.value)} />
              </div>
              <div className="flow-form-field">
                <label className="flow-label" htmlFor="demo-genre">Genre</label>
                <input id="demo-genre" className="flow-input" placeholder="e.g. Trap" value={trackGenre} onChange={(e) => setGenre(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('roster')}>Back</button>
            <button type="button" className="int-btn" disabled={!trackName.trim() || !trackLinkValid} onClick={() => setStep('artist-info')}>Next</button>
          </div>
        </div>
      )}

      {step === 'artist-info' && (
        <div className="step-pane">
          <FlowSteps steps={STEP_LABELS} current={stepIndex[step]} />
          <div className="flow-form">
            <p className="flow-section-title">Artist Information</p>
            <div className="flow-form-field">
              <label className="flow-label" htmlFor="demo-aname">Artist Name</label>
              <input id="demo-aname" className="flow-input" placeholder="Your stage name" value={artistName} onChange={(e) => setAName(e.target.value)} />
            </div>
            <div className="flow-form-field">
              <label className="flow-label" htmlFor="demo-social">Instagram / TikTok Handle</label>
              <input id="demo-social" className="flow-input" placeholder="@handle" value={socialHandle} onChange={(e) => setSoc(e.target.value)} />
            </div>
          </div>
          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('track')}>Back</button>
            <button type="button" className="int-btn" disabled={!artistName.trim()} onClick={() => setStep('message')}>Next</button>
          </div>
        </div>
      )}

      {step === 'message' && (
        <div className="step-pane">
          <FlowSteps steps={STEP_LABELS} current={stepIndex[step]} />
          <div className="flow-form">
            <p className="flow-section-title">Message to A&amp;R</p>
            <p className="flow-desc" style={{ margin: '4px 0 10px' }}>
              Tell us about yourself, your sound, and why you want to sign with this label.
            </p>
            <div className="flow-form-field">
              <label className="flow-label" htmlFor="demo-msg">Your Message</label>
              <textarea
                id="demo-msg"
                className="flow-input flow-textarea"
                placeholder="Keep it short and direct…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('artist-info')}>Back</button>
            <button type="button" className="int-btn" disabled={!message.trim()} onClick={() => setStep('review')}>Review</button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="step-pane">
          <FlowSteps steps={STEP_LABELS} current={stepIndex[step]} />
          <p className="flow-section-title" style={{ marginBottom: 12 }}>Review &amp; Submit</p>
          <div className="review-grid">
            <div className="review-row"><span>Track</span><span>{trackName}</span></div>
            <div className="review-row"><span>Link</span><span className="review-link">{trackLink}</span></div>
            <div className="review-row"><span>Artist</span><span>{artistName}</span></div>
            <div className="review-row"><span>Social</span><span>{socialHandle || '—'}</span></div>
            <div className="review-row"><span>Genre</span><span>{trackGenre} {trackBpm ? `· ${trackBpm} BPM` : ''}</span></div>
          </div>
          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('message')}>Back</button>
            <button
              type="button"
              className="int-btn"
              onClick={() => {
                trackEvent('demo_submitted', {
                  buildingId,
                  genre: trackGenre || 'unspecified',
                  hasSocial: Boolean(socialHandle.trim()),
                });
                setStep('success');
              }}
            >
              Submit Demo
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flow-success">
          <div className="success-icon">✓</div>
          <h3 className="success-title">Demo Submitted</h3>
          <p className="success-desc">Our A&amp;R team will review your submission within 5–7 business days.</p>
          <div className="success-ref">{ref}</div>
          <div className="success-detail">
            <span>{trackName}</span>
            <span>·</span>
            <span>{artistName}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Club RSVP + membership flow ─────────────────────────────────────────

type ClubStep = 'events' | 'tiers' | 'email' | 'success';

const MEMBERSHIP_TIERS = [
  {
    key: 'free',
    name: 'Fan',
    price: 'Free',
    features: ['Event notifications', 'Public chat access', 'View lineup updates'],
  },
  {
    key: 'member',
    name: 'Member',
    price: '$9/mo',
    features: ['Early access to events', 'Priority RSVP', 'Members-only chat', 'Digital badge'],
  },
  {
    key: 'vip',
    name: 'VIP',
    price: '$25/mo',
    features: ['All Member perks', 'VIP entry queue', 'Artist meet & greet', 'EMS Gold badge'],
  },
];

function ClubContent({ buildingId }: { buildingId: string }) {
  const events = getClubEvents(buildingId);
  const [step, setStep]           = useState<ClubStep>('events');
  const [rsvpEvent, setRsvpEvent] = useState<string | null>(null);
  const [tier, setTier]           = useState('free');
  const [email, setEmail]         = useState('');
  const [ref] = useState(`MBR-${Math.floor(10000 + Math.random() * 89999)}`);
  const emailValid = isValidEmail(email);

  const handleRsvp = (eventId: string) => {
    setRsvpEvent(eventId);
    trackEvent('rsvp_confirmed', {
      buildingId,
      eventId,
    });
    setStep('success');
  };

  return (
    <div>
      {step === 'events' && (
        <div className="step-pane">
          <div className="event-grid">
            {events.map((e) => (
              <div key={e.id} className={`event-card event-card--${e.status}`}>
                <div className="event-left">
                  <div className="event-name">{e.name}</div>
                  <div className="event-meta">{e.time} · {e.type}</div>
                  <div className="event-capacity">Host: {e.host}</div>
                </div>
                <div className="event-right">
                  <EventBadge status={e.status} />
                  {e.status === 'sold-out' ? (
                    <span className="event-capacity">Sold out</span>
                  ) : (
                    <button
                      type="button"
                      className="int-btn int-btn--sm"
                      onClick={() => handleRsvp(e.id)}
                    >
                      RSVP
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="int-btn int-btn--outline int-btn--full int-btn--mt" onClick={() => setStep('tiers')}>
            Join Club Membership
          </button>
        </div>
      )}

      {step === 'tiers' && (
        <div className="step-pane">
          <p className="flow-section-title" style={{ marginBottom: 14 }}>Choose Your Membership</p>
          <div className="tier-grid">
            {MEMBERSHIP_TIERS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`tier-card ${tier === t.key ? 'tier-card--selected' : ''}`}
                onClick={() => setTier(t.key)}
              >
                <div className="tier-name">{t.name}</div>
                <div className="tier-price">{t.price}</div>
                <ul className="tier-features">
                  {t.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </button>
            ))}
          </div>
          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('events')}>Back</button>
            <button type="button" className="int-btn" onClick={() => setStep('email')}>Continue</button>
          </div>
        </div>
      )}

      {step === 'email' && (
        <div className="step-pane">
          <div className="payment-summary" style={{ marginBottom: 14 }}>
            <span>{MEMBERSHIP_TIERS.find((t) => t.key === tier)?.name} Membership</span>
            <span className="payment-price">{MEMBERSHIP_TIERS.find((t) => t.key === tier)?.price}</span>
          </div>
          <div className="flow-form">
            <div className="flow-form-field">
              <label className="flow-label" htmlFor="club-email">Email Address</label>
              <input id="club-email" className="flow-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              {email.trim() && !emailValid && (
                <span className="flow-input-hint flow-input-hint--error">Enter a valid email for ticket updates and membership receipts.</span>
              )}
            </div>
          </div>
          <div className="int-btn-row int-btn-row--mt">
            <button type="button" className="int-btn int-btn--outline" onClick={() => setStep('tiers')}>Back</button>
            <button
              type="button"
              className="int-btn"
              disabled={!emailValid}
              onClick={() => {
                trackEvent('membership_started', {
                  buildingId,
                  tier,
                });
                setStep('success');
              }}
            >
              Join
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flow-success">
          <div className="success-icon">✓</div>
          <h3 className="success-title">
            {rsvpEvent
              ? `You're In — ${events.find((e) => e.id === rsvpEvent)?.name}`
              : `${MEMBERSHIP_TIERS.find((t) => t.key === tier)?.name} Membership Active`}
          </h3>
          <p className="success-desc">
            {rsvpEvent
              ? `RSVP confirmed. See you there.`
              : `Your membership is now active. Welcome to the club.`}
          </p>
          <div className="success-ref">{ref}</div>
        </div>
      )}
    </div>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────

interface Props {
  nav: NavigationState;
  onClose: () => void;
}

export default function InteriorOverlay({ nav, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (nav.mode !== 'interior') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((node) => !node.hasAttribute('disabled'));

    window.setTimeout(() => {
      focusables()[0]?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = focusables();
      if (nodes.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      const index = active ? nodes.indexOf(active) : -1;

      event.preventDefault();
      if (event.shiftKey) {
        nodes[(index <= 0 ? nodes.length : index) - 1]?.focus();
      } else {
        nodes[(index + 1) % nodes.length]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nav.mode, onClose]);

  if (nav.mode !== 'interior') return null;

  const district  = nav.districtId   ? DISTRICTS.find((d) => d.id === nav.districtId) : null;
  const icon      = nav.buildingType ? BUILDING_TYPE_ICONS[nav.buildingType] : '🏢';
  const buildingId = nav.buildingId ?? '';

  return (
    <div className={`int-overlay theme-${nav.districtId ?? 'hiphop-hwy'}`} role="dialog" aria-modal="true" aria-label={nav.buildingName ?? 'Building'}>
      <div className="int-panel" ref={dialogRef}>
        <div className="int-header">
          <div className="int-header-copy">
            <p className="int-district-label">
              {icon} {district?.name ?? ''} — {district?.genre ?? ''}
            </p>
            <h2 className="int-building-title">{nav.buildingName}</h2>
            {nav.buildingDescription && (
              <p className="int-building-desc">{nav.buildingDescription}</p>
            )}
          </div>
          <button type="button" className="int-exit-btn" onClick={onClose} aria-label="Close">
            ✕ Close
          </button>
        </div>

        <div className="int-body">
          {nav.buildingType === 'studio'      && <StudioContent      buildingId={buildingId} />}
          {nav.buildingType === 'room'        && <RoomContent        buildingId={buildingId} />}
          {nav.buildingType === 'marketplace' && <MarketplaceContent buildingId={buildingId} />}
          {nav.buildingType === 'apartment'   && <ApartmentContent   buildingId={buildingId} buildingName={nav.buildingName ?? ''} />}
          {nav.buildingType === 'label'       && <LabelContent       buildingId={buildingId} />}
          {nav.buildingType === 'club'        && <ClubContent        buildingId={buildingId} />}
        </div>
      </div>
    </div>
  );
}
