// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro Vibe Scene Packs
//
// HOW TO ADD YOUR OWN IMAGES & AUDIO
// ─────────────────────────────────────────────────────────────────────────────
// 1. Drop files into apps/web/public/pomodoro/vibes/{vibe-id}/
//      background.webp  — stage background (recommended 1920×1080, keep under ~1 MB)
//      ambience.mp3       — seamless loop (keep under ~5 MB; Cloudflare Workers assets max 25 MiB per file)
// 2. Or change the paths below (backgroundSrc / audioSrc).
// 3. Files in those folders are used as-is (background.webp + ambience.mp3).
// 4. Large originals belong on R2 (the-ants-assets), not in Worker static assets.
//
// Folders: rain | deep-focus | cafe | forest
// ──────────────────────────────────────────────────────────────────────────────

export type VibeId = 'rain' | 'deep-focus' | 'cafe' | 'forest';

export interface PomodoroVibe {
  id: VibeId;
  label: string;
  description: string;
  /** → apps/web/public/pomodoro/vibes/{id}/background.webp */
  backgroundSrc: string;
  /** → apps/web/public/pomodoro/vibes/{id}/ambience.mp3 */
  audioSrc: string;
  /** CSS gradient fallback when the image is missing */
  gradient: string;
  /** Accent for timer ring, buttons, active state */
  accent: string;
  /** Synth fallback when the audio file is unavailable */
  synthKey: 'rain' | 'brown_noise' | 'cafe' | 'forest';
}

export const POMODORO_VIBES: PomodoroVibe[] = [
  {
    id: 'rain',
    label: 'Rainfall',
    description: 'Soft rain by the window — monsoon study energy',
    backgroundSrc: '/pomodoro/vibes/rain/background.webp',
    audioSrc: '/pomodoro/vibes/rain/ambience.mp3',
    gradient: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 45%, #334155 100%)',
    accent: '#38bdf8',
    synthKey: 'rain',
  },
  {
    id: 'deep-focus',
    label: 'Deep Focus',
    description: 'Warm low rumble that masks distractions',
    backgroundSrc: '/pomodoro/vibes/deep-focus/background.webp',
    audioSrc: '/pomodoro/vibes/deep-focus/ambience.mp3',
    gradient: 'linear-gradient(160deg, #1c1917 0%, #292524 40%, #44403c 100%)',
    accent: '#f59e0b',
    synthKey: 'brown_noise',
  },
  {
    id: 'cafe',
    label: 'Cafe',
    description: 'Quiet teashop murmur — gentle human hum',
    backgroundSrc: '/pomodoro/vibes/cafe/background.webp',
    audioSrc: '/pomodoro/vibes/cafe/ambience.mp3',
    gradient: 'linear-gradient(160deg, #292524 0%, #78350f 50%, #a16207 100%)',
    accent: '#d97706',
    synthKey: 'cafe',
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Airy breeze through trees — calm and grounded',
    backgroundSrc: '/pomodoro/vibes/forest/background.webp',
    audioSrc: '/pomodoro/vibes/forest/ambience.mp3',
    gradient: 'linear-gradient(160deg, #052e16 0%, #14532d 45%, #166534 100%)',
    accent: '#34d399',
    synthKey: 'forest',
  },
];

export function getVibe(id: VibeId | null | undefined): PomodoroVibe | null {
  if (!id) return null;
  return POMODORO_VIBES.find((v) => v.id === id) ?? null;
}
