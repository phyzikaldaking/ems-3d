'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  ready: boolean;
}

export default function LoadingScreen({ ready }: LoadingScreenProps) {
  const [exiting, setExiting] = useState(false);
  const [gone,    setGone]    = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate incremental progress until ready
  useEffect(() => {
    if (ready) {
      setProgress(100);
      return;
    }
    const iv = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 14, 85));
    }, 140);
    return () => clearInterval(iv);
  }, [ready]);

  // Trigger exit animation once ready
  useEffect(() => {
    if (!ready) return;
    const t1 = setTimeout(() => setExiting(true), 180);
    const t2 = setTimeout(() => setGone(true),    820);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [ready]);

  if (gone) return null;

  return (
    <div
      className={`loading-screen${exiting ? ' loading-screen--exit' : ''}`}
      role="status"
      aria-label="Loading Epic MusicSpace"
    >
      <div className="loading-inner">
        <p className="loading-logo">EMS</p>
        <p className="loading-eyebrow">Epic MusicSpace · City OS</p>
        <div
          className="loading-bar"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="loading-label">
          {ready ? 'Entering the city…' : 'Building the city…'}
        </p>
      </div>
    </div>
  );
}
