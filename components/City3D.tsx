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
  Mesh,
  MeshBuilder,
  StandardMaterial,
  PointerEventTypes,
  ActionManager,
  ExecuteCodeAction,
  GlowLayer,
  DefaultRenderingPipeline,
  ShadowGenerator,
  Animation,
  CubicEase,
  EasingFunction,
  DynamicTexture,
  Texture,
  ParticleSystem,
} from '@babylonjs/core';

import { DISTRICTS, CITY, districtCenter, type BuildingType, type BuildingDef, type DistrictId, type District } from '@/lib/districts';
import { type NavigationState } from '@/lib/navigation';

interface City3DProps {
  navigationState: NavigationState;
  onNavigate: (state: NavigationState) => void;
  onReady?: () => void;
}

interface BuildingMeta {
  buildingId: string;
  buildingType: BuildingType;
  buildingName: string;
  buildingDescription: string;
  districtId: DistrictId;
  floors: number;
}

function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getBuildingShape(b: BuildingDef): { w: number; d: number; h: number } {
  const baseH = b.floors * 1.8;
  const lm = b.isLandmark ? 1.25 : 1;
  switch (b.type) {
    case 'studio':      return { w: 4 * lm, d: 4 * lm, h: baseH * lm };
    case 'room':        return { w: 9 * lm, d: 9 * lm, h: baseH * 0.5 };
    case 'marketplace': return { w: 10,     d: 5,       h: baseH * 0.5 };
    case 'apartment':   return { w: 4,      d: 4,       h: baseH };
    case 'label':       return { w: 7 * lm, d: 7 * lm, h: baseH * lm * 1.1 };
    case 'club':        return { w: 7,      d: 7,       h: baseH * 0.75 };
    default:            return { w: 4,      d: 4,       h: baseH };
  }
}

function getEmissiveScale(type: BuildingType): number {
  switch (type) {
    case 'studio':      return 0.18;
    case 'label':       return 0.22;
    case 'club':        return 0.20;
    case 'room':        return 0.12;
    case 'marketplace': return 0.13;
    case 'apartment':   return 0.05;
    default:            return 0.08;
  }
}

// ─── Window overlay planes per building face ──────────────────────────────
function addWindowPlanes(
  scene: Scene,
  bx: number, bz: number,
  shape: { w: number; d: number; h: number },
  floors: number,
  id: string,
  accent: Color3
): void {
  const CELL = 32;
  const COLS = 4;
  const ROWS = 4;
  const TEX  = CELL * COLS; // 128 px
  const PAD  = 5;
  const ar = Math.round(accent.r * 255);
  const ag = Math.round(accent.g * 255);
  const ab = Math.round(accent.b * 255);

  const faces: Array<{ suf: string; faceW: number; px: number; pz: number; ry: number }> = [
    { suf: 'f', faceW: shape.w, px: bx,                       pz: bz - shape.d / 2 - 0.09, ry: Math.PI },
    { suf: 'b', faceW: shape.w, px: bx,                       pz: bz + shape.d / 2 + 0.09, ry: 0 },
    { suf: 'l', faceW: shape.d, px: bx - shape.w / 2 - 0.09, pz: bz,                       ry: -Math.PI / 2 },
    { suf: 'r', faceW: shape.d, px: bx + shape.w / 2 + 0.09, pz: bz,                       ry:  Math.PI / 2 },
  ];

  faces.forEach(({ suf, faceW, px, pz, ry }) => {
    const plane = MeshBuilder.CreatePlane(`win-${id}-${suf}`, { width: faceW, height: shape.h }, scene);
    plane.position.set(px, shape.h / 2, pz);
    plane.rotation.y = ry;
    plane.isPickable = false;

    const rng = seeded(hashString(id + suf + '9'));
    const t   = new DynamicTexture(`wt-${id}-${suf}`, { width: TEX, height: TEX }, scene, false);
    t.wrapU = Texture.WRAP_ADDRESSMODE;
    t.wrapV = Texture.WRAP_ADDRESSMODE;
    const ctx = t.getContext() as unknown as CanvasRenderingContext2D;

    // Dark wall background
    ctx.fillStyle = '#07070f';
    ctx.fillRect(0, 0, TEX, TEX);

    // Per-cell window grid — seeded random lit / dark / tinted
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cx = col * CELL + PAD;
        const cy = row * CELL + PAD;
        const cw = CELL - PAD * 2;
        const ch = CELL - PAD * 2;
        const rand = rng();
        if (rand < 0.20) {
          // Unlit window
          ctx.fillStyle = 'rgba(8,8,14,0.95)';
        } else {
          const kind = rng();
          if (kind < 0.12) {
            // Cool blue-white (studio screen / late-night)
            ctx.fillStyle = 'rgba(155,185,255,0.88)';
          } else if (kind < 0.26) {
            // Accent-tinted window
            ctx.fillStyle = `rgba(${ar},${ag},${ab},0.72)`;
          } else {
            // Warm incandescent — slight per-cell variation
            const wr = 215 + Math.round(rng() * 40);
            const wg = 190 + Math.round(rng() * 30);
            const wb  =  90 + Math.round(rng() * 55);
            ctx.fillStyle = `rgba(${wr},${wg},${wb},0.84)`;
          }
        }
        ctx.fillRect(cx, cy, cw, ch);
      }
    }

    t.update(false);
    t.uScale = Math.max(1, Math.round(faceW * 0.52));
    t.vScale = Math.max(1, Math.round(floors * 0.40));

    const mat = new StandardMaterial(`wm-${id}-${suf}`, scene);
    mat.emissiveTexture = t;
    mat.diffuseColor    = Color3.Black();
    mat.specularColor   = Color3.Black();
    mat.backFaceCulling = true;
    plane.material = mat;
  });
}

