// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Club Constants
// Shared constants used across club-related pages. Import from here instead of
// defining inline.
// ──────────────────────────────────────────────────────────────────────────────

import type { ClubField } from '@/types';

export const FIELD_LABELS: Record<ClubField, string> = {
  computer_science: 'Computer Science',
  mathematics: 'Mathematics',
  science: 'Science',
  engineering: 'Engineering',
  medicine: 'Medicine',
  literature: 'Literature',
  arts: 'Arts',
  music: 'Music',
  debate: 'Debate',
  entrepreneurship: 'Entrepreneurship',
  architecture: 'Architecture',
  volunteering: 'Volunteering',
  other: 'Other',
};

/**
 * Consistent badge/tag color styles for each club field.
 * Uses the club/[slug]/page.tsx version (violet-500, blue-500, emerald-500, etc.)
 * as the canonical set.
 */
export const FIELD_BADGE_STYLES: Record<ClubField, string> = {
  computer_science: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  mathematics: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  science: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  engineering: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  medicine: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  literature: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  arts: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  music: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  debate: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  entrepreneurship: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  architecture: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  volunteering: 'bg-green-500/15 text-green-400 border-green-500/20',
  other: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

export const FIELD_OPTIONS: [ClubField, string][] = Object.entries(FIELD_LABELS) as [ClubField, string][];
