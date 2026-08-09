// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Settings Layout
// Provides metadata for the settings page (which is a client component).
// ──────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Settings — The ANTs',
  description:
    'Customise your The ANTs experience. Manage your profile, appearance, notification preferences, and timezone settings.',
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
