'use client';

import Link from 'next/link';
import { BookOpen, Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { type Classroom } from '@/types';
import { cn } from '@/lib/utils';

interface ClassroomCardProps {
  classroom: Classroom;
  memberCount: number;
  teacherNames: string[];
  curriculumNames: string[];
}

export default function ClassroomCard({
  classroom,
  memberCount,
  teacherNames,
  curriculumNames,
}: ClassroomCardProps) {
  const enabledCount = classroom.enabled_features?.filter((f) => f.enabled).length || 0;

  return (
    <Link
      href={`/classrooms/${classroom.id}`}
      className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-lg)]"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Icon */}
      <div className="mb-3 flex items-start justify-between">
        <div className="rounded-xl bg-[var(--accent-light)] p-2.5 text-[var(--accent)]">
          <BookOpen className="h-5 w-5" />
        </div>
      </div>

      {/* Name & Description */}
      <div className="mb-4 flex-1">
        <h3 className="mb-1 text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
          {classroom.name}
        </h3>
        {classroom.description && (
          <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
            {classroom.description}
          </p>
        )}
      </div>

      {/* Curriculum badges */}
      {curriculumNames.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {curriculumNames.map((name) => (
            <Badge key={name}>{name}</Badge>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Users size={13} />
          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
        </span>
        {teacherNames.length > 0 && (
          <>
            <span className="text-[var(--border)]">·</span>
            <span className="truncate">
              {teacherNames.slice(0, 2).join(', ')}
              {teacherNames.length > 2 && ` +${teacherNames.length - 2}`}
            </span>
          </>
        )}
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="text-xs text-[var(--foreground-muted)]">
          {enabledCount} feature{enabledCount !== 1 ? 's' : ''}
        </span>
        <span className="text-xs font-semibold text-[var(--primary)]">
          View Classroom →
        </span>
      </div>
    </Link>
  );
}
