'use client';

// ──────────────────────────────────────────────────────────────────────────────
// AntTrailPattern — Subtle ant-colony geometric mesh background
//
// Repeating SVG pattern of connected nodes that evokes ant trail networks.
// Pure CSS background-image (data URI SVG), zero runtime cost, vector-sharp.
//
// Props:
//   variant   — 'brand' (teal) | 'violet' | 'mixed' (teal + violet accents)
//   opacity   — override base pattern opacity (default 0.12)
//   fadeEdges — enable top/bottom edge-fade mask (default true)
// ──────────────────────────────────────────────────────────────────────────────

const SVG_ANT_TRAIL = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">`
  + `<circle cx="14" cy="22" r="2" fill="currentColor" opacity=".22"/>`
  + `<circle cx="48" cy="18" r="2" fill="currentColor" opacity=".22"/>`
  + `<circle cx="92" cy="30" r="2" fill="currentColor" opacity=".22"/>`
  + `<circle cx="26" cy="64" r="2" fill="currentColor" opacity=".22"/>`
  + `<circle cx="70" cy="58" r="2" fill="currentColor" opacity=".22"/>`
  + `<circle cx="104" cy="76" r="2" fill="currentColor" opacity=".22"/>`
  + `<circle cx="38" cy="102" r="2" fill="currentColor" opacity=".22"/>`
  + `<circle cx="82" cy="98" r="2" fill="currentColor" opacity=".22"/>`
  + `<line x1="14" y1="22" x2="48" y2="18" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `<line x1="48" y1="18" x2="92" y2="30" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `<line x1="14" y1="22" x2="26" y2="64" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `<line x1="26" y1="64" x2="70" y2="58" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `<line x1="70" y1="58" x2="104" y2="76" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `<line x1="26" y1="64" x2="38" y2="102" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `<line x1="70" y1="58" x2="82" y2="98" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `<line x1="92" y1="30" x2="104" y2="76" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `<line x1="38" y1="102" x2="82" y2="98" stroke="currentColor" stroke-width=".8" opacity=".12"/>`
  + `</svg>`
);

const COLOR_MAP: Record<string, string> = {
  brand: 'var(--hp-brand)',
  violet: 'var(--hp-violet)',
  mixed: 'var(--hp-brand)',
};

interface Props {
  variant?: 'brand' | 'violet' | 'mixed';
  opacity?: number;
  fadeEdges?: boolean;
}

export default function AntTrailPattern({
  variant = 'brand',
  opacity = 0.12,
  fadeEdges = true,
}: Props) {
  const color = COLOR_MAP[variant] ?? COLOR_MAP.brand;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="hp-ant-pattern"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        color,
        opacity,
        backgroundImage: `url("data:image/svg+xml,${SVG_ANT_TRAIL}")`,
        backgroundRepeat: 'repeat',
        WebkitMaskImage: fadeEdges
          ? 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
          : 'none',
        maskImage: fadeEdges
          ? 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
          : 'none',
      }}
    />
  );
}

export { SVG_ANT_TRAIL };
