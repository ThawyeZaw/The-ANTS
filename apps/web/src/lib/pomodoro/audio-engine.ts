// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro & Exam Audio Engine
// Studio-Grade Ambient Soundscapes & Acoustic Chime Synthesis
// Dual-layer: High-Fidelity MP3 field recordings + Organic Procedural Web Audio fallback
// ──────────────────────────────────────────────────────────────────────────────

import type { VibeId } from '@/constants/pomodoro-vibes';
import { getVibe } from '@/constants/pomodoro-vibes';
import type { ChimeSoundId } from '@/constants/pomodoro';

export type SynthKey = 'rain' | 'brown_noise' | 'cafe' | 'forest';

interface SoundEngineState {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  sourceNodes: AudioScheduledSourceNode[];
  lfoNodes: OscillatorNode[];
  scheduledIntervals: number[];
  audioElement: HTMLAudioElement | null;
  isPlayingMp3: boolean;
  isFading: boolean;
  fadeTimer: number | null;
  isRunning: boolean;
  currentVibeId: VibeId | null;
  volume: number;
}

const state: SoundEngineState = {
  ctx: null,
  masterGain: null,
  sourceNodes: [],
  lfoNodes: [],
  scheduledIntervals: [],
  audioElement: null,
  isPlayingMp3: false,
  isFading: false,
  fadeTimer: null,
  isRunning: false,
  currentVibeId: null,
  volume: 0.4,
};

function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

function getAudioContext(): AudioContext {
  if (!state.ctx || state.ctx.state === 'closed') {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    state.ctx = new AudioContextClass();
    state.masterGain = state.ctx.createGain();
    state.masterGain.gain.setValueAtTime(state.volume, state.ctx.currentTime);
    state.masterGain.connect(state.ctx.destination);
  }
  if (state.ctx.state === 'suspended') {
    void state.ctx.resume();
  }
  return state.ctx;
}

function stopAllProceduralNodes(): void {
  // Clear any scheduled micro-events (raindrops, clinks, etc.)
  for (const interval of state.scheduledIntervals) {
    window.clearInterval(interval);
  }
  state.scheduledIntervals = [];

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

/** Clear active fade timer if one is running */
function cancelFade(): void {
  if (state.fadeTimer !== null) {
    window.clearInterval(state.fadeTimer);
    state.fadeTimer = null;
  }
  state.isFading = false;
}

/** Generate a continuous pink/brown/white noise buffer for natural acoustic synthesis */
function createNoiseBuffer(
  ctx: AudioContext,
  durationSec = 6,
  type: 'pink' | 'white' | 'brown' = 'pink',
): AudioBuffer {
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
      data[i] *= 3.5;
    }
  } else {
    // Pink noise approximation (Paul Kellet 7-pole filter)
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
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

// ──────────────────────────────────────────────────────────────────────────────
// Procedural Soundscapes (Studio-Grade Fallback Synthesizer)
// ──────────────────────────────────────────────────────────────────────────────

/** Deep Focus / Midnight Library: Warm acoustic rumble with sub-bass isolation */
function buildBrownNoise(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 6, 'brown');
  const source = createLoopingSource(ctx, buffer);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(220, ctx.currentTime);
  lowpass.Q.setValueAtTime(0.7, ctx.currentTime);

  const secondFilter = ctx.createBiquadFilter();
  secondFilter.type = 'lowpass';
  secondFilter.frequency.setValueAtTime(320, ctx.currentTime);

  // Sub-bass warmth layer (60 Hz acoustic presence)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(60, ctx.currentTime);
  subGain.gain.setValueAtTime(0.06, ctx.currentTime);
  subOsc.connect(subGain);
  subGain.connect(state.masterGain!);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.15, ctx.currentTime);

  source.connect(lowpass);
  lowpass.connect(secondFilter);
  secondFilter.connect(gain);
  gain.connect(state.masterGain!);

  source.start();
  subOsc.start();
  state.sourceNodes.push(source, subOsc);
}

