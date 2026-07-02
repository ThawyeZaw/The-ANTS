'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Classroom Detail Page
// Shows a single classroom with tabs for assignments, quizzes, discussions, etc.
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ClassroomDetailView from '@/components/classrooms/ClassroomDetail';

export default function ClassroomDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const classroomId = params.id as string;

  if (!user) return null;

  return (
    <div className="space-y-6">
      <BackButton href="/classrooms" label="Back to Classrooms" />
      <ClassroomDetailView
        classroomId={classroomId}
        currentUserId={user.id}
        userRole={user.profile.role}
      />
    </div>
  );
}
