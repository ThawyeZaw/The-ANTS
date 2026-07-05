'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — Font Loader
// Injects Fraunces + JetBrains Mono Google Fonts links into <head> without
// touching the PM-locked layout.tsx. Runs once on mount; no-ops server-side.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&display=swap';

export default function HomepageFonts() {
  useEffect(() => {
    if (document.querySelector('[data-hp-fonts]')) return;

    // Preconnect
    const pc1 = document.createElement('link');
    pc1.rel = 'preconnect';
    pc1.href = 'https://fonts.googleapis.com';
    pc1.setAttribute('data-hp-fonts', 'pc1');
    document.head.appendChild(pc1);

    const pc2 = document.createElement('link');
    pc2.rel = 'preconnect';
    pc2.href = 'https://fonts.gstatic.com';
    pc2.crossOrigin = 'anonymous';
    pc2.setAttribute('data-hp-fonts', 'pc2');
    document.head.appendChild(pc2);

    // Font stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    link.setAttribute('data-hp-fonts', 'stylesheet');
    document.head.appendChild(link);
  }, []);

  return null;
}
