'use client';

import { useEffect, useRef, useState } from 'react';
import { type DistrictId, type BuildingType } from '@/lib/districts';
import { type NavigationState } from '@/lib/navigation';

// ── Per-district synthesis ─────────────────────────────────────────────────

interface DistrictAudioConfig {
  baseFreq: number;
  harmFreq: number;
  subFreq:  number;
  waveform: OscillatorType;
  gains:    [number, number, number];
}

const DISTRICT_AUDIO: Record<DistrictId, DistrictAudioConfig> = {
  'trap-ave':       { baseFreq: 55,    harmFreq: 82.5,  subFreq: 27.5,  waveform: 'triangle', gains: [0.035, 0.024, 0.032] },
  'rnb-blvd':       { baseFreq: 220,   harmFreq: 330,   subFreq: 55,    waveform: 'sine',     gains: [0.032, 0.026, 0.024] },
  'drill-district': { baseFreq: 138.6, harmFreq: 207.7, subFreq: 34.6,  waveform: 'triangle', gains: [0.030, 0.022, 0.030] },
  'hiphop-hwy':     { baseFreq: 110,   harmFreq: 165,   subFreq: 55,    waveform: 'triangle', gains: [0.034, 0.024, 0.030] },
  'pop-plaza':      { baseFreq: 261.6, harmFreq: 392,   subFreq: 65.4,  waveform: 'sine',     gains: [0.030, 0.024, 0.020] },
  'afro-alley':     { baseFreq: 174,   harmFreq: 261.6, subFreq: 43.65, waveform: 'triangle', gains: [0.032, 0.026, 0.026] },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function makeNoise(ctx: AudioContext): AudioBufferSourceNode {
  const secs = 3;
  const buf  = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;
  return src;
}

function makeOsc(ctx: AudioContext, freq: number, type: OscillatorType, vol: number, dest: AudioNode): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = vol;
  osc.connect(g).connect(dest);
  osc.start();
  return osc;
}

// ── Node builders ──────────────────────────────────────────────────────────

function buildDistrictNodes(ctx: AudioContext, cfg: DistrictAudioConfig, master: GainNode): GainNode {
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(0, ctx.currentTime);
  gn.connect(master);

  makeOsc(ctx, cfg.baseFreq, cfg.waveform, cfg.gains[0], gn);
  makeOsc(ctx, cfg.harmFreq, 'sine',       cfg.gains[1], gn);
  makeOsc(ctx, cfg.subFreq,  'sine',       cfg.gains[2], gn);

  return gn;
}

function buildCityNodes(ctx: AudioContext, master: GainNode): GainNode {
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(0, ctx.currentTime);
  gn.connect(master);

  // Soft city bed: musical intervals instead of abrasive test tones.
  makeOsc(ctx, 55,    'sine',     0.020, gn);
  makeOsc(ctx, 82.5,  'triangle', 0.016, gn);
  makeOsc(ctx, 110,   'sine',     0.018, gn);
  makeOsc(ctx, 165,   'triangle', 0.014, gn);
  makeOsc(ctx, 220,   'sine',     0.012, gn);

  // Slow breathing LFO (~14-second cycle)
  const lfo  = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.045;
  lfo.connect(lfoG).connect(gn.gain);
  lfo.start();

  return gn;
}

function buildInteriorNodes(ctx: AudioContext, master: GainNode, type: BuildingType): GainNode {
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(0, ctx.currentTime);
  gn.connect(master);

  switch (type) {
    case 'studio': {
      // Recording room: warm control-room hum without harsh hiss.
      makeOsc(ctx, 82.4,  'sine',     0.045, gn);
      makeOsc(ctx, 164.8, 'triangle', 0.020, gn);
      break;
    }

    case 'room': {
      // Listening room: detuned pair creates gentle beating + sub warmth
      makeOsc(ctx, 160,   'sine', 0.036, gn);
      makeOsc(ctx, 161.5, 'sine', 0.032, gn);
      makeOsc(ctx, 80,    'sine', 0.028, gn);
      break;
    }

    case 'marketplace': {
      makeOsc(ctx, 110, 'sine',     0.030, gn);
      makeOsc(ctx, 220, 'triangle', 0.022, gn);
      makeOsc(ctx, 330, 'sine',     0.014, gn);
      break;
    }

    case 'apartment': {
      // Intimate, warm — cozy home studio feel (E2 + B2)
      makeOsc(ctx, 82.4,  'sine', 0.034, gn);
      makeOsc(ctx, 123.5, 'sine', 0.024, gn);
      break;
    }

    case 'label': {
      // Clean, professional, minimal — corporate clarity (A3 + A4)
      makeOsc(ctx, 220, 'sine', 0.028, gn);
      makeOsc(ctx, 440, 'sine', 0.012, gn);
      break;
    }

    case 'club': {
      // Deep pulsing sub + sawtooth mid — club energy with ~128 BPM LFO
      const sub  = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = 55;
      const gSub = ctx.createGain();
      gSub.gain.value = 0.042;
      sub.connect(gSub).connect(gn);
      sub.start();

      makeOsc(ctx, 110, 'triangle', 0.026, gn);

      const lfo  = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 2.13; // ~128 BPM pulse
      const lfoG = ctx.createGain();
      lfoG.gain.value = 0.026;
      lfo.connect(lfoG).connect(gSub.gain);
      lfo.start();
      break;
    }
  }

  return gn;
}

