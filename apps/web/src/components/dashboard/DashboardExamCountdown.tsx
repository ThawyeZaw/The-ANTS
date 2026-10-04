'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — DashboardExamCountdown
// Premium academic timetable schedule widget for the Student Dashboard.
// Highlights imminent paper with live digital ticker & clean chronological list.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  ExternalLink,
  Calendar,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  Sparkles,
  BookOpen,
  Timer,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCountdown, type CountdownWithTime } from '@/hooks/useCountdown';
import { useLessonContext } from '@/context/LessonContext';
import { formatExamDateTime } from '@/lib/exam-datetime';
import { cn } from '@/lib/utils';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDaysBadge(days: number, isPast: boolean): { text: string; urgent: 'critical' | 'warning' | 'normal' } {
  if (isPast) return { text: 'Past', urgent: 'normal' };
  if (days === 0) return { text: 'Today', urgent: 'critical' };
  if (days === 1) return { text: 'Tomorrow', urgent: 'critical' };
  if (days <= 7) return { text: `${days}d left`, urgent: 'critical' };
  if (days <= 30) return { text: `${days}d left`, urgent: 'warning' };
  return { text: `In ${days}d`, urgent: 'normal' };
}

function parseMonthDayWeekday(dateVal: Date | string | number | null): { month: string; day: string; weekday: string; timeStr: string } {
  if (!dateVal) return { month: '—', day: '—', weekday: '', timeStr: '' };
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(d.getTime())) return { month: '—', day: '—', weekday: '', timeStr: '' };

  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const weekday = d.toLocaleString('en-GB', { weekday: 'short' });
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const session = hours < 12 ? 'AM' : 'PM';
  const timeStr = `${hours % 12 || 12}:${mins} ${session}`;

  return { month, day, weekday, timeStr };
}

interface TimetableItemProps {
  item: CountdownWithTime;
  isEnrolled: boolean;
  onClick: () => void;
}

