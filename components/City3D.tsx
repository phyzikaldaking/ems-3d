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
  id: string
): void {
  const WIN_U = 0.5;
  const WIN_V = 0.38;

  const faces: Array<{ suf: string; faceW: number; px: number; pz: number; ry: number }> = [
    { suf: 'f', faceW: shape.w, px: bx,                      pz: bz - shape.d / 2 - 0.12, ry: Math.PI },
    { suf: 'b', faceW: shape.w, px: bx,                      pz: bz + shape.d / 2 + 0.12, ry: 0 },
    { suf: 'l', faceW: shape.d, px: bx - shape.w / 2 - 0.12, pz: bz,                      ry: -Math.PI / 2 },
    { suf: 'r', faceW: shape.d, px: bx + shape.w / 2 + 0.12, pz: bz,                      ry:  Math.PI / 2 },
  ];

  faces.forEach(({ suf, faceW, px, pz, ry }) => {
    const plane = MeshBuilder.CreatePlane(`win-${id}-${suf}`, { width: faceW, height: shape.h }, scene);
    plane.position.set(px, shape.h / 2, pz);
    plane.rotation.y = ry;
    plane.isPickable = false;

    const t = new DynamicTexture(`wt-${id}-${suf}`, { width: 16, height: 16 }, scene, false);
    t.wrapU = Texture.WRAP_ADDRESSMODE;
    t.wrapV = Texture.WRAP_ADDRESSMODE;
    const ctx = t.getContext() as unknown as CanvasRenderingContext2D;
    ctx.fillStyle = '#05050b';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = 'rgba(255, 225, 140, 0.82)';
    ctx.fillRect(3, 3, 10, 9);
    t.update(false);
    t.uScale = Math.max(1, Math.round(faceW * WIN_U));
    t.vScale = Math.max(1, Math.round(floors * WIN_V));

    const mat = new StandardMaterial(`wm-${id}-${suf}`, scene);
    mat.emissiveTexture = t;
    mat.diffuseColor = Color3.Black();
    mat.specularColor = Color3.Black();
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

export default function City3D({ navigationState, onNavigate }: City3DProps) {
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

    const glow = new GlowLayer('glow', scene);
    glow.intensity = 0.7;

    // Ground plane
    const ocean = MeshBuilder.CreateGround('ocean', { width: 700, height: 700 }, scene);
    const oceanMat = new StandardMaterial('oceanMat', scene);
    oceanMat.diffuseColor = new Color3(0.03, 0.03, 0.05);
    oceanMat.specularColor = Color3.Black();
    ocean.material = oceanMat;
    ocean.position.y = -0.2;

    // ── Build districts ──────────────────────────────────────────────────
    const landmarkMats: Array<{ mat: StandardMaterial; base: Color3 }> = [];

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

        // Window overlays & rooftop details
        addWindowPlanes(scene, bx, bz, { w, d, h }, building.floors, building.id);
        addRooftopDetails(scene, building, { w, d, h }, bx, bz, accent);

        // Track landmark materials for pulse animation
        if (building.isLandmark) {
          landmarkMats.push({ mat: bMat, base: bMat.emissiveColor.clone() });
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

    // ── Atmosphere & post-effects ─────────────────────────────────────────
    createStarfield(scene);
    DISTRICTS.forEach((d) => createDistrictLabel(scene, d));

    // Pulse landmark building emissive
    scene.registerBeforeRender(() => {
      const t = performance.now() / 1000;
      landmarkMats.forEach(({ mat, base }, i) => {
        mat.emissiveColor = base.scale(1 + 0.28 * Math.sin(t * 1.5 + i * 0.85));
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

    engine.runRenderLoop(() => scene.render());

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
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        outline: 'none',
        touchAction: 'none',
        filter: navigationState.mode === 'interior' ? 'blur(4px) brightness(0.5)' : 'none',
        transition: 'filter 0.4s ease',
      }}
    />
  );
}
