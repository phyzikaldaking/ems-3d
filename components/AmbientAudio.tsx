'use client';

import { useEffect, useRef } from 'react';
import { type DistrictId } from '@/lib/districts';
import { type NavigationState } from '@/lib/navigation';

// ── Per-district synthesis recipe ──────────────────────────────────────────
// Each district gets a characteristic tone texture made from Web Audio primitives.
// No external files — all synthesized in the browser.

interface DistrictAudioConfig {
  /** Primary drone frequency in Hz */
  baseFreq: number;
  /** Secondary harmonic frequency */
  harmFreq: number;
  /** Sub-bass frequency (sine, very low) */
  subFreq: number;
  /** Type for primary oscillator */
  waveform: OscillatorType;
  /** Gain for each layer [base, harm, sub] */
  gains: [number, number, number];
}

const DISTRICT_AUDIO: Record<DistrictId, DistrictAudioConfig> = {
  'trap-ave': {
    baseFreq: 55,     // A1 — classic 808 territory
    harmFreq: 82.5,   // E2
    subFreq: 27.5,    // A0 sub rumble
    waveform: 'sawtooth',
    gains: [0.09, 0.05, 0.12],
  },
  'rnb-blvd': {
    baseFreq: 220,    // A3 — warm, smooth
    harmFreq: 330,    // E4
    subFreq: 55,      // A1 sub
    waveform: 'sine',
    gains: [0.07, 0.04, 0.06],
  },
  'drill-district': {
    baseFreq: 138.6,  // C#3 — dark and tense
    harmFreq: 185,    // F#3
    subFreq: 34.6,    // C#1 sub
    waveform: 'square',
    gains: [0.06, 0.04, 0.10],
  },
  'hiphop-hwy': {
    baseFreq: 110,    // A2 — golden hip-hop
    harmFreq: 165,    // E3
    subFreq: 55,      // A1 sub
    waveform: 'triangle',
    gains: [0.08, 0.05, 0.09],
  },
  'pop-plaza': {
    baseFreq: 261.6,  // C4 — bright, major-key feel
    harmFreq: 392,    // G4
    subFreq: 65.4,    // C2
    waveform: 'sine',
    gains: [0.06, 0.05, 0.05],
  },
  'afro-alley': {
    baseFreq: 174,    // F3 — afrobeats-flavoured
    harmFreq: 261.6,  // C4
    subFreq: 43.65,   // F1 sub
    waveform: 'triangle',
    gains: [0.07, 0.06, 0.08],
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildDistrictNodes(
  ctx: AudioContext,
  cfg: DistrictAudioConfig,
  masterGain: GainNode,
): { oscBase: OscillatorNode; oscHarm: OscillatorNode; oscSub: OscillatorNode; gainNode: GainNode } {
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.connect(masterGain);

  const oscBase = ctx.createOscillator();
  oscBase.type = cfg.waveform;
  oscBase.frequency.value = cfg.baseFreq;
  const gBase = ctx.createGain();
  gBase.gain.value = cfg.gains[0];
  oscBase.connect(gBase).connect(gainNode);
  oscBase.start();

  const oscHarm = ctx.createOscillator();
  oscHarm.type = 'sine';
  oscHarm.frequency.value = cfg.harmFreq;
  const gHarm = ctx.createGain();
  gHarm.gain.value = cfg.gains[1];
  oscHarm.connect(gHarm).connect(gainNode);
  oscHarm.start();

  const oscSub = ctx.createOscillator();
  oscSub.type = 'sine';
  oscSub.frequency.value = cfg.subFreq;
  const gSub = ctx.createGain();
  gSub.gain.value = cfg.gains[2];
  oscSub.connect(gSub).connect(gainNode);
  oscSub.start();

  return { oscBase, oscHarm, oscSub, gainNode };
}

// ── Component ────────────────────────────────────────────────────────────────

interface AmbientAudioProps {
  nav: NavigationState;
}

const FADE_DURATION = 1.8; // seconds for cross-fade
const AMBIENT_VOLUME = 0.22; // master volume (quiet background)

export default function AmbientAudio({ nav }: AmbientAudioProps) {
  const ctxRef     = useRef<AudioContext | null>(null);
  const masterRef  = useRef<GainNode | null>(null);
  // Map of districtId → active gain node so we can fade individually
  const activeRef  = useRef<Map<DistrictId, GainNode>>(new Map());
  const startedRef = useRef(false);

  // Initialise context on first user interaction (browser autoplay policy)
  useEffect(() => {
    const bootstrap = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = AMBIENT_VOLUME;
      master.connect(ctx.destination);
      ctxRef.current   = ctx;
      masterRef.current = master;
    };

    window.addEventListener('pointerdown', bootstrap, { once: true });
    window.addEventListener('keydown', bootstrap, { once: true });
    return () => {
      window.removeEventListener('pointerdown', bootstrap);
      window.removeEventListener('keydown', bootstrap);
    };
  }, []);

  // React to navigation changes — fade in current district, fade out others
  useEffect(() => {
    const ctx    = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    if (nav.mode === 'city' || nav.mode === 'interior') {
      // Fade everything out when in city overview or inside a building
      activeRef.current.forEach((gainNode) => {
        gainNode.gain.setTargetAtTime(0, ctx.currentTime, FADE_DURATION / 3);
      });
      return;
    }

    const targetId = nav.districtId as DistrictId | null;
    if (!targetId) return;

    // Fade out all non-target districts
    activeRef.current.forEach((gainNode, id) => {
      if (id !== targetId) {
        gainNode.gain.setTargetAtTime(0, ctx.currentTime, FADE_DURATION / 3);
      }
    });

    // Fade in / create target district
    if (activeRef.current.has(targetId)) {
      const gn = activeRef.current.get(targetId)!;
      gn.gain.setTargetAtTime(1, ctx.currentTime, FADE_DURATION / 3);
    } else {
      const cfg = DISTRICT_AUDIO[targetId];
      const { gainNode } = buildDistrictNodes(ctx, cfg, master);
      gainNode.gain.setTargetAtTime(1, ctx.currentTime, FADE_DURATION / 3);
      activeRef.current.set(targetId, gainNode);
    }
  }, [nav.mode, nav.districtId]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return null; // no visible UI
}
