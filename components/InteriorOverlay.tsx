'use client';

import { DISTRICTS } from '@/lib/districts';
import { BUILDING_TYPE_ICONS, type NavigationState } from '@/lib/navigation';

interface Props {
  nav: NavigationState;
  onClose: () => void;
}

const BASE_FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, "Cascadia Code", "Fira Code", monospace';

// ── Interior content per building type ───────────────────────────────────

function StudioContent({ accent }: { accent: string }) {
  const sessions = [
    { room: 'Suite A', artist: 'YXNG BLVCK', status: 'recording', bpm: 140 },
    { room: 'Suite B', artist: '—',          status: 'available', bpm: null },
    { room: 'Suite C', artist: 'prod. 8LACK', status: 'mixing',   bpm: 92  },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
        {sessions.map((s) => (
          <div
            key={s.room}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${s.status === 'available' ? accent + '55' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, opacity: 0.45, letterSpacing: 1 }}>{s.room}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                {s.status === 'available' ? <span style={{ opacity: 0.35 }}>Open</span> : s.artist}
              </div>
              {s.bpm && (
                <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>{s.bpm} BPM</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <StatusBadge status={s.status} accent={accent} />
              {s.status === 'available' && (
                <button type="button" style={{ display: 'block', marginTop: 8, background: accent, border: 'none', color: '#05050a', fontFamily: BASE_FONT, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: '7px 14px', borderRadius: 6, cursor: 'pointer' }}>
                  Book
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ActionButton accent={accent} label="Upload Track" icon="↑" />
        <ActionButton accent={accent} label="My Sessions" icon="◷" outline />
      </div>
    </div>
  );
}

function RoomContent({ accent }: { accent: string }) {
  const nowPlaying = { title: 'No Fear (prod. Metro)', artist: 'YXNG BLVCK', bpm: 140, key: 'C# Min' };
  return (
    <div>
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: '18px 18px',
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.45, marginBottom: 8 }}>
          Now Playing
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{nowPlaying.title}</div>
        <div style={{ fontSize: 14, opacity: 0.55, marginTop: 2 }}>{nowPlaying.artist}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12 }}>
          <span style={{ opacity: 0.45 }}>BPM <strong style={{ color: accent }}>{nowPlaying.bpm}</strong></span>
          <span style={{ opacity: 0.45 }}>Key <strong style={{ color: accent }}>{nowPlaying.key}</strong></span>
          <span style={{ opacity: 0.45 }}>Listeners <strong style={{ color: accent }}>14</strong></span>
        </div>
        {/* Waveform placeholder */}
        <div style={{ height: 40, marginTop: 14, background: `linear-gradient(90deg, ${accent}22 0%, ${accent}55 50%, ${accent}22 100%)`, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '38%', background: `${accent}44`, borderRight: `2px solid ${accent}` }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ActionButton accent={accent} label="Join Session" icon="▶" />
        <ActionButton accent={accent} label="Queue" icon="≡" outline />
      </div>
    </div>
  );
}

function MarketplaceContent({ accent }: { accent: string }) {
  const listings = [
    { id: 'BT-001', name: 'Dark Meditation', type: 'Beat', bpm: 140, price: 29.99, sold: false },
    { id: 'BT-002', name: 'Pressure Season',  type: 'Stems', bpm: 88,  price: 59.99, sold: false },
    { id: 'BT-003', name: 'Glass Throne',     type: 'Beat', bpm: 162, price: 24.99, sold: true  },
    { id: 'BT-004', name: 'Jungle Fever Kit', type: 'Sample Pack', bpm: null, price: 19.99, sold: false },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
        {listings.map((l) => (
          <div
            key={l.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: l.sold ? 0.4 : 1,
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: 1, opacity: 0.4 }}>{l.id} · {l.type}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{l.name}</div>
              {l.bpm && <div style={{ fontSize: 11, opacity: 0.4, marginTop: 1 }}>{l.bpm} BPM</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: l.sold ? undefined : accent }}>${l.price}</div>
              {l.sold
                ? <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>Sold</div>
                : <button type="button" style={{ display: 'block', marginTop: 6, background: accent, border: 'none', color: '#05050a', fontFamily: BASE_FONT, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: '6px 12px', borderRadius: 5, cursor: 'pointer' }}>Buy</button>
              }
            </div>
          </div>
        ))}
      </div>
      <ActionButton accent={accent} label="List Your Sound" icon="+" />
    </div>
  );
}

function ApartmentContent({ accent, buildingName }: { accent: string; buildingName: string }) {
  const tracks = [
    { title: 'Drip Season',  plays: '142K' },
    { title: 'No Hook',      plays: '89K'  },
    { title: 'Stay Solid',   plays: '214K' },
  ];
  return (
    <div>
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: '16px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}55, ${accent}11)`,
            border: `1px solid ${accent}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          🎤
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{buildingName}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>Artist · EMS Resident</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12 }}>
            <span style={{ opacity: 0.45 }}>Followers <strong style={{ color: accent }}>2.4K</strong></span>
            <span style={{ opacity: 0.45 }}>Tracks <strong style={{ color: accent }}>18</strong></span>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        {tracks.map((t, i) => (
          <div
            key={t.title}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 4px',
              borderBottom: i < tracks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.3, width: 16 }}>{i + 1}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</span>
            </div>
            <span style={{ fontSize: 12, opacity: 0.4 }}>{t.plays}</span>
          </div>
        ))}
      </div>
      <ActionButton accent={accent} label="Follow" icon="+" />
    </div>
  );
}

function LabelContent({ accent }: { accent: string }) {
  const roster = ['YXNG BLVCK', 'prod. 8LACK', 'LILA VOSS', 'SAINT$'];
  return (
    <div>
      <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 16, lineHeight: 1.6 }}>
        One of EMS&apos;s premier labels. Signing artists across every tier — from newcomers to platinum-certified acts.
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.4, marginBottom: 10 }}>
          Current Roster
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {roster.map((artist) => (
            <div
              key={artist}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {artist}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ActionButton accent={accent} label="Submit Demo" icon="↑" />
        <ActionButton accent={accent} label="A&R Contact" icon="✉" outline />
      </div>
    </div>
  );
}

function ClubContent({ accent }: { accent: string }) {
  const events = [
    { name: 'Late Night Session',   time: 'Tonight · 11 PM',    status: 'live'     },
    { name: 'Beat Battle Vol. 4',   time: 'Fri · 9 PM',         status: 'upcoming' },
    { name: 'Producer Showcase',    time: 'Sat · 8 PM',         status: 'upcoming' },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
        {events.map((e) => (
          <div
            key={e.name}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${e.status === 'live' ? accent + '55' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{e.name}</div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{e.time}</div>
            </div>
            <StatusBadge status={e.status} accent={accent} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ActionButton accent={accent} label="Join Club" icon="★" />
        <ActionButton accent={accent} label="Events" icon="◷" outline />
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────

function StatusBadge({ status, accent }: { status: string; accent: string }) {
  const map: Record<string, { label: string; color: string }> = {
    recording: { label: 'Recording', color: '#FF3D3D' },
    mixing:    { label: 'Mixing',    color: '#FFB800' },
    available: { label: 'Open',      color: accent    },
    live:      { label: '● Live',    color: '#3DFF74' },
    upcoming:  { label: 'Upcoming',  color: '#888'    },
  };
  const cfg = map[status] ?? { label: status, color: '#888' };
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: cfg.color,
        border: `1px solid ${cfg.color}55`,
        borderRadius: 5,
        padding: '4px 8px',
        display: 'inline-block',
      }}
    >
      {cfg.label}
    </div>
  );
}

function ActionButton({
  accent, label, icon, outline,
}: {
  accent: string; label: string; icon: string; outline?: boolean;
}) {
  return (
    <button
      type="button"
      style={{
        background: outline ? 'transparent' : accent,
        border: outline ? `1px solid ${accent}66` : 'none',
        color: outline ? accent : '#05050a',
        fontFamily: BASE_FONT,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        padding: '13px 0',
        borderRadius: 8,
        cursor: 'pointer',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────

export default function InteriorOverlay({ nav, onClose }: Props) {
  if (nav.mode !== 'interior') return null;

  const district = nav.districtId ? DISTRICTS.find((d) => d.id === nav.districtId) : null;
  const accent = district?.color ?? '#FFB800';
  const icon = nav.buildingType ? BUILDING_TYPE_ICONS[nav.buildingType] : '🏢';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          background: 'rgba(6,6,12,0.92)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${accent}33`,
          borderRadius: 18,
          width: '100%',
          maxWidth: 480,
          maxHeight: '88vh',
          overflowY: 'auto',
          color: '#f4f4f8',
          fontFamily: BASE_FONT,
          boxShadow: `0 0 80px ${accent}22, 0 30px 80px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 22px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: accent, opacity: 0.9 }}>
              {icon} {district?.name} — {district?.genre}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, letterSpacing: -0.3 }}>
              {nav.buildingName}
            </div>
            <div style={{ fontSize: 13, opacity: 0.5, marginTop: 3 }}>
              {nav.buildingDescription}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: 'none',
              color: '#f4f4f8',
              fontFamily: BASE_FONT,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              padding: '8px 14px',
              borderRadius: 7,
              cursor: 'pointer',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            ← Exit
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px 24px' }}>
          {nav.buildingType === 'studio'      && <StudioContent accent={accent} />}
          {nav.buildingType === 'room'        && <RoomContent accent={accent} />}
          {nav.buildingType === 'marketplace' && <MarketplaceContent accent={accent} />}
          {nav.buildingType === 'apartment'   && <ApartmentContent accent={accent} buildingName={nav.buildingName ?? ''} />}
          {nav.buildingType === 'label'       && <LabelContent accent={accent} />}
          {nav.buildingType === 'club'        && <ClubContent accent={accent} />}
        </div>
      </div>
    </div>
  );
}
