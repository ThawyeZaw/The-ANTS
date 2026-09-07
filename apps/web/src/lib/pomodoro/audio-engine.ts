// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro Audio Engine
// File-loop ambience when available; Web Audio synth fallback otherwise.
// Completion chime stays synthesized.
// ──────────────────────────────────────────────────────────────────────────────

import type { VibeId } from '@/constants/pomodoro-vibes';
import { getVibe } from '@/constants/pomodoro-vibes';

type SynthKey = 'rain' | 'brown_noise' | 'cafe' | 'forest';

type SoundEngineState = {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  sourceNodes: AudioScheduledSourceNode[];
  lfoNodes: OscillatorNode[];
  htmlAudio: HTMLAudioElement | null;
  mode: 'file' | 'synth' | null;
  isRunning: boolean;
  currentVibeId: VibeId | null;
  volume: number;
  /** Bumps on every start/stop so stale play()/error callbacks cannot start synth */
  generation: number;
};

let state: SoundEngineState = {
  ctx: null,
  masterGain: null,
  sourceNodes: [],
  lfoNodes: [],
  htmlAudio: null,
  mode: null,
  isRunning: false,
  currentVibeId: null,
  volume: 0.4,
  generation: 0,
};

function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

function getAudioContext(): AudioContext {
  if (!state.ctx || state.ctx.state === 'closed') {
    state.ctx = new AudioContext();
    state.masterGain = state.ctx.createGain();
    state.masterGain.gain.value = state.volume;
    state.masterGain.connect(state.ctx.destination);
  }
  if (state.ctx.state === 'suspended') {
    void state.ctx.resume();
  }
  return state.ctx;
}

function stopAllNodes(): void {
  for (const src of state.sourceNodes) {
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
  }
  for (const lfo of state.lfoNodes) {
    try {
      lfo.stop();
    } catch {
      /* already stopped */
    }
  }
  state.sourceNodes = [];
  state.lfoNodes = [];
}

function stopHtmlAudio(): void {
  const audio = state.htmlAudio;
  state.htmlAudio = null;
  if (!audio) return;
  try {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  } catch {
    /* ignore */
  }
}

function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createLoopingSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function buildBrownNoise(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 2);
  const source = createLoopingSource(ctx, buffer);
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 400;
  lowpass.Q.value = 1;
  source.connect(lowpass);
  lowpass.connect(state.masterGain!);
  source.start();
  state.sourceNodes.push(source);
}

function buildRain(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 2);
  const source = createLoopingSource(ctx, buffer);
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 2000;
  bandpass.Q.value = 0.5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.3;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 3;
  lfo.connect(lfoGain);
  lfoGain.connect(bandpass.frequency);
  lfo.start();
  source.connect(bandpass);
  bandpass.connect(state.masterGain!);
  source.start();
  state.sourceNodes.push(source);
  state.lfoNodes.push(lfo);
}

function buildCafe(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 2);
  const source = createLoopingSource(ctx, buffer);
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 350;
  lowpass.Q.value = 0.8;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 80;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.3;
  lfo.connect(lfoGain);
  lfoGain.connect(lowpass.frequency);
  lfo.start();
  source.connect(lowpass);
  lowpass.connect(state.masterGain!);
  source.start();
  state.sourceNodes.push(source);
  state.lfoNodes.push(lfo);
}

function buildForest(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 2);
  const source = createLoopingSource(ctx, buffer);
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 600;
  bandpass.Q.value = 0.3;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 400;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.15;
  lfo.connect(lfoGain);
  lfoGain.connect(bandpass.frequency);
  lfo.start();
  source.connect(bandpass);
  bandpass.connect(state.masterGain!);
  source.start();
  state.sourceNodes.push(source);
  state.lfoNodes.push(lfo);
}

function startSynth(key: SynthKey, volume: number): void {
  const ctx = getAudioContext();
  stopAllNodes();
  stopHtmlAudio();
  if (state.masterGain) {
    state.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
  switch (key) {
    case 'brown_noise':
      buildBrownNoise(ctx);
      break;
    case 'rain':
      buildRain(ctx);
      break;
    case 'cafe':
      buildCafe(ctx);
      break;
    case 'forest':
      buildForest(ctx);
      break;
  }
  state.mode = 'synth';
  state.isRunning = true;
}

function startFileLoop(src: string, volume: number, onFail: () => void): void {
  const generation = ++state.generation;
  stopAllNodes();
  stopHtmlAudio();

  const audio = new Audio();
  audio.preload = 'auto';
  audio.loop = true;
  audio.playsInline = true;
  audio.volume = clampVolume(volume);
  audio.src = src;

  state.htmlAudio = audio;
  state.mode = 'file';
  state.isRunning = true;

  const isCurrent = () => state.generation === generation && state.htmlAudio === audio;

  audio.addEventListener(
    'error',
    () => {
      if (!isCurrent()) return;
      stopHtmlAudio();
      onFail();
    },
    { once: true },
  );

  void audio.play().then(
    () => {
      if (isCurrent()) state.isRunning = true;
    },
    (err: unknown) => {
      if (!isCurrent()) return;
      const name = err instanceof Error ? err.name : '';
      // Overlapping play()/pause() throws AbortError — do not swap in synth
      if (name === 'AbortError' || name === 'NotAllowedError') return;
      stopHtmlAudio();
      onFail();
    },
  );
}

/** Start vibe ambience from /public/pomodoro/vibes/{id}/ambience.mp3. Call from a user gesture. */
export function startVibeSound(vibeId: VibeId | null, volume: number): void {
  state.volume = clampVolume(volume);
  if (!vibeId || state.volume <= 0) {
    stopSound();
    return;
  }

  const vibe = getVibe(vibeId);
  if (!vibe) {
    stopSound();
    return;
  }

  state.currentVibeId = vibeId;
  startFileLoop(vibe.audioSrc, state.volume, () => startSynth(vibe.synthKey, state.volume));
}

/** @deprecated Use startVibeSound — kept for transitional imports */
export function startSound(key: SynthKey | null, volume: number): void {
  if (!key) {
    stopSound();
    return;
  }
  startSynth(key, volume);
  state.isRunning = true;
}

export function setVolume(volume: number): void {
  state.volume = clampVolume(volume);
  if (state.masterGain) {
    state.masterGain.gain.value = state.volume;
  }
  if (state.htmlAudio) {
    state.htmlAudio.volume = state.volume;
  }
}

export function stopSound(): void {
  state.generation += 1;
  stopAllNodes();
  stopHtmlAudio();
  state.isRunning = false;
  state.mode = null;
  state.currentVibeId = null;
}

export function disposeAudio(): void {
  stopSound();
  if (state.ctx && state.ctx.state !== 'closed') {
    void state.ctx.close();
  }
  state.ctx = null;
  state.masterGain = null;
}

export function playChime(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 523;
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 659;
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);

    setTimeout(() => {
      if (ctx.state !== 'closed') void ctx.close();
    }, 600);
  } catch {
    /* blocked */
  }
}