// ─── Type-specific rooftop features ──────────────────────────────────────
function addRooftopDetails(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  accent: Color3
): void {
  const topY = shape.h;
  const pH = 0.65;
  const pW = 0.35;

  const rfMat = new StandardMaterial(`rf-${building.id}`, scene);
  rfMat.diffuseColor = accent.scale(0.22);
  rfMat.emissiveColor = accent.scale(0.10);
  rfMat.specularColor = Color3.Black();

  const mkBox = (n: string, w: number, d: number, h: number, x: number, z: number) => {
    const b = MeshBuilder.CreateBox(n, { width: w, depth: d, height: h }, scene);
    b.material = rfMat;
    b.position.set(x, topY + h / 2, z);
    b.isPickable = false;
    return b;
  };

  // Parapet border walls
  mkBox(`prt-n-${building.id}`, shape.w,           pW, pH, bx,                     bz - shape.d / 2 + pW / 2);
  mkBox(`prt-s-${building.id}`, shape.w,           pW, pH, bx,                     bz + shape.d / 2 - pW / 2);
  mkBox(`prt-w-${building.id}`, pW, shape.d - pW * 2, pH, bx - shape.w / 2 + pW / 2, bz);
  mkBox(`prt-e-${building.id}`, pW, shape.d - pW * 2, pH, bx + shape.w / 2 - pW / 2, bz);

  if (building.type === 'studio') {
    const antMat = new StandardMaterial(`ant-mat-${building.id}`, scene);
    antMat.diffuseColor = Color3.Black();
    antMat.emissiveColor = accent.scale(0.45);
    antMat.specularColor = Color3.Black();
    const antH = building.isLandmark ? 8 : 5;
    const offsets = building.isLandmark
      ? [[-shape.w * 0.22, 0], [shape.w * 0.22, shape.d * 0.1]] as [number, number][]
      : [[0, 0]] as [number, number][];
    offsets.forEach(([ox, oz], i) => {
      const ant = MeshBuilder.CreateCylinder(`ant-${building.id}-${i}`, { height: antH, diameter: 0.12, tessellation: 5 }, scene);
      ant.material = antMat;
      ant.position.set(bx + ox, topY + pH + antH / 2, bz + oz);
      ant.isPickable = false;
      const litMat = new StandardMaterial(`antlit-mat-${building.id}-${i}`, scene);
      litMat.emissiveColor = new Color3(1, 0.12, 0.12);
      litMat.diffuseColor = Color3.Black();
      const lit = MeshBuilder.CreateSphere(`antlit-${building.id}-${i}`, { diameter: 0.35 }, scene);
      lit.material = litMat;
      lit.position.set(bx + ox, topY + pH + antH + 0.18, bz + oz);
      lit.isPickable = false;
    });
  }

  if (building.type === 'label' && building.isLandmark) {
    const spireMat = new StandardMaterial(`spire-mat-${building.id}`, scene);
    spireMat.diffuseColor = Color3.Black();
    spireMat.emissiveColor = accent.scale(0.65);
    spireMat.specularColor = Color3.Black();
    const spireH = 13;
    const spire = MeshBuilder.CreateCylinder(`spire-${building.id}`, { height: spireH, diameterTop: 0.04, diameterBottom: 0.8, tessellation: 8 }, scene);
    spire.material = spireMat;
    spire.position.set(bx, topY + pH + spireH / 2, bz);
    spire.isPickable = false;
  }

  if (building.type === 'club') {
    const ringMat = new StandardMaterial(`ring-mat-${building.id}`, scene);
    ringMat.diffuseColor = Color3.Black();
    ringMat.emissiveColor = accent;
    ringMat.specularColor = Color3.Black();
    const ringDiam = Math.min(shape.w, shape.d) * 0.68;
    const ring = MeshBuilder.CreateTorus(`ring-${building.id}`, { diameter: ringDiam, thickness: 0.5, tessellation: 28 }, scene);
    ring.material = ringMat;
    ring.position.set(bx, topY + pH + 0.55, bz);
    ring.isPickable = false;
  }

  if (building.type === 'apartment') {
    const tankMat = new StandardMaterial(`tank-mat-${building.id}`, scene);
    tankMat.diffuseColor = accent.scale(0.18);
    tankMat.emissiveColor = accent.scale(0.06);
    tankMat.specularColor = Color3.Black();
    const tankH = 2.1;
    const tank = MeshBuilder.CreateCylinder(`tank-${building.id}`, { height: tankH, diameter: 1.6, tessellation: 8 }, scene);
    tank.material = tankMat;
    tank.position.set(bx + shape.w * 0.22, topY + pH + tankH / 2, bz - shape.d * 0.22);
    tank.isPickable = false;
    const legH = 0.8;
    ([[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]] as [number, number][]).forEach(([lx, lz], i) => {
      const leg = MeshBuilder.CreateCylinder(`tleg-${building.id}-${i}`, { height: legH, diameter: 0.12, tessellation: 4 }, scene);
      leg.material = tankMat;
      leg.position.set(bx + shape.w * 0.22 + lx * 0.5, topY + pH + legH / 2 - 0.1, bz - shape.d * 0.22 + lz * 0.5);
      leg.isPickable = false;
    });
  }

  if (building.type === 'room' && building.isLandmark) {
    const dishMat = new StandardMaterial(`dish-mat-${building.id}`, scene);
    dishMat.diffuseColor = accent.scale(0.28);
    dishMat.emissiveColor = accent.scale(0.22);
    dishMat.specularColor = Color3.Black();
    const pole = MeshBuilder.CreateCylinder(`dpole-${building.id}`, { height: 2.5, diameter: 0.2, tessellation: 6 }, scene);
    pole.material = dishMat;
    pole.position.set(bx + shape.w * 0.2, topY + pH + 1.25, bz + shape.d * 0.2);
    pole.isPickable = false;
    const dish = MeshBuilder.CreateSphere(`dish-${building.id}`, { diameter: 2, segments: 8 }, scene);
    dish.scaling.y = 0.38;
    dish.material = dishMat;
    dish.position.set(bx + shape.w * 0.2, topY + pH + 2.8, bz + shape.d * 0.2);
    dish.isPickable = false;
  }
}


