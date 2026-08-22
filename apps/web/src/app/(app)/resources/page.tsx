'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Official Resources & Exams Page
// Route: /resources — Canonical view for exam papers & official syllabi.
// ──────────────────────────────────────────────────────────────────────────────

import ExamsLibraryBrowser from '@/components/library/ExamsLibraryBrowser';

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <ExamsLibraryBrowser />
    </div>
  );
}
