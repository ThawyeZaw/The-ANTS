'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Course Manager Page
// Route: /courses — Renders the browse-and-multi-select course manager view.
// ──────────────────────────────────────────────────────────────────────────────

import { useAuth } from '@/hooks/useAuth';
import CourseBrowser from '@/components/courses/CourseBrowser';

export default function CourseManagerPage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <CourseBrowser />
    </div>
  );
}
