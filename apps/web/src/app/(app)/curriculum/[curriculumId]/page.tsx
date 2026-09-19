'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Curriculum Subject List
// Route: /curriculum/[curriculumId]
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, BookOpen, ClipboardCheck, CheckCircle2,
  BarChart3, Plus, Minus, GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getSubjectsByCurriculum,
  enrollInSubject,
  unenrollFromSubject,
  type SubjectWithProgress,
} from '@/actions/curriculum';
import { cn } from '@/lib/utils';
import { groupEdexcelIalSubjects, type GroupedSubject } from '@/lib/edexcel-ial';

const CURRICULUM_LABELS: Record<string, { label: string; code: string; color: string }> = {
  'curr-caie-igcse':    { label: 'Cambridge IGCSE',               code: 'CAIE',    color: '#8b5cf6' },
  'curr-caie-alevel':   { label: 'Cambridge A Level',             code: 'CAIE',    color: '#3b82f6' },
  'curr-edexcel-igcse': { label: 'Pearson Edexcel IGCSE',         code: 'Edexcel', color: '#10b981' },
  'curr-edexcel-ial':   { label: 'Pearson Edexcel IAL',           code: 'Edexcel', color: '#f59e0b' },
};

function ProgressBar({ value, total, color }: { value: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color ?? 'var(--color-primary)' }}
        />
      </div>
      <span className="text-[10px] font-mono text-foreground-muted tabular-nums">{value}/{total}</span>
    </div>
  );
}

function SubjectCard({
  subject,
  onEnrollToggle,
  curriculumId,
}: {
  subject: SubjectWithProgress;
  onEnrollToggle: (s: SubjectWithProgress) => void;
  curriculumId: string;
}) {
  const color = subject.color_code ?? '#6366f1';

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border/60 bg-background-card overflow-hidden',
        'hover:border-border-hover hover:shadow-md transition-all duration-200'
      )}
    >
      {/* Color accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: color }} />

      <div className="pl-4 pr-4 pt-4 pb-4 ml-1 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {subject.code}
              </span>
              {subject.isEnrolled && (
                <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Enrolled
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug">{subject.name}</h3>
          </div>
          <button
            onClick={() => onEnrollToggle(subject)}
            className={cn(
              'shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors',
              subject.isEnrolled
                ? 'border-error/30 text-error hover:bg-error/10'
                : 'border-primary/30 text-primary hover:bg-primary/10'
            )}
          >
            {subject.isEnrolled ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {subject.isEnrolled ? 'Leave' : 'Enroll'}
          </button>
        </div>

        {/* Progress bars */}
        <div className="space-y-1.5">
          {subject.topicCount > 0 && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                <ClipboardCheck className="h-3 w-3" /> Topics
              </span>
              <ProgressBar value={subject.completedTopics} total={subject.topicCount} color={color} />
            </div>
          )}
          {subject.paperCount > 0 && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Past Papers
              </span>
              <ProgressBar value={subject.completedPapers} total={subject.paperCount} color={color} />
            </div>
          )}
          {subject.topicCount === 0 && subject.paperCount === 0 && (
            <p className="text-[11px] text-foreground-muted italic">Content coming soon</p>
          )}
        </div>

        {/* View link */}
        <Link
          href={`/curriculum/${curriculumId}/${subject.id}`}
          className="flex items-center justify-between pt-2 border-t border-border/40 group/link"
        >
          <span className="text-xs font-medium text-foreground-muted group-hover/link:text-foreground transition-colors">
            Open subject
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-foreground-muted group-hover/link:text-primary group-hover/link:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}