/** Monsoon Rain: Layered rainfall bed with gentle wind modulation & micro-droplets */
function buildRain(ctx: AudioContext): void {
  // Layer 1: Warm body of rain (pink noise lowpass)
  const bodyBuffer = createNoiseBuffer(ctx, 6, 'pink');
  const bodySource = createLoopingSource(ctx, bodyBuffer);

  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.setValueAtTime(850, ctx.currentTime);
  bodyFilter.Q.setValueAtTime(0.5, ctx.currentTime);

  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.85, ctx.currentTime);

  bodySource.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(state.masterGain!);
  bodySource.start();
  state.sourceNodes.push(bodySource);

  // Layer 2: Delicate airborne droplet hiss with slow breath LFO
  const dropletBuffer = createNoiseBuffer(ctx, 5, 'pink');
  const dropletSource = createLoopingSource(ctx, dropletBuffer);

  const dropFilter = ctx.createBiquadFilter();
  dropFilter.type = 'bandpass';
  dropFilter.frequency.setValueAtTime(2400, ctx.currentTime);
  dropFilter.Q.setValueAtTime(1.1, ctx.currentTime);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // slow 12s breath
  lfoGain.gain.setValueAtTime(0.12, ctx.currentTime);
  lfo.connect(lfoGain);

  const dropGain = ctx.createGain();
  dropGain.gain.setValueAtTime(0.32, ctx.currentTime);
  lfoGain.connect(dropGain.gain);

  dropletSource.connect(dropFilter);
  dropFilter.connect(dropGain);
  dropGain.connect(state.masterGain!);

  lfo.start();
  dropletSource.start();
  state.sourceNodes.push(dropletSource);
  state.lfoNodes.push(lfo);

  // Layer 3: Occasional delicate acoustic raindrop impact ticks
  const dropInterval = window.setInterval(() => {
    if (!state.isRunning || !state.masterGain || !state.ctx) return;
    try {
      const now = state.ctx.currentTime;
      const osc = state.ctx.createOscillator();
      const oscGain = state.ctx.createGain();

      const freq = 1600 + Math.random() * 1200;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + 0.045);

      const amp = (0.04 + Math.random() * 0.06) * state.volume;
      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.linearRampToValueAtTime(amp, now + 0.005);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(oscGain);
      oscGain.connect(state.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      /* ignore tick error */
    }
  }, 320);

  state.scheduledIntervals.push(dropInterval);
}

/** Yangon Teashop: Warm acoustic room reverberation with soft wooden ambience */
function buildCafe(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 6, 'pink');
  const source = createLoopingSource(ctx, buffer);

  // Formant 1: Warm human vocal body
  const lowFilter = ctx.createBiquadFilter();
  lowFilter.type = 'bandpass';
  lowFilter.frequency.setValueAtTime(340, ctx.currentTime);
  lowFilter.Q.setValueAtTime(1.8, ctx.currentTime);

  // Formant 2: Room acoustic reflection
  const midFilter = ctx.createBiquadFilter();
  midFilter.type = 'bandpass';
  midFilter.frequency.setValueAtTime(920, ctx.currentTime);
  midFilter.Q.setValueAtTime(2.2, ctx.currentTime);

  const lowGain = ctx.createGain();
  lowGain.gain.setValueAtTime(0.7, ctx.currentTime);

  const midGain = ctx.createGain();
  midGain.gain.setValueAtTime(0.35, ctx.currentTime);

  // Slow natural murmur drift
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
  lfoGain.gain.setValueAtTime(35, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(lowFilter.frequency);

  source.connect(lowFilter);
  lowFilter.connect(lowGain);
  lowGain.connect(state.masterGain!);

  source.connect(midFilter);
  midFilter.connect(midGain);
  midGain.connect(state.masterGain!);

  lfo.start();
  source.start();
  state.sourceNodes.push(source);
  state.lfoNodes.push(lfo);

  // Soft ceramic cup ping at distant intervals (every 5-10s)
  const clinkInterval = window.setInterval(() => {
    if (!state.isRunning || !state.masterGain || !state.ctx) return;
    if (Math.random() < 0.45) return;
    try {
      const now = state.ctx.currentTime;
      const osc = state.ctx.createOscillator();
      const oscGain = state.ctx.createGain();

      const baseFreq = 2900 + Math.random() * 400;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);

      const amp = 0.035 * state.volume;
      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.linearRampToValueAtTime(amp, now + 0.003);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(oscGain);
      oscGain.connect(state.masterGain);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch {
      /* ignore clink error */
    }
  }, 4500);

  state.scheduledIntervals.push(clinkInterval);
}

