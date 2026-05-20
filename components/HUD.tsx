'use client';

import { useEffect, useRef, useState } from 'react';
import { DISTRICTS } from '@/lib/districts';
import { BUILDING_TYPE_LABELS, BUILDING_TYPE_ICONS, type NavigationState } from '@/lib/navigation';
import { trackEvent } from '@/lib/telemetry';
import type { LiveStudio, BuildingMeta } from '@/components/City3D';

interface HUDProps {
  nav: NavigationState;
  onBack: () => void;
  onEnter: () => void;
  onNavigate: (state: NavigationState) => void;
  liveStudios?: LiveStudio[];
  studioFeedStatus?: 'loading' | 'live' | 'offline';
  siteNotice?: string | null;
  onDismissNotice?: () => void;
  proximityBuilding?: BuildingMeta | null;
}

const FEATURED_DISTRICT_ID = 'hiphop-hwy';
const FEATURED_BUILDING_ID = 'hh-label-row';

const CITY_CAPABILITIES = [
  {
    title: 'Book',
    copy: 'Studios expose schedules, rates, and confirmation flows that feel like a real marketplace.',
  },
  {
    title: 'License',
    copy: 'Marketplaces surface inventory, tiered licenses, and a real Stripe-ready checkout handoff.',
  },
  {
    title: 'Grow',
    copy: 'Labels, clubs, and listening rooms connect discovery, memberships, and repeat fan activity in one map.',
  },
] as const;


const BUILDING_PLAYBOOK: Record<NonNullable<NavigationState['buildingType']>, { title: string; copy: string }> = {
  studio: {
    title: 'Booking loop',
    copy: 'Studios should convert attention into sessions with rates, availability, and instant confirmation.',
  },
  marketplace: {
    title: 'Commerce loop',
    copy: 'Marketplaces turn discovery into licensing with pricing tiers, checkout, and downloadable inventory.',
  },
  label: {
    title: 'Submission loop',
    copy: 'Labels should communicate roster strength, artist value, and a credible A&R funnel.',
  },
  room: {
    title: 'Audience loop',
    copy: 'Listening rooms make live participation visible with active sessions, queueing, and social presence.',
  },
  club: {
    title: 'Membership loop',
    copy: 'Clubs convert energy into repeat engagement through RSVP, tiered access, and recurring attendance.',
  },
  apartment: {
    title: 'Artist identity loop',
    copy: 'Residences humanize the ecosystem with artist profiles, catalog depth, and fan follow actions.',
  },
};

type DistrictEntry = (typeof DISTRICTS)[number];
type BuildingEntry = DistrictEntry['buildings'][number];

type SearchResult =
  | {
      kind: 'district';
      kindOrder: number;
      district: DistrictEntry;
      label: string;
      meta: string;
      score: number;
    }
  | {
      kind: 'building';
      kindOrder: number;
      district: DistrictEntry;
      building: BuildingEntry;
      label: string;
      meta: string;
      score: number;
    };

function scoreText(query: string, text: string): number | null {
  const normalized = text.toLowerCase();

  if (!normalized.includes(query)) return null;
  if (normalized === query) return 0;
  if (normalized.startsWith(query)) return 1;
  return 2;
}

function bestScore(query: string, values: string[]): number | null {
  let best: number | null = null;

  for (const value of values) {
    const score = scoreText(query, value);
    if (score === null) continue;
    best = best === null ? score : Math.min(best, score);
  }

  return best;
}

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

