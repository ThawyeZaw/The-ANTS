'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, GraduationCap, ArrowRight, Plus, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMySubjectsHub, type HubSubject } from '@/actions/curriculum';
import { groupEdexcelIalSubjects } from '@/lib/edexcel-ial';
import { formatExamDateTime } from '@/lib/exam-datetime';
import { cn } from '@/lib/utils';

// ── Mini dual progress bar ────────────────────────────────────────────────────
function MiniProgress({
  label,
  value,
  total,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (total === 0) return null;
  const pct = Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="h-3 w-3 shrink-0 text-foreground-muted" />
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-foreground-muted tabular-nums shrink-0">
        {value}/{total}
      </span>
    </div>
  );
}

// ── Single subject card ───────────────────────────────────────────────────────
function SubjectCard({ subject }: { subject: HubSubject }) {
  const router = useRouter();
  const color = subject.color_code ?? '#d97706';
  const nextDate = subject.nextExamDate ? formatExamDateTime(subject.nextExamDate) : null;
  const href = `/curriculum/${subject.curriculum_id}/${subject.id}`;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(href); }}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-background-card p-4 hover:border-border-hover hover:shadow-md shadow-xs transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* left accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: color }} />

      <div className="pl-2">
        {/* header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {subject.code}
              </span>
              <span className="text-[10px] text-foreground-muted">{subject.curriculum_name}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
              {subject.name}
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-primary shrink-0 transition-colors mt-0.5 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* progress bars */}
        {(subject.topicCount > 0 || subject.paperCount > 0) && (
          <div className="mt-2 space-y-1.5">
            <MiniProgress
              label="Topics"
              value={subject.completedTopics}
              total={subject.topicCount}
              color={color}
              icon={GraduationCap}
            />
            <MiniProgress
              label="Papers"
              value={subject.completedPapers}
              total={subject.paperCount}
              color={color}
              icon={BookOpen}
            />
          </div>
        )}

        {/* next exam */}
        {nextDate && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground-muted">
            <Clock className="h-3 w-3 text-primary shrink-0" />
            <span>Next: {nextDate}{subject.nextExamTitle ? ` · ${subject.nextExamTitle}` : ''}</span>
          </div>
        )}
      </div>

      {/* quick action — stops propagation so the card nav doesn't fire */}
      <div className="pl-2 pt-2 border-t border-border/40 flex items-center gap-2">
        <Link
          href={`/past-papers?subject=${subject.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <BookOpen className="h-3 w-3" /> Papers
        </Link>
        <span className="text-[10px] text-foreground-muted">Progress tracked</span>
      </div>
    </div>
  );
}

// ── IAL group card ────────────────────────────────────────────────────────────
function IalGroupCard({ group }: { group: ReturnType<typeof groupEdexcelIalSubjects>[number] }) {
  if (group.isVirtual === false) return null; // handled by SubjectCard
  const curriculumId = group.curriculum_id ?? 'curr-edexcel-ial';
  return (
    <Link
      href={`/curriculum/${curriculumId}/${group.primarySubjectId}`}
      className="relative flex flex-col gap-3 rounded-2xl border border-border bg-background-card p-4 hover:border-amber-500/40 transition-all overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-amber-500" />
      <div className="pl-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
              {group.code}
            </span>
            <h3 className="text-sm font-semibold text-foreground mt-1">{group.title}</h3>
          </div>
          <GraduationCap className="h-4 w-4 text-amber-500 shrink-0" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {group.units.map((unit) => (
            <span
              key={unit.id}
              className="inline-flex items-center rounded-lg bg-background-secondary px-2 py-1 text-[10px] font-mono font-medium text-foreground"
              title={unit.title}
            >
              {unit.code}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function DashboardSubjectsPanel() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<HubSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMySubjectsHub(user.id).then((res) => {
      setSubjects(res.subjects);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-background-card p-6 shadow-xs animate-pulse">
        <div className="h-5 w-32 bg-border rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-background-secondary rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-background-card p-8 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-background-secondary border border-border flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-foreground-muted" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No subjects enrolled yet</p>
          <p className="text-xs text-foreground-muted mt-1 max-w-xs leading-relaxed">
            Enroll in subjects to track your progress and access quick links here.
          </p>
        </div>
        <Link href="/curriculum" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
          <Plus className="h-3.5 w-3.5" />
          Explore Curriculum
        </Link>
      </div>
    );
  }

  const groups = groupEdexcelIalSubjects(subjects);

  return (
    <div className="rounded-3xl border border-border bg-background-card p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-4 w-4 text-primary" />
          </span>
          My Subjects
          <span className="text-xs font-normal text-foreground-muted ml-1">({groups.length})</span>
        </h2>
        <Link
          href="/curriculum"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groups.map((group) => {
          if (!group.isVirtual) {
            return <SubjectCard key={group.units[0].id} subject={group.units[0]} />;
          }
          return <IalGroupCard key={group.id} group={group} />;
        })}
      </div>
    </div>
  );
}
