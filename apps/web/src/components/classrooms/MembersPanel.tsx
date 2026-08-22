'use client';

import { Users, UserX, Shield, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getInitials } from '@/lib/utils';
import type { ClassroomMember } from '@/types';

// ── Member Row ──────────────────────────────────────────────────────────────
function MemberRow({
  member,
  name,
  isCurrentUser,
  isTeacher,
  onRemove,
}: {
  member: ClassroomMember;
  name: string;
  isCurrentUser: boolean;
  isTeacher: boolean;
  onRemove?: (userId: string) => void;
}) {
  const initials = getInitials(name);

  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-3 transition-all duration-200 hover:border-[var(--border-hover)]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-semibold text-[var(--primary)]">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {name}
              {isCurrentUser && <span className="ml-1 text-xs text-[var(--foreground-muted)]">(you)</span>}
            </span>
            {member.role === 'teacher' && (
              <Badge variant="teacher">Teacher</Badge>
            )}
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">
            {member.role === 'teacher' ? 'Teacher' : 'Student'}
          </p>
        </div>
      </div>
      {isTeacher && !isCurrentUser && member.role !== 'teacher' && onRemove && (
        <button
          onClick={() => onRemove(member.user_id)}
          className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]"
          title="Remove member"
        >
          <UserX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────────────
interface MembersPanelProps {
  classroomId: string;
  members: ClassroomMember[];
  currentUserId: string;
  isTeacher: boolean;
  getProfile: (userId: string) => { id: string; name: string; role: string } | undefined;
  onRemove: (userId: string) => void;
}

export default function MembersPanel({
  classroomId,
  members,
  currentUserId,
  isTeacher,
  getProfile,
  onRemove,
}: MembersPanelProps) {
  const classroomMembers = members.filter((m) => m.classroom_id === classroomId);

  const teachers = classroomMembers.filter((m) => m.role === 'teacher');
  const students = classroomMembers.filter((m) => m.role === 'student');

  const teacherCount = teachers.length;
  const studentCount = students.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {classroomMembers.length} total
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          {teacherCount} teacher{teacherCount !== 1 ? 's' : ''}
        </span>
        <span>
          {studentCount} student{studentCount !== 1 ? 's' : ''}
        </span>
      </div>

      {teachers.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Teachers</p>
          <div className="space-y-1.5">
            {teachers.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                name={getProfile(m.user_id)?.name || 'Unknown'}
                isCurrentUser={m.user_id === currentUserId}
                isTeacher={isTeacher}
              />
            ))}
          </div>
        </div>
      )}

      {students.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Students</p>
          <div className="space-y-1.5">
            {students.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                name={getProfile(m.user_id)?.name || 'Unknown'}
                isCurrentUser={m.user_id === currentUserId}
                isTeacher={isTeacher}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