/** Misty Forest: Ethereal mountain wind swaying through pine canopy */
function buildForest(ctx: AudioContext): void {
  const buffer = createNoiseBuffer(ctx, 6, 'pink');
  const source = createLoopingSource(ctx, buffer);

  const filter1 = ctx.createBiquadFilter();
  filter1.type = 'bandpass';
  filter1.frequency.setValueAtTime(540, ctx.currentTime);
  filter1.Q.setValueAtTime(0.8, ctx.currentTime);

  const filter2 = ctx.createBiquadFilter();
  filter2.type = 'bandpass';
  filter2.frequency.setValueAtTime(920, ctx.currentTime);
  filter2.Q.setValueAtTime(1.2, ctx.currentTime);

  // Dual asynchronous breeze LFOs (non-repeating organic sway)
  const breezeLfo1 = ctx.createOscillator();
  const breezeGain1 = ctx.createGain();
  breezeLfo1.type = 'sine';
  breezeLfo1.frequency.setValueAtTime(0.07, ctx.currentTime); // ~14s period
  breezeGain1.gain.setValueAtTime(180, ctx.currentTime);
  breezeLfo1.connect(breezeGain1);
  breezeGain1.connect(filter1.frequency);

  const breezeLfo2 = ctx.createOscillator();
  const breezeGain2 = ctx.createGain();
  breezeLfo2.type = 'sine';
  breezeLfo2.frequency.setValueAtTime(0.11, ctx.currentTime); // ~9s period
  breezeGain2.gain.setValueAtTime(120, ctx.currentTime);
  breezeLfo2.connect(breezeGain2);
  breezeGain2.connect(filter2.frequency);

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.7, ctx.currentTime);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.3, ctx.currentTime);

  source.connect(filter1);
  filter1.connect(gain1);
  gain1.connect(state.masterGain!);

  source.connect(filter2);
  filter2.connect(gain2);
  gain2.connect(state.masterGain!);

  breezeLfo1.start();
  breezeLfo2.start();
  source.start();

  state.sourceNodes.push(source);
  state.lfoNodes.push(breezeLfo1, breezeLfo2);
}

// ──────────────────────────────────────────────────────────────────────────────
// High-Fidelity Audio Element Streamer (MP3 Player)
// ──────────────────────────────────────────────────────────────────────────────

function getAudioElement(): HTMLAudioElement {
  if (!state.audioElement) {
    state.audioElement = new Audio();
    state.audioElement.loop = true;
    state.audioElement.preload = 'auto';

    // Fallback if media loading encounters an unrecoverable network error
    state.audioElement.addEventListener('error', () => {
      console.warn('[AudioEngine] HTMLAudio playback error, falling back to Web Audio synth');
      if (state.isRunning && state.currentVibeId) {
        const vibe = getVibe(state.currentVibeId);
        if (vibe) {
          startSynth(vibe.synthKey, state.volume);
        }
      }
    });
  }
  return state.audioElement;
}

