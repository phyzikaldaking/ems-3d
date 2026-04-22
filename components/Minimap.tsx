'use client';

import { DISTRICTS } from '@/lib/districts';
import { type NavigationState } from '@/lib/navigation';

interface MinimapProps {
  nav: NavigationState;
  onNavigate: (state: NavigationState) => void;
}

export default function Minimap({ nav, onNavigate }: MinimapProps) {
  // Districts are ordered as col 0→2 row 0, then col 0→2 row 1 — matching a 3-column CSS grid
  const hidden = nav.mode === 'interior';

  return (
    <nav
      className={`minimap${hidden ? ' minimap--hidden' : ''}`}
      aria-label="District navigation map"
    >
      <p className="minimap-title">Districts</p>
      <div className="minimap-grid">
        {DISTRICTS.map((district) => {
          const isActive = nav.districtId === district.id;
          return (
            <button
              key={district.id}
              type="button"
              className={`minimap-cell minimap-cell--${district.id}${isActive ? ' minimap-cell--active' : ''}`}
              onClick={() =>
                onNavigate({
                  mode: 'district',
                  districtId: district.id,
                  buildingId: null,
                  buildingName: null,
                  buildingType: null,
                  buildingDescription: null,
                })
              }
              title={`${district.name} — ${district.tagline}`}
              aria-pressed={isActive}
            >
              <span className="minimap-cell-name">{district.name}</span>
              {isActive && nav.buildingId && (
                <span className="minimap-dot" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      <p className="minimap-hint">Click to navigate</p>
    </nav>
  );
}
