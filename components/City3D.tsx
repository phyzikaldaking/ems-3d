'use client';

import { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  Vector3,
  Color3,
  Color4,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  StandardMaterial,
  GlowLayer,
  DefaultRenderingPipeline,
  SSAO2RenderingPipeline,
  ShadowGenerator,
  DynamicTexture,
  Texture,
  ParticleSystem,
  ImageProcessingConfiguration,
  ReflectionProbe,
} from '@babylonjs/core';

import { DISTRICTS, CITY, districtCenter, type BuildingType, type BuildingDef, type DistrictId, type District } from '@/lib/districts';

export interface LiveStudio {
  username: string;
  name: string;
  image: string | null;
  district: 'LABEL_ROW' | 'DOWNTOWN_PRIME' | 'INDIE_BLOCKS';
  level: number;
  avgScore: number;
  songCount: number;
  totalSold: number;
}

export interface BuildingMeta {
  buildingId: string;
  buildingType: BuildingType;
  buildingName: string;
  buildingDescription: string;
  districtId: DistrictId;
  floors: number;
}

interface City3DProps {
  onProximityBuilding: (meta: BuildingMeta | null) => void;
  onReady?: () => void;
  liveStudios?: LiveStudio[];
}

type RenderProfile = 'full' | 'lite';

interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function getRenderProfile(): RenderProfile {
  if (typeof window === 'undefined') return 'full';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCompactViewport = window.innerWidth <= 900;
  const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
  return prefersReducedMotion || isCompactViewport || saveData ? 'lite' : 'full';
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

function createBuildingPBR(
  name: string,
  scene: Scene,
  type: BuildingType,
  isLandmark: boolean,
  accent: Color3
): PBRMaterial {
  const mat = new PBRMaterial(name, scene);
  mat.useRadianceOverAlpha = false;
  mat.useSpecularOverAlpha = false;
  mat.environmentIntensity  = 0.18;
  mat.specularIntensity     = 1.0;

  switch (type) {
    case 'studio': {
      mat.albedoColor   = new Color3(0.04, 0.06, 0.12).add(accent.scale(0.06));
      mat.metallic      = isLandmark ? 0.88 : 0.74;
      mat.roughness     = isLandmark ? 0.07 : 0.14;
      mat.emissiveColor = accent.scale(isLandmark ? 0.24 : 0.16);
      break;
    }
    case 'label': {
      mat.albedoColor   = new Color3(0.02, 0.02, 0.04).add(accent.scale(0.04));
      mat.metallic      = isLandmark ? 0.96 : 0.82;
      mat.roughness     = isLandmark ? 0.05 : 0.11;
      mat.emissiveColor = accent.scale(isLandmark ? 0.28 : 0.20);
      break;
    }
    case 'club': {
      mat.albedoColor   = new Color3(0.05, 0.03, 0.08).add(accent.scale(0.12));
      mat.metallic      = 0.30;
      mat.roughness     = 0.60;
      mat.emissiveColor = accent.scale(0.30);
      break;
    }
    case 'marketplace': {
      mat.albedoColor   = new Color3(0.07, 0.07, 0.09);
      mat.metallic      = 0.12;
      mat.roughness     = 0.82;
      mat.emissiveColor = accent.scale(0.09);
      break;
    }
    case 'apartment': {
      mat.albedoColor   = new Color3(0.09, 0.07, 0.08).add(accent.scale(0.04));
      mat.metallic      = 0.04;
      mat.roughness     = 0.92;
      mat.emissiveColor = accent.scale(0.04);
      break;
    }
    case 'room': {
      mat.albedoColor   = new Color3(0.05, 0.06, 0.10);
      mat.metallic      = 0.32;
      mat.roughness     = 0.65;
      mat.emissiveColor = accent.scale(0.10);
      break;
    }
    default: {
      mat.albedoColor   = new Color3(0.05, 0.05, 0.08);
      mat.metallic      = 0.28;
      mat.roughness     = 0.65;
      mat.emissiveColor = accent.scale(0.08);
    }
  }

  return mat;
}

interface CompoundResult {
  base: Mesh;
  all: Mesh[];
  podShape: { w: number; d: number; h: number };
}

function buildCompoundMeshes(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  mat: PBRMaterial
): CompoundResult {
  const { w, d, h } = shape;

  if (building.isLandmark && h >= 18) {
    const podH   = h * 0.26;
    const towerH = h * 0.52;
    const crownH = h - podH - towerH;

    const pod = MeshBuilder.CreateBox(`bldg-${building.id}`, { width: w, depth: d, height: podH }, scene);
    pod.material = mat;
    pod.position.set(bx, podH / 2, bz);
    pod.receiveShadows = true;
    pod.checkCollisions = true;

    const tower = MeshBuilder.CreateBox(`part-twr-${building.id}`, { width: w * 0.70, depth: d * 0.70, height: towerH }, scene);
    tower.material = mat;
    tower.position.set(bx, podH + towerH / 2, bz);
    tower.isPickable   = false;
    tower.receiveShadows = true;
    tower.checkCollisions = true;

    const crown = MeshBuilder.CreateBox(`part-crw-${building.id}`, { width: w * 0.48, depth: d * 0.48, height: crownH }, scene);
    crown.material = mat;
    crown.position.set(bx, podH + towerH + crownH / 2, bz);
    crown.isPickable   = false;
    crown.receiveShadows = true;

    return {
      base: pod,
      all: [pod, tower, crown],
      podShape: { w, d, h: podH },
    };
  }

  if ((building.type === 'studio' || building.type === 'label') && h >= 14) {
    const baseH = h * 0.38;
    const topH  = h - baseH;

    const base = MeshBuilder.CreateBox(`bldg-${building.id}`, { width: w, depth: d, height: baseH }, scene);
    base.material = mat;
    base.position.set(bx, baseH / 2, bz);
    base.receiveShadows = true;
    base.checkCollisions = true;

    const top = MeshBuilder.CreateBox(`part-top-${building.id}`, { width: w * 0.80, depth: d * 0.80, height: topH }, scene);
    top.material = mat;
    top.position.set(bx, baseH + topH / 2, bz);
    top.isPickable   = false;
    top.receiveShadows = true;
    top.checkCollisions = true;

    return {
      base,
      all: [base, top],
      podShape: { w, d, h: baseH },
    };
  }

  const mesh = MeshBuilder.CreateBox(`bldg-${building.id}`, { width: w, depth: d, height: h }, scene);
  mesh.material = mat;
  mesh.position.set(bx, h / 2, bz);
  mesh.receiveShadows = true;
  mesh.checkCollisions = true;

  return { base: mesh, all: [mesh], podShape: { w, d, h } };
}

function createSkyDome(scene: Scene): void {
  const sky = MeshBuilder.CreateSphere('skydome', { diameter: 950, segments: 8 }, scene);
  sky.isPickable = false;

  const tex = new DynamicTexture('sky-tex', { width: 4, height: 512 }, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#000006');
  grad.addColorStop(0.22, '#01010d');
  grad.addColorStop(0.48, '#040215');
  grad.addColorStop(0.68, '#0c0622');
  grad.addColorStop(0.82, '#180b30');
  grad.addColorStop(0.92, '#0f0619');
  grad.addColorStop(1.00, '#080412');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 512);
  tex.update(false);

  const mat = new StandardMaterial('sky-mat', scene);
  mat.emissiveTexture  = tex;
  mat.diffuseColor     = Color3.Black();
  mat.specularColor    = Color3.Black();
  mat.backFaceCulling  = false;
  mat.disableLighting  = true;
  sky.material = mat;
}

function createHorizonGlow(scene: Scene): void {
  const ring = MeshBuilder.CreateTorus('horizon-glow', {
    diameter: 600,
    thickness: 90,
    tessellation: 48,
  }, scene);
  ring.position.y = -20;
  ring.isPickable = false;

  const mat = new StandardMaterial('horizon-mat', scene);
  mat.diffuseColor  = Color3.Black();
  mat.emissiveColor = new Color3(0.12, 0.06, 0.22);
  mat.specularColor = Color3.Black();
  mat.alpha         = 0.18;
  ring.material     = mat;
}

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
  const TEX  = CELL * COLS;
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

    ctx.fillStyle = '#040408';
    ctx.fillRect(0, 0, TEX, TEX);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cx = col * CELL + PAD;
        const cy = row * CELL + PAD;
        const cw = CELL - PAD * 2;
        const ch = CELL - PAD * 2;
        const rand = rng();
        if (rand < 0.18) {
          ctx.fillStyle = 'rgba(6,6,10,0.97)';
        } else {
          const kind = rng();
          if (kind < 0.10) {
            ctx.fillStyle = 'rgba(140,170,255,0.90)';
          } else if (kind < 0.24) {
            ctx.fillStyle = `rgba(${ar},${ag},${ab},0.75)`;
          } else {
            const wr = 218 + Math.round(rng() * 37);
            const wg = 192 + Math.round(rng() * 28);
            const wb  =  88 + Math.round(rng() * 52);
            ctx.fillStyle = `rgba(${wr},${wg},${wb},0.86)`;
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

  const rfMat = new PBRMaterial(`rf-${building.id}`, scene);
  rfMat.albedoColor   = accent.scale(0.18);
  rfMat.emissiveColor = accent.scale(0.10);
  rfMat.metallic      = 0.6;
  rfMat.roughness     = 0.35;

  const mkBox = (n: string, w: number, d: number, h: number, x: number, z: number) => {
    const b = MeshBuilder.CreateBox(n, { width: w, depth: d, height: h }, scene);
    b.material = rfMat;
    b.position.set(x, topY + h / 2, z);
    b.isPickable = false;
    return b;
  };

  mkBox(`prt-n-${building.id}`, shape.w,               pW, pH, bx,                         bz - shape.d / 2 + pW / 2);
  mkBox(`prt-s-${building.id}`, shape.w,               pW, pH, bx,                         bz + shape.d / 2 - pW / 2);
  mkBox(`prt-w-${building.id}`, pW, shape.d - pW * 2,  pH, bx - shape.w / 2 + pW / 2,     bz);
  mkBox(`prt-e-${building.id}`, pW, shape.d - pW * 2,  pH, bx + shape.w / 2 - pW / 2,     bz);

  if (building.type === 'studio') {
    const antMat = new PBRMaterial(`ant-mat-${building.id}`, scene);
    antMat.albedoColor   = Color3.Black();
    antMat.emissiveColor = accent.scale(0.55);
    antMat.metallic      = 0.9;
    antMat.roughness     = 0.1;
    const antH = building.isLandmark ? 9 : 5.5;
    const offsets = building.isLandmark
      ? [[-shape.w * 0.22, 0], [shape.w * 0.22, shape.d * 0.1]] as [number, number][]
      : [[0, 0]] as [number, number][];
    offsets.forEach(([ox, oz], i) => {
      const ant = MeshBuilder.CreateCylinder(`ant-${building.id}-${i}`, { height: antH, diameter: 0.12, tessellation: 5 }, scene);
      ant.material = antMat;
      ant.position.set(bx + ox, topY + pH + antH / 2, bz + oz);
      ant.isPickable = false;
      const litMat = new PBRMaterial(`antlit-mat-${building.id}-${i}`, scene);
      litMat.emissiveColor = new Color3(1, 0.10, 0.10);
      litMat.albedoColor   = Color3.Black();
      litMat.metallic      = 0.0;
      litMat.roughness     = 1.0;
      const lit = MeshBuilder.CreateSphere(`antlit-${building.id}-${i}`, { diameter: 0.38 }, scene);
      lit.material = litMat;
      lit.position.set(bx + ox, topY + pH + antH + 0.18, bz + oz);
      lit.isPickable = false;
    });
  }

  if (building.type === 'label' && building.isLandmark) {
    const spireMat = new PBRMaterial(`spire-mat-${building.id}`, scene);
    spireMat.albedoColor   = Color3.Black();
    spireMat.emissiveColor = accent.scale(0.75);
    spireMat.metallic      = 0.95;
    spireMat.roughness     = 0.05;
    const spireH = 15;
    const spire = MeshBuilder.CreateCylinder(`spire-${building.id}`, { height: spireH, diameterTop: 0.03, diameterBottom: 0.75, tessellation: 8 }, scene);
    spire.material = spireMat;
    spire.position.set(bx, topY + pH + spireH / 2, bz);
    spire.isPickable = false;
  }

  if (building.type === 'club') {
    const ringMat = new PBRMaterial(`ring-mat-${building.id}`, scene);
    ringMat.albedoColor   = Color3.Black();
    ringMat.emissiveColor = accent;
    ringMat.metallic      = 0.7;
    ringMat.roughness     = 0.12;
    const ringDiam = Math.min(shape.w, shape.d) * 0.68;
    const ring = MeshBuilder.CreateTorus(`ring-${building.id}`, { diameter: ringDiam, thickness: 0.5, tessellation: 32 }, scene);
    ring.material = ringMat;
    ring.position.set(bx, topY + pH + 0.55, bz);
    ring.isPickable = false;
  }

  if (building.type === 'apartment') {
    const tankMat = new PBRMaterial(`tank-mat-${building.id}`, scene);
    tankMat.albedoColor   = accent.scale(0.15);
    tankMat.emissiveColor = accent.scale(0.06);
    tankMat.metallic      = 0.55;
    tankMat.roughness     = 0.45;
    const tankH = 2.1;
    const tank = MeshBuilder.CreateCylinder(`tank-${building.id}`, { height: tankH, diameter: 1.6, tessellation: 10 }, scene);
    tank.material = tankMat;
    tank.position.set(bx + shape.w * 0.22, topY + pH + tankH / 2, bz - shape.d * 0.22);
    tank.isPickable = false;
    ([[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]] as [number, number][]).forEach(([lx, lz], i) => {
      const leg = MeshBuilder.CreateCylinder(`tleg-${building.id}-${i}`, { height: 0.8, diameter: 0.12, tessellation: 4 }, scene);
      leg.material = tankMat;
      leg.position.set(bx + shape.w * 0.22 + lx * 0.5, topY + pH + 0.3, bz - shape.d * 0.22 + lz * 0.5);
      leg.isPickable = false;
    });
  }

  if (building.type === 'room' && building.isLandmark) {
    const dishMat = new PBRMaterial(`dish-mat-${building.id}`, scene);
    dishMat.albedoColor   = accent.scale(0.22);
    dishMat.emissiveColor = accent.scale(0.28);
    dishMat.metallic      = 0.82;
    dishMat.roughness     = 0.22;
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

function addLedgeBands(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  accent: Color3
): void {
  if (shape.h < 10) return;
  const overhang = 0.50;
  const bandH    = 0.32;
  const numBands = shape.h > 30 ? 3 : shape.h > 18 ? 2 : 1;

  const mat = new PBRMaterial(`lb-mat-${building.id}`, scene);
  mat.albedoColor   = accent.scale(0.08);
  mat.emissiveColor = accent.scale(0.28);
  mat.metallic      = 0.85;
  mat.roughness     = 0.10;

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

function addACUnits(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number
): void {
  const topY  = shape.h + 0.65;
  const mat   = new PBRMaterial(`ac-mat-${building.id}`, scene);
  mat.albedoColor   = new Color3(0.12, 0.12, 0.16);
  mat.metallic      = 0.72;
  mat.roughness     = 0.42;
  mat.emissiveColor = new Color3(0.01, 0.012, 0.018);

  const rng   = seeded(hashString(building.id + 'ac'));
  const count = 2 + Math.floor(rng() * 3);
  const safeW = shape.w * 0.60;
  const safeD = shape.d * 0.60;

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

  const lobMat = new PBRMaterial(`lob-mat-${building.id}`, scene);
  lobMat.albedoColor   = accent.scale(0.22);
  lobMat.emissiveColor = accent.scale(0.16);
  lobMat.metallic      = 0.75;
  lobMat.roughness     = 0.20;

  const lob = MeshBuilder.CreateBox(`lob-${building.id}`, { width: lobW, depth: lobD, height: lobH }, scene);
  lob.material = lobMat;
  lob.position.set(bx, lobH / 2, lobZ);
  lob.isPickable = false;

  const cMat = new PBRMaterial(`can-mat-${building.id}`, scene);
  cMat.albedoColor   = accent.scale(0.08);
  cMat.emissiveColor = accent.scale(0.06);
  cMat.metallic      = 0.88;
  cMat.roughness     = 0.12;
  const can = MeshBuilder.CreateBox(`can-${building.id}`, { width: lobW + 1.2, depth: lobD + 0.8, height: 0.16 }, scene);
  can.material = cMat;
  can.position.set(bx, lobH + 0.08, lobZ - 0.25);
  can.isPickable = false;

  const dH   = Math.min(lobH * 0.74, 2.6);
  const dW   = Math.min(lobW * 0.26, 1.3);
  const dMat = new StandardMaterial(`dor-mat-${building.id}`, scene);
  dMat.diffuseColor  = Color3.Black();
  dMat.emissiveColor = accent.scale(0.95);
  dMat.specularColor = Color3.Black();
  const door = MeshBuilder.CreatePlane(`dor-${building.id}`, { width: dW, height: dH }, scene);
  door.material = dMat;
  door.position.set(bx, dH / 2 + 0.02, lobZ - lobD / 2 - 0.04);
  door.rotation.y = Math.PI;
  door.isPickable = false;
}

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
  const sigZ = bz - shape.d / 2 - 0.18;

  const ar = Math.round(accent.r * 255);
  const ag = Math.round(accent.g * 255);
  const ab = Math.round(accent.b * 255);

  const tex = new DynamicTexture(`sig-tex-${building.id}`, { width: 512, height: 128 }, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = 'rgba(3,3,8,0.88)';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.94)`;
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 502, 118);
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.32)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(11, 11, 490, 106);
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

interface BeaconEntry {
  mesh: Mesh;
  mat: PBRMaterial;
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

  const mat = new PBRMaterial(`bcn-mat-${building.id}`, scene);
  mat.albedoColor   = Color3.Black();
  mat.emissiveColor = beaconColor.scale(0.85);
  mat.metallic      = 0.0;
  mat.roughness     = 1.0;

  const orb: Mesh = MeshBuilder.CreateSphere(`bcn-${building.id}`, { diameter: 0.65, segments: 8 }, scene);
  orb.material = mat;
  orb.position.set(bx, baseY, bz);
  orb.isPickable = false;

  const phase = (hashString(building.id + 'bcn') >>> 0) / 0xffffffff * Math.PI * 2;
  const speed = building.type === 'club' ? 2.9 : building.type === 'studio' ? 2.3 : 1.7;
  entries.push({ mesh: orb, mat, base: beaconColor, bx, bz, baseY, phase, speed });
}

function createDroneTraffic(scene: Scene, profile: RenderProfile): void {
  const configs: Array<{ radius: number; speed: number; height: number; phase: number }> = [
    { radius: 122, speed:  0.18, height: 58, phase: 0.0 },
    { radius:  82, speed: -0.24, height: 44, phase: 1.2 },
    { radius: 148, speed:  0.14, height: 68, phase: 2.4 },
    { radius:  58, speed:  0.31, height: 36, phase: 3.7 },
    { radius: 105, speed: -0.11, height: 72, phase: 4.8 },
  ];

  const droneConfigs = profile === 'lite' ? configs.slice(0, 3) : configs;

  const drones = droneConfigs.map((cfg, i) => {
    const bodyMat = new PBRMaterial(`drn-mat-${i}`, scene);
    bodyMat.albedoColor   = new Color3(0.05, 0.06, 0.08);
    bodyMat.emissiveColor = new Color3(0.55, 0.62, 1.0);
    bodyMat.metallic      = 0.92;
    bodyMat.roughness     = 0.12;

    const body: Mesh = MeshBuilder.CreateBox(`drn-body-${i}`, { width: 1.2, depth: 0.38, height: 0.18 }, scene);
    body.material = bodyMat;
    body.isPickable = false;

    const lightMat = new PBRMaterial(`drn-lm-${i}`, scene);
    lightMat.albedoColor   = Color3.Black();
    lightMat.emissiveColor = new Color3(1, 0.1, 0.1);
    lightMat.metallic      = 0.0;
    lightMat.roughness     = 1.0;

    const orb: Mesh = MeshBuilder.CreateSphere(`drn-orb-${i}`, { diameter: 0.22, segments: 6 }, scene);
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

function addGroundGlow(
  scene: Scene,
  building: BuildingDef,
  shape: { w: number; d: number; h: number },
  bx: number, bz: number,
  accent: Color3
): void {
  const diam = Math.max(shape.w, shape.d) * 2.2;
  const disc = MeshBuilder.CreateCylinder(`gd-${building.id}`, { height: 0.03, diameter: diam, tessellation: 40 }, scene);
  disc.position.set(bx, 0.04, bz);
  disc.isPickable = false;

  const mat = new StandardMaterial(`gd-mat-${building.id}`, scene);
  mat.diffuseColor  = Color3.Black();
  mat.emissiveColor = accent.scale(0.35);
  mat.specularColor = Color3.Black();
  mat.alpha = 0.55;
  disc.material = mat;
}

function createRoads(scene: Scene): void {
  const { TILE_SIZE, TILE_GAP, GRID_COLS, GRID_ROWS } = CITY;
  const stride  = TILE_SIZE + TILE_GAP;
  const totalW  = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_GAP;
  const totalH  = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_GAP;
  const originX = -totalW / 2;
  const originZ = -totalH / 2;

  const roadMat = new PBRMaterial('road-mat', scene);
  roadMat.albedoColor   = new Color3(0.025, 0.025, 0.035);
  roadMat.metallic      = 0.80;
  roadMat.roughness     = 0.18;
  roadMat.emissiveColor = new Color3(0.006, 0.006, 0.010);

  const dashMat = new StandardMaterial('road-dash', scene);
  dashMat.diffuseColor  = Color3.Black();
  dashMat.emissiveColor = new Color3(0.38, 0.34, 0.14);
  dashMat.specularColor = Color3.Black();

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

function createCityRingRoad(scene: Scene): void {
  const roadMat = new PBRMaterial('city-ring-road', scene);
  roadMat.albedoColor = new Color3(0.018, 0.018, 0.026);
  roadMat.metallic = 0.86;
  roadMat.roughness = 0.13;
  roadMat.emissiveColor = new Color3(0.006, 0.006, 0.012);

  const laneMat = new StandardMaterial('city-ring-lane', scene);
  laneMat.diffuseColor = Color3.Black();
  laneMat.emissiveColor = new Color3(0.58, 0.47, 0.16);
  laneMat.specularColor = Color3.Black();

  const radius = 86;
  const roadWidth = 9;
  const segments = 72;
  const segmentLength = (Math.PI * 2 * radius) / segments + 0.4;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const road = MeshBuilder.CreateBox(`ring-road-${i}`, { width: segmentLength, depth: roadWidth, height: 0.08 }, scene);
    road.material = roadMat;
    road.position.set(x, 0.035, z);
    road.rotation.y = -angle + Math.PI / 2;
    road.isPickable = false;
    road.checkCollisions = true;

    if (i % 2 === 0) {
      const dash = MeshBuilder.CreateBox(`ring-road-dash-${i}`, { width: segmentLength * 0.42, depth: 0.16, height: 0.09 }, scene);
      dash.material = laneMat;
      dash.position.set(x, 0.11, z);
      dash.rotation.y = -angle + Math.PI / 2;
      dash.isPickable = false;
    }
  }

  DISTRICTS.forEach((district) => {
    const center = districtCenter(district);
    const spokeLength = Math.max(18, Math.sqrt(center.x * center.x + center.z * center.z) - CITY.TILE_SIZE * 0.42);
    const angle = Math.atan2(center.z, center.x);
    const x = Math.cos(angle) * (spokeLength / 2);
    const z = Math.sin(angle) * (spokeLength / 2);
    const spoke = MeshBuilder.CreateBox(`spoke-road-${district.id}`, { width: spokeLength, depth: 6, height: 0.07 }, scene);
    spoke.material = roadMat;
    spoke.position.set(x, 0.032, z);
    spoke.rotation.y = -angle;
    spoke.isPickable = false;
    spoke.checkCollisions = true;
  });
}

function createStreetLamps(scene: Scene, profile: RenderProfile): void {
  const { TILE_SIZE, TILE_GAP, GRID_COLS, GRID_ROWS } = CITY;
  const stride  = TILE_SIZE + TILE_GAP;
  const totalW  = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_GAP;
  const totalH  = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_GAP;
  const originX = -totalW / 2;
  const originZ = -totalH / 2;

  const poleMat = new PBRMaterial('sl-pole', scene);
  poleMat.albedoColor = new Color3(0.08, 0.08, 0.11);
  poleMat.metallic    = 0.88;
  poleMat.roughness   = 0.30;

  const bulbMat = new StandardMaterial('sl-bulb', scene);
  bulbMat.diffuseColor  = Color3.White();
  bulbMat.emissiveColor = new Color3(1.0, 0.92, 0.74);
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

    const bulb = MeshBuilder.CreateSphere(`slb-${idx}`, { diameter: 0.46, segments: 6 }, scene);
    bulb.material = bulbMat;
    bulb.position.set(x + dir * 1.4, H - 0.10, z);
    bulb.isPickable = false;
  };

  const SPACING = profile === 'lite' ? 24 : 16;

  for (let col = 0; col < GRID_COLS - 1; col++) {
    const rx = originX + (col + 1) * stride - TILE_GAP / 2;
    const steps = Math.floor(totalH / SPACING);
    for (let i = 0; i <= steps; i++) {
      const lz = originZ + i * SPACING;
      placeLamp(rx - TILE_GAP * 0.55, lz, true);
      placeLamp(rx + TILE_GAP * 0.55, lz, false);
    }
  }

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

function createStarfield(scene: Scene, profile: RenderProfile): void {
  const tex = new DynamicTexture('star_tex', { width: 16, height: 16 }, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(8, 8, 5, 0, Math.PI * 2);
  ctx.fill();
  tex.update(false);

  const capacity = profile === 'lite' ? 500 : 1400;
  const stars = new ParticleSystem('stars', capacity, scene);
  stars.particleTexture = tex;
  stars.emitter = new Vector3(0, 0, 0);
  stars.minEmitBox = new Vector3(-380, 175, -380);
  stars.maxEmitBox = new Vector3(380, 265, 380);
  stars.color1 = new Color4(1, 1, 1, 1);
  stars.color2 = new Color4(0.72, 0.80, 1, 0.72);
  stars.colorDead = new Color4(0, 0, 0, 0);
  stars.minSize = 0.28;
  stars.maxSize = 0.85;
  stars.minLifeTime = 99999;
  stars.maxLifeTime = 99999;
  stars.emitRate = capacity;
  stars.minEmitPower = 0;
  stars.maxEmitPower = 0;
  stars.updateSpeed = 0;
  stars.gravity = new Vector3(0, 0, 0);
  stars.start();
}

function createDistrictLabel(scene: Scene, district: District): void {
  const { x, z } = districtCenter(district);
  let maxH = 0;
  district.buildings.forEach((b) => {
    const { h } = getBuildingShape(b);
    if (h > maxH) maxH = h;
  });

  const plane = MeshBuilder.CreatePlane(`dlabel-${district.id}`, { width: 20, height: 4.5 }, scene);
  plane.position.set(x, maxH + 14, z);
  plane.billboardMode = 7;
  plane.isPickable = false;

  const tex = new DynamicTexture(`dlabeltex-${district.id}`, { width: 512, height: 128 }, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 512, 128);
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0,    'rgba(0,0,0,0)');
  grad.addColorStop(0.12, 'rgba(0,0,0,0.42)');
  grad.addColorStop(0.88, 'rgba(0,0,0,0.42)');
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

// ─── Street cars ──────────────────────────────────────────────────────────────
interface CarEntry {
  body: Mesh;
  hlL: Mesh; hlR: Mesh;
  tlL: Mesh; tlR: Mesh;
  hlMat: PBRMaterial; tlMat: PBRMaterial;
  startPos: Vector3; endPos: Vector3;
  speed: number; t: number;
}

function createStreetCars(scene: Scene, profile: RenderProfile): CarEntry[] {
  const { TILE_SIZE, TILE_GAP, GRID_COLS, GRID_ROWS } = CITY;
  const stride  = TILE_SIZE + TILE_GAP;
  const totalW  = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_GAP;
  const totalH  = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_GAP;
  const originX = -totalW / 2;
  const originZ = -totalH / 2;

  const bodyColors = [
    new Color3(0.04, 0.04, 0.06),
    new Color3(0.06, 0.02, 0.02),
    new Color3(0.02, 0.05, 0.08),
    new Color3(0.08, 0.08, 0.10),
    new Color3(0.02, 0.04, 0.04),
  ];

  const corridors: Array<{ start: Vector3; end: Vector3; lane: number }> = [];

  for (let col = 0; col < GRID_COLS - 1; col++) {
    const rx = originX + (col + 1) * stride - TILE_GAP / 2;
    corridors.push({
      start: new Vector3(rx - 1.0, 0.55, originZ - 10),
      end:   new Vector3(rx - 1.0, 0.55, originZ + totalH + 10),
      lane: col,
    });
    corridors.push({
      start: new Vector3(rx + 1.0, 0.55, originZ + totalH + 10),
      end:   new Vector3(rx + 1.0, 0.55, originZ - 10),
      lane: col,
    });
  }

  for (let row = 0; row < GRID_ROWS - 1; row++) {
    const rz = originZ + (row + 1) * stride - TILE_GAP / 2;
    corridors.push({
      start: new Vector3(originX - 10,          0.55, rz - 1.0),
      end:   new Vector3(originX + totalW + 10, 0.55, rz - 1.0),
      lane: row,
    });
    corridors.push({
      start: new Vector3(originX + totalW + 10, 0.55, rz + 1.0),
      end:   new Vector3(originX - 10,          0.55, rz + 1.0),
      lane: row,
    });
  }

  const carCount = profile === 'lite' ? Math.min(corridors.length, 4) : corridors.length;
  const entries: CarEntry[] = [];

  for (let i = 0; i < carCount; i++) {
    const corridor = corridors[i % corridors.length];
    const colorIdx = (i + corridor.lane) % bodyColors.length;

    const bodyMat = new PBRMaterial(`car-body-mat-${i}`, scene);
    bodyMat.albedoColor = bodyColors[colorIdx];
    bodyMat.metallic    = 0.72;
    bodyMat.roughness   = 0.30;

    const body = MeshBuilder.CreateBox(`car-${i}`, { width: 1.8, depth: 4.2, height: 1.3 }, scene);
    body.material = bodyMat;
    body.isPickable = false;
    body.checkCollisions = false;

    // roof setback
    const roofMat = new PBRMaterial(`car-roof-${i}`, scene);
    roofMat.albedoColor = bodyColors[colorIdx].scale(0.8);
    roofMat.metallic    = 0.65;
    roofMat.roughness   = 0.32;
    const roof = MeshBuilder.CreateBox(`car-roof-${i}`, { width: 1.4, depth: 2.2, height: 0.65 }, scene);
    roof.material = roofMat;
    roof.isPickable = false;
    roof.parent = body;
    roof.position.set(0, 0.975, -0.2);

    const hlMat = new PBRMaterial(`car-hl-${i}`, scene);
    hlMat.albedoColor   = Color3.Black();
    hlMat.emissiveColor = new Color3(1.0, 0.96, 0.82);
    hlMat.metallic = 0; hlMat.roughness = 1;

    const tlMat = new PBRMaterial(`car-tl-${i}`, scene);
    tlMat.albedoColor   = Color3.Black();
    tlMat.emissiveColor = new Color3(0.9, 0.06, 0.06);
    tlMat.metallic = 0; tlMat.roughness = 1;

    const mkLight = (name: string, mat: PBRMaterial, ox: number, oz: number) => {
      const s = MeshBuilder.CreateSphere(name, { diameter: 0.28, segments: 5 }, scene);
      s.material = mat;
      s.isPickable = false;
      s.parent = body;
      s.position.set(ox, 0.0, oz);
      return s;
    };

    const hlL = mkLight(`car-hll-${i}`, hlMat, -0.65, -2.1);
    const hlR = mkLight(`car-hlr-${i}`, hlMat,  0.65, -2.1);
    const tlL = mkLight(`car-tll-${i}`, tlMat, -0.65,  2.1);
    const tlR = mkLight(`car-tlr-${i}`, tlMat,  0.65,  2.1);

    const tOffset = (i / carCount);
    entries.push({
      body, hlL, hlR, tlL, tlR, hlMat, tlMat,
      startPos: corridor.start.clone(),
      endPos:   corridor.end.clone(),
      speed: 6 + (i % 3) * 2.5,
      t: tOffset,
    });
  }

  return entries;
}

// ─── Pedestrians ──────────────────────────────────────────────────────────────
interface PedEntry {
  body: Mesh; head: Mesh;
  startPos: Vector3; endPos: Vector3;
  speed: number; t: number; pauseT: number;
  cx: number; cz: number; radius: number;
  rng: () => number;
}

function createPedestrians(scene: Scene, profile: RenderProfile): PedEntry[] {
  const pedColors = [
    new Color3(0.08, 0.06, 0.10),
    new Color3(0.06, 0.08, 0.10),
    new Color3(0.10, 0.06, 0.06),
    new Color3(0.04, 0.08, 0.06),
  ];

  const entries: PedEntry[] = [];
  const count = profile === 'lite' ? 6 : 14;

  for (let i = 0; i < count; i++) {
    const district = DISTRICTS[i % DISTRICTS.length];
    const { x: cx, z: cz } = districtCenter(district);
    const rng = seeded(hashString('ped' + i));

    const colorIdx = i % pedColors.length;
    const bodyMat = new PBRMaterial(`ped-body-${i}`, scene);
    bodyMat.albedoColor = pedColors[colorIdx];
    bodyMat.metallic    = 0.05;
    bodyMat.roughness   = 0.90;

    const skinColors = [
      new Color3(0.32, 0.22, 0.16),
      new Color3(0.45, 0.32, 0.22),
      new Color3(0.18, 0.12, 0.08),
      new Color3(0.60, 0.44, 0.30),
    ];
    const headMat = new PBRMaterial(`ped-head-${i}`, scene);
    headMat.albedoColor = skinColors[i % skinColors.length];
    headMat.metallic    = 0.0;
    headMat.roughness   = 0.95;

    const body = MeshBuilder.CreateCylinder(`ped-body-${i}`, { height: 1.7, diameter: 0.4, tessellation: 7 }, scene);
    body.material = bodyMat;
    body.isPickable = false;
    body.checkCollisions = false;

    const head = MeshBuilder.CreateSphere(`ped-head-${i}`, { diameter: 0.42, segments: 6 }, scene);
    head.material = headMat;
    head.isPickable = false;
    head.parent = body;
    head.position.set(0, 1.06, 0);

    const radius = 8 + rng() * 12;
    const angle0 = rng() * Math.PI * 2;
    const angle1 = angle0 + Math.PI * (0.4 + rng() * 0.8);
    const startPos = new Vector3(cx + Math.cos(angle0) * radius, 0.85, cz + Math.sin(angle0) * radius);
    const endPos   = new Vector3(cx + Math.cos(angle1) * radius, 0.85, cz + Math.sin(angle1) * radius);

    entries.push({
      body, head,
      startPos, endPos,
      speed: 1.0 + rng() * 0.5,
      t: rng(),
      pauseT: 0,
      cx, cz, radius,
      rng,
    });
  }

  return entries;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function City3D({ onProximityBuilding, onReady }: City3DProps) {
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const engineRef    = useRef<Engine | null>(null);
  const sceneRef     = useRef<Scene | null>(null);

  const onProximityRef = useRef(onProximityBuilding);
  useEffect(() => { onProximityRef.current = onProximityBuilding; }, [onProximityBuilding]);

  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderProfile = getRenderProfile();
    const isLiteMode    = renderProfile === 'lite';
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engine.setHardwareScalingLevel(isLiteMode ? Math.min(2, Math.max(1.35, window.devicePixelRatio || 1)) : 1);
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current  = scene;
    scene.clearColor  = new Color4(0.01, 0.01, 0.03, 1);

    // ── Collision world ───────────────────────────────────────────────────────
    scene.collisionsEnabled = true;
    scene.gravity           = new Vector3(0, -9.81, 0);

    // ── Player capsule ────────────────────────────────────────────────────────
    const player = MeshBuilder.CreateCapsule('player', { height: 1.8, radius: 0.38 }, scene);
    player.position        = new Vector3(0, 0.9, -10);
    player.isPickable      = false;
    player.checkCollisions = true;
    player.ellipsoid       = new Vector3(0.38, 0.9, 0.38);
    player.isVisible       = false;

    // ── Camera (GTA follow cam locked to player) ──────────────────────────────
    const camera = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3.5, 14, player.position.clone(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit    = 4;
    camera.upperRadiusLimit    = 28;
    camera.lowerBetaLimit      = 0.15;
    camera.upperBetaLimit      = Math.PI / 2.2;
    camera.panningSensibility  = 0; // disable panning — camera locked to player
    camera.wheelPrecision      = 8;

    // ── Lighting ──────────────────────────────────────────────────────────────
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity   = 0.10;
    hemi.diffuse     = new Color3(0.22, 0.26, 0.45);
    hemi.groundColor = new Color3(0.04, 0.02, 0.10);

    const moon = new DirectionalLight('moon', new Vector3(-0.4, -1, -0.55), scene);
    moon.intensity = 0.28;
    moon.diffuse   = new Color3(0.65, 0.72, 1.0);

    const warmBounce = new DirectionalLight('warm', new Vector3(0.5, 0.2, 0.8), scene);
    warmBounce.intensity = 0.06;
    warmBounce.diffuse   = new Color3(1.0, 0.55, 0.22);

    // ── Fog ───────────────────────────────────────────────────────────────────
    scene.fogMode    = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.006;
    scene.fogColor   = new Color3(0.04, 0.02, 0.10);

    // ── Shadows ───────────────────────────────────────────────────────────────
    const shadowGen = new ShadowGenerator(isLiteMode ? 512 : 1024, moon);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = isLiteMode ? 10 : 20;
    shadowGen.darkness   = 0.55;

    // ── Glow ──────────────────────────────────────────────────────────────────
    const glow = new GlowLayer('glow', scene);
    glow.intensity = isLiteMode ? 0.55 : 0.90;

    // ── Post-processing ───────────────────────────────────────────────────────
    const pipeline = new DefaultRenderingPipeline('pipeline', true, scene, [camera]);

    pipeline.bloomEnabled   = true;
    pipeline.bloomThreshold = isLiteMode ? 0.28 : 0.18;
    pipeline.bloomWeight    = isLiteMode ? 0.50 : 0.82;
    pipeline.bloomKernel    = isLiteMode ? 32   : 64;
    pipeline.bloomScale     = 0.5;

    pipeline.chromaticAberrationEnabled = !isLiteMode;
    pipeline.chromaticAberration.aberrationAmount = 6;

    pipeline.grainEnabled    = !isLiteMode;
    pipeline.grain.intensity = 9;
    pipeline.grain.animated  = true;

    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.toneMappingEnabled = true;
    pipeline.imageProcessing.toneMappingType    = ImageProcessingConfiguration.TONEMAPPING_ACES;
    pipeline.imageProcessing.exposure           = 1.28;
    pipeline.imageProcessing.contrast           = 1.14;

    pipeline.depthOfFieldEnabled = false; // DOF off in street-level cam

    if (!isLiteMode) {
      try {
        const ssao = new SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: 0.5, blurRatio: 1 }, [camera]);
        ssao.radius        = 2.8;
        ssao.totalStrength = 1.2;
        ssao.samples       = 12;
        ssao.maxZ          = 80;
        ssao.expensiveBlur = true;
      } catch { /* SSAO not supported */ }
    }

    // ── IBL probe ─────────────────────────────────────────────────────────────
    const probe = new ReflectionProbe('probe', isLiteMode ? 64 : 128, scene);
    probe.position = new Vector3(0, 60, 0);
    scene.environmentTexture   = probe.cubeTexture;
    scene.environmentIntensity = isLiteMode ? 0.35 : 0.55;

    // ── Sky + environment ─────────────────────────────────────────────────────
    createSkyDome(scene);
    createHorizonGlow(scene);

    // ── Ground ────────────────────────────────────────────────────────────────
    const ground = MeshBuilder.CreateGround('ground', { width: 700, height: 700 }, scene);
    const groundMat = new PBRMaterial('groundMat', scene);
    groundMat.albedoColor   = new Color3(0.014, 0.014, 0.020);
    groundMat.metallic      = 0.85;
    groundMat.roughness     = 0.16;
    groundMat.emissiveColor = new Color3(0.006, 0.006, 0.010);
    ground.material   = groundMat;
    ground.position.y = -0.2;
    ground.receiveShadows = true;
    ground.checkCollisions = true;

    // ── Build districts ───────────────────────────────────────────────────────
    const landmarkMats: Array<{ mat: PBRMaterial; base: Color3 }> = [];
    const flickerMats:  Array<{ mat: PBRMaterial; base: Color3; seed: number }> = [];
    const beaconEntries: BeaconEntry[] = [];

    // Store building proximity data: { id → { x, z, d (depth), meta } }
    const proximityTargets: Array<{ x: number; z: number; d: number; meta: BuildingMeta }> = [];

    DISTRICTS.forEach((district) => {
      const { x, z } = districtCenter(district);
      const accent = Color3.FromHexString(district.color);

      if (!isLiteMode) {
        const accentLight = new PointLight(`pl-${district.id}`, new Vector3(x, 28, z), scene);
        accentLight.diffuse   = accent;
        accentLight.specular  = accent.scale(0.55);
        accentLight.intensity = 1.4;
        accentLight.range     = (CITY.TILE_SIZE / 2) * 1.8;
      }

      const plate = MeshBuilder.CreateGround(`plate-${district.id}`, { width: CITY.TILE_SIZE, height: CITY.TILE_SIZE }, scene);
      const plateMat = new PBRMaterial(`plateMat-${district.id}`, scene);
      plateMat.albedoColor   = accent.scale(0.08);
      plateMat.metallic      = 0.78;
      plateMat.roughness     = 0.20;
      plateMat.emissiveColor = accent.scale(0.05);
      plate.material    = plateMat;
      plate.position.set(x, 0, z);
      plate.isPickable  = false;
      plate.receiveShadows = true;
      plate.checkCollisions = true;

      // Neon perimeter strips
      const stripMat = new PBRMaterial(`stripMat-${district.id}`, scene);
      stripMat.albedoColor   = accent.scale(0.3);
      stripMat.emissiveColor = accent.scale(0.5);
      stripMat.metallic      = 0.9;
      stripMat.roughness     = 0.08;

      const half = CITY.TILE_SIZE / 2;
      const t = 0.5;
      ([
        [x,        z - half, CITY.TILE_SIZE, t],
        [x,        z + half, CITY.TILE_SIZE, t],
        [x - half, z,        t, CITY.TILE_SIZE],
        [x + half, z,        t, CITY.TILE_SIZE],
      ] as [number, number, number, number][]).forEach((s, i) => {
        const strip = MeshBuilder.CreateBox(`strip-${district.id}-${i}`, { width: s[2], depth: s[3], height: 0.22 }, scene);
        strip.material = stripMat;
        strip.position.set(s[0], 0.14, s[1]);
        strip.isPickable = false;
      });

      // ── Buildings ──────────────────────────────────────────────────────────
      const rng      = seeded(hashString(district.id));
      const padding  = 7;
      const innerSize = CITY.TILE_SIZE - padding * 2;
      const count    = district.buildings.length;
      const perSide  = Math.ceil(Math.sqrt(count));
      const cell     = innerSize / perSide;

      district.buildings.forEach((building, idx) => {
        const row = Math.floor(idx / perSide);
        const col = idx % perSide;
        const jx  = (rng() - 0.5) * 1.2;
        const jz  = (rng() - 0.5) * 1.2;
        const bx  = x - innerSize / 2 + col * cell + cell / 2 + jx;
        const bz  = z - innerSize / 2 + row * cell + cell / 2 + jz;

        const shape = getBuildingShape(building);

        const bMat = createBuildingPBR(`bmat-${building.id}`, scene, building.type, !!building.isLandmark, accent);

        const { base: mesh, all: meshParts, podShape } = buildCompoundMeshes(scene, building, shape, bx, bz, bMat);

        const meta: BuildingMeta = {
          buildingId: building.id,
          buildingType: building.type,
          buildingName: building.name,
          buildingDescription: building.description,
          districtId: district.id,
          floors: building.floors,
        };
        mesh.metadata = meta;

        // Register door position for proximity detection (front of building)
        proximityTargets.push({ x: bx, z: bz - shape.d / 2 - 1, d: shape.d, meta });

        addWindowPlanes(scene, bx, bz, podShape, building.floors, building.id, accent);
        addLedgeBands(scene, building, shape, bx, bz, accent);
        addRooftopDetails(scene, building, shape, bx, bz, accent);
        addACUnits(scene, building, shape, bx, bz);
        addBuildingLobby(scene, building, shape, bx, bz, accent);

        if (building.isLandmark) {
          addBuildingSign(scene, building, shape, bx, bz, accent);
          addGroundGlow(scene, building, shape, bx, bz, accent);
          landmarkMats.push({ mat: bMat, base: bMat.emissiveColor.clone() });
          meshParts.forEach((m) => shadowGen.addShadowCaster(m));
        }

        if (building.type === 'studio' || building.type === 'room' || building.type === 'club') {
          addActivityBeacon(scene, building, shape, bx, bz, accent, beaconEntries);
        }

        if (building.type === 'club' || (building.type === 'studio' && !building.isLandmark)) {
          const seed = (hashString(building.id + 'flk') >>> 0) / 0xffffffff;
          flickerMats.push({ mat: bMat, base: bMat.emissiveColor.clone(), seed });
        }
      });
    });

    // ── Infrastructure ────────────────────────────────────────────────────────
    createCityRingRoad(scene);
    createRoads(scene);
    createStreetLamps(scene, renderProfile);
    createStarfield(scene, renderProfile);
    DISTRICTS.forEach((d) => createDistrictLabel(scene, d));
    createDroneTraffic(scene, renderProfile);

    const cars = createStreetCars(scene, renderProfile);
    const peds = createPedestrians(scene, renderProfile);

    // ── WASD key state ────────────────────────────────────────────────────────
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const onKeyUp   = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);

    // ── Per-frame logic ───────────────────────────────────────────────────────
    let lastProximityId: string | null = null;

    scene.registerBeforeRender(() => {
      const t        = performance.now() / 1000;
      const deltaMs  = engine.getDeltaTime();
      const delta    = Math.min(deltaMs / 1000, 0.05);

      // ── Landmark pulse ────────────────────────────────────────────────────
      landmarkMats.forEach(({ mat, base }, i) => {
        mat.emissiveColor = base.scale(1 + 0.26 * Math.sin(t * 1.5 + i * 0.85));
      });

      // ── Neon flicker ──────────────────────────────────────────────────────
      flickerMats.forEach(({ mat, base, seed }) => {
        const f = 0.76
          + 0.13 * Math.sin(t * 2.4  + seed * 10)
          + 0.07 * Math.sin(t * 5.9  + seed *  7)
          + 0.04 * Math.sin(t * 11.3 + seed *  3);
        mat.emissiveColor = base.scale(Math.max(0.22, f));
      });

      // ── Activity beacons ──────────────────────────────────────────────────
      beaconEntries.forEach(({ mesh, mat, base, bx, bz, baseY, phase, speed }) => {
        mesh.position.set(bx, baseY + 0.55 * Math.sin(t * 1.35 + phase), bz);
        const pulse = 0.32 + 0.68 * Math.abs(Math.sin(t * speed + phase));
        mat.emissiveColor = base.scale(0.35 + 1.25 * pulse);
      });

      // ── Car movement ──────────────────────────────────────────────────────
      cars.forEach((car) => {
        car.t += delta * car.speed / Vector3.Distance(car.startPos, car.endPos);
        if (car.t > 1) car.t -= 1;
        const pos = Vector3.Lerp(car.startPos, car.endPos, car.t);
        car.body.position.copyFrom(pos);
        const dir = car.endPos.subtract(car.startPos).normalize();
        car.body.rotation.y = Math.atan2(dir.x, dir.z);
      });

      // ── Pedestrian movement ───────────────────────────────────────────────
      peds.forEach((ped) => {
        if (ped.pauseT > 0) {
          ped.pauseT -= delta;
          return;
        }
        ped.t += delta * ped.speed / Math.max(0.1, Vector3.Distance(ped.startPos, ped.endPos));
        if (ped.t >= 1) {
          ped.t = 0;
          ped.pauseT = 1.5 + ped.rng() * 2.5;
          // pick new random waypoint
          const angle = ped.rng() * Math.PI * 2;
          ped.startPos = ped.endPos.clone();
          ped.endPos = new Vector3(
            ped.cx + Math.cos(angle) * ped.radius,
            0.85,
            ped.cz + Math.sin(angle) * ped.radius
          );
        }
        const pos = Vector3.Lerp(ped.startPos, ped.endPos, ped.t);
        ped.body.position.copyFrom(pos);
        const dir = ped.endPos.subtract(ped.startPos);
        if (dir.length() > 0.01) {
          ped.body.rotation.y = Math.atan2(dir.x, dir.z);
        }
      });

      // ── WASD player movement ──────────────────────────────────────────────
      const speed = 8.5;
      const fwd3  = camera.target.subtract(camera.position);
      fwd3.y = 0;
      const fwdLen = fwd3.length();
      if (fwdLen > 0.001) {
        fwd3.scaleInPlace(1 / fwdLen);
      }
      const right3 = Vector3.Cross(Vector3.Up(), fwd3).normalize();

      let moveDir = Vector3.Zero();
      if (keys['KeyW'] || keys['ArrowUp'])    moveDir.addInPlace(fwd3);
      if (keys['KeyS'] || keys['ArrowDown'])  moveDir.addInPlace(fwd3.scale(-1));
      if (keys['KeyA'] || keys['ArrowLeft'])  moveDir.addInPlace(right3.scale(-1));
      if (keys['KeyD'] || keys['ArrowRight']) moveDir.addInPlace(right3);

      if (moveDir.length() > 0.001) {
        moveDir.normalize().scaleInPlace(speed * delta);
        player.moveWithCollisions(moveDir);
        // face movement direction
        player.rotation.y = Math.atan2(moveDir.x, moveDir.z);
      }

      // keep player on ground
      if (player.position.y < 0.9) player.position.y = 0.9;

      // lock camera target to player
      camera.target.copyFrom(player.position);

      // ── Proximity detection ───────────────────────────────────────────────
      const PROX_RADIUS = 7.5;
      let closestId:   string | null = null;
      let closestMeta: BuildingMeta | null = null;
      let closestDist  = PROX_RADIUS;

      for (const pt of proximityTargets) {
        const dx   = player.position.x - pt.x;
        const dz   = player.position.z - pt.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < closestDist) {
          closestDist = dist;
          closestId   = pt.meta.buildingId;
          closestMeta = pt.meta;
        }
      }

      if (closestId !== lastProximityId) {
        lastProximityId = closestId;
        onProximityRef.current(closestMeta);
      }
    });

    // ── Render loop ───────────────────────────────────────────────────────────
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
    canvas.style.cursor = 'default';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      window.removeEventListener('resize',  handleResize);
      scene.dispose();
      engine.dispose();
      engineRef.current = null;
      sceneRef.current  = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="city-canvas" />;
}
