// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro & Exam Audio Engine (Native Web Audio API)
// 100% self-contained synthesized soundscapes & crystal-clear chimes.
// Zero buffering, zero broken links, works seamlessly offline.
// ──────────────────────────────────────────────────────────────────────────────

import type { VibeId } from '@/constants/pomodoro-vibes';
import { getVibe } from '@/constants/pomodoro-vibes';

export type SynthKey = 'rain' | 'brown_noise' | 'cafe' | 'forest';

type SoundEngineState = {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  sourceNodes: AudioScheduledSourceNode[];
  lfoNodes: OscillatorNode[];
  isRunning: boolean;
  currentVibeId: VibeId | null;
  volume: number;
};

const state: SoundEngineState = {
  ctx: null,
  masterGain: null,
  sourceNodes: [],
  lfoNodes: [],
  isRunning: false,
  currentVibeId: null,
  volume: 0.4,
};

function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

function getAudioContext(): AudioContext {
  if (!state.ctx || state.ctx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    state.ctx = new AudioContextClass();
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
      src.disconnect();
    } catch {
      /* already stopped */
    }
  }
  for (const lfo of state.lfoNodes) {
    try {
      lfo.stop();
      lfo.disconnect();
    } catch {
      /* already stopped */
    }
  }
  state.sourceNodes = [];
  state.lfoNodes = [];
}

/** Generate a continuous pink/brown noise buffer for natural acoustic synthesis */
function createNoiseBuffer(ctx: AudioContext, durationSec = 4, type: 'pink' | 'white' | 'brown' = 'pink'): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'brown') {
    let lastOut = 0.0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }
  } else {
    // Pink noise approximation (Paul Kellet's filter method)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

function createLoopingSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

/** Deep Focus / Library: Warm acoustic rumble that eliminates external distractions */
function buildBrownNoise(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 4, 'brown');
  const source = createLoopingSource(ctx, buffer);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 280;
  lowpass.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.value = 1.1;

  source.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(state.masterGain!);

  source.start();
  state.sourceNodes.push(source);
}

/** Monsoon Rain: Layered rainfall with soft distant drizzle and modulated droplet surge */
function buildRain(ctx: AudioContext): void {
  // Layer 1: Body of the rain (pink noise lowpass)
  const rainBodyBuffer = createNoiseBuffer(ctx, 4, 'pink');
  const rainBodySource = createLoopingSource(ctx, rainBodyBuffer);

  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.value = 1100;
  bodyFilter.Q.value = 0.4;

  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.75;

  rainBodySource.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(state.masterGain!);
  rainBodySource.start();
  state.sourceNodes.push(rainBodySource);

  // Layer 2: High-frequency droplet patter with subtle LFO surge
  const rainDropletsBuffer = createNoiseBuffer(ctx, 3, 'white');
  const rainDropletsSource = createLoopingSource(ctx, rainDropletsBuffer);

  const dropFilter = ctx.createBiquadFilter();
  dropFilter.type = 'bandpass';
  dropFilter.frequency.value = 3200;
  dropFilter.Q.value = 1.2;

  // Gentle wind swell LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.2; // slow 5-second breath
  lfoGain.gain.value = 0.18;
  lfo.connect(lfoGain);

  const dropGain = ctx.createGain();
  dropGain.gain.value = 0.28;
  lfoGain.connect(dropGain.gain);

  rainDropletsSource.connect(dropFilter);
  dropFilter.connect(dropGain);
  dropGain.connect(state.masterGain!);

  lfo.start();
  rainDropletsSource.start();
  state.sourceNodes.push(rainDropletsSource);
  state.lfoNodes.push(lfo);
}

/** Yangon Teashop / Cafe: Warm mid-range acoustic murmur and pleasant background hum */
function buildCafe(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 4, 'pink');
  const source = createLoopingSource(ctx, buffer);

  // Low vocal rumble simulation
  const lowFilter = ctx.createBiquadFilter();
  lowFilter.type = 'bandpass';
  lowFilter.frequency.value = 320;
  lowFilter.Q.value = 1.5;

  const lowGain = ctx.createGain();
  lowGain.gain.value = 0.8;

  // Modulate vocal hum slightly
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.35;
  lfoGain.gain.value = 40;
  lfo.connect(lfoGain);
  lfoGain.connect(lowFilter.frequency);

  source.connect(lowFilter);
  lowFilter.connect(lowGain);
  lowGain.connect(state.masterGain!);

  lfo.start();
  source.start();
  state.sourceNodes.push(source);
  state.lfoNodes.push(lfo);
}

