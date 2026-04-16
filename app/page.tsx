'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import HUD from '@/components/HUD';
import DistrictPanel from '@/components/DistrictPanel';
import type { BuildingPickPayload } from '@/components/City3D';

// Babylon.js must never run on the server — it touches window/canvas directly.
const City3D = dynamic(() => import('@/components/City3D'), { ssr: false });

export default function HomePage() {
  const [pick, setPick] = useState<BuildingPickPayload | null>(null);

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <City3D onPickBuilding={setPick} />
      <HUD />
      <DistrictPanel pick={pick} onClose={() => setPick(null)} />
    </main>
  );
}
