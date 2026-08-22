// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Curriculum Dashboard Page
// Route: /curriculum — Unified curriculum hub with exam countdowns,
// study notes, and flashcard decks filtered by enrolled subjects.
// ──────────────────────────────────────────────────────────────────────────────

import CurriculumDashboard from '@/components/curriculum/CurriculumDashboard';

export default function CurriculumPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <CurriculumDashboard />
    </div>
  );
}