/** Smoothly fade audio element volume to target */
function fadeAudioElement(
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs = 350,
  onComplete?: () => void,
): void {
  cancelFade();
  state.isFading = true;

  const startVol = audio.volume;
  const diff = targetVolume - startVol;
  if (Math.abs(diff) < 0.01) {
    audio.volume = targetVolume;
    state.isFading = false;
    onComplete?.();
    return;
  }

  const steps = 15;
  const stepTime = durationMs / steps;
  let currentStep = 0;

  state.fadeTimer = window.setInterval(() => {
    currentStep++;
    const progress = Math.min(1, currentStep / steps);
    // Smooth cosine interpolation
    const ease = 0.5 * (1 - Math.cos(Math.PI * progress));
    audio.volume = Math.max(0, Math.min(1, startVol + diff * ease));

    if (progress >= 1) {
      cancelFade();
      audio.volume = targetVolume;
      onComplete?.();
    }
  }, stepTime);
}

// ──────────────────────────────────────────────────────────────────────────────
// Public Ambient Audio Controls
// ──────────────────────────────────────────────────────────────────────────────

/** Start synthesizing vibe background ambience directly via Web Audio */
export function startSynth(key: SynthKey, volume: number): void {
  try {
    const ctx = getAudioContext();
    stopAllProceduralNodes();

    if (state.masterGain) {
      state.masterGain.gain.setValueAtTime(clampVolume(volume), ctx.currentTime);
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
    state.isPlayingMp3 = false;
  } catch (err) {
    console.warn('[AudioEngine] Could not start synth soundscape:', err);
  }
}

/**
 * Start vibe ambience.
 * Attempts high-fidelity MP3 field recording first; seamlessly falls back
 * to organic Web Audio procedural synthesis if offline or blocked.
 */
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
  state.isRunning = true;

  // Try playing real high-fidelity recorded MP3 first
  if (typeof window !== 'undefined' && vibe.audioSrc) {
    const audio = getAudioElement();
    const targetSrc = new URL(vibe.audioSrc, window.location.origin).href;

    // Check if same audio is already playing
    if (state.isPlayingMp3 && audio.src === targetSrc && !audio.paused) {
      fadeAudioElement(audio, state.volume, 250);
      return;
    }

    // Stop procedural synth if it was running
    stopAllProceduralNodes();

    // Fade out current audio if playing, then switch and fade in
    const doPlay = () => {
      audio.src = vibe.audioSrc;
      audio.volume = 0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            state.isPlayingMp3 = true;
            fadeAudioElement(audio, state.volume, 450);
          })
          .catch((err) => {
            console.info('[AudioEngine] MP3 streaming unavailable, using native Web Audio:', err);
            state.isPlayingMp3 = false;
            startSynth(vibe.synthKey, state.volume);
          });
      }
    };

    if (state.isPlayingMp3 && !audio.paused) {
      fadeAudioElement(audio, 0, 200, doPlay);
    } else {
      doPlay();
    }
    return;
  }

  // Fallback to procedural synthesis
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

  // Smoothly adjust MP3 volume if active
  if (state.isPlayingMp3 && state.audioElement) {
    fadeAudioElement(state.audioElement, state.volume, 120);
  }

  // Smoothly adjust master gain for Web Audio
  if (state.masterGain && state.ctx) {
    state.masterGain.gain.setValueAtTime(state.volume, state.ctx.currentTime);
  }
}

export function stopSound(): void {
  cancelFade();

  if (state.audioElement && !state.audioElement.paused) {
    fadeAudioElement(state.audioElement, 0, 200, () => {
      if (state.audioElement) {
        state.audioElement.pause();
        state.audioElement.currentTime = 0;
      }
      state.isPlayingMp3 = false;
    });
  } else {
    state.isPlayingMp3 = false;
  }

  stopAllProceduralNodes();
  state.isRunning = false;
  state.currentVibeId = null;
}

