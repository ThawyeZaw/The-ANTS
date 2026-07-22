'use client';

// ──────────────────────────────────────────────────────────────────────────────
// AppFonts — Global Google Font Loader
// Injects Quicksand font link into <head> on mount. Runs once.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap';

export default function AppFonts() {
  useEffect(() => {
    if (document.querySelector('[data-app-fonts]')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_HREF;
    link.setAttribute('data-app-fonts', 'quicksand');
    document.head.appendChild(link);
  }, []);

  return null;
}
