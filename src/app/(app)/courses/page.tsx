'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Course Manager Page
// Route: /courses — Single-page browse + multi-select enrol experience.
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import BackButton from '@/components/ui/BackButton';
import CourseBrowser from '@/components/courses/CourseBrowser';

export default function CourseManagerPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <BackButton href="/dashboard" label="Back" />

      <div className="mt-4">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        }>
          <CourseBrowser />
        </Suspense>
      </div>
    </div>
  );
}