// ─── Horizontal glowing ledge bands around building ──────────────────────
function addLedgeBands(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  accent: Color3
): void {
  if (shape.h < 10) return;
  const overhang = 0.44;
  const bandH    = 0.36;
  const numBands = shape.h > 30 ? 3 : shape.h > 18 ? 2 : 1;

  const mat = new StandardMaterial(`lb-mat-${building.id}`, scene);
  mat.diffuseColor  = accent.scale(0.10);
  mat.emissiveColor = accent.scale(0.24);
  mat.specularColor = Color3.Black();

  for (let i = 1; i <= numBands; i++) {
    const bandY = (shape.h * i) / (numBands + 1);
    const band  = MeshBuilder.CreateBox(`lb-${building.id}-${i}`, {
      width:  shape.w + overhang * 2,
      depth:  shape.d + overhang * 2,
      height: bandH,
    }, scene);
    band.material = mat;
    band.position.set(bx, bandY, bz);
    band.isPickable = false;
  }
}

// ─── AC unit clusters on rooftop ─────────────────────────────────────────
function addACUnits(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number
): void {
  const topY  = shape.h + 0.65; // sit above parapet
  const mat   = new StandardMaterial(`ac-mat-${building.id}`, scene);
  mat.diffuseColor  = new Color3(0.16, 0.16, 0.20);
  mat.specularColor = new Color3(0.28, 0.28, 0.32);
  mat.emissiveColor = new Color3(0.014, 0.016, 0.024);

  const rng   = seeded(hashString(building.id + 'ac'));
  const count = 2 + Math.floor(rng() * 3);
  const safeW = shape.w * 0.62;
  const safeD = shape.d * 0.62;

  for (let i = 0; i < count; i++) {
    const ax = bx + (rng() - 0.5) * safeW;
    const az = bz + (rng() - 0.5) * safeD;
    const aw = 0.85 + rng() * 0.55;
    const ad = 0.45 + rng() * 0.32;
    const ah = 0.42 + rng() * 0.38;
    const ac = MeshBuilder.CreateBox(`ac-${building.id}-${i}`, { width: aw, depth: ad, height: ah }, scene);
    ac.material = mat;
    ac.position.set(ax, topY + ah / 2, az);
    ac.isPickable = false;
  }
}

// ─── Lobby entrance protrusion at base ───────────────────────────────────
function addBuildingLobby(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  accent: Color3
): void {
  const lobH = Math.min(shape.h * 0.13, 3.8);
  const lobW = shape.w * 0.52;
  const lobD = 0.9;
  const lobZ = bz - shape.d / 2 - lobD / 2 + 0.05;

  const lobMat = new StandardMaterial(`lob-mat-${building.id}`, scene);
  lobMat.diffuseColor  = accent.scale(0.30);
  lobMat.emissiveColor = accent.scale(0.14);
  lobMat.specularColor = accent.scale(0.22);

  const lob = MeshBuilder.CreateBox(`lob-${building.id}`, { width: lobW, depth: lobD, height: lobH }, scene);
  lob.material = lobMat;
  lob.position.set(bx, lobH / 2, lobZ);
  lob.isPickable = false;

  // Flat canopy overhang
  const cMat = new StandardMaterial(`can-mat-${building.id}`, scene);
  cMat.diffuseColor  = accent.scale(0.09);
  cMat.emissiveColor = accent.scale(0.05);
  cMat.specularColor = Color3.Black();
  const can = MeshBuilder.CreateBox(`can-${building.id}`, { width: lobW + 1.0, depth: lobD + 0.7, height: 0.18 }, scene);
  can.material = cMat;
  can.position.set(bx, lobH + 0.09, lobZ - 0.25);
  can.isPickable = false;

  // Glowing door slit
  const dH   = Math.min(lobH * 0.74, 2.6);
  const dW   = Math.min(lobW * 0.26, 1.3);
  const dMat = new StandardMaterial(`dor-mat-${building.id}`, scene);
  dMat.diffuseColor  = Color3.Black();
  dMat.emissiveColor = accent.scale(0.85);
  dMat.specularColor = Color3.Black();
  const door = MeshBuilder.CreatePlane(`dor-${building.id}`, { width: dW, height: dH }, scene);
  door.material = dMat;
  door.position.set(bx, dH / 2 + 0.02, lobZ - lobD / 2 - 0.04);
  door.rotation.y = Math.PI;
  door.isPickable = false;
}