export function disposeAudio(): void {
  stopSound();
  if (state.audioElement) {
    state.audioElement.pause();
    state.audioElement.src = '';
    state.audioElement = null;
  }
  if (state.ctx && state.ctx.state !== 'closed') {
    void state.ctx.close();
  }
  state.ctx = null;
  state.masterGain = null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Studio-Grade Chime & Alert Engine (Anti-click physical modeling)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Play a crystal-clear, warm acoustic chime with zero digital clicks.
 * Models physical strike transients, inharmonic overtone partials & warm decay.
 */
export function playChime(chimeId: ChimeSoundId = 'bowl'): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = Math.max(0.1, state.volume);

    switch (chimeId) {
      case 'bell':
        playCambridgeBell(ctx, now, vol);
        break;
      case 'marimba':
        playCrystalMarimba(ctx, now, vol);
        break;
      case 'minimal':
        playMinimalChime(ctx, now, vol);
        break;
      case 'bowl':
      default:
        playSingingBowl(ctx, now, vol);
        break;
    }
  } catch (err) {
    console.warn('[AudioEngine] Chime playback blocked:', err);
  }
}

/** Tibetan Singing Bowl: 528 Hz Solfeggio with shimmering 1.4 Hz acoustic beat & felt mallet */
function playSingingBowl(ctx: AudioContext, now: number, masterVol: number): void {
  // Felt mallet strike transient (short bandpass impulse for organic contact)
  const strikeNoise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
  }
  strikeNoise.buffer = noiseBuffer;
  const strikeFilter = ctx.createBiquadFilter();
  strikeFilter.type = 'bandpass';
  strikeFilter.frequency.setValueAtTime(650, now);
  strikeFilter.Q.setValueAtTime(2.0, now);

  const strikeGain = ctx.createGain();
  strikeGain.gain.setValueAtTime(0.08 * masterVol, now);
  strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

  strikeNoise.connect(strikeFilter);
  strikeFilter.connect(strikeGain);
  strikeGain.connect(ctx.destination);
  strikeNoise.start(now);

  // Dual fundamentals creating gentle 1.4 Hz acoustic beating shimmer (528 Hz + 529.4 Hz)
  const bowlHarmonics = [
    { freq: 264, gain: 0.18, decay: 4.8 }, // warm sub-octave
    { freq: 528, gain: 0.38, decay: 4.2 }, // fundamental
    { freq: 529.4, gain: 0.28, decay: 4.0 }, // acoustic interference pair
    { freq: 1456, gain: 0.14, decay: 3.2 }, // inharmonic tierce overtone
    { freq: 2820, gain: 0.06, decay: 2.0 }, // crystalline ring
  ];

  bowlHarmonics.forEach(({ freq, gain, decay }) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Smooth 12ms attack ramp: Eliminates digital clicks completely
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(gain * masterVol, now + 0.015);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + decay);
  });
}

/** Cambridge Academic Bell: Classic collegiate tower bell with struck metal resonance */
function playCambridgeBell(ctx: AudioContext, now: number, masterVol: number): void {
  // Strike transient
  const strikeOsc = ctx.createOscillator();
  const strikeGain = ctx.createGain();
  strikeOsc.type = 'triangle';
  strikeOsc.frequency.setValueAtTime(1318.5, now);
  strikeGain.gain.setValueAtTime(0.0001, now);
  strikeGain.gain.linearRampToValueAtTime(0.15 * masterVol, now + 0.003);
  strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  strikeOsc.connect(strikeGain);
  strikeGain.connect(ctx.destination);
  strikeOsc.start(now);
  strikeOsc.stop(now + 0.07);

  // Classic church bell harmonic spectrum (E5 nominal = 659.25 Hz)
  const bellHarmonics = [
    { freq: 329.63, gain: 0.22, decay: 3.8 }, // Hum tone (octave below)
    { freq: 659.25, gain: 0.42, decay: 3.5 }, // Fundamental strike note
    { freq: 783.99, gain: 0.18, decay: 2.8 }, // Tierce (minor third)
    { freq: 987.77, gain: 0.12, decay: 2.2 }, // Quint (fifth)
    { freq: 1318.5, gain: 0.08, decay: 1.6 }, // Nominal (octave above)
  ];

  bellHarmonics.forEach(({ freq, gain, decay }) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(gain * masterVol, now + 0.008);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + decay);
  });
}

