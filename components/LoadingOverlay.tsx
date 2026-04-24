'use client';

/**
 * Full-screen overlay shown while the 3D scene boots.
 * Fades out automatically once the parent signals `isLoaded`.
 */
export default function LoadingOverlay({ isLoaded }: { isLoaded: boolean }) {
  return (
    <div
      aria-hidden={isLoaded}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a10',
        zIndex: 100,
        gap: 20,
        transition: 'opacity 0.6s ease',
        opacity: isLoaded ? 0 : 1,
        pointerEvents: isLoaded ? 'none' : 'all',
      }}
    >
      {/* Neon spinner ring */}
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        style={{ animation: 'ems-spin 1s linear infinite' }}
      >
        <style>{`
          @keyframes ems-spin { to { transform: rotate(360deg); } }
        `}</style>
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke="#B026FF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="100 40"
        />
      </svg>
      <div
        style={{
          color: '#f4f4f8',
          fontSize: 13,
          opacity: 0.7,
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        Building the city…
      </div>
    </div>
  );
}