// ─── Neon name sign on landmark front face ────────────────────────────────
function addBuildingSign(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  accent: Color3
): void {
  const sigH = 2.4;
  const sigW = Math.min(shape.w * 0.82, 13);
  const sigY = shape.h * 0.76;
  const sigZ = bz - shape.d / 2 - 0.16;

  const ar = Math.round(accent.r * 255);
  const ag = Math.round(accent.g * 255);
  const ab = Math.round(accent.b * 255);

  const tex = new DynamicTexture(`sig-tex-${building.id}`, { width: 512, height: 128 }, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 512, 128);

  // Panel
  ctx.fillStyle = 'rgba(4,4,10,0.82)';
  ctx.fillRect(0, 0, 512, 128);

  // Outer neon border
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.92)`;
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 502, 118);

  // Inner accent line
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.35)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(11, 11, 490, 106);

  // Building name
  ctx.font = 'bold 50px Arial';
  ctx.fillStyle = `rgb(${ar},${ag},${ab})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(building.name.toUpperCase(), 256, 64);

  tex.update(false);
  tex.hasAlpha = true;

  const plane = MeshBuilder.CreatePlane(`sig-${building.id}`, { width: sigW, height: sigH }, scene);
  plane.position.set(bx, sigY, sigZ);
  plane.rotation.y = Math.PI;
  plane.isPickable = false;

  const mat = new StandardMaterial(`sig-mat-${building.id}`, scene);
  mat.diffuseTexture             = tex;
  mat.emissiveTexture            = tex;
  mat.diffuseColor               = Color3.Black();
  mat.useAlphaFromDiffuseTexture = true;
  mat.backFaceCulling            = false;
  plane.material = mat;
}

// ─── Pulsing activity beacon orb above live buildings ────────────────────────
interface BeaconEntry {
  mesh: Mesh;
  mat: StandardMaterial;
  base: Color3;
  bx: number; bz: number; baseY: number;
  phase: number; speed: number;
}

function addActivityBeacon(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  accent: Color3,
  entries: BeaconEntry[]
): void {
  const baseY = shape.h + 0.65 + 5.8;
  const beaconColor =
    building.type === 'studio' ? new Color3(1.0, 0.62, 0.08)
    : building.type === 'club' ? accent
    :                            new Color3(0.14, 0.95, 0.54);

  const mat = new StandardMaterial(`bcn-mat-${building.id}`, scene);
  mat.diffuseColor  = Color3.Black();
  mat.emissiveColor = beaconColor.scale(0.8);
  mat.specularColor = Color3.Black();

  const orb: Mesh = MeshBuilder.CreateSphere(`bcn-${building.id}`, { diameter: 0.62 }, scene);
  orb.material = mat;
  orb.position.set(bx, baseY, bz);
  orb.isPickable = false;

  const phase = (hashString(building.id + 'bcn') >>> 0) / 0xffffffff * Math.PI * 2;
  const speed = building.type === 'club' ? 2.9 : building.type === 'studio' ? 2.3 : 1.7;
  entries.push({ mesh: orb, mat, base: beaconColor, bx, bz, baseY, phase, speed });
}

// ─── Drone traffic orbiting the city ─────────────────────────────────────────
function createDroneTraffic(scene: Scene): void {
  const configs: Array<{ radius: number; speed: number; height: number; phase: number }> = [
    { radius: 122, speed:  0.18, height: 58, phase: 0.0 },
    { radius:  82, speed: -0.24, height: 44, phase: 1.2 },
    { radius: 148, speed:  0.14, height: 68, phase: 2.4 },
    { radius:  58, speed:  0.31, height: 36, phase: 3.7 },
    { radius: 105, speed: -0.11, height: 72, phase: 4.8 },
  ];

  const drones = configs.map((cfg, i) => {
    const bodyMat = new StandardMaterial(`drn-mat-${i}`, scene);
    bodyMat.diffuseColor  = Color3.Black();
    bodyMat.emissiveColor = new Color3(0.68, 0.74, 1.0);
    bodyMat.specularColor = Color3.Black();
    const body: Mesh = MeshBuilder.CreateBox(`drn-body-${i}`, { width: 1.2, depth: 0.38, height: 0.18 }, scene);
    body.material = bodyMat;
    body.isPickable = false;

    const lightMat = new StandardMaterial(`drn-lm-${i}`, scene);
    lightMat.diffuseColor  = Color3.Black();
    lightMat.emissiveColor = new Color3(1, 0.1, 0.1);
    lightMat.specularColor = Color3.Black();
    const orb: Mesh = MeshBuilder.CreateSphere(`drn-orb-${i}`, { diameter: 0.22 }, scene);
    orb.material = lightMat;
    orb.isPickable = false;

    return { body, orb, lightMat, ...cfg };
  });

  scene.registerBeforeRender(() => {
    const t = performance.now() / 1000;
    drones.forEach(({ body, orb, lightMat, radius, speed, height, phase }) => {
      const angle = t * speed + phase;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;
      body.position.set(px, height, pz);
      body.rotation.y = -angle + Math.PI / 2;
      orb.position.set(px, height + 0.19, pz);
      const blink = Math.sin(t * 3.8 + phase) > 0.45 ? 1.1 : 0.07;
      lightMat.emissiveColor = new Color3(blink, blink * 0.09, blink * 0.09);
    });
  });
}

// ─── Emissive ground glow disc under landmark ─────────────────────────────
function addGroundGlow(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  accent: Color3
): void {
  const diam = Math.max(shape.w, shape.d) * 1.85;
  const disc = MeshBuilder.CreateCylinder(`gd-${building.id}`, { height: 0.04, diameter: diam, tessellation: 32 }, scene);
  disc.position.set(bx, 0.05, bz);
  disc.isPickable = false;

  const mat = new StandardMaterial(`gd-mat-${building.id}`, scene);
  mat.diffuseColor  = Color3.Black();
  mat.emissiveColor = accent.scale(0.30);
  mat.specularColor = Color3.Black();
  mat.alpha = 0.58;
  disc.material = mat;
}

