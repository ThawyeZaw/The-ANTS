'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Subject Lesson Page (dynamic route)
// Route: /lessons/[curriculumId]/[subjectId]
// Dedicated lesson view for a specific subject with topic content,
// progress tracking, and navigation controls.
// ──────────────────────────────────────────────────────────────────────────────

import { useParams } from 'next/navigation';
import SubjectLessonView from '@/components/Lessons/SubjectLessonView';

export default function SubjectLessonPage() {
  const params = useParams<{ curriculumId: string; subjectId: string }>();

  return (
    <div className="space-y-6">
      <SubjectLessonView
        curriculumId={params.curriculumId}
        subjectId={params.subjectId}
      />
    </div>
  );
}
