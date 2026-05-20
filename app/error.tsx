'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ems-3d] app error boundary:', error);
  }, [error]);

  return (
    <main className="app-fallback">
      <div className="app-fallback__content">
        <p className="app-fallback__eyebrow">Epic MusicSpace</p>
        <h1 className="app-fallback__title">The city needs a quick reload.</h1>
        <p className="app-fallback__copy">
          Something interrupted the 3D experience. Refresh the scene and your place in the city should recover.
        </p>
        <div className="app-fallback__actions">
          <button type="button" className="primary-button" onClick={reset}>
            Reload city
          </button>
          <Link className="glass-button app-fallback__link" href="/">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
