// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Stat Color Map Constant
// Quiet semantic tones for dashboard stat cards & badges (no rainbow neon).
// ──────────────────────────────────────────────────────────────────────────────

export const STAT_COLOR_MAP: Record<string, string> = {
  orange: 'text-foreground-secondary bg-background-secondary',
  violet: 'text-foreground-secondary bg-background-secondary',
  red: 'text-destructive bg-destructive/10',
  emerald: 'text-success bg-success/10',
  mint: 'text-foreground-secondary bg-background-secondary',
  amber: 'text-warning bg-warning/10',
  teal: 'text-foreground-secondary bg-background-secondary',
  pink: 'text-foreground-secondary bg-background-secondary',
  sky: 'text-primary bg-primary/10',
};

export default STAT_COLOR_MAP;
