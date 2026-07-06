'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Classroom List Page
// Shows all classrooms the user is a member of; allows joining and creating.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { useClassroom } from '@/hooks/useClassroom';
import ClassroomList from '@/components/classrooms/ClassroomList';
import type { Classroom, ClassroomMember } from '@/types';

export default function ClassroomsPage() {
  const { user } = useAuth();
  const c = useClassroom();
  const [feedback, setFeedback] = useState('');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, ClassroomMember[]>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const userClassrooms = await c.getClassroomsByUser(user.id);
      setClassrooms(userClassrooms);

      const map: Record<string, ClassroomMember[]> = {};
      await Promise.all(
        userClassrooms.map(async (cls) => {
          map[cls.id] = await c.getMembers(cls.id);
        })
      );
      setMembersMap(map);
    })();
  }, [user, c]);

  if (!user) return null;

  const isTeacher = user.profile.role === 'teacher' || user.profile.role === 'contributor' || user.profile.role === 'main_contributor';

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back" />
      <ClassroomList
      classrooms={classrooms}
      getMemberCount={(classroomId) => (membersMap[classroomId] || []).length}
      getTeacherNames={(classroomId) =>
        (membersMap[classroomId] || [])
          .filter((m) => m.role === 'teacher')
          .map((m) => c.getProfile(m.user_id)?.name || 'Unknown')
      }
      getCurriculumNames={(classroomId) => {
        const classroom = c.getClassroom(classroomId);
        return classroom?.curriculum_ids?.map(() => 'IGCSE Physics') || [];
      }}
      isTeacher={isTeacher}
      onJoin={async (inviteCode) => {
        const result = await c.joinByCode(user.id, inviteCode);
        if (result.success) {
          setFeedback(`Joined classroom successfully!`);
        } else {
          setFeedback(result.error || 'Failed to join classroom.');
        }
      }}
      onCreate={async (name, description) => {
        const result = await c.createNewClassroom({
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
    </div>
  );
}
