'use client';

// ──────────────────────────────────────────────────────────────────────────────
// AntHeroAccent — Subtle animated ant silhouette in the hero section
//
// A small, CSS-drawn ant shape that gently bobs near the hero heading.
// Purely decorative — reinforces "The ANTs" brand identity without
// distracting from primary content. Low opacity (10-14%) ensures it
// stays in the background.
//
// The ant is built from 3 oval body segments, 6 angled leg lines,
// and 2 curved antennae — all rendered via inline SVG for crisp edges.
// A second ant faces the opposite direction and floats at a different
// speed for a natural, organic feel.
// ──────────────────────────────────────────────────────────────────────────────

export default function AntHeroAccent() {
  return (
    <div aria-hidden="true" role="presentation">
      {/* Ant 1 — upper right, facing left */}
      <svg
        className="hp-ant-float"
        width="44"
        height="36"
        viewBox="0 0 44 36"
        style={{ top: '20%', right: '8%', animationDelay: '0s' }}
      >
        {/* Legs — back pair */}
        <line x1="28" y1="12" x2="22" y2="20" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        <line x1="28" y1="12" x2="34" y2="20" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        {/* Legs — middle pair */}
        <line x1="22" y1="10" x2="16" y2="18" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        <line x1="22" y1="10" x2="28" y2="18" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        {/* Legs — front pair */}
        <line x1="16" y1="8" x2="10" y2="16" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        <line x1="16" y1="8" x2="22" y2="16" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        {/* Antennae */}
        <path d="M4 6 Q2 2 0 0" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.6" />
        <path d="M4 6 Q4 0 5 -2" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.6" />
        {/* Head */}
        <ellipse cx="5" cy="7" rx="3.5" ry="2.8" fill="currentColor" opacity="0.85" />
        {/* Thorax */}
        <ellipse cx="12" cy="8" rx="3" ry="2.4" fill="currentColor" opacity="0.75" />
        {/* Abdomen */}
        <ellipse cx="20" cy="10" rx="4.5" ry="3.2" fill="currentColor" opacity="0.7" />
        {/* Tail tip */}
        <ellipse cx="26" cy="11" rx="2" ry="1.8" fill="currentColor" opacity="0.5" />
      </svg>

      {/* Ant 2 — lower left, facing right (mirrored) */}
      <svg
        className="hp-ant-float"
        width="38"
        height="32"
        viewBox="0 0 38 32"
        style={{ bottom: '15%', left: '6%', animationDelay: '2.5s', transform: 'scaleX(-1)' }}
      >
        {/* Legs — back pair */}
        <line x1="24" y1="10" x2="18" y2="17" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        <line x1="24" y1="10" x2="30" y2="17" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        {/* Legs — middle pair */}
        <line x1="18" y1="9" x2="12" y2="16" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        <line x1="18" y1="9" x2="24" y2="16" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        {/* Legs — front pair */}
        <line x1="12" y1="8" x2="6" y2="15" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        <line x1="12" y1="8" x2="18" y2="15" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
        {/* Antennae */}
        <path d="M3 5 Q1 1 -1 -1" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.6" />
        <path d="M3 5 Q3 0 4 -2" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.6" />
        {/* Head */}
        <ellipse cx="4" cy="6" rx="3" ry="2.4" fill="currentColor" opacity="0.85" />
        {/* Thorax */}
        <ellipse cx="10" cy="7" rx="2.6" ry="2.1" fill="currentColor" opacity="0.75" />
        {/* Abdomen */}
        <ellipse cx="17" cy="9" rx="4" ry="2.8" fill="currentColor" opacity="0.7" />
        {/* Tail tip */}
        <ellipse cx="22" cy="10" rx="1.8" ry="1.5" fill="currentColor" opacity="0.5" />
      </svg>
    </div>
  );
}