// ── Component ──────────────────────────────────────────────────────────────

interface AmbientAudioProps {
  nav: NavigationState;
}

const FADE              = 1.8;
const MASTER_VOLUME     = 0.12;
const INTERIOR_DX_GAIN  = 0.18; // district audio persists quietly under interior

export default function AmbientAudio({ nav }: AmbientAudioProps) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef      = useRef<AudioContext | null>(null);
  const masterRef   = useRef<GainNode | null>(null);
  const cityRef     = useRef<GainNode | null>(null);
  const districtRef = useRef<Map<DistrictId, GainNode>>(new Map());
  const interiorRef = useRef<Map<BuildingType, GainNode>>(new Map());
  const startedRef  = useRef(false);

  const startMusic = async () => {
    if (!startedRef.current) {
      startedRef.current = true;
      const ctx    = new AudioContext();
      const master = ctx.createGain();
      const softener = ctx.createBiquadFilter();
      softener.type = 'lowpass';
      softener.frequency.value = 1800;
      softener.Q.value = 0.25;
      master.gain.value = 0;
      master.connect(softener).connect(ctx.destination);
      ctxRef.current    = ctx;
      masterRef.current = master;
    }

    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    await ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(MASTER_VOLUME, ctx.currentTime, 0.25);
    setEnabled(true);
  };

  const stopMusic = () => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.18);
    }
    setEnabled(false);
  };

  useEffect(() => {
    const ctx    = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master || !enabled) return;

    const t  = ctx.currentTime;
    const tc = FADE / 3;
    const fadeTo = (gn: GainNode, target: number) =>
      gn.gain.setTargetAtTime(target, t, tc);

    // ── City overview ────────────────────────────────────────────────────
    if (nav.mode === 'city') {
      if (!cityRef.current) cityRef.current = buildCityNodes(ctx, master);
      fadeTo(cityRef.current, 1);
      districtRef.current.forEach((gn) => fadeTo(gn, 0));
      interiorRef.current.forEach((gn) => fadeTo(gn, 0));
      return;
    }

    if (cityRef.current) fadeTo(cityRef.current, 0);

    // ── District / Building ──────────────────────────────────────────────
    if (nav.mode === 'district' || nav.mode === 'building') {
      const id = nav.districtId as DistrictId;
      if (!districtRef.current.has(id)) {
        districtRef.current.set(id, buildDistrictNodes(ctx, DISTRICT_AUDIO[id], master));
      }
      districtRef.current.forEach((gn, k) => fadeTo(gn, k === id ? 1 : 0));
      interiorRef.current.forEach((gn) => fadeTo(gn, 0));
      return;
    }

    // ── Interior ─────────────────────────────────────────────────────────
    if (nav.mode === 'interior' && nav.buildingType && nav.districtId) {
      const id   = nav.districtId as DistrictId;
      const type = nav.buildingType;

      // Ensure district nodes exist (user may deep-link directly to interior)
      if (!districtRef.current.has(id)) {
        districtRef.current.set(id, buildDistrictNodes(ctx, DISTRICT_AUDIO[id], master));
      }
      // Keep the active district quietly underneath — feels like street outside
      districtRef.current.forEach((gn, k) => fadeTo(gn, k === id ? INTERIOR_DX_GAIN : 0));

      if (!interiorRef.current.has(type)) {
        interiorRef.current.set(type, buildInteriorNodes(ctx, master, type));
      }
      interiorRef.current.forEach((gn, k) => fadeTo(gn, k === type ? 1 : 0));
    }
  }, [enabled, nav.mode, nav.districtId, nav.buildingType]);

  useEffect(() => {
    return () => { ctxRef.current?.close(); };
  }, []);

  return (
    <button
      type="button"
      className={`audio-toggle ${enabled ? 'audio-toggle--on' : ''}`}
      onClick={enabled ? stopMusic : startMusic}
      aria-pressed={enabled}
    >
      <span className="audio-toggle__dot" aria-hidden="true" />
      {enabled ? 'Music on' : 'Music off'}
    </button>
  );
}
