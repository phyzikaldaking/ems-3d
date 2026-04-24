'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import HUD from '@/components/HUD';
import DistrictPanel from '@/components/DistrictPanel';
import LoadingOverlay from '@/components/LoadingOverlay';
import City3DErrorBoundary from '@/components/City3DErrorBoundary';
import type { BuildingPickPayload } from '@/components/City3D';

// Babylon.js must never run on the server — it touches window/canvas directly.
const City3D = dynamic(() => import('@/components/City3D'), { ssr: false });

export default function HomePage() {
  const [pick, setPick] = useState<BuildingPickPayload | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <LoadingOverlay isLoaded={sceneReady} />
      <City3DErrorBoundary>
        <City3D onPickBuilding={setPick} onSceneReady={() => setSceneReady(true)} />
      </City3DErrorBoundary>
      <HUD />
      <DistrictPanel pick={pick} onClose={() => setPick(null)} />
    </main>
  );
}