// ─── Road corridors between districts ────────────────────────────────────
function createRoads(scene: Scene): void {
  const { TILE_SIZE, TILE_GAP, GRID_COLS, GRID_ROWS } = CITY;
  const stride  = TILE_SIZE + TILE_GAP;
  const totalW  = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_GAP;
  const totalH  = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_GAP;
  const originX = -totalW / 2;
  const originZ = -totalH / 2;

  const roadMat = new StandardMaterial('road-mat', scene);
  roadMat.diffuseColor  = new Color3(0.04, 0.04, 0.06);
  roadMat.emissiveColor = new Color3(0.008, 0.008, 0.012);
  roadMat.specularColor = Color3.Black();

  const dashMat = new StandardMaterial('road-dash', scene);
  dashMat.diffuseColor  = Color3.Black();
  dashMat.emissiveColor = new Color3(0.36, 0.32, 0.12);
  dashMat.specularColor = Color3.Black();

  // Vertical corridors (between district columns)
  for (let col = 0; col < GRID_COLS - 1; col++) {
    const rx = originX + (col + 1) * stride - TILE_GAP / 2;
    const road = MeshBuilder.CreateGround(`vrd-${col}`, { width: TILE_GAP, height: totalH }, scene);
    road.material = roadMat;
    road.position.set(rx, 0.02, 0);
    road.isPickable = false;
    const dashes = Math.floor(totalH / 10);
    for (let i = 0; i < dashes; i++) {
      const dash = MeshBuilder.CreateBox(`vdsh-${col}-${i}`, { width: 0.14, depth: 4.2, height: 0.04 }, scene);
      dash.material = dashMat;
      dash.position.set(rx, 0.05, originZ + i * 10 + 5);
      dash.isPickable = false;
    }
  }

  // Horizontal corridors (between district rows)
  for (let row = 0; row < GRID_ROWS - 1; row++) {
    const rz = originZ + (row + 1) * stride - TILE_GAP / 2;
    const road = MeshBuilder.CreateGround(`hrd-${row}`, { width: totalW, height: TILE_GAP }, scene);
    road.material = roadMat;
    road.position.set(0, 0.02, rz);
    road.isPickable = false;
    const dashes = Math.floor(totalW / 10);
    for (let i = 0; i < dashes; i++) {
      const dash = MeshBuilder.CreateBox(`hdsh-${row}-${i}`, { width: 4.2, depth: 0.14, height: 0.04 }, scene);
      dash.material = dashMat;
      dash.position.set(originX + i * 10 + 5, 0.05, rz);
      dash.isPickable = false;
    }
  }
}

// ─── Street lamp posts along road corridors ───────────────────────────────
function createStreetLamps(scene: Scene): void {
  const { TILE_SIZE, TILE_GAP, GRID_COLS, GRID_ROWS } = CITY;
  const stride  = TILE_SIZE + TILE_GAP;
  const totalW  = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_GAP;
  const totalH  = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_GAP;
  const originX = -totalW / 2;
  const originZ = -totalH / 2;

  const poleMat = new StandardMaterial('sl-pole', scene);
  poleMat.diffuseColor  = new Color3(0.10, 0.10, 0.13);
  poleMat.specularColor = new Color3(0.22, 0.22, 0.26);

  const bulbMat = new StandardMaterial('sl-bulb', scene);
  bulbMat.diffuseColor  = Color3.White();
  bulbMat.emissiveColor = new Color3(1.0, 0.91, 0.72);
  bulbMat.specularColor = Color3.Black();

  let lpIdx = 0;
  const placeLamp = (x: number, z: number, armRight: boolean) => {
    const H   = 6.5;
    const idx = lpIdx++;
    const dir = armRight ? 1 : -1;

    const pole = MeshBuilder.CreateCylinder(`slp-${idx}`, { height: H, diameter: 0.17, tessellation: 6 }, scene);
    pole.material = poleMat;
    pole.position.set(x, H / 2, z);
    pole.isPickable = false;

    const arm = MeshBuilder.CreateBox(`sla-${idx}`, { width: 1.4, depth: 0.12, height: 0.12 }, scene);
    arm.material = poleMat;
    arm.position.set(x + dir * 0.7, H - 0.22, z);
    arm.isPickable = false;

    const bulb = MeshBuilder.CreateSphere(`slb-${idx}`, { diameter: 0.46 }, scene);
    bulb.material = bulbMat;
    bulb.position.set(x + dir * 1.4, H - 0.10, z);
    bulb.isPickable = false;
  };

  const SPACING = 16;

  // Along vertical road corridors
  for (let col = 0; col < GRID_COLS - 1; col++) {
    const rx = originX + (col + 1) * stride - TILE_GAP / 2;
    const steps = Math.floor(totalH / SPACING);
    for (let i = 0; i <= steps; i++) {
      const lz = originZ + i * SPACING;
      placeLamp(rx - TILE_GAP * 0.55, lz, true);
      placeLamp(rx + TILE_GAP * 0.55, lz, false);
    }
  }

  // Along horizontal road corridors
  for (let row = 0; row < GRID_ROWS - 1; row++) {
    const rz = originZ + (row + 1) * stride - TILE_GAP / 2;
    const steps = Math.floor(totalW / SPACING);
    for (let i = 0; i <= steps; i++) {
      const lx = originX + i * SPACING;
      placeLamp(lx, rz - TILE_GAP * 0.55, true);
      placeLamp(lx, rz + TILE_GAP * 0.55, false);
    }
  }
}

