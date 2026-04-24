'use client';

import { DISTRICTS } from '@/lib/districts';

/**
 * Top-left title card + bottom-left district legend.
 * Pointer events disabled so it never blocks scene controls.
 */
export default function HUD() {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          color: '#f4f4f8',
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            opacity: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Epic MusicSpace
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>
          The City <span style={{ opacity: 0.5, fontWeight: 500 }}>/ Skeleton</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          Drag to orbit · scroll to zoom · click a building
        </div>
        <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>
          On mobile: one finger to orbit · pinch to zoom
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          color: '#f4f4f8',
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          pointerEvents: 'none',
          zIndex: 10,
          background: 'rgba(10,10,16,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          gap: '6px 14px',
          fontSize: 12,
        }}
      >
        {DISTRICTS.map((d) => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: d.color,
                boxShadow: `0 0 10px ${d.color}`,
                display: 'inline-block',
              }}
            />
            <span>{d.name}</span>
          </div>
        ))}
      </div>
    </>
  );
}