function TimetableRow({ item, onClick }: TimetableItemProps) {
  const targetDate = item.exam_date || item.target_date || null;
  const { month, day, weekday, timeStr } = parseMonthDayWeekday(targetDate);
  const badge = formatDaysBadge(item.timeLeft.days, item.timeLeft.isPast);

  const title = item.custom_title || item.title || item.paper_name || 'Upcoming Exam';
  const paperCode = item.paper_name || null;
  const rawBoard = (item.exam_board || item.qualification_group || '').toUpperCase();
  const isEdexcel = rawBoard.includes('EDEXCEL') || rawBoard.includes('PEARSON');
  const isCambridge = rawBoard.includes('CAIE') || rawBoard.includes('CAMBRIDGE');
  const boardLabel = isEdexcel ? 'Edexcel' : isCambridge ? 'Cambridge' : (item.exam_board || 'Official');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl border bg-background-card p-3 transition-all duration-200 cursor-pointer overflow-hidden',
        badge.urgent === 'critical'
          ? 'border-red-500/30 hover:border-red-500/60 bg-red-500/[0.02]'
          : badge.urgent === 'warning'
            ? 'border-amber-500/30 hover:border-amber-500/60 bg-amber-500/[0.02]'
            : 'border-border hover:border-primary/40 hover:shadow-xs'
      )}
    >
      {/* Date badge */}
      <div className="flex flex-col items-center justify-center rounded-xl bg-background-secondary border border-border/80 w-12 h-12 shrink-0 text-center select-none">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-foreground-muted leading-none">
          {month}
        </span>
        <span className="text-base font-black font-mono tabular-nums text-foreground leading-tight mt-0.5">
          {day}
        </span>
        <span className="text-[8px] font-semibold text-foreground-muted uppercase leading-none">
          {weekday}
        </span>
      </div>

      {/* Subject & paper details */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span
            className={cn(
              'text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border',
              isEdexcel
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                : isCambridge
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                  : 'bg-background-secondary text-foreground-muted border-border'
            )}
          >
            {boardLabel}
          </span>
          {paperCode && (
            <span className="font-mono text-[10px] font-bold text-foreground bg-background-secondary border border-border/80 px-1.5 py-0.2 rounded">
              {paperCode}
            </span>
          )}
          {item.target_grade && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
              <Sparkles className="w-2.5 h-2.5" /> {item.target_grade}
            </span>
          )}
        </div>

        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
          {title}
        </h4>

        {timeStr && (
          <p className="text-[10px] text-foreground-muted mt-0.5 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 shrink-0" />
            <span>{timeStr} MMT</span>
          </p>
        )}
      </div>

      {/* Days remaining badge */}
      <div className="shrink-0 flex items-center gap-1.5">
        <div
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-mono font-bold tabular-nums border select-none',
            badge.urgent === 'critical'
              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
              : badge.urgent === 'warning'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-background-secondary text-foreground border-border'
          )}
        >
          {badge.urgent === 'critical' && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          )}
          <span>{badge.text}</span>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export function DashboardExamCountdown({
  enrolledSubjectIds: propSubjectIds,
  countdowns: propCountdowns,
  isLoading: propLoading,
  compact = false,
}: {
  enrolledSubjectIds?: string[];
  countdowns?: CountdownWithTime[];
  isLoading?: boolean;
  compact?: boolean;
} = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const fallbackCountdown = useCountdown(propCountdowns ? undefined : user?.id);
  const countdowns = propCountdowns ?? fallbackCountdown.countdowns;
  const countdownsLoading = propLoading !== undefined ? propLoading : fallbackCountdown.isLoading;
  const { enrolledSubjectIds: contextSubjectIds, isLoading: contextLoading } = useLessonContext();
  const enrolledSubjectIds = propSubjectIds ?? contextSubjectIds;

  const [activeTab, setActiveTab] = useState<'enrolled' | 'all'>('enrolled');

  // Filter out past countdowns and sort chronologically
  const activeCountdowns = useMemo(() => {
    return countdowns
      .filter((c) => !c.timeLeft.isPast)
      .sort((a, b) => {
        const dateA = new Date(a.exam_date || a.target_date || 0).getTime();
        const dateB = new Date(b.exam_date || b.target_date || 0).getTime();
        return dateA - dateB;
      });
  }, [countdowns]);

  // Split into enrolled vs other
  const enrolledSubjectSet = useMemo(() => new Set(enrolledSubjectIds), [enrolledSubjectIds]);

  const enrolledCountdowns = useMemo(() => {
    return activeCountdowns.filter((c) => c.subject_id && enrolledSubjectSet.has(c.subject_id));
  }, [activeCountdowns, enrolledSubjectSet]);

  const otherCountdowns = useMemo(() => {
    return activeCountdowns.filter((c) => !c.subject_id || !enrolledSubjectSet.has(c.subject_id));
  }, [activeCountdowns, enrolledSubjectSet]);

  // Display list according to user preference (enrolled prioritized)
  const displayList = useMemo(() => {
    if (activeTab === 'enrolled') {
      return enrolledCountdowns.length > 0 ? enrolledCountdowns : activeCountdowns;
    }
    return activeCountdowns;
  }, [activeTab, enrolledCountdowns, activeCountdowns]);

  const hasEnrolledSubjects = enrolledSubjectIds.length > 0;
  const isLoading = countdownsLoading || contextLoading;

  const handleOpenManager = () => {
    router.push('/countdown');
  };

  // Imminent Next Exam (first item in display list)
  const nextExam = displayList.length > 0 ? displayList[0] : null;
  const subsequentExams = displayList.length > 1 ? displayList.slice(1, compact ? 3 : 5) : [];

  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-background-card shadow-xs flex flex-col',
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 h-full'
      )}
    >
      {/* ── Widget Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Timer className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground leading-tight">
              Exam Countdowns
            </h3>
            <span className="text-[10px] font-medium text-foreground-muted">
              Myanmar Zone 4 Sitting Schedule
            </span>
          </div>
        </div>

        <Link
          href="/countdown"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Manage All <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* ── Segmented Switcher (My Subjects vs All) ──────────────────── */}
      {hasEnrolledSubjects && otherCountdowns.length > 0 && enrolledCountdowns.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-xl border border-border/70 mb-3.5 text-xs">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer',
              activeTab === 'enrolled'
                ? 'bg-background-card text-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            My Subjects ({enrolledCountdowns.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer',
              activeTab === 'all'
                ? 'bg-background-card text-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            All Tracked ({activeCountdowns.length})
          </button>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="h-32 rounded-2xl bg-background-secondary/70 border border-border animate-pulse" />
            <div className="h-14 rounded-2xl bg-background-secondary/60 border border-border animate-pulse" />
            <div className="h-14 rounded-2xl bg-background-secondary/60 border border-border animate-pulse" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-border bg-background-secondary/40 my-auto">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              {activeTab === 'enrolled' && hasEnrolledSubjects
                ? 'No active sittings found'
                : 'No exam countdowns active'}
            </h4>
            <p className="text-xs text-foreground-muted max-w-xs mt-1 leading-relaxed">
              Track Cambridge & Pearson Edexcel official sittings to stay ahead of revision deadlines.
            </p>
            <Link
              href="/countdown?tab=browse"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-2xs"
            >
              Browse Timetable <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {/* ── Imminent Next Exam Spotlight Card ────────────────────── */}
            {nextExam && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleOpenManager}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleOpenManager();
                }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-xs',
                  nextExam.timeLeft.days < 7
                    ? 'border-red-500/40 bg-gradient-to-br from-red-500/[0.04] via-background-card to-background-card hover:border-red-500/70'
                    : nextExam.timeLeft.days < 30
                      ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/[0.04] via-background-card to-background-card hover:border-amber-500/70'
                      : 'border-primary/30 bg-gradient-to-br from-primary/[0.04] via-background-card to-background-card hover:border-primary/60'
                )}
              >
                {/* Header status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    Next Imminent Exam
                  </span>

                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-background-secondary border border-border/80 text-foreground">
                    {nextExam.exam_board || 'Official'}
                  </span>
                </div>

                {/* Exam Title */}
                <h4 className="text-sm font-extrabold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
                  {nextExam.custom_title || nextExam.title || 'Upcoming Paper'}
                </h4>

                {/* Date & Time */}
                <p className="text-[11px] text-foreground-muted mt-1 flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3 text-primary shrink-0" />
                  <span>{formatExamDateTime(nextExam.exam_date || nextExam.target_date)}</span>
                </p>

                {/* Ticking Digital HUD Boxes */}
                <div className="grid grid-cols-4 gap-1.5 text-center mt-3 pt-3 border-t border-border/60">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-background-secondary/80 border border-border/70 py-1.5">
                    <span className="font-mono text-base font-black tabular-nums text-foreground leading-none">
                      {nextExam.timeLeft.days}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-foreground-muted mt-0.5">
                      Days
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-background-secondary/80 border border-border/70 py-1.5">
                    <span className="font-mono text-sm font-bold tabular-nums text-foreground leading-none">
                      {pad(nextExam.timeLeft.hours)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-foreground-muted mt-0.5">
                      Hrs
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-background-secondary/80 border border-border/70 py-1.5">
                    <span className="font-mono text-sm font-bold tabular-nums text-foreground leading-none">
                      {pad(nextExam.timeLeft.minutes)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-foreground-muted mt-0.5">
                      Min
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 border border-primary/20 py-1.5">
                    <span className="font-mono text-sm font-black tabular-nums text-primary leading-none animate-pulse">
                      {pad(nextExam.timeLeft.seconds)}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary mt-0.5">
                      Sec
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Subsequent Upcoming Schedule List ──────────────────── */}
            {subsequentExams.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block px-0.5">
                  Subsequent Sittings
                </span>
                {subsequentExams.map((item) => (
                  <TimetableRow
                    key={item.id}
                    item={item}
                    isEnrolled={Boolean(item.subject_id && enrolledSubjectSet.has(item.subject_id))}
                    onClick={handleOpenManager}
                  />
                ))}
              </div>
            )}

            {displayList.length > 5 && (
              <div className="pt-1 text-center">
                <Link
                  href="/countdown"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  +{displayList.length - 5} more upcoming sittings <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="pt-3.5 mt-3.5 border-t border-border/60 flex items-center justify-between text-[11px] text-foreground-muted">
        <span className="flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5 text-primary" />
          <span>Zone 4 / Myanmar R-Papers</span>
        </span>
        <Link
          href="/countdown"
          className="font-bold text-foreground-secondary hover:text-primary transition-colors flex items-center gap-1"
        >
          View Full Timetable →
        </Link>
      </div>
    </div>
  );
}