// ─── Starfield ────────────────────────────────────────────────────────────
function createStarfield(scene: Scene): void {
  const tex = new DynamicTexture('star_tex', { width: 16, height: 16 }, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(8, 8, 5, 0, Math.PI * 2);
  ctx.fill();
  tex.update(false);

  const stars = new ParticleSystem('stars', 1200, scene);
  stars.particleTexture = tex;
  stars.emitter = new Vector3(0, 0, 0);
  stars.minEmitBox = new Vector3(-380, 170, -380);
  stars.maxEmitBox = new Vector3(380, 260, 380);
  stars.color1 = new Color4(1, 1, 1, 1);
  stars.color2 = new Color4(0.75, 0.83, 1, 0.75);
  stars.colorDead = new Color4(0, 0, 0, 0);
  stars.minSize = 0.3;
  stars.maxSize = 0.9;
  stars.minLifeTime = 99999;
  stars.maxLifeTime = 99999;
  stars.emitRate = 1200;
  stars.minEmitPower = 0;
  stars.maxEmitPower = 0;
  stars.updateSpeed = 0;
  stars.gravity = new Vector3(0, 0, 0);
  stars.start();
}

// ─── Floating district label billboard ───────────────────────────────────
function createDistrictLabel(scene: Scene, district: District): void {
  const { x, z } = districtCenter(district);
  let maxH = 0;
  district.buildings.forEach((b) => {
    const { h } = getBuildingShape(b);
    if (h > maxH) maxH = h;
  });

  const plane = MeshBuilder.CreatePlane(`dlabel-${district.id}`, { width: 20, height: 4.5 }, scene);
  plane.position.set(x, maxH + 14, z);
  plane.billboardMode = 7; // BILLBOARDMODE_ALL
  plane.isPickable = false;

  const tex = new DynamicTexture(`dlabeltex-${district.id}`, { width: 512, height: 128 }, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 512, 128);
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0,    'rgba(0,0,0,0)');
  grad.addColorStop(0.12, 'rgba(0,0,0,0.38)');
  grad.addColorStop(0.88, 'rgba(0,0,0,0.38)');
  grad.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);
  ctx.font = 'bold 54px Arial';
  ctx.fillStyle = district.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(district.name.toUpperCase(), 256, 66);
  tex.update(false);
  tex.hasAlpha = true;

  const mat = new StandardMaterial(`dlabelmat-${district.id}`, scene);
  mat.diffuseTexture = tex;
  mat.emissiveTexture = tex;
  mat.diffuseColor = Color3.Black();
  mat.useAlphaFromDiffuseTexture = true;
  mat.backFaceCulling = false;
  plane.material = mat;
}

