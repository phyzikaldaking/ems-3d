'use client';

import type { BuildingPickPayload } from './City3D';

interface DistrictPanelProps {
  pick: BuildingPickPayload | null;
  onClose: () => void;
}

/**
 * Floating info panel that appears when a user clicks a building.
 * Positioned near the click, with a dismiss control.
 */
export default function DistrictPanel({ pick, onClose }: DistrictPanelProps) {
  if (!pick) return null;

  // Clamp position so the panel doesn't overflow the viewport.
  const PANEL_W = 320;
  const PANEL_H = 220;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const left = Math.min(Math.max(12, pick.screenX + 16), vw - PANEL_W - 12);
  const top = Math.min(Math.max(12, pick.screenY + 16), vh - PANEL_H - 12);

  return (
    <div
      role="dialog"
      aria-label={`${pick.districtName} building info`}
      style={{
        position: 'fixed',
        left,
        top,
        width: PANEL_W,
        background: 'rgba(10, 10, 16, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        color: '#f4f4f8',
        padding: '16px 18px',
        fontFamily:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, opacity: 0.6, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {pick.genre}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f4f4f8',
            fontSize: 20,
            cursor: 'pointer',
            opacity: 0.7,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{pick.districtName}</div>
      <div style={{ fontSize: 14, opacity: 0.75, marginTop: 2 }}>{pick.districtTagline}</div>

      <div
        style={{
          marginTop: 14,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Building
        </div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, marginTop: 2 }}>
          {pick.buildingId}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 8, fontSize: 13 }}>
          <div>
            <span style={{ opacity: 0.55 }}>Floors: </span>
            <span style={{ fontWeight: 600 }}>{pick.floors}</span>
          </div>
          <div>
            <span style={{ opacity: 0.55 }}>Status: </span>
            <span style={{ fontWeight: 600, color: '#3DFF74' }}>Available</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Placeholder lot. Leasing + artist profiles arrive in Phase 2.
      </div>
    </div>
  );
}