/** Misty Forest: Ethereal mountain breeze swaying through tall pines */
function buildForest(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 4, 'pink');
  const source = createLoopingSource(ctx, buffer);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 650;
  filter.Q.value = 0.6;

  // Slow natural wind breeze modulation
  const windLfo = ctx.createOscillator();
  const windLfoGain = ctx.createGain();
  windLfo.type = 'sine';
  windLfo.frequency.value = 0.12; // 8-second slow breeze cycle
  windLfoGain.gain.value = 260;
  windLfo.connect(windLfoGain);
  windLfoGain.connect(filter.frequency);

  const gain = ctx.createGain();
  gain.gain.value = 0.85;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(state.masterGain!);

  windLfo.start();
  source.start();
  state.sourceNodes.push(source);
  state.lfoNodes.push(windLfo);
}

/** Start synthesizing vibe background ambience directly via Web Audio */
export function startSynth(key: SynthKey, volume: number): void {
  try {
    const ctx = getAudioContext();
    stopAllNodes();

    if (state.masterGain) {
      state.masterGain.gain.value = clampVolume(volume);
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
      default:
        buildBrownNoise(ctx);
        break;
    }
    state.isRunning = true;
  } catch (err) {
    console.warn('[AudioEngine] Could not start synth soundscape:', err);
  }
}

/** Start vibe soundscape (defaults to 100% self-contained native Web Audio synthesis) */
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

  state.currentVibeId = vibe.id;
  startSynth(vibe.synthKey, state.volume);
}

export function startSound(key: SynthKey | null, volume: number): void {
  if (!key) {
    stopSound();
    return;
  }
  startSynth(key, volume);
}

export function setVolume(volume: number): void {
  state.volume = clampVolume(volume);
  if (state.masterGain) {
    state.masterGain.gain.setValueAtTime(state.volume, state.ctx?.currentTime ?? 0);
  }
}

export function stopSound(): void {
  stopAllNodes();
  state.isRunning = false;
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

/** Harmonic Tibetan Singing Bowl / Meditation Chime for session completion */
export function playChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Harmonic frequencies for a calming singing bowl sound (528 Hz base)
    const harmonics = [
      { freq: 528, gain: 0.35, decay: 3.2 },
      { freq: 1056, gain: 0.16, decay: 2.2 },
      { freq: 1584, gain: 0.08, decay: 1.5 },
      { freq: 2112, gain: 0.04, decay: 1.0 },
    ];

    harmonics.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(gain * state.volume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  } catch (err) {
    console.warn('[AudioEngine] Chime playback was blocked:', err);
  }
}

/** Official Cambridge / Edexcel Style Exam Milestone Alert (15m & 5m warning) */
export function playExamWarningChime(minutesRemaining: number): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two-tone clean exam chime: Note 1 (880 Hz / A5), Note 2 (1174.66 Hz / D6)
    const tones = [
      { freq: 880, startTime: now, duration: 0.45 },
      { freq: 1174.66, startTime: now + 0.22, duration: 0.65 },
    ];

    tones.forEach(({ freq, startTime, duration }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      oscGain.gain.setValueAtTime(0.28 * Math.max(state.volume, 0.3), startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // Also speak brief speech cue if available (Five minutes remaining / Fifteen minutes remaining)
    if ('speechSynthesis' in window) {
      try {
        const text = `${minutesRemaining} minutes remaining`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = Math.max(state.volume, 0.4);
        // Delay slightly after the chime tones
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 350);
      } catch {
        /* Speech synthesis not supported or muted */
      }
    }
  } catch (err) {
    console.warn('[AudioEngine] Exam warning chime was blocked:', err);
  }
}