function animateCamera(
  camera: ArcRotateCamera,
  scene: Scene,
  to: { alpha?: number; beta?: number; radius?: number; targetX?: number; targetZ?: number },
  ms = 900
) {
  const fps = 60;
  const frames = Math.round((ms * fps) / 1000);
  const ease = new CubicEase();
  ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

  const makeFloat = (name: string, prop: string, from: number, toVal: number) => {
    const a = new Animation(name, prop, fps, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    a.setKeys([{ frame: 0, value: from }, { frame: frames, value: toVal }]);
    a.setEasingFunction(ease);
    return a;
  };

  const anims: Animation[] = [];
  if (to.radius !== undefined) anims.push(makeFloat('r', 'radius', camera.radius, to.radius));
  if (to.beta !== undefined)   anims.push(makeFloat('b', 'beta',   camera.beta,   to.beta));
  if (to.alpha !== undefined)  anims.push(makeFloat('a', 'alpha',  camera.alpha,  to.alpha));

  scene.beginDirectAnimation(camera, anims, 0, frames, false);

  if (to.targetX !== undefined || to.targetZ !== undefined) {
    const startX = camera.target.x;
    const startZ = camera.target.z;
    const endX = to.targetX ?? startX;
    const endZ = to.targetZ ?? startZ;
    let frame = 0;
    const obs = scene.onBeforeRenderObservable.add(() => {
      frame++;
      const t = Math.min(frame / frames, 1);
      const e = ease.ease(t);
      camera.target.x = startX + (endX - startX) * e;
      camera.target.z = startZ + (endZ - startZ) * e;
      if (frame >= frames) scene.onBeforeRenderObservable.remove(obs);
    });
  }
}

export default function City3D({ navigationState, onNavigate, onReady }: City3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const sceneRef  = useRef<Scene | null>(null);
  const buildingPositions = useRef<Record<string, { x: number; z: number }>>({});
  const pointerDownRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Keep callback in ref so scene setup effect never needs to re-run
  const onNavigateRef = useRef(onNavigate);
  useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);

  const navigationStateRef = useRef(navigationState);
  useEffect(() => { navigationStateRef.current = navigationState; }, [navigationState]);

  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  // ── Scene setup (runs once) ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color4(0.03, 0.03, 0.07, 1);

    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3.2, 260, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 420;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.wheelPrecision = 2;
    camera.panningSensibility = 60;
    cameraRef.current = camera;

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;
    hemi.diffuse = new Color3(0.88, 0.9, 1);
    hemi.groundColor = new Color3(0.08, 0.04, 0.18);

    const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.3), scene);
    sun.intensity = 0.9;
    sun.diffuse = new Color3(1, 0.95, 0.85);

    // ── Atmospheric fog ────────────────────────────────────────
    scene.fogMode    = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.007;
    scene.fogColor   = new Color3(0.03, 0.03, 0.07);

    // ── Shadow generator (landmark buildings only for perf) ────────────
    const shadowGen = new ShadowGenerator(512, sun);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;

    const glow = new GlowLayer('glow', scene);
    glow.intensity = 0.7;

    // ── Post-processing pipeline ────────────────────────────────────────
    const pipeline = new DefaultRenderingPipeline('pipeline', true, scene, [camera]);
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.22;
    pipeline.bloomWeight = 0.55;
    pipeline.bloomKernel = 64;
    pipeline.bloomScale = 0.5;
    pipeline.chromaticAberrationEnabled = true;
    pipeline.chromaticAberration.aberrationAmount = 12;
    pipeline.grainEnabled = true;
    pipeline.grain.intensity = 6;
    pipeline.grain.animated = true;

    // Ground plane
    const ocean = MeshBuilder.CreateGround('ocean', { width: 700, height: 700 }, scene);
    const oceanMat = new StandardMaterial('oceanMat', scene);
    oceanMat.diffuseColor = new Color3(0.03, 0.03, 0.05);
    oceanMat.specularColor = Color3.Black();
    ocean.material = oceanMat;
    ocean.position.y = -0.2;
    ocean.receiveShadows = true;

    // ── Build districts ──────────────────────────────────────────────────
    const landmarkMats: Array<{ mat: StandardMaterial; base: Color3 }> = [];
    const flickerMats:  Array<{ mat: StandardMaterial; base: Color3; seed: number }> = [];
    const beaconEntries: BeaconEntry[] = [];

    DISTRICTS.forEach((district) => {
      const { x, z } = districtCenter(district);
      const accent = Color3.FromHexString(district.color);

      // Ground plate — clickable to enter district
      const plate = MeshBuilder.CreateGround(`plate-${district.id}`, { width: CITY.TILE_SIZE, height: CITY.TILE_SIZE }, scene);
      const plateMat = new StandardMaterial(`plateMat-${district.id}`, scene);
      plateMat.diffuseColor = accent.scale(0.16);
      plateMat.specularColor = Color3.Black();
      plateMat.emissiveColor = accent.scale(0.04);
      plate.material = plateMat;
      plate.position.set(x, 0, z);
      plate.isPickable = true;

      plate.actionManager = new ActionManager(scene);
      plate.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
          plateMat.emissiveColor = accent.scale(0.1);
          canvas.style.cursor = 'pointer';
        })
      );
      plate.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
          plateMat.emissiveColor = accent.scale(0.04);
          canvas.style.cursor = 'grab';
        })
      );

      // Neon perimeter strips
      const stripMat = new StandardMaterial(`stripMat-${district.id}`, scene);
      stripMat.diffuseColor = accent;
      stripMat.emissiveColor = accent;
      stripMat.specularColor = Color3.Black();

      const half = CITY.TILE_SIZE / 2;
      const t = 0.5;
      ([
        [x,        z - half, CITY.TILE_SIZE, t],
        [x,        z + half, CITY.TILE_SIZE, t],
        [x - half, z,        t, CITY.TILE_SIZE],
        [x + half, z,        t, CITY.TILE_SIZE],
      ] as [number, number, number, number][]).forEach((s, i) => {
        const strip = MeshBuilder.CreateBox(`strip-${district.id}-${i}`, { width: s[2], depth: s[3], height: 0.25 }, scene);
        strip.material = stripMat;
        strip.position.set(s[0], 0.15, s[1]);
        strip.isPickable = false;
      });

      // ── Buildings ──────────────────────────────────────────────────────
      const rng = seeded(hashString(district.id));
      const padding = 7;
      const innerSize = CITY.TILE_SIZE - padding * 2;
      const count = district.buildings.length;
      const perSide = Math.ceil(Math.sqrt(count));
      const cell = innerSize / perSide;

      district.buildings.forEach((building, idx) => {
        const row = Math.floor(idx / perSide);
        const col = idx % perSide;
        const jx = (rng() - 0.5) * 1.2;
        const jz = (rng() - 0.5) * 1.2;
        const bx = x - innerSize / 2 + col * cell + cell / 2 + jx;
        const bz = z - innerSize / 2 + row * cell + cell / 2 + jz;

        const { w, d, h } = getBuildingShape(building);

        const mesh = MeshBuilder.CreateBox(`bldg-${building.id}`, { width: w, depth: d, height: h }, scene);

        const bMat = new StandardMaterial(`bmat-${building.id}`, scene);
        bMat.diffuseColor = accent.scale(building.isLandmark ? 0.7 : 0.55);
        bMat.emissiveColor = accent.scale(getEmissiveScale(building.type));
        bMat.specularColor = accent.scale(building.type === 'label' || building.type === 'studio' ? 0.35 : 0.15);
        mesh.material = bMat;
        mesh.position.set(bx, h / 2, bz);

        const meta: BuildingMeta = {
          buildingId: building.id,
          buildingType: building.type,
          buildingName: building.name,
          buildingDescription: building.description,
          districtId: district.id,
          floors: building.floors,
        };
        mesh.metadata = meta;

        buildingPositions.current[building.id] = { x: bx, z: bz };

        // Window overlays, ledge bands, rooftop & ground details
        addWindowPlanes(scene, bx, bz, { w, d, h }, building.floors, building.id, accent);
        addLedgeBands(scene, building, { w, d, h }, bx, bz, accent);
        addRooftopDetails(scene, building, { w, d, h }, bx, bz, accent);
        addACUnits(scene, building, { w, d, h }, bx, bz);
        addBuildingLobby(scene, building, { w, d, h }, bx, bz, accent);

        if (building.isLandmark) {
          addBuildingSign(scene, building, { w, d, h }, bx, bz, accent);
          addGroundGlow(scene, building, { w, d, h }, bx, bz, accent);
          landmarkMats.push({ mat: bMat, base: bMat.emissiveColor.clone() });
          shadowGen.addShadowCaster(mesh);
        }

        // Activity beacon above studios, rooms, and clubs
        if (building.type === 'studio' || building.type === 'room' || building.type === 'club') {
          addActivityBeacon(scene, building, { w, d, h }, bx, bz, accent, beaconEntries);
        }

        // Erratic neon flicker on clubs + non-landmark studios
        if (building.type === 'club' || (building.type === 'studio' && !building.isLandmark)) {
          const seed = (hashString(building.id + 'flk') >>> 0) / 0xffffffff;
          flickerMats.push({ mat: bMat, base: bMat.emissiveColor.clone(), seed });
        }

        // Hover
        mesh.actionManager = new ActionManager(scene);
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
            mesh.scaling.y = 1.05;
            canvas.style.cursor = 'pointer';
          })
        );
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
            mesh.scaling.y = 1;
            canvas.style.cursor = 'grab';
          })
        );
      });
    });

    // ── Infrastructure & atmosphere ───────────────────────────────────────
    createRoads(scene);
    createStreetLamps(scene);
    createStarfield(scene);
    DISTRICTS.forEach((d) => createDistrictLabel(scene, d));
    createDroneTraffic(scene);

    // Pulse / flicker / beacon animations
    scene.registerBeforeRender(() => {
      const t = performance.now() / 1000;

      // Smooth landmark pulse
      landmarkMats.forEach(({ mat, base }, i) => {
        mat.emissiveColor = base.scale(1 + 0.28 * Math.sin(t * 1.5 + i * 0.85));
      });

      // Erratic neon flicker on clubs & secondary studios
      flickerMats.forEach(({ mat, base, seed }) => {
        const f = 0.76
          + 0.13 * Math.sin(t * 2.4  + seed * 10)
          + 0.07 * Math.sin(t * 5.9  + seed *  7)
          + 0.04 * Math.sin(t * 11.3 + seed *  3);
        mat.emissiveColor = base.scale(Math.max(0.22, f));
      });

      // Floating beacon pulse
      beaconEntries.forEach(({ mesh, mat, base, bx, bz, baseY, phase, speed }) => {
        mesh.position.set(bx, baseY + 0.55 * Math.sin(t * 1.35 + phase), bz);
        const pulse = 0.32 + 0.68 * Math.abs(Math.sin(t * speed + phase));
        mat.emissiveColor = base.scale(0.35 + 1.25 * pulse);
      });
    });

    // ── Click handling ──────────────────────────────────────────────────
    scene.onPointerObservable.add((pointerInfo) => {
      const event = pointerInfo.event as PointerEvent | MouseEvent | undefined;

      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        if (!event || ('button' in event && event.button !== 0)) {
          pointerDownRef.current = null;
          return;
        }

        pointerDownRef.current = {
          x: event.clientX,
          y: event.clientY,
          time: performance.now(),
        };
        return;
      }

      if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;

      if (!event) return;

      const pointerDown = pointerDownRef.current;
      pointerDownRef.current = null;

      if (!pointerDown) return;

      const movedDistance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      const gestureTime = performance.now() - pointerDown.time;

      if (movedDistance > 8 || gestureTime > 650) return;

      const mesh = pointerInfo.pickInfo?.pickedMesh;
      if (!mesh) return;

      const currentNav = navigationStateRef.current;

      if (mesh.name.startsWith('plate-')) {
        const districtId = mesh.name.replace('plate-', '') as DistrictId;
        onNavigateRef.current({
          mode: 'district',
          districtId,
          buildingId: null,
          buildingName: null,
          buildingType: null,
          buildingDescription: null,
        });
        return;
      }

      if (mesh.name.startsWith('bldg-')) {
        const meta = mesh.metadata as BuildingMeta;

        if (currentNav.mode === 'city') {
          return;
        }

        if (currentNav.districtId && meta.districtId !== currentNav.districtId) {
          return;
        }

        onNavigateRef.current({
          mode: 'building',
          districtId: meta.districtId,
          buildingId: meta.buildingId,
          buildingName: meta.buildingName,
          buildingType: meta.buildingType,
          buildingDescription: meta.buildingDescription,
        });
      }
    });

    let firstFrame = true;
    engine.runRenderLoop(() => {
      scene.render();
      if (firstFrame) {
        firstFrame = false;
        onReadyRef.current?.();
      }
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);
    canvas.style.cursor = 'grab';

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
      engineRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  // ── Camera navigation (reacts to state changes) ───────────────────────
  useEffect(() => {
    const camera = cameraRef.current;
    const scene  = sceneRef.current;
    if (!camera || !scene) return;

    const { mode, districtId, buildingId } = navigationState;

    if (mode === 'city') {
      animateCamera(camera, scene, { beta: Math.PI / 3.2, radius: 260, targetX: 0, targetZ: 0 });
      return;
    }

    if (mode === 'district' && districtId) {
      const district = DISTRICTS.find((d) => d.id === districtId);
      if (!district) return;
      const { x, z } = districtCenter(district);
      animateCamera(camera, scene, { beta: Math.PI / 4.2, radius: 95, targetX: x, targetZ: z });
      return;
    }

    if ((mode === 'building' || mode === 'interior') && buildingId) {
      const pos = buildingPositions.current[buildingId];
      if (!pos) return;
      animateCamera(camera, scene, { beta: Math.PI / 3.6, radius: 30, targetX: pos.x, targetZ: pos.z });
    }
  }, [navigationState]);

  return (
    <canvas
      ref={canvasRef}
      className={`city-canvas${navigationState.mode === 'interior' ? ' city-canvas--interior' : ''}`}
    />
  );
}
