'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Classroom List Page
// Shows all classrooms the user is a member of; allows joining and creating.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClassroom } from '@/hooks/useClassroom';
import ClassroomList from '@/components/classrooms/ClassroomList';

export default function ClassroomsPage() {
  const { user } = useAuth();
  const c = useClassroom();
  const [feedback, setFeedback] = useState('');

  if (!user) return null;

  const isTeacher = user.profile.role === 'teacher' || user.profile.role === 'contributor' || user.profile.role === 'main_contributor';
  const userClassrooms = c.getClassroomsByUser(user.id);

  return (
    <ClassroomList
      classrooms={userClassrooms}
      getMemberCount={(classroomId) => c.getMembers(classroomId).length}
      getTeacherNames={(classroomId) =>
        c.getMembers(classroomId)
          .filter((m) => m.role === 'teacher')
          .map((m) => c.getProfile(m.user_id)?.name || 'Unknown')
      }
      getCurriculumNames={(classroomId) => {
        // In the real app this comes from curriculum data
        const classroom = c.getClassroom(classroomId);
        return classroom?.curriculum_ids?.map(() => 'IGCSE Physics') || [];
      }}
      isTeacher={isTeacher}
      onJoin={(inviteCode) => {
        const result = c.joinByCode(user.id, inviteCode);
        if (result.success) {
          setFeedback(`Joined classroom successfully!`);
        } else {
          setFeedback(result.error || 'Failed to join classroom.');
        }
      }}
      onCreate={(name, description) => {
        const result = c.createNewClassroom({
          name,
          description,
          curriculum_ids: ['curr-1'],
          created_by: user.id,
        });
        if (result.success) {
          setFeedback(`Classroom "${name}" created!`);
        } else {
          setFeedback(result.error || 'Failed to create classroom.');
        }
      }}
      feedback={feedback}
      onClearFeedback={() => setFeedback('')}
    />
  );
}
