'use client';

import { useState, useEffect, useCallback } from 'react';
import { DISTRICTS } from '@/lib/districts';

export const ONBOARDING_KEY = 'ems-seen-v1';

interface Slide {
  id: string;
  eyebrow: string;
  headline: string;
  copy: string;
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    eyebrow: 'Welcome',
    headline: 'Epic MusicSpace',
    copy: 'The music industry, built as a 3D city. Studios. Labels. Clubs. Marketplaces. Everything is a real place you can walk into.',
  },
  {
    id: 'city',
    eyebrow: 'The World',
    headline: 'A city that works for your music career.',
    copy: 'Book studio sessions. Buy and sell beats. Submit demos to labels. Join listening rooms and events. Spatial, interactive, and built for scale.',
  },
  {
    id: 'districts',
    eyebrow: '6 Genre Districts',
    headline: 'Every genre has its own territory.',
    copy: 'From Trap Ave to Afrobeats Alley — each district has its own culture, landmark buildings, and artist community.',
  },
  {
    id: 'spaces',
    eyebrow: "What's Inside",
    headline: 'Studios. Labels. Clubs. Markets.',
    copy: 'Walk into buildings to book sessions, buy beats, follow artists, submit demos, and join events. The city is the product.',
  },
  {
    id: 'enter',
    eyebrow: "You're Ready",
    headline: 'Enter the City.',
    copy: 'Drag to orbit. Scroll to zoom. Click a district to explore. Click a building to enter.',
  },
];

const BUILDING_TYPES = [
  { icon: '🎙', label: 'Recording Studios' },
  { icon: '🏢', label: 'Label Offices' },
  { icon: '🎪', label: 'Clubs & Lounges' },
  { icon: '🛍', label: 'Marketplaces' },
  { icon: '🎵', label: 'Listening Rooms' },
  { icon: '🏠', label: 'Artist Residences' },
];

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);

  const finish = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* unavailable */ }
    setExiting(true);
    setTimeout(onComplete, 550);
  }, [onComplete]);

  const advance = useCallback(() => {
    if (current >= SLIDES.length - 1) {
      finish();
    } else {
      setCurrent((c) => c + 1);
    }
  }, [current, finish]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') advance();
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, finish]);

  const slide = SLIDES[current]!;
  const isLast = current === SLIDES.length - 1;

  return (
    <div
      className={`onboarding ${exiting ? 'onboarding--exit' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Epic MusicSpace"
    >
      <div className="onboarding-bg" aria-hidden="true" />

      <div className="onboarding-content" key={slide.id}>
        <p className="onboarding-eyebrow">{slide.eyebrow}</p>
        <h1 className="onboarding-headline">{slide.headline}</h1>
        <p className="onboarding-copy">{slide.copy}</p>

        {slide.id === 'districts' && (
          <div className="onboarding-districts" aria-label="District list">
            {DISTRICTS.map((d) => (
              <span
                key={d.id}
                className={`onboarding-district-tag onboarding-district-tag--${d.id}`}
              >
                {d.name}
              </span>
            ))}
          </div>
        )}

        {slide.id === 'spaces' && (
          <div className="onboarding-types" aria-label="Building types">
            {BUILDING_TYPES.map((t) => (
              <div key={t.label} className="onboarding-type-item">
                <span className="onboarding-type-icon" aria-hidden="true">{t.icon}</span>
                <span className="onboarding-type-label">{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-progress" role="group" aria-label="Slide progress">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`onboarding-dot ${i === current ? 'onboarding-dot--active' : ''} ${i < current ? 'onboarding-dot--done' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1} of ${SLIDES.length}`}
              aria-current={i === current ? 'true' : undefined}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          <button type="button" className="onboarding-skip" onClick={finish}>
            Skip intro
          </button>
          <button type="button" className="onboarding-next" onClick={advance}>
            {isLast ? 'Enter the City' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
