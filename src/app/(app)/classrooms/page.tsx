'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Classroom List Page
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
    let cancelled = false;
    (async () => {
      try {
        const userClassrooms = await c.getClassroomsByUser(user.id);
        if (cancelled) return;
        setClassrooms(userClassrooms);

        const map: Record<string, ClassroomMember[]> = {};
        await Promise.all(
          userClassrooms.map(async (cls) => {
            map[cls.id] = await c.getMembers(cls.id);
          })
        );
        if (!cancelled) setMembersMap(map);
      } catch {
        // fetch aborted by navigation — safe to ignore
      }
    })();
    return () => { cancelled = true; };
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
      onJoin={(inviteCode) => {
        void c.joinByCode(user.id, inviteCode).then((result) => {
          if (result.success) {
            setFeedback(`Joined classroom successfully!`);
          } else {
            setFeedback(result.error || 'Failed to join classroom.');
          }
        });
      }}
      onCreate={(name, description) => {
        void c.createNewClassroom({
          name,
          description,
          curriculum_ids: ['curr-1'],
          created_by: user.id,
        }).then((result) => {
          if (result.success) {
            setFeedback(`Classroom "${name}" created!`);
          } else {
            setFeedback(result.error || 'Failed to create classroom.');
          }
        });
      }}
      feedback={feedback}
      onClearFeedback={() => setFeedback('')}
    />
    </div>
  );
}
