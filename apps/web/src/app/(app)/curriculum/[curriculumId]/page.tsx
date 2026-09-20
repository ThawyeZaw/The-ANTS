'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Curriculum Subject List
// Route: /curriculum/[curriculumId]
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, BookOpen, ClipboardCheck, CheckCircle2,
  BarChart3, Plus, Minus, GraduationCap, Layers, Check, Settings2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getSubjectsByCurriculum,
  enrollInSubject,
  unenrollFromSubject,
  enrollSubjectUnits,
  unenrollSubjectUnits,
  getUserCashInEnrollments,
  type SubjectWithProgress,
  type UserCashInEnrollmentRow,
} from '@/actions/curriculum';
import { cn } from '@/lib/utils';
import { groupEdexcelIalSubjects, type GroupedSubject } from '@/lib/edexcel-ial';
import { IalOptionalUnitsModal } from '@/components/curriculum/IalOptionalUnitsModal';

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
              'shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors',
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
  curriculumId,
  onGroupEnroll,
  onGroupLeave,
  onOpenModal,
}: {
  group: GroupedSubject<SubjectWithProgress>;
  curriculumId: string;
  onGroupEnroll: (g: GroupedSubject<SubjectWithProgress>) => void;
  onGroupLeave: (g: GroupedSubject<SubjectWithProgress>) => void;
  onOpenModal: (g: GroupedSubject<SubjectWithProgress>) => void;
}) {
  const color = group.color_code || '#f59e0b';
  const isEnrolled = group.isEnrolled;

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border/60 bg-background-card overflow-hidden',
        'hover:border-border-hover hover:shadow-md transition-all duration-200'
      )}
    >
      {/* Aesthetic accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: color }} />

      <div className="p-5 ml-1 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {group.code && (
                <span
                  className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${color}15`,
                    color,
                    borderColor: `${color}30`,
                  }}
                >
                  {group.code}
                </span>
              )}
              {group.hasOptionalUnits && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Modular · Optional Units
                </span>
              )}
              {isEnrolled && (
                <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {group.hasOptionalUnits
                    ? `Enrolled (${group.enrolledUnitsCount} units)`
                    : 'Enrolled'}
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-foreground mt-1.5 leading-snug">{group.title}</h3>
            {group.description && (
              <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{group.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex items-center gap-2">
            {!isEnrolled ? (
              group.hasOptionalUnits ? (
                <button
                  type="button"
                  onClick={() => onOpenModal(group)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all shadow-xs"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Choose Units &amp; Enroll
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onGroupEnroll(group)}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Enroll
                </button>
              )
            ) : (
              <div className="flex items-center gap-1.5">
                {group.hasOptionalUnits && (
                  <button
                    type="button"
                    onClick={() => onOpenModal(group)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:border-border-hover text-foreground-muted hover:text-foreground bg-background-secondary/50 transition-colors"
                    title="Change unit selection"
                  >
                    <Settings2 className="h-3 w-3" />
                    Configure
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onGroupLeave(group)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/10 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                  Leave
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Aggregated Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <span className="text-[10px] text-foreground-muted flex items-center gap-1">
              <ClipboardCheck className="h-3 w-3" /> Topics Completed
            </span>
            <ProgressBar value={group.completedTopics} total={group.topicCount} color={color} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-foreground-muted flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Past Papers Practiced
            </span>
            <ProgressBar value={group.completedPapers} total={group.paperCount} color={color} />
          </div>
        </div>

        {/* Units Chips */}
        {group.units.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Units ({group.units.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.units.map((unit) => {
                const isUnitEnrolled = unit.isEnrolled;
                return (
                  <Link
                    key={unit.id}
                    href={`/curriculum/${curriculumId}/${unit.id}`}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all',
                      isUnitEnrolled
                        ? 'border-primary/40 bg-primary/10 text-foreground font-semibold shadow-xs'
                        : 'border-border/60 bg-background-secondary/40 text-foreground-muted hover:border-border hover:text-foreground'
                    )}
                  >
                    {isUnitEnrolled && <Check className="h-3 w-3 text-primary stroke-[3]" />}
                    <span>{unit.title ?? unit.name}</span>
                    <span className="font-mono text-[10px] text-foreground-muted">({unit.code})</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Link */}
        <Link
          href={`/curriculum/${curriculumId}/${group.primarySubjectId}`}
          className="flex items-center justify-between pt-3 border-t border-border/40 group/link"
        >
          <span className="text-xs font-medium text-foreground-muted group-hover/link:text-foreground transition-colors">
            Open subject workspace
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-foreground-muted group-hover/link:text-primary group-hover/link:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}

function SubjectSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background-card p-5 ml-1 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-foreground-muted/10" />
          <div className="h-5 w-40 rounded bg-foreground-muted/15" />
        </div>
        <div className="h-8 w-20 rounded bg-foreground-muted/10" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-foreground-muted/10" />
        <div className="h-3 w-3/4 rounded bg-foreground-muted/10" />
      </div>
    </div>
  );
}

