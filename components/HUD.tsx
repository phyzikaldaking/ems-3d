'use client';

import { useState, useRef } from 'react';
import { DISTRICTS } from '@/lib/districts';
import { BUILDING_TYPE_LABELS, BUILDING_TYPE_ICONS, type NavigationState } from '@/lib/navigation';

interface HUDProps {
  nav: NavigationState;
  onBack: () => void;
  onEnter: () => void;
  onNavigate: (state: NavigationState) => void;
}

const FEATURED_DISTRICT_ID = 'hiphop-hwy';
const FEATURED_BUILDING_ID = 'hh-label-row';

function toDistrictState(districtId: (typeof DISTRICTS)[number]['id']): NavigationState {
  return {
    mode: 'district',
    districtId,
    buildingId: null,
    buildingName: null,
    buildingType: null,
    buildingDescription: null,
  };
}

function toBuildingState(nav: NavigationState, districtId: (typeof DISTRICTS)[number]['id'], buildingId: string): NavigationState {
  const district = DISTRICTS.find((entry) => entry.id === districtId);
  const building = district?.buildings.find((entry) => entry.id === buildingId);

  if (!district || !building) {
    return nav;
  }

  return {
    mode: 'building',
    districtId,
    buildingId: building.id,
    buildingName: building.name,
    buildingType: building.type,
    buildingDescription: building.description,
  };
}

