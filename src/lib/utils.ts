// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Utility Helpers
// General-purpose helpers used across the app.
// ──────────────────────────────────────────────────────────────────────────────

import { UserRole, ROLE_METADATA } from '@/types';

/**
 * Merge class names, filtering out falsy values.
 * Lightweight alternative to `clsx` + `tailwind-merge`.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get the human-readable display name for a role.
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLE_METADATA[role]?.displayName ?? role;
}

/**
 * Get the URL path for a role's landing page.
 */
export function getRoleLandingPath(role: UserRole): string {
  return '/dashboard';
}

/**
 * Format a date string into a human-readable format.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a relative time string (e.g., "2 hours ago").
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/**
 * Generate initials from a full name (e.g. "Thiri Aung" → "TA").
 */
export function getInitials(name?: string | null): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength.
 * Returns an object with a score (0-4) and feedback messages.
 */
export function checkPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['bg-error', 'bg-error', 'bg-warning', 'bg-success', 'bg-accent'];

  const cappedScore = Math.min(score, 4);
  return {
    score: cappedScore,
    label: labels[cappedScore],
    color: colors[cappedScore],
  };
}

/**
 * Generate a URL-safe username slug from a full name.
 * "Aye Chan Thu" → "ayechanthu", "U Kyaw Min" → "ukyawmin"
 */
export function generateUsername(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return slug || `user${Date.now()}`;
}