/** Crystal Marimba: Joyful 4-note ascending major arpeggio with warm wooden tone */
function playCrystalMarimba(ctx: AudioContext, now: number, masterVol: number): void {
  // Ascending G major arpeggio: G4, B4, D5, G5
  const notes = [
    { freq: 392.0, time: now + 0.0, decay: 1.1 },
    { freq: 493.88, time: now + 0.08, decay: 1.1 },
    { freq: 587.33, time: now + 0.16, decay: 1.2 },
    { freq: 783.99, time: now + 0.24, decay: 1.6 },
  ];

  notes.forEach(({ freq, time, decay }) => {
    // Fundamental sine
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Warm 4x wooden bar harmonic
    const harm = ctx.createOscillator();
    const harmGain = ctx.createGain();
    harm.type = 'sine';
    harm.frequency.setValueAtTime(freq * 3.96, time);

    oscGain.gain.setValueAtTime(0.0001, time);
    oscGain.gain.linearRampToValueAtTime(0.28 * masterVol, time + 0.006);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    harmGain.gain.setValueAtTime(0.0001, time);
    harmGain.gain.linearRampToValueAtTime(0.07 * masterVol, time + 0.004);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    osc.connect(oscGain);
    harm.connect(harmGain);
    oscGain.connect(ctx.destination);
    harmGain.connect(ctx.destination);

    osc.start(time);
    harm.start(time);
    osc.stop(time + decay);
    harm.stop(time + decay);
  });
}

/** Minimal Two-Tone: Modern, discreet, soft acoustic cue */
function playMinimalChime(ctx: AudioContext, now: number, masterVol: number): void {
  const tones = [
    { freq: 587.33, time: now + 0.0, duration: 0.45, gain: 0.26 }, // D5
    { freq: 880.0, time: now + 0.14, duration: 0.85, gain: 0.32 }, // A5
  ];

  tones.forEach(({ freq, time, duration, gain }) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    oscGain.gain.setValueAtTime(0.0001, time);
    oscGain.gain.linearRampToValueAtTime(gain * masterVol, time + 0.012);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  });
}

/**
 * Official Cambridge / Edexcel Exam Milestone Alert (15m & 5m warning).
 * Features an authoritative, gentle two-tone acoustic bell.
 * Voice announcement is optional and polite.
 */
export function playExamWarningChime(
  minutesRemaining: number,
  withVoice = false,
  _chimeId: ChimeSoundId = 'bowl',
): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = Math.max(0.25, state.volume);

    // Two-tone British collegiate exam hall chime: C5 (523 Hz) -> E5 (659 Hz)
    const tones = [
      { freq: 523.25, startTime: now, duration: 0.55, gain: 0.28 },
      { freq: 659.25, startTime: now + 0.24, duration: 0.85, gain: 0.34 },
    ];

    tones.forEach(({ freq, startTime, duration, gain }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      oscGain.gain.setValueAtTime(0.0001, startTime);
      oscGain.gain.linearRampToValueAtTime(gain * vol, startTime + 0.01);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // Optional natural voice announcement if enabled by user
    if (withVoice && 'speechSynthesis' in window) {
      try {
        const text = `${minutesRemaining} minutes remaining`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = Math.max(0.3, state.volume);

        // Prefer English / natural voice if installed
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('UK') ||
              v.name.includes('British') ||
              v.name.includes('Online')),
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Delay until after the two chime tones finish (600ms)
        window.setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 600);
      } catch {
        /* Speech synthesis muted or unavailable */
      }
    }
  } catch (err) {
    console.warn('[AudioEngine] Exam warning chime blocked:', err);
  }
}
