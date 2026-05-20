'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    copy: 'The music industry reimagined as a 3D city, where studios, labels, clubs, and marketplaces become real spaces you can enter.',
  },
  {
    id: 'city',
    eyebrow: 'The World',
    headline: 'A city built for the business of music.',
    copy: 'Book studio time, license beats, submit demos, and join fan experiences inside one premium 3D platform.',
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
    copy: 'Each building is a product surface with real actions, clearer value, and a path from discovery to revenue.',
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
  const dialogRef = useRef<HTMLDivElement | null>(null);

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
    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute('disabled'));

    const initialFocus = dialogRef.current?.querySelector<HTMLButtonElement>('.onboarding-skip');
    initialFocus?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const nodes = focusables();
        if (nodes.length === 0) return;

        const active = document.activeElement as HTMLElement | null;
        if (!active || !dialogRef.current?.contains(active)) {
          e.preventDefault();
          nodes[0]?.focus();
          return;
        }

        const index = nodes.indexOf(active);
        if (index === -1) return;

        e.preventDefault();
        const nextIndex = e.shiftKey
          ? (index - 1 + nodes.length) % nodes.length
          : (index + 1) % nodes.length;
        nodes[nextIndex]?.focus();
        return;
      }

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
      ref={dialogRef}
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
