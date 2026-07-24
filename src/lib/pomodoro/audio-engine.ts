// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro Audio Engine
// PPP-owned: synthesized ambient soundscapes via Web Audio API.
// Zero external audio files, zero dependencies, zero licensing risk.
// ──────────────────────────────────────────────────────────────────────────────

import type { SoundKey } from '@/constants/pomodoro';

type SoundEngineState = {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  sourceNodes: AudioScheduledSourceNode[];
  lfoNodes: OscillatorNode[];
  isRunning: boolean;
  currentKey: SoundKey;
};

let state: SoundEngineState = {
  ctx: null,
  masterGain: null,
  sourceNodes: [],
  lfoNodes: [],
  isRunning: false,
  currentKey: null,
};

/**
 * Lazily initialise the shared AudioContext (browser autoplay policy:
 * must be triggered by a user gesture — our Start button does this).
 */
function getAudioContext(): AudioContext {
  if (!state.ctx || state.ctx.state === 'closed') {
    state.ctx = new AudioContext();
    state.masterGain = state.ctx.createGain();
    state.masterGain.gain.value = 0.4;
    state.masterGain.connect(state.ctx.destination);
  }
  if (state.ctx.state === 'suspended') {
    state.ctx.resume();
  }
  return state.ctx;
}

/** Stop and disconnect all active sound nodes. */
function stopAllNodes(): void {
  for (const src of state.sourceNodes) {
    try { src.stop(); } catch { /* already stopped */ }
  }
  for (const lfo of state.lfoNodes) {
    try { lfo.stop(); } catch { /* already stopped */ }
  }
  state.sourceNodes = [];
  state.lfoNodes = [];
}

/**
 * Create a buffer of white noise (random samples between -1 and 1).
 */
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

/**
 * Create a looping noise source from a buffer.
 */
function createLoopingSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

// ── Individual Soundscape Synthesizers ──────────────────────────────────────

function buildBrownNoise(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 2);
  const source = createLoopingSource(ctx, buffer);

  // Lowpass filter at ~400 Hz for the warm brown-noise characteristic
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

  // Bandpass to isolate the "hiss" of rain (~800–4000 Hz)
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 2000;
  bandpass.Q.value = 0.5;

  // Subtle amplitude LFO at ~3 Hz to simulate varying rainfall intensity
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
  // Base brown noise layer for warmth
  const buffer = createNoiseBuffer(ctx, 2);
  const source = createLoopingSource(ctx, buffer);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 350;
  lowpass.Q.value = 0.8;

  // Slow LFO on filter cutoff to simulate occasional murmur modulation (~0.3 Hz)
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

  // Bandpass for airy wind sound
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 600;
  bandpass.Q.value = 0.3;

  // Slow bandpass frequency sweep simulating gentle breezes (~0.15 Hz)
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

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Start playing a synthesized soundscape.
 * Must be called from a user-gesture handler (click/keydown) to satisfy
 * browser autoplay policy.
 */
export function startSound(key: SoundKey, volume: number): void {
  if (!key) {
    stopSound();
    return;
  }

  const ctx = getAudioContext();

  // Stop any currently playing sound
  stopAllNodes();

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

  state.isRunning = true;
  state.currentKey = key;
}

/**
 * Adjust master volume (0–1).
 */
export function setVolume(volume: number): void {
  if (state.masterGain) {
    state.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Stop all sound and reset state. Safe to call multiple times.
 */
export function stopSound(): void {
  stopAllNodes();
  state.isRunning = false;
  state.currentKey = null;
}

/**
 * Fully tear down the AudioContext. Call when the component unmounts
 * or when the user navigates away.
 */
export function disposeAudio(): void {
  stopSound();
  if (state.ctx && state.ctx.state !== 'closed') {
    state.ctx.close();
  }
  state.ctx = null;
  state.masterGain = null;
}

/**
 * Play a gentle two-note completion chime (ascending C5→E5).
 * Uses a temporary AudioContext so it doesn't interfere with the ambience engine.
 * Safe to call at any time — silently degrades if audio is blocked by browser policy.
 */
export function playChime(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // First note — C5 (523 Hz)
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

    // Second note — E5 (659 Hz), delayed 120ms
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

    // Clean up after chime finishes
    setTimeout(() => {
      if (ctx.state !== 'closed') ctx.close();
    }, 600);
  } catch {
    // Silently degrade — audio may be blocked by browser policy
  }
}
