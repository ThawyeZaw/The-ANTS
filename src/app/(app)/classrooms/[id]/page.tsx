'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Classroom Detail Page
// Shows a single classroom with tabs for assignments, quizzes, discussions, etc.
// ──────────────────────────────────────────────────────────────────────────────

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ClassroomDetailView from '@/components/classrooms/ClassroomDetail';

export default function ClassroomDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const classroomId = params.id as string;

  if (!user) return null;

  return (
    <ClassroomDetailView
      classroomId={classroomId}
      currentUserId={user.id}
      userRole={user.profile.role}
    />
  );
}