export default function HUD({ nav, onBack, onEnter, onNavigate }: HUDProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg]       = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => showToast('Link copied to clipboard'),
      () => showToast(url),
    );
  };

  const searchResults =
    searchQuery.trim().length > 1
      ? DISTRICTS.flatMap((d) =>
          d.buildings
            .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((b) => ({ district: d, building: b }))
        ).slice(0, 8)
      : [];

  const goToBuilding = (districtId: string, buildingId: string) => {
    setSearchQuery('');
    const district = DISTRICTS.find((d) => d.id === districtId);
    const building = district?.buildings.find((b) => b.id === buildingId);
    if (!district || !building) return;
    onNavigate({
      mode: 'building',
      districtId: district.id,
      buildingId: building.id,
      buildingName: building.name,
      buildingType: building.type,
      buildingDescription: building.description,
    });
  };
  const district = nav.districtId ? DISTRICTS.find((d) => d.id === nav.districtId) : null;
  const inInterior = nav.mode === 'interior';
  const themeClass = `theme-${nav.districtId ?? 'city'}`;
  const totalBuildings = DISTRICTS.reduce((count, entry) => count + entry.buildings.length, 0);
  const totalLandmarks = DISTRICTS.reduce(
    (count, entry) => count + entry.buildings.filter((building) => building.isLandmark).length,
    0,
  );
  const featuredDistrict = DISTRICTS.find((entry) => entry.id === FEATURED_DISTRICT_ID) ?? DISTRICTS[0];
  const featuredBuilding = featuredDistrict.buildings.find((entry) => entry.id === FEATURED_BUILDING_ID) ?? featuredDistrict.buildings[0];
  const districtLandmarks = district?.buildings.filter((building) => building.isLandmark).length ?? 0;
  const districtStudios = district?.buildings.filter((building) => building.type === 'studio').length ?? 0;
  const districtCommerce = district?.buildings.filter((building) => building.type === 'marketplace' || building.type === 'label').length ?? 0;

  const currentHeadline =
    nav.mode === 'city'
      ? 'The Las Vegas Strip of the music industry.'
      : nav.mode === 'district'
        ? district?.name ?? 'District'
        : nav.mode === 'building'
          ? nav.buildingName ?? 'Building'
          : nav.buildingName ?? 'Interior';

  const currentCopy =
    nav.mode === 'city'
      ? 'Book studios, license beats, submit to labels, and connect with artists — all inside one living 3D city. Six districts. Every genre. Real product behind every door.'
      : nav.mode === 'district'
        ? `${district?.genre} — ${district?.tagline}`
        : nav.mode === 'building'
          ? nav.buildingDescription ?? ''
          : '';

  return (
    <div className={`hud-layer ${themeClass} ${inInterior ? 'is-muted' : ''}`}>
      <div className="topbar">
        <div className={`panel topbar-card ${nav.mode === 'city' ? '' : 'accent-panel'}`}>
          <p className="eyebrow">Epic MusicSpace · Premium City OS</p>
          <h1 className="topbar-title">{currentHeadline}</h1>
          <p className="topbar-copy">{currentCopy}</p>
          <div className="breadcrumb">
            <span>The City</span>
            {district && <span className="accent-text">{district.name}</span>}
            {nav.buildingName && <span>{nav.buildingName}</span>}
            <span>{nav.mode === 'city' ? 'Orbit, zoom, and discover' : nav.mode.toUpperCase()}</span>
          </div>
        </div>

        <div className="floating-actions">
          {nav.mode !== 'city' && !inInterior && (
            <button type="button" className="glass-button panel" onClick={onBack}>
              Back to previous layer
            </button>
          )}
          <div className="status-pill panel">
            <span className="status-pulse" aria-hidden="true" />
            World active · {DISTRICTS.length} districts live
          </div>
        </div>
      </div>

      {nav.mode === 'city' && (
        <section className="panel hero-panel">
          <div className="hero-grid">
            <div>
              <p className="section-label">Positioning</p>
              <div className="search-wrapper">
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search buildings, studios, labels…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search buildings"
                  autoComplete="off"
                />
                {searchResults.length > 0 && (
                  <div className="search-results" role="listbox">
                    {searchResults.map(({ district, building }) => (
                      <button
                        key={building.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="search-result"
                        onClick={() => goToBuilding(district.id, building.id)}
                      >
                        <span className="search-result-icon">{BUILDING_TYPE_ICONS[building.type]}</span>
                        <span className="search-result-name">{building.name}</span>
                        <span className="search-result-meta">{district.name} · {BUILDING_TYPE_LABELS[building.type]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <h2 className="hero-headline">From prototype city to venture-scale product story.</h2>
              <p className="hero-copy">
                The fastest way to make this feel bigger is to make it legible. Visitors now get a headline, a product thesis, and guided entry points into the strongest district and building the moment the page loads.
              </p>
              <div className="kb-hints" aria-label="Keyboard shortcuts">
                <span className="kb-hint"><kbd className="kb-key">←</kbd><kbd className="kb-key">→</kbd> Districts</span>
                <span className="kb-hint"><kbd className="kb-key">Enter</kbd> Go deeper</span>
                <span className="kb-hint"><kbd className="kb-key">Esc</kbd> Go back</span>
              </div>
            </div>

            <div className="cta-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => onNavigate(toDistrictState(featuredDistrict.id))}
              >
                Open {featuredDistrict.name}
              </button>
              <button
                type="button"
                className="glass-button panel"
                onClick={() => onNavigate(toBuildingState(nav, featuredDistrict.id, featuredBuilding.id))}
              >
                Jump to {featuredBuilding.name}
              </button>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-value">{DISTRICTS.length}</span>
                <span className="metric-label">Genre districts</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{totalBuildings}</span>
                <span className="metric-label">Interactive buildings</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{totalLandmarks}</span>
                <span className="metric-label">Anchor landmarks</span>
              </div>
            </div>

            <div>
              <p className="section-label">Districts</p>
              <div className="legend-grid">
                {DISTRICTS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`district-chip ${nav.districtId === entry.id ? 'active' : ''}`}
                    onClick={() => onNavigate(toDistrictState(entry.id))}
                  >
                    <span className="district-chip-copy">
                      <span className="district-chip-name">{entry.name}</span>
                      <span className="district-chip-tagline">{entry.tagline}</span>
                    </span>
                    <span className={`district-dot district-dot--${entry.id}`} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {(nav.mode === 'district' || nav.mode === 'building') && district && (
        <section className="panel insight-panel accent-panel">
          <div className="insight-grid">
            <div>
              <p className="section-label accent-text">District focus</p>
              <h2 className="insight-headline">{district.name}</h2>
              <p className="insight-copy">
                {district.tagline}
              </p>
            </div>

            <div className="mini-stats">
              <div className="mini-stat">
                <strong>{district.buildings.length}</strong>
                <span>Buildings</span>
              </div>
              <div className="mini-stat">
                <strong>{districtLandmarks}</strong>
                <span>Landmarks</span>
              </div>
              <div className="mini-stat">
                <strong>{districtStudios + districtCommerce}</strong>
                <span>Monetizable spaces</span>
              </div>
            </div>

            {nav.mode === 'building' && nav.buildingType && nav.buildingName ? (
              <div className="building-cta">
                <div className="building-cta-copy">
                  <span className="building-cta-title">
                    {BUILDING_TYPE_ICONS[nav.buildingType]} {nav.buildingName}
                  </span>
                  <span className="building-cta-text">{nav.buildingDescription}</span>
                </div>
                <div className="building-cta-actions">
                  <button type="button" className="primary-button accent-primary" onClick={onEnter}>
                    Enter interior
                  </button>
                  <button type="button" className="share-btn" onClick={copyLink} aria-label="Copy link to this building">
                    &#x1F517; Share
                  </button>
                </div>
              </div>
            ) : null}

            <div>
              <p className="section-label">Inventory</p>
              <div className="building-list">
                {district.buildings.map((building) => (
                  <button
                    key={building.id}
                    type="button"
                    className={`building-button ${nav.buildingId === building.id ? 'active' : ''}`}
                    onClick={() => onNavigate(toBuildingState(nav, district.id, building.id))}
                  >
                    <div className="building-title-row">
                      <span className="building-name">{BUILDING_TYPE_ICONS[building.type]} {building.name}</span>
                      <span className="building-type">{BUILDING_TYPE_LABELS[building.type]}</span>
                    </div>
                    <div className="building-description">{building.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {toastMsg && (
        <div className="toast" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
