'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import HUD from '@/components/HUD';
import InteriorOverlay from '@/components/InteriorOverlay';
import { INITIAL_NAV, type NavigationState } from '@/lib/navigation';

// Babylon.js must never run on the server — it touches window/canvas directly.
const City3D = dynamic(() => import('@/components/City3D'), { ssr: false });

export default function MetaversePage() {
  const [nav, setNav] = useState<NavigationState>(INITIAL_NAV);

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

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#030307' }}>
      <City3D navigationState={nav} onNavigate={handleNavigate} />
      <HUD nav={nav} onBack={goBack} onEnter={enterBuilding} />
      <InteriorOverlay nav={nav} onClose={goBack} />
    </main>
  );
}
