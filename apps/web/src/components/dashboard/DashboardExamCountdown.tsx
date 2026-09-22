'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — DashboardExamCountdown
// Compact, high-polish academic timetable schedule list for the Student Dashboard.
// Prioritizes enrolled subjects with chronological ordering and JetBrains Mono metrics.
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCountdown, type CountdownWithTime } from '@/hooks/useCountdown';
import { useLessonContext } from '@/context/LessonContext';
import { formatExamDateTime } from '@/lib/exam-datetime';
import { cn } from '@/lib/utils';

function formatDaysBadge(days: number, isPast: boolean): { text: string; urgent: 'critical' | 'warning' | 'normal' } {
  if (isPast) return { text: 'Past', urgent: 'normal' };
  if (days === 0) return { text: 'Today', urgent: 'critical' };
  if (days === 1) return { text: 'Tomorrow', urgent: 'critical' };
  if (days <= 7) return { text: `${days}d left`, urgent: 'critical' };
  if (days <= 30) return { text: `${days}d left`, urgent: 'warning' };
  return { text: `${days}d left`, urgent: 'normal' };
}

function parseMonthDay(dateVal: Date | string | number | null): { month: string; day: string; timeStr: string } {
  if (!dateVal) return { month: '—', day: '—', timeStr: '' };
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(d.getTime())) return { month: '—', day: '—', timeStr: '' };

  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const session = hours < 12 ? 'AM' : 'PM';
  const timeStr = `${hours % 12 || 12}:${mins} ${session}`;

  return { month, day, timeStr };
}

interface TimetableItemProps {
  item: CountdownWithTime;
  isEnrolled: boolean;
  onClick: () => void;
}

function TimetableItem({ item, isEnrolled, onClick }: TimetableItemProps) {
  const targetDate = item.exam_date || item.target_date || null;
  const { month, day, timeStr } = parseMonthDay(targetDate);
  const badge = formatDaysBadge(item.timeLeft.days, item.timeLeft.isPast);

  const title = item.custom_title || item.title || item.paper_name || 'Upcoming Exam';
  const paperCode = item.paper_name || null;
  const board = item.exam_board || item.qualification_group || 'Official';
  const color = item.color_code || '#f59e0b';

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
          ? 'border-red-500/30 hover:border-red-500/60 bg-red-500/[0.02] shadow-xs'
          : badge.urgent === 'warning'
            ? 'border-amber-500/30 hover:border-amber-500/60 bg-amber-500/[0.02] shadow-xs'
            : 'border-border hover:border-primary/40 hover:shadow-sm'
      )}
    >
      {/* Subject accent left stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all group-hover:w-1.5"
        style={{ backgroundColor: color }}
      />

      {/* Date badge */}
      <div className="flex flex-col items-center justify-center rounded-xl bg-background-secondary border border-border/70 w-12 h-12 shrink-0 text-center select-none ml-1">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-foreground-muted leading-none">
          {month}
        </span>
        <span className="text-base font-black font-mono tabular-nums text-foreground leading-tight mt-0.5">
          {day}
        </span>
      </div>

      {/* Subject & paper details */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
            {board}
          </span>
          {paperCode && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {paperCode}
            </span>
          )}
          {item.target_grade && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
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
            <span>{timeStr}</span>
          </p>
        )}
      </div>

      {/* Days remaining badge */}
      <div className="shrink-0 text-right">
        <div
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-mono font-bold tabular-nums border',
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
      </div>
    </div>
  );
}

export function DashboardExamCountdown() {
  const router = useRouter();
  const { user } = useAuth();
  const { countdowns, isLoading: countdownsLoading } = useCountdown(user?.id);
  const { enrolledSubjectIds, isLoading: contextLoading } = useLessonContext();

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
      return enrolledCountdowns;
    }
    return activeCountdowns;
  }, [activeTab, enrolledCountdowns, activeCountdowns]);

  const hasEnrolledSubjects = enrolledSubjectIds.length > 0;
  const isLoading = countdownsLoading || contextLoading;

  const handleOpenManager = () => {
    router.push('/countdown');
  };

  return (
    <div className="rounded-3xl border border-border bg-background-card p-5 sm:p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground leading-none">
              Exam Timetable
            </h3>
            <span className="text-[10px] text-foreground-muted">
              Official sitting countdowns
            </span>
          </div>
        </div>

        <Link
          href="/countdown"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Manage All <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Tabs / Filter: Enrolled vs All */}
      {hasEnrolledSubjects && otherCountdowns.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-xl border border-border/60 mb-3 text-xs">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={cn(
              'flex-1 py-1 px-2 rounded-lg font-semibold transition-all text-center',
              activeTab === 'enrolled'
                ? 'bg-background-card text-foreground shadow-xs font-bold'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            My Subjects ({enrolledCountdowns.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex-1 py-1 px-2 rounded-lg font-semibold transition-all text-center',
              activeTab === 'all'
                ? 'bg-background-card text-foreground shadow-xs font-bold'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            All Exams ({activeCountdowns.length})
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="space-y-2.5 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-background-secondary/70 border border-border animate-pulse"
              />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-border bg-background-secondary/40 my-auto">
            <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center mb-2.5 text-foreground-muted">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-foreground">
              {activeTab === 'enrolled' && hasEnrolledSubjects
                ? 'No sittings in this series'
                : 'No exam countdowns active'}
            </h4>
            <p className="text-[11px] text-foreground-muted max-w-xs mt-1 leading-relaxed">
              {activeTab === 'enrolled' && hasEnrolledSubjects
                ? 'Your enrolled subjects may sit in a different exam series (e.g. Summer 2027).'
                : 'Add official exam sittings from the timetable catalog or explore syllabi.'}
            </p>
            {activeTab === 'enrolled' && otherCountdowns.length > 0 ? (
              <button
                onClick={() => setActiveTab('all')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
              >
                View all {activeCountdowns.length} countdowns <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <Link
                href="/countdown?tab=browse"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Browse Timetable <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2 flex-1">
            {displayList.slice(0, 6).map((item) => (
              <TimetableItem
                key={item.id}
                item={item}
                isEnrolled={Boolean(item.subject_id && enrolledSubjectSet.has(item.subject_id))}
                onClick={handleOpenManager}
              />
            ))}

            {displayList.length > 6 && (
              <div className="pt-2 text-center">
                <Link
                  href="/countdown"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  +{displayList.length - 6} more upcoming sittings <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer info pill */}
      <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-foreground-muted">
        <span className="flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5 text-primary" />
          <span>Zone 4 / Myanmar R-Papers</span>
        </span>
        <Link
          href="/countdown"
          className="font-medium hover:text-foreground transition-colors"
        >
          View Calendar →
        </Link>
      </div>
    </div>
  );
}
