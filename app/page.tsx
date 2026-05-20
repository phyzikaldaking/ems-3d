'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import HUD from '@/components/HUD';
import InteriorOverlay from '@/components/InteriorOverlay';
import Onboarding, { ONBOARDING_KEY } from '@/components/Onboarding';
import LoadingScreen from '@/components/LoadingScreen';
import Minimap from '@/components/Minimap';
import AmbientAudio from '@/components/AmbientAudio';
import { INITIAL_NAV, type NavigationState } from '@/lib/navigation';
import { DISTRICTS } from '@/lib/districts';
import { trackEvent } from '@/lib/telemetry';
import type { LiveStudio, BuildingMeta } from '@/components/City3D';

interface StudiosResponse {
  studios?: LiveStudio[];
  source?: 'live' | 'unconfigured' | 'upstream-error';
}

// Babylon.js must never run on the server — it touches window/canvas directly.
const City3D = dynamic(() => import('@/components/City3D'), { ssr: false });

export default function MetaversePage() {
  const [nav, setNav] = useState<NavigationState>(INITIAL_NAV);
  const [proximityBuilding, setProximityBuilding] = useState<BuildingMeta | null>(null);
  const proximityBuildingRef = useRef<BuildingMeta | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [startupFallbackReady, setStartupFallbackReady] = useState(false);
  const [liveStudios, setLiveStudios] = useState<LiveStudio[]>([]);
  const [studioFeedStatus, setStudioFeedStatus] = useState<'loading' | 'live' | 'offline'>('loading');
  const [siteNotice, setSiteNotice] = useState<string | null>(null);
  const cityLoadedTracked = useRef(false);
  const lastTrackedNav = useRef('');
  const studioFeedTracked = useRef(false);

  // Fetch live studio data from epic-music-space (best-effort, non-blocking)
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    fetch('/api/studios', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { studios: [], source: 'upstream-error' as const }))
      .then((data: StudiosResponse) => {
        if (Array.isArray(data.studios)) {
          setLiveStudios(data.studios);
        }

        const nextStatus = data.source === 'live' ? 'live' : 'offline';
        setStudioFeedStatus(nextStatus);
        if (!studioFeedTracked.current) {
          studioFeedTracked.current = true;
          trackEvent('studio_feed_checked', {
            status: nextStatus,
            source: data.source ?? 'unknown',
            studios: Array.isArray(data.studios) ? data.studios.length : 0,
          });
        }
      })
      .catch(() => {
        setStudioFeedStatus('offline');
        if (!studioFeedTracked.current) {
          studioFeedTracked.current = true;
          trackEvent('studio_feed_checked', { status: 'offline', source: 'network-error' });
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  // Keep a stable ref to nav for use in the keyboard handler without re-binding
  const navRef = useRef(nav);
  useEffect(() => { navRef.current = nav; }, [nav]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setStartupFallbackReady(true), 6500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (!checkout) return;

    if (checkout === 'success') {
      setSiteNotice('Payment confirmed. The marketplace flow returned successfully and the city is ready for the next step.');
      trackEvent('checkout_returned', { status: 'success' });
    } else if (checkout === 'cancelled') {
      setSiteNotice('Checkout was cancelled. Your session is still active and you can resume licensing at any time.');
      trackEvent('checkout_returned', { status: 'cancelled' });
    }

    params.delete('checkout');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    history.replaceState(null, '', nextUrl);
  }, []);

  // ── Onboarding gate ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) setShowOnboarding(true);
    } catch { /* localStorage unavailable */ }
  }, []);

  // ── Proximity callback (from City3D each frame) ──────────────────────────
  const handleProximityBuilding = useCallback((meta: BuildingMeta | null) => {
    proximityBuildingRef.current = meta;
    setProximityBuilding(meta);
  }, []);

  // ── Navigation callbacks ─────────────────────────────────────────────────
  const handleNavigate = useCallback((state: NavigationState) => {
    setNav(state);
  }, []);

  const goBack = useCallback(() => {
    setNav((prev) => {
      if (prev.mode === 'interior') {
        return { ...prev, mode: 'building' };
      }
      if (prev.mode === 'building') {
        return { ...prev, mode: 'district', buildingId: null, buildingName: null, buildingType: null, buildingDescription: null };
      }
      return INITIAL_NAV;
    });
  }, []);

  const enterBuilding = useCallback(() => {
    setNav((prev) => (prev.mode === 'building' ? { ...prev, mode: 'interior' } : prev));
  }, []);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      // Don't hijack input fields
      const active = document.activeElement;
      if (
        active instanceof HTMLElement
        && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)
      ) {
        return;
      }

      const current = navRef.current;

      if (e.key === 'Escape') {
        if (current.mode !== 'city') goBack();
        return;
      }

      // E key — enter proximity building (GTA-style)
      if (e.code === 'KeyE') {
        const prox = proximityBuildingRef.current;
        if (prox) {
          setNav({
            mode: 'interior',
            districtId: prox.districtId,
            buildingId: prox.buildingId,
            buildingName: prox.buildingName,
            buildingType: prox.buildingType,
            buildingDescription: prox.buildingDescription,
          });
        }
        return;
      }

      if (current.mode === 'building' && e.key === 'Enter') {
        enterBuilding();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goBack, handleNavigate, enterBuilding]);

  // ── URL hash deep-linking ────────────────────────────────────────────────
  // Read hash on mount and navigate to the corresponding building
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    for (const district of DISTRICTS) {
      const building = district.buildings.find((b) => b.id === hash);
      if (building) {
        handleNavigate({
          mode: 'building',
          districtId: district.id,
          buildingId: building.id,
          buildingName: building.name,
          buildingType: building.type,
          buildingDescription: building.description,
        });
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write hash as nav changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (nav.buildingId) {
      history.replaceState(null, '', `#${nav.buildingId}`);
    } else if (nav.districtId) {
      history.replaceState(null, '', `#${nav.districtId}`);
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  }, [nav.buildingId, nav.districtId]);

  const uiReady = sceneReady || startupFallbackReady;

  useEffect(() => {
    if (!uiReady || cityLoadedTracked.current) return;
    cityLoadedTracked.current = true;
    trackEvent('city_loaded', {
      readySource: sceneReady ? 'scene' : 'fallback',
      studioFeedStatus,
    });
  }, [uiReady, sceneReady, studioFeedStatus]);

  useEffect(() => {
    const key = `${nav.mode}:${nav.districtId ?? ''}:${nav.buildingId ?? ''}`;
    if (lastTrackedNav.current === key) return;
    lastTrackedNav.current = key;

    if (nav.mode === 'district' && nav.districtId) {
      trackEvent('district_opened', { districtId: nav.districtId });
      return;
    }

    if (nav.mode === 'building' && nav.buildingId) {
      trackEvent('building_opened', {
        districtId: nav.districtId,
        buildingId: nav.buildingId,
        buildingType: nav.buildingType,
      });
      return;
    }

    if (nav.mode === 'interior' && nav.buildingId) {
      trackEvent('interior_entered', {
        districtId: nav.districtId,
        buildingId: nav.buildingId,
        buildingType: nav.buildingType,
      });
    }
  }, [nav]);

  return (
    <main className="app-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <LoadingScreen ready={uiReady} />
      <City3D
        onProximityBuilding={handleProximityBuilding}
        onReady={() => setSceneReady(true)}
        liveStudios={liveStudios}
      />
      <HUD
        nav={nav}
        onBack={goBack}
        onEnter={enterBuilding}
        onNavigate={handleNavigate}
        liveStudios={liveStudios}
        studioFeedStatus={studioFeedStatus}
        siteNotice={siteNotice}
        onDismissNotice={() => setSiteNotice(null)}
        proximityBuilding={proximityBuilding}
      />
      <Minimap nav={nav} onNavigate={handleNavigate} />
      <AmbientAudio nav={nav} />
      <InteriorOverlay nav={nav} onClose={goBack} />
      {showOnboarding && uiReady && <Onboarding onComplete={() => setShowOnboarding(false)} />}
    </main>
  );
}
