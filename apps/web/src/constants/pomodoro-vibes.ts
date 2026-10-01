// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro & Study Vibe Scene Packs
// ──────────────────────────────────────────────────────────────────────────────

export type VibeId = 'library' | 'rain' | 'cafe' | 'forest' | 'deep-focus';

export type ParticleType = 'dust' | 'rain' | 'steam' | 'mist' | 'none';

export interface PomodoroVibe {
  id: VibeId;
  label: string;
  description: string;
  /** Primary stage background asset */
  backgroundSrc: string;
  /** Ambience audio fallback path */
  audioSrc: string;
  /** CSS gradient fallback when image is loading */
  gradient: string;
  /** Accent for timer ring, buttons, active state */
  accent: string;
  /** Synth key for native Web Audio generator */
  synthKey: 'brown_noise' | 'rain' | 'cafe' | 'forest';
  /** Ambient dynamic canvas particle type */
  particleType: ParticleType;
}

export const POMODORO_VIBES: PomodoroVibe[] = [
  {
    id: 'library',
    label: 'Midnight Library',
    description: 'Warm amber glow, mahogany bookshelves & antique desk focus',
    backgroundSrc: '/pomodoro/vibes/library/background.jpg',
    audioSrc: '/pomodoro/vibes/deep-focus/ambience.mp3',
    gradient: 'linear-gradient(160deg, #1c130c 0%, #2e1e11 40%, #452c1a 100%)',
    accent: '#f59e0b',
    synthKey: 'brown_noise',
    particleType: 'dust',
  },
  {
    id: 'rain',
    label: 'Monsoon Rain',
    description: 'Soft raindrops on the window overlooking misty city lights',
    backgroundSrc: '/pomodoro/vibes/rain/background.jpg',
    audioSrc: '/pomodoro/vibes/rain/ambience.mp3',
    gradient: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 45%, #334155 100%)',
    accent: '#38bdf8',
    synthKey: 'rain',
    particleType: 'rain',
  },
  {
    id: 'cafe',
    label: 'Yangon Teashop',
    description: 'Quiet morning teashop, warm tea steam & peaceful wooden light',
    backgroundSrc: '/pomodoro/vibes/cafe/background.jpg',
    audioSrc: '/pomodoro/vibes/cafe/ambience.mp3',
    gradient: 'linear-gradient(160deg, #292524 0%, #78350f 50%, #a16207 100%)',
    accent: '#fbbf24',
    synthKey: 'cafe',
    particleType: 'steam',
  },
  {
    id: 'forest',
    label: 'Misty Forest',
    description: 'Airy breeze through pine trees & tranquil mountain mist',
    backgroundSrc: '/pomodoro/vibes/forest/background.jpg',
    audioSrc: '/pomodoro/vibes/forest/ambience.mp3',
    gradient: 'linear-gradient(160deg, #052e16 0%, #14532d 45%, #166534 100%)',
    accent: '#34d399',
    synthKey: 'forest',
    particleType: 'mist',
  },
  {
    id: 'deep-focus',
    label: 'Deep Focus',
    description: 'Warm low rumble that eliminates background distractions',
    backgroundSrc: '/pomodoro/vibes/library/background.jpg',
    audioSrc: '/pomodoro/vibes/deep-focus/ambience.mp3',
    gradient: 'linear-gradient(160deg, #1c1917 0%, #292524 40%, #44403c 100%)',
    accent: '#f59e0b',
    synthKey: 'brown_noise',
    particleType: 'dust',
  },
];

export function getVibe(id: VibeId | string | null | undefined): PomodoroVibe | null {
  if (!id) return null;
  if (id === 'deep-focus') {
    return POMODORO_VIBES.find((v) => v.id === 'library') ?? POMODORO_VIBES[0];
  }
  return POMODORO_VIBES.find((v) => v.id === id) ?? null;
}