// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Preset Avatar Definitions
// Cute illustrated avatar presets for user profile customization.
// ──────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';

export interface PresetAvatar {
  key: string;
  name: string;
  /** Emoji used as a simple fallback representation */
  emoji: string;
  /** Gradient colors for the avatar background */
  gradient: string;
}

/** Curated set of cute illustrated avatar presets */
export const PRESET_AVATARS: PresetAvatar[] = [
  { key: 'fox', name: 'Fox', emoji: '🦊', gradient: 'from-orange-400 to-rose-500' },
  { key: 'cat', name: 'Cat', emoji: '🐱', gradient: 'from-amber-300 to-orange-500' },
  { key: 'bear', name: 'Bear', emoji: '🐻', gradient: 'from-amber-600 to-yellow-700' },
  { key: 'rabbit', name: 'Rabbit', emoji: '🐰', gradient: 'from-pink-300 to-purple-400' },
  { key: 'owl', name: 'Owl', emoji: '🦉', gradient: 'from-violet-500 to-indigo-700' },
  { key: 'panda', name: 'Panda', emoji: '🐼', gradient: 'from-stone-400 to-stone-600' },
  { key: 'penguin', name: 'Penguin', emoji: '🐧', gradient: 'from-sky-400 to-blue-600' },
  { key: 'koala', name: 'Koala', emoji: '🐨', gradient: 'from-slate-300 to-slate-500' },
  { key: 'lion', name: 'Lion', emoji: '🦁', gradient: 'from-yellow-400 to-orange-500' },
  { key: 'tiger', name: 'Tiger', emoji: '🐯', gradient: 'from-orange-400 to-amber-600' },
  { key: 'unicorn', name: 'Unicorn', emoji: '🦄', gradient: 'from-fuchsia-300 to-pink-500' },
  { key: 'dragon', name: 'Dragon', emoji: '🐉', gradient: 'from-emerald-400 to-teal-600' },
  { key: 'butterfly', name: 'Butterfly', emoji: '🦋', gradient: 'from-cyan-300 to-blue-400' },
  { key: 'whale', name: 'Whale', emoji: '🐋', gradient: 'from-blue-400 to-indigo-500' },
  { key: 'cactus', name: 'Cactus', emoji: '🌵', gradient: 'from-green-400 to-emerald-600' },
  { key: 'star', name: 'Star', emoji: '⭐', gradient: 'from-yellow-300 to-amber-400' },
];

/** Check if an avatar string is a preset reference */
export function isPresetAvatar(avatar: string): boolean {
  return avatar.startsWith('preset:');
}

/** Get a preset avatar config by its key */
export function getPresetAvatar(key: string): PresetAvatar | undefined {
  const presetKey = key.replace('preset:', '');
  return PRESET_AVATARS.find(p => p.key === presetKey);
}

/** Build the preset key string to store in profile.avatar */
export function makePresetAvatarKey(key: string): string {
  return `preset:${key}`;
}
