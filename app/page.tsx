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

// Babylon.js must never run on the server — it touches window/canvas directly.
const City3D = dynamic(() => import('@/components/City3D'), { ssr: false });

export default function MetaversePage() {
  const [nav, setNav] = useState<NavigationState>(INITIAL_NAV);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  // Keep a stable ref to nav for use in the keyboard handler without re-binding
  const navRef = useRef(nav);
  useEffect(() => { navRef.current = nav; }, [nav]);

  // ── Onboarding gate ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) setShowOnboarding(true);
    } catch { /* localStorage unavailable */ }
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
      // Don't hijack input fields
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      const current = navRef.current;

      if (e.key === 'Escape') {
        if (current.mode !== 'city') goBack();
        return;
      }

      if (current.mode === 'city') {
        const idx = current.districtId
          ? DISTRICTS.findIndex((d) => d.id === current.districtId)
          : -1;
        if (e.key === 'ArrowRight') {
          const next = DISTRICTS[(idx + 1) % DISTRICTS.length];
          handleNavigate({ mode: 'district', districtId: next.id, buildingId: null, buildingName: null, buildingType: null, buildingDescription: null });
        } else if (e.key === 'ArrowLeft') {
          const prev = DISTRICTS[(idx - 1 + DISTRICTS.length) % DISTRICTS.length];
          handleNavigate({ mode: 'district', districtId: prev.id, buildingId: null, buildingName: null, buildingType: null, buildingDescription: null });
        }
        return;
      }

      if (current.mode === 'district' && current.districtId) {
        const district = DISTRICTS.find((d) => d.id === current.districtId);
        if (!district) return;
        const bIdx = current.buildingId
          ? district.buildings.findIndex((b) => b.id === current.buildingId)
          : -1;
        if (e.key === 'ArrowRight') {
          const b = district.buildings[(bIdx + 1) % district.buildings.length];
          handleNavigate({ mode: 'building', districtId: current.districtId, buildingId: b.id, buildingName: b.name, buildingType: b.type, buildingDescription: b.description });
        } else if (e.key === 'ArrowLeft') {
          const b = district.buildings[(bIdx - 1 + district.buildings.length) % district.buildings.length];
          handleNavigate({ mode: 'building', districtId: current.districtId, buildingId: b.id, buildingName: b.name, buildingType: b.type, buildingDescription: b.description });
        } else if (e.key === 'Enter' && current.buildingId) {
          enterBuilding();
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

  return (
    <main className="app-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <LoadingScreen ready={sceneReady} />
      <City3D
        navigationState={nav}
        onNavigate={handleNavigate}
        onReady={() => setSceneReady(true)}
      />
      <HUD nav={nav} onBack={goBack} onEnter={enterBuilding} onNavigate={handleNavigate} />
      <Minimap nav={nav} onNavigate={handleNavigate} />
      <AmbientAudio nav={nav} />
      <InteriorOverlay nav={nav} onClose={goBack} />
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
    </main>
  );
}