export default function HUD({
  nav,
  onBack,
  onEnter,
  onNavigate,
  liveStudios = [],
  studioFeedStatus = 'loading',
  siteNotice = null,
  onDismissNotice,
  proximityBuilding = null,
}: HUDProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [guideOpen, setGuideOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        trackEvent('share_copied', {
          mode: nav.mode,
          districtId: nav.districtId,
          buildingId: nav.buildingId,
        });
        showToast('Link copied to clipboard');
      },
      () => showToast(url),
    );
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const searchResults: SearchResult[] =
    normalizedQuery.length > 1
      ? DISTRICTS.flatMap((district) => {
          const districtScore = bestScore(normalizedQuery, [district.name, district.genre, district.tagline]);
          const results: SearchResult[] = [];

          if (districtScore !== null) {
            results.push({
              kind: 'district',
              kindOrder: 0,
              district,
              label: district.name,
              meta: `${district.genre} district`,
              score: districtScore,
            });
          }

          for (const building of district.buildings) {
            const buildingScore = bestScore(normalizedQuery, [
              building.name,
              building.description,
              building.type,
              district.name,
              district.tagline,
            ]);

            if (buildingScore === null) continue;

            results.push({
              kind: 'building',
              kindOrder: 1,
              district,
              building,
              label: building.name,
              meta: `${district.name} · ${BUILDING_TYPE_LABELS[building.type]}`,
              score: buildingScore,
            });
          }

          return results;
        })
          .sort((a, b) => a.score - b.score || a.kindOrder - b.kindOrder || a.label.localeCompare(b.label))
          .slice(0, 8)
      : [];

  useEffect(() => {
    if (searchResults.length === 0) {
      setActiveSearchIndex(-1);
      return;
    }

    setActiveSearchIndex((prev) => {
      if (prev < 0) return 0;
      return Math.min(prev, searchResults.length - 1);
    });
  }, [searchResults.length]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setActiveSearchIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const goToSearchResult = (result: SearchResult) => {
    setSearchQuery('');
    setActiveSearchIndex(-1);
    setGuideOpen(false);
    trackEvent('search_result_opened', {
      kind: result.kind,
      districtId: result.district.id,
      buildingId: result.kind === 'building' ? result.building.id : undefined,
      label: result.label,
      query: normalizedQuery,
    });

    if (result.kind === 'district') {
      onNavigate(toDistrictState(result.district.id));
      return;
    }

    onNavigate({
      mode: 'building',
      districtId: result.district.id,
      buildingId: result.building.id,
      buildingName: result.building.name,
      buildingType: result.building.type,
      buildingDescription: result.building.description,
    });
  };

  const surpriseMe = () => {
    const allBuildings = DISTRICTS.flatMap((d) => d.buildings.map((b) => ({ district: d, building: b })));
    const pick = allBuildings[Math.floor(Math.random() * allBuildings.length)]!;
    trackEvent('surprise_me', { districtId: pick.district.id, buildingId: pick.building.id });
    setGuideOpen(false);
    onNavigate({
      mode: 'building',
      districtId: pick.district.id,
      buildingId: pick.building.id,
      buildingName: pick.building.name,
      buildingType: pick.building.type,
      buildingDescription: pick.building.description,
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
  const buildingPlaybook = nav.buildingType ? BUILDING_PLAYBOOK[nav.buildingType] : null;
  const districtMood =
    district
      ? `${district.genre} district with ${districtLandmarks} landmark${districtLandmarks === 1 ? '' : 's'} and ${districtCommerce} commercial destinations.`
      : null;
  const feedLabel =
    studioFeedStatus === 'live'
      ? 'Live studio feed connected'
      : studioFeedStatus === 'offline'
        ? 'Running in showcase mode'
      : 'Checking live integrations';

  const navigateToDistrict = (districtId: (typeof DISTRICTS)[number]['id']) => {
    setGuideOpen(false);
    onNavigate(toDistrictState(districtId));
  };

  const navigateToBuilding = (districtId: (typeof DISTRICTS)[number]['id'], buildingId: string) => {
    setGuideOpen(false);
    onNavigate(toBuildingState(nav, districtId, buildingId));
  };

  const currentHeadline =
    nav.mode === 'city'
      ? 'A premium music city for discovery, commerce, and community.'
      : nav.mode === 'district'
        ? district?.name ?? 'District'
        : nav.mode === 'building'
          ? nav.buildingName ?? 'Building'
          : nav.buildingName ?? 'Interior';

  const currentCopy =
    nav.mode === 'city'
      ? 'Navigate a polished 3D platform where every building maps to a working product loop: booking, licensing, demos, events, and membership.'
      : nav.mode === 'district'
        ? `${district?.genre} — ${district?.tagline} ${districtMood ?? ''}`
        : nav.mode === 'building'
          ? `${nav.buildingDescription ?? ''} ${buildingPlaybook?.copy ?? ''}`.trim()
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
            <div className={`status-pill panel ${studioFeedStatus === 'live' ? 'status-pill--live' : studioFeedStatus === 'offline' ? 'status-pill--offline' : ''}`}>
              <span className="status-pulse" aria-hidden="true" />
              {feedLabel} · {DISTRICTS.length} districts active
            </div>
          </div>
        </div>

      {nav.mode === 'city' && (
        <section className="panel hero-panel">
          <div className="hero-grid">
            <div>
              {siteNotice && (
                <div className="site-notice" role="status" aria-live="polite">
                  <span>{siteNotice}</span>
                  {onDismissNotice && (
                    <button type="button" className="site-notice__dismiss" onClick={onDismissNotice} aria-label="Dismiss notice">
                      Close
                    </button>
                  )}
                </div>
              )}
              <div className="search-wrapper" ref={searchRef}>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search buildings, studios, labels…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveSearchIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && searchResults.length > 0) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveSearchIndex((prev) => (prev + 1) % searchResults.length);
                      return;
                    }

                    if (e.key === 'ArrowUp' && searchResults.length > 0) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
                      return;
                    }

                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setActiveSearchIndex(-1);
                      setSearchQuery('');
                      return;
                    }

                    const activeResult = activeSearchIndex >= 0 ? searchResults[activeSearchIndex] : searchResults[0];
                    if (e.key === 'Enter' && activeResult) {
                      e.preventDefault();
                      e.stopPropagation();
                      goToSearchResult(activeResult);
                    }
                  }}
                  aria-label="Search buildings"
                  autoComplete="off"
                />
                {searchResults.length > 0 && (
                  <div className="search-results" role="listbox" id="city-search-results">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.kind}-${result.kind === 'building' ? result.building.id : result.district.id}`}
                        type="button"
                        role="option"
                        aria-selected={activeSearchIndex === index}
                        className={`search-result ${activeSearchIndex === index ? 'search-result--active' : ''}`}
                        onClick={() => goToSearchResult(result)}
                        onMouseEnter={() => setActiveSearchIndex(index)}
                      >
                        <span className="search-result-icon" aria-hidden="true">
                          {result.kind === 'district'
                            ? <span className={`district-dot district-dot--${result.district.id}`} />
                            : BUILDING_TYPE_ICONS[result.building.type]}
                        </span>
                        <span className="search-result-copy">
                          <span className="search-result-name">{result.label}</span>
                          <span className="search-result-meta">{result.meta}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {normalizedQuery.length > 1 && searchResults.length === 0 && (
                  <div className="search-empty" role="status" aria-live="polite">
                    No matches. Try a district, building, or space type.
                  </div>
                )}
              </div>
              <h2 className="hero-headline">Open a district, enter a building, and see how the business works.</h2>
              <p className="hero-copy">
                Navigate by district, enter any building, and complete real product flows — from studio booking and beat licensing to demo submission and club membership.
              </p>
              <div className="kb-hints" aria-label="Keyboard shortcuts">
                <span className="kb-hint"><kbd className="kb-key">WASD</kbd> Walk</span>
                <span className="kb-hint"><kbd className="kb-key">Mouse</kbd> Look</span>
                <span className="kb-hint"><kbd className="kb-key">E</kbd> Enter</span>
                <span className="kb-hint"><kbd className="kb-key">Esc</kbd> Back</span>
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
              <button
                type="button"
                className="glass-button panel"
                onClick={surpriseMe}
              >
                Surprise me
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
              {liveStudios.length > 0 && (
                <div className="metric-card">
                  <span className="metric-value">{liveStudios.length}</span>
                  <span className="metric-label">Live artist studios</span>
                </div>
              )}
              {liveStudios.length > 0 && (
                <div className="metric-card">
                  <span className="metric-value">
                    {liveStudios.reduce((s, x) => s + x.totalSold, 0).toLocaleString()}
                  </span>
                  <span className="metric-label">Licenses sold</span>
                </div>
              )}
            </div>

            <div className="launch-grid" aria-label="Core product capabilities">
              {CITY_CAPABILITIES.map((item) => (
                <div key={item.title} className="launch-card">
                  <span className="launch-card-title">{item.title}</span>
                  <p className="launch-card-copy">{item.copy}</p>
                </div>
              ))}
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
              <div className="building-cta-wrap">
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

                {buildingPlaybook && (
                  <div className="building-brief">
                    <span className="building-brief-label">{buildingPlaybook.title}</span>
                    <p className="building-brief-copy">{buildingPlaybook.copy}</p>
                  </div>
                )}
              </div>
            ) : nav.mode === 'district' ? (
              <div className="district-brief">
                <span className="district-brief-label">District read</span>
                <p className="district-brief-copy">
                  {district?.name} combines genre identity, anchor spaces, and monetizable rooms so every area feels intentional, legible, and ready to present.
                </p>
                <div className="district-brief-tags">
                  <span className="district-brief-tag">{districtStudios} studio{districtStudios === 1 ? '' : 's'}</span>
                  <span className="district-brief-tag">{districtCommerce} commercial space{districtCommerce === 1 ? '' : 's'}</span>
                  <span className="district-brief-tag">{districtLandmarks} launch anchor{districtLandmarks === 1 ? '' : 's'}</span>
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

      {proximityBuilding && nav.mode !== 'interior' && (
        <div className="proximity-prompt" role="status" aria-live="polite">
          <kbd className="kb-key">E</kbd>
          <span>Enter {proximityBuilding.buildingName}</span>
        </div>
      )}

      {toastMsg && (
        <div className="toast" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