function GroupedSubjectCard({
  group,
  onEnrollToggle,
  curriculumId,
}: {
  group: GroupedSubject<SubjectWithProgress>;
  onEnrollToggle: (s: SubjectWithProgress) => void;
  curriculumId: string;
}) {
  if (!group.isVirtual) {
    return <SubjectCard subject={group.units[0]} onEnrollToggle={onEnrollToggle} curriculumId={curriculumId} />;
  }

  const allEnrolled = group.units.every((u) => u.isEnrolled);
  const anyEnrolled = group.units.some((u) => u.isEnrolled);

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border/60 bg-background-card overflow-hidden',
        'hover:border-border-hover hover:shadow-md transition-all duration-200'
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-amber-500" />
      <div className="p-4 ml-1 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                Edexcel IAL Group
              </span>
              {anyEnrolled && (
                <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {allEnrolled ? 'All Enrolled' : 'Partially Enrolled'}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug">{group.title}</h3>
          </div>
        </div>

        {/* Units List */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Units / Papers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.units.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/40 bg-background-secondary/50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate" title={unit.title}>{unit.title}</p>
                  <p className="text-[10px] text-foreground-muted font-mono">{unit.code}</p>
                </div>
                <button
                  onClick={() => onEnrollToggle(unit)}
                  className={cn(
                    'shrink-0 flex items-center justify-center h-7 w-7 rounded-md border transition-colors',
                    unit.isEnrolled
                      ? 'border-error/30 text-error hover:bg-error/10'
                      : 'border-primary/30 text-primary hover:bg-primary/10'
                  )}
                  title={unit.isEnrolled ? 'Leave' : 'Enroll'}
                >
                  {unit.isEnrolled ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubjectSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background-card p-4 ml-1 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-4 w-12 rounded bg-foreground-muted/10" />
        <div className="h-4 w-28 rounded bg-foreground-muted/15" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-foreground-muted/10" />
        <div className="h-3 w-3/4 rounded bg-foreground-muted/10" />
      </div>
    </div>
  );
}

export default function CurriculumSubjectListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams<{ curriculumId: string }>();
  const curriculumId = params.curriculumId;

  const [subjects, setSubjects] = useState<SubjectWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const boardInfo = CURRICULUM_LABELS[curriculumId];

  const load = async () => {
    if (!user) {
      setSubjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getSubjectsByCurriculum(curriculumId, user.id);
    setSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [user, authLoading, curriculumId]);

  const handleEnrollToggle = async (subject: SubjectWithProgress) => {
    if (!user) return;
    const nextEnrolled = !subject.isEnrolled;

    // 1. Instant optimistic update — no page reload, no skeletons
    setSubjects((prev) =>
      prev.map((s) => (s.id === subject.id ? { ...s, isEnrolled: nextEnrolled } : s))
    );

    // 2. Persist in background
    try {
      if (!nextEnrolled) {
        await unenrollFromSubject(user.id, subject.id);
      } else {
        await enrollInSubject(user.id, curriculumId, subject.id);
      }
    } catch (err) {
      console.error('[curriculum] Failed to toggle enrollment:', err);
      // Rollback on network failure
      setSubjects((prev) =>
        prev.map((s) => (s.id === subject.id ? { ...s, isEnrolled: !nextEnrolled } : s))
      );
    }
  };

  const enrolled = subjects.filter((s) => s.isEnrolled);
  const unenrolled = subjects.filter((s) => !s.isEnrolled);

  const groupedEnrolled = groupEdexcelIalSubjects(enrolled);
  const groupedUnenrolled = groupEdexcelIalSubjects(unenrolled);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Breadcrumb */}
        <Link href="/curriculum" className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors group w-fit">
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          All Curricula
        </Link>

        {/* Header */}
        <div className="space-y-1">
          {boardInfo && (
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted uppercase tracking-widest">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              {boardInfo.code}
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {boardInfo?.label ?? 'Subjects'}
          </h1>
          <p className="text-foreground-muted text-sm">
            {loading ? '...' : `${subjects.length} subject${subjects.length !== 1 ? 's' : ''} available`}
            {!loading && enrolled.length > 0 && ` · ${enrolled.length} enrolled`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SubjectSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-6">
            {enrolled.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  My Subjects ({enrolled.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {groupedEnrolled.map((g) => (
                    <GroupedSubjectCard key={g.id} group={g} onEnrollToggle={handleEnrollToggle} curriculumId={curriculumId} />
                  ))}
                </div>
              </section>
            )}

            {unenrolled.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-widest flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Available ({unenrolled.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {groupedUnenrolled.map((g) => (
                    <GroupedSubjectCard key={g.id} group={g} onEnrollToggle={handleEnrollToggle} curriculumId={curriculumId} />
                  ))}
                </div>
              </section>
            )}

            {subjects.length === 0 && (
              <div className="text-center py-16 text-foreground-muted">
                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No subjects found for this curriculum.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