export default function CurriculumSubjectListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ curriculumId: string }>();
  const curriculumId = params.curriculumId;

  const [subjects, setSubjects] = useState<SubjectWithProgress[]>([]);
  const [cashInEnrollments, setCashInEnrollments] = useState<UserCashInEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalGroup, setModalGroup] = useState<GroupedSubject<SubjectWithProgress> | null>(null);

  const boardInfo = CURRICULUM_LABELS[curriculumId];
  const isEdexcelIal = curriculumId === 'curr-edexcel-ial';

  const load = async () => {
    setLoading(true);
    const [data, cashIns] = await Promise.all([
      getSubjectsByCurriculum(curriculumId, user?.id),
      user?.id && isEdexcelIal ? getUserCashInEnrollments(user.id) : Promise.resolve([]),
    ]);
    setSubjects(data);
    setCashInEnrollments(cashIns);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [user?.id, authLoading, curriculumId]);

  // Group all subjects first
  const allGrouped = useMemo(() => groupEdexcelIalSubjects(subjects), [subjects]);
  const enrolledGroups = useMemo(() => allGrouped.filter((g) => g.isEnrolled), [allGrouped]);
  const unenrolledGroups = useMemo(() => allGrouped.filter((g) => !g.isEnrolled), [allGrouped]);

  // Standard 1-to-1 toggle for non-IAL linear subjects
  const handleSingleSubjectEnrollToggle = async (subject: SubjectWithProgress) => {
    if (!user) {
      router.push('/login');
      return;
    }
    const nextEnrolled = !subject.isEnrolled;

    setSubjects((prev) =>
      prev.map((s) => (s.id === subject.id ? { ...s, isEnrolled: nextEnrolled } : s))
    );

    try {
      if (!nextEnrolled) {
        await unenrollFromSubject(user.id, subject.id);
      } else {
        await enrollInSubject(user.id, curriculumId, subject.id);
      }
    } catch (err) {
      console.error('[curriculum] Failed to toggle enrollment:', err);
      setSubjects((prev) =>
        prev.map((s) => (s.id === subject.id ? { ...s, isEnrolled: !nextEnrolled } : s))
      );
    }
  };

  // Group-level enroll for standard subjects
  const handleGroupEnroll = async (group: GroupedSubject<SubjectWithProgress>) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (group.hasOptionalUnits) {
      setModalGroup(group);
      return;
    }

    const unitIds = group.units.map((u) => u.id);
    const idSet = new Set(unitIds);

    // Optimistic update
    setSubjects((prev) =>
      prev.map((s) => (idSet.has(s.id) ? { ...s, isEnrolled: true } : s))
    );

    try {
      await enrollSubjectUnits(user.id, curriculumId, unitIds);
    } catch (err) {
      console.error('[curriculum] Failed to enroll subject units:', err);
      setSubjects((prev) =>
        prev.map((s) => (idSet.has(s.id) ? { ...s, isEnrolled: false } : s))
      );
    }
  };

  // Group-level leave for both standard and modular subjects
  const handleGroupLeave = async (group: GroupedSubject<SubjectWithProgress>) => {
    if (!user) return;
    const enrolledUnits = group.units.filter((u) => u.isEnrolled);
    const unitIds = enrolledUnits.map((u) => u.id);
    if (unitIds.length === 0) return;

    const idSet = new Set(unitIds);

    // Optimistic update
    setSubjects((prev) =>
      prev.map((s) => (idSet.has(s.id) ? { ...s, isEnrolled: false } : s))
    );

    try {
      await unenrollSubjectUnits(user.id, unitIds);
      if (group.hasOptionalUnits) {
        const cashIns = await getUserCashInEnrollments(user.id);
        setCashInEnrollments(cashIns);
      }
    } catch (err) {
      console.error('[curriculum] Failed to leave subject units:', err);
      setSubjects((prev) =>
        prev.map((s) => (idSet.has(s.id) ? { ...s, isEnrolled: true } : s))
      );
    }
  };

  const handleOpenModal = (group: GroupedSubject<SubjectWithProgress>) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setModalGroup(group);
  };

  const handleModalSuccess = (cashInCode: string, awardLevel: string, selectedUnits: string[]) => {
    if (!modalGroup) return;

    const selectedSet = new Set(selectedUnits);
    const groupUnitIds = new Set(modalGroup.units.map((u) => u.id));

    setSubjects((prev) =>
      prev.map((s) => {
        if (!groupUnitIds.has(s.id)) return s;
        const shouldBeEnrolled = selectedSet.has(s.code);
        return s.isEnrolled !== shouldBeEnrolled ? { ...s, isEnrolled: shouldBeEnrolled } : s;
      })
    );

    setCashInEnrollments((prev) => {
      const filtered = prev.filter((r) => r.cash_in_code !== cashInCode);
      return [
        ...filtered,
        {
          id: 'temp-' + Date.now(),
          cash_in_code: cashInCode,
          award_level: awardLevel,
          selected_units: selectedUnits,
          applied_pair: null,
        },
      ];
    });
  };

  // Find existing cash-in enrollment for modalGroup if applicable
  const activeCashIn = useMemo(() => {
    if (!modalGroup) return null;
    const isFm = modalGroup.title.toLowerCase().includes('further');
    const validCodes = isFm ? ['YFM01', 'XFM01'] : ['YMA01', 'XMA01'];
    return cashInEnrollments.find((c) => validCodes.includes(c.cash_in_code)) ?? null;
  }, [modalGroup, cashInEnrollments]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Breadcrumb */}
        <Link
          href="/curriculum"
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors group w-fit"
        >
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
            {loading
              ? '...'
              : `${allGrouped.length} subject${allGrouped.length !== 1 ? 's' : ''} available`}
            {!loading && enrolledGroups.length > 0 && ` · ${enrolledGroups.length} enrolled`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SubjectSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-6">
            {/* My Subjects */}
            {enrolledGroups.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  My Subjects ({enrolledGroups.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {enrolledGroups.map((g) =>
                    !g.isVirtual ? (
                      <SubjectCard
                        key={g.id}
                        subject={g.units[0]}
                        onEnrollToggle={handleSingleSubjectEnrollToggle}
                        curriculumId={curriculumId}
                      />
                    ) : (
                      <GroupedSubjectCard
                        key={g.id}
                        group={g}
                        curriculumId={curriculumId}
                        onGroupEnroll={handleGroupEnroll}
                        onGroupLeave={handleGroupLeave}
                        onOpenModal={handleOpenModal}
                      />
                    )
                  )}
                </div>
              </section>
            )}

            {/* Available Subjects */}
            {unenrolledGroups.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-widest flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Available ({unenrolledGroups.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {unenrolledGroups.map((g) =>
                    !g.isVirtual ? (
                      <SubjectCard
                        key={g.id}
                        subject={g.units[0]}
                        onEnrollToggle={handleSingleSubjectEnrollToggle}
                        curriculumId={curriculumId}
                      />
                    ) : (
                      <GroupedSubjectCard
                        key={g.id}
                        group={g}
                        curriculumId={curriculumId}
                        onGroupEnroll={handleGroupEnroll}
                        onGroupLeave={handleGroupLeave}
                        onOpenModal={handleOpenModal}
                      />
                    )
                  )}
                </div>
              </section>
            )}

            {allGrouped.length === 0 && (
              <div className="text-center py-16 text-foreground-muted">
                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No subjects found for this curriculum.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optional Units Selection Modal */}
      {modalGroup && user && (
        <IalOptionalUnitsModal
          isOpen={Boolean(modalGroup)}
          onClose={() => setModalGroup(null)}
          userId={user.id}
          subjectTitle={modalGroup.title}
          initialAwardCode={activeCashIn?.cash_in_code}
          initialSelectedUnits={activeCashIn?.selected_units}
          availableUnits={modalGroup.units.map((u) => ({
            id: u.id,
            code: u.code,
            title: u.title ?? u.name,
          }))}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

