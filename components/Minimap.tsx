'use client';

import { useEffect, useState } from 'react';

import { DISTRICTS } from '@/lib/districts';
import { type NavigationState } from '@/lib/navigation';

interface MinimapProps {
  nav: NavigationState;
  onNavigate: (state: NavigationState) => void;
}

export default function Minimap({ nav, onNavigate }: MinimapProps) {
  // Districts are ordered as col 0→2 row 0, then col 0→2 row 1 — matching a 3-column CSS grid
  const hidden = nav.mode === 'interior';
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const syncCollapsed = () => {
      setCollapsed(window.innerWidth <= 700);
    };

    syncCollapsed();
    window.addEventListener('resize', syncCollapsed);
    return () => window.removeEventListener('resize', syncCollapsed);
  }, []);

  const activeDistrict = nav.districtId
    ? DISTRICTS.find((district) => district.id === nav.districtId) ?? null
    : null;

  return (
    <nav
      className={`minimap${hidden ? ' minimap--hidden' : ''}${collapsed ? ' minimap--collapsed' : ''}`}
      aria-label="District navigation map"
    >
      <div className="minimap-header">
        <div className="minimap-heading">
          <p className="minimap-title">Districts</p>
          <p className="minimap-summary">
            {activeDistrict ? activeDistrict.name : 'City overview'}
          </p>
        </div>
        <button
          type="button"
          className="minimap-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-controls="district-minimap-grid"
        >
          {collapsed ? 'Open map' : 'Hide map'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="minimap-grid" id="district-minimap-grid">
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
          <p className="minimap-hint">Tap a district to jump there</p>
        </>
      )}
    </nav>
  );
}
