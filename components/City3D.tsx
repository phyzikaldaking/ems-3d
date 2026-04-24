'use client';

import { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  PointerEventTypes,
  ActionManager,
  ExecuteCodeAction,
  GlowLayer,
} from '@babylonjs/core';

import { DISTRICTS, CITY, districtCenter, type District } from '@/lib/districts';

export interface BuildingPickPayload {
  buildingId: string;
  districtId: District['id'];
  districtName: string;
  districtTagline: string;
  genre: string;
  floors: number;
  /** Screen coords of the pick, for positioning the overlay panel. */
  screenX: number;
  screenY: number;
}

interface City3DProps {
  onPickBuilding: (payload: BuildingPickPayload) => void;
  onSceneReady?: () => void;
}

/**
 * Deterministic pseudo-random so building heights/positions are stable across
 * renders — no hydration flicker, no rerolled layouts on hot reload.
 */
function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export default function City3D({ onPickBuilding, onSceneReady }: City3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engineRef.current = engine;

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.04, 0.08, 1);

    // Bird's-eye establishing shot; users can orbit/zoom.
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3.2,
      260,
      new Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 80;
    camera.upperRadiusLimit = 420;
    camera.lowerBetaLimit = 0.15;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.wheelPrecision = 2;
    camera.panningSensibility = 60;

    // Soft ambient + warm directional for Vegas-strip vibe.
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.55;
    hemi.diffuse = new Color3(0.9, 0.92, 1);
    hemi.groundColor = new Color3(0.1, 0.05, 0.2);

    const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.3), scene);
    sun.intensity = 0.85;
    sun.diffuse = new Color3(1, 0.95, 0.85);

    // Neon glow on accent strips.
    const glow = new GlowLayer('glow', scene);
    glow.intensity = 0.6;

    // Dark asphalt "sea" under the whole city.
    const ocean = MeshBuilder.CreateGround(
      'ocean',
      { width: 600, height: 600 },
      scene
    );
    const oceanMat = new StandardMaterial('oceanMat', scene);
    oceanMat.diffuseColor = new Color3(0.04, 0.04, 0.06);
    oceanMat.specularColor = new Color3(0, 0, 0);
    ocean.material = oceanMat;
    ocean.position.y = -0.2;

    // Build each district: ground plane + building grid + glowing perimeter.
    DISTRICTS.forEach((district) => {
      const { x, z } = districtCenter(district);
      const accent = Color3.FromHexString(district.color);

      // District ground plate
      const plate = MeshBuilder.CreateGround(
        `plate-${district.id}`,
        { width: CITY.TILE_SIZE, height: CITY.TILE_SIZE },
        scene
      );
      const plateMat = new StandardMaterial(`plateMat-${district.id}`, scene);
      plateMat.diffuseColor = accent.scale(0.18);
      plateMat.specularColor = new Color3(0, 0, 0);
      plateMat.emissiveColor = accent.scale(0.04);
      plate.material = plateMat;
      plate.position.set(x, 0, z);

      // Neon perimeter strip — four thin glowing boxes around the tile.
      const stripMat = new StandardMaterial(`stripMat-${district.id}`, scene);
      stripMat.diffuseColor = accent;
      stripMat.emissiveColor = accent;
      stripMat.specularColor = new Color3(0, 0, 0);

      const half = CITY.TILE_SIZE / 2;
      const thickness = 0.6;
      const stripY = 0.15;
      const strips: [number, number, number, number][] = [
        // [cx, cz, width, depth]
        [x, z - half, CITY.TILE_SIZE, thickness],
        [x, z + half, CITY.TILE_SIZE, thickness],
        [x - half, z, thickness, CITY.TILE_SIZE],
        [x + half, z, thickness, CITY.TILE_SIZE],
      ];
      strips.forEach((s, i) => {
        const strip = MeshBuilder.CreateBox(
          `strip-${district.id}-${i}`,
          { width: s[2], depth: s[3], height: 0.3 },
          scene
        );
        strip.material = stripMat;
        strip.position.set(s[0], stripY, s[1]);
      });

      // Buildings — arranged in a soft grid inside the tile, heights vary.
      const rng = seeded(hashString(district.id));
      const padding = 6;
      const innerSize = CITY.TILE_SIZE - padding * 2;
      const perSide = Math.ceil(Math.sqrt(district.buildings));
      const cell = innerSize / perSide;

      const bMat = new StandardMaterial(`buildingMat-${district.id}`, scene);
      bMat.diffuseColor = accent.scale(0.55);
      bMat.emissiveColor = accent.scale(0.08);
      bMat.specularColor = accent.scale(0.25);

      let placed = 0;
      outer: for (let row = 0; row < perSide; row++) {
        for (let col = 0; col < perSide; col++) {
          if (placed >= district.buildings) break outer;
          const bx = x - innerSize / 2 + col * cell + cell / 2 + (rng() - 0.5) * 1.5;
          const bz = z - innerSize / 2 + row * cell + cell / 2 + (rng() - 0.5) * 1.5;

          // Vary footprint + height so it looks like a skyline, not a crate farm.
          const w = 3 + rng() * 3;
          const d = 3 + rng() * 3;
          const floors = 2 + Math.floor(rng() * 12); // 2–13 floors
          const h = floors * 1.8;

          const building = MeshBuilder.CreateBox(
            `bldg-${district.id}-${placed}`,
            { width: w, depth: d, height: h },
            scene
          );
          building.material = bMat;
          building.position.set(bx, h / 2, bz);

          const buildingId = building.name;
          building.metadata = {
            buildingId,
            districtId: district.id,
            floors,
          };

          // Hover: make it pop.
          building.actionManager = new ActionManager(scene);
          building.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
              building.scaling.y = 1.04;
              canvas.style.cursor = 'pointer';
            })
          );
          building.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
              building.scaling.y = 1;
              canvas.style.cursor = 'grab';
            })
          );

          placed++;
        }
      }
    });

    // Click-to-inspect: pick meshes whose name starts with "bldg-"
    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;
      const pick = pointerInfo.pickInfo;
      if (!pick?.hit || !pick.pickedMesh) return;
      const mesh = pick.pickedMesh;
      if (!mesh.name.startsWith('bldg-')) return;

      const meta = mesh.metadata as {
        buildingId: string;
        districtId: District['id'];
        floors: number;
      };
      const district = DISTRICTS.find((d) => d.id === meta.districtId);
      if (!district) return;

      const evt = pointerInfo.event as PointerEvent;
      onPickBuilding({
        buildingId: meta.buildingId,
        districtId: district.id,
        districtName: district.name,
        districtTagline: district.tagline,
        genre: district.genre,
        floors: meta.floors,
        screenX: evt.clientX,
        screenY: evt.clientY,
      });
    });

    engine.runRenderLoop(() => scene.render());

    // Signal the parent that the first frame has been rendered.
    scene.executeWhenReady(() => onSceneReady?.());

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);
    canvas.style.cursor = 'grab';

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
      engineRef.current = null;
    };
  }, [onPickBuilding, onSceneReady]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        outline: 'none',
        touchAction: 'none',
      }}
    />
  );
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
