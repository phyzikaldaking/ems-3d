'use client';

import { DISTRICTS } from '@/lib/districts';
import { BUILDING_TYPE_LABELS, BUILDING_TYPE_ICONS, type NavigationState } from '@/lib/navigation';

interface HUDProps {
  nav: NavigationState;
  onBack: () => void;
  onEnter: () => void;
}

const BASE_FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function HUD({ nav, onBack, onEnter }: HUDProps) {
  const district = nav.districtId ? DISTRICTS.find((d) => d.id === nav.districtId) : null;
  const accent = district?.color ?? '#FFB800';
  const inInterior = nav.mode === 'interior';

  return (
    <>
      {/* ── Top-left: Brand + breadcrumb ──────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          color: '#f4f4f8',
          fontFamily: BASE_FONT,
          pointerEvents: 'none',
          zIndex: 30,
          opacity: inInterior ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 2.5, opacity: 0.5, textTransform: 'uppercase' }}>
          Epic Music Space
        </div>

        {nav.mode === 'city' && (
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>
            The City
          </div>
        )}

        {nav.mode !== 'city' && (
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ opacity: 0.45, fontSize: 14 }}>The City</span>
            <span style={{ opacity: 0.35 }}>/</span>
            <span style={{ color: accent }}>{district?.name}</span>
            {nav.buildingName && (
              <>
                <span style={{ opacity: 0.35 }}>/</span>
                <span style={{ fontSize: 14, opacity: 0.85 }}>{nav.buildingName}</span>
              </>
            )}
          </div>
        )}

        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
          {nav.mode === 'city'    && 'Drag to orbit · scroll to zoom · click a district'}
          {nav.mode === 'district' && `${district?.genre} — ${district?.tagline}`}
          {nav.mode === 'building' && nav.buildingType && BUILDING_TYPE_LABELS[nav.buildingType]}
        </div>
      </div>

      {/* ── Back button ──────────────────────────────────────────────── */}
      {nav.mode !== 'city' && !inInterior && (
        <button
          type="button"
          onClick={onBack}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: 'rgba(10,10,16,0.7)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            color: '#f4f4f8',
            fontFamily: BASE_FONT,
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            padding: '10px 18px',
            borderRadius: 8,
            cursor: 'pointer',
            zIndex: 30,
          }}
        >
          ← Back
        </button>
      )}

      {/* ── Building entry prompt ─────────────────────────────────────── */}
      {nav.mode === 'building' && nav.buildingType && nav.buildingName && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            zIndex: 30,
          }}
        >
          <div
            style={{
              background: 'rgba(8,8,14,0.88)',
              backdropFilter: 'blur(14px)',
              border: `1px solid ${accent}44`,
              borderRadius: 14,
              padding: '14px 22px',
              color: '#f4f4f8',
              fontFamily: BASE_FONT,
              textAlign: 'center',
              maxWidth: 340,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: accent, opacity: 0.9 }}>
              {BUILDING_TYPE_ICONS[nav.buildingType]} {BUILDING_TYPE_LABELS[nav.buildingType]}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{nav.buildingName}</div>
            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4, lineHeight: 1.4 }}>
              {nav.buildingDescription}
            </div>
          </div>

          <button
            type="button"
            onClick={onEnter}
            style={{
              background: accent,
              border: 'none',
              color: '#050508',
              fontFamily: BASE_FONT,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              padding: '14px 40px',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: `0 0 28px ${accent}66`,
            }}
          >
            Enter
          </button>
        </div>
      )}

      {/* ── District legend (city view only) ─────────────────────────── */}
      {nav.mode === 'city' && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            color: '#f4f4f8',
            fontFamily: BASE_FONT,
            pointerEvents: 'none',
            zIndex: 10,
            background: 'rgba(8,8,14,0.65)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            gap: '6px 16px',
            fontSize: 12,
          }}
        >
          {DISTRICTS.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  background: d.color,
                  boxShadow: `0 0 8px ${d.color}`,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ opacity: 0.85 }}>{d.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
