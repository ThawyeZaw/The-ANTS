'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ExamsLibraryBrowser
// Browse approved exam entries by board. Add to countdown with optional
// date override. Smart filter for enrolled courses.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import {
  Search, Filter, Clock, Globe, Sparkles,
  Calendar, ChevronRight, FlaskConical, Check,
  BookMarked, CalendarDays, Layers,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCountdown } from '@/hooks/useCountdown';
import {
  getLibraryExams, getExamsByEnrolledCourses,
  getUserCountdowns,
} from '@/lib/mock/database';
import { QUALIFICATION_REGISTRY } from '@/constants/qualifications';
import { cn } from '@/lib/utils';
import type { Exam } from '@/types';
import { AddCountdownModal } from '@/components/countdown/AddCountdownModal';

// ── Exam Card ─────────────────────────────────────────────────────────────────

interface ExamCardProps {
  exam: Exam;
  isTracking: boolean;
  onAdd: (exam: Exam) => void;
}

function ExamCard({ exam, isTracking, onAdd }: ExamCardProps) {
  const board = exam.exam_board;
  const qualKey = board && exam.qualification
    ? `${board}_${exam.qualification}` as keyof typeof QUALIFICATION_REGISTRY
    : null;
  const qualMeta = qualKey && QUALIFICATION_REGISTRY[qualKey] ? QUALIFICATION_REGISTRY[qualKey] : null;

  const dateType = exam.date_type ?? 'fixed';
  const examDate = new Date(exam.exam_date);
  const daysUntil = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPast = daysUntil < 0;

  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl border bg-[var(--background-card)] p-5 transition-all duration-300',
      'hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 hover:border-[var(--primary)]/30',
      isTracking ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5' : 'border-[var(--border)]'
    )}>
      {isTracking && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
          <Check size={10} />
          Tracking
        </div>
      )}

      {/* Board + date type badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {qualMeta ? (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', qualMeta.colorClass)}>
            {qualMeta.boardCode} · {exam.qualification}
          </span>
        ) : (
          board && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">
              {board}
            </span>
          )
        )}
        {exam.syllabus_code && (
          <span className="text-[10px] font-mono bg-[var(--background-secondary)] text-[var(--foreground-muted)] px-2 py-0.5 rounded-md border border-[var(--border)]">
            {exam.syllabus_code}
          </span>
        )}
        <span className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full',
          dateType === 'fixed'
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        )}>
          {dateType === 'fixed' ? '📅 Fixed date' : '📆 Custom date'}
        </span>
      </div>

      {/* Exam title */}
      <h3 className="text-base font-bold text-[var(--foreground)] mb-1 leading-tight line-clamp-2">
        {exam.title}
      </h3>

      {/* Paper code + series */}
      <div className="flex flex-wrap gap-3 text-xs text-[var(--foreground-muted)] mb-4">
        {exam.paper_code && (
          <span className="flex items-center gap-1">
            <Layers size={11} />
            {exam.paper_code}
          </span>
        )}
        {exam.exam_series && (
          <span className="flex items-center gap-1">
            <CalendarDays size={11} />
            {exam.exam_series}
          </span>
        )}
      </div>

      {/* Date display */}
      <div className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2 mb-4 text-sm',
        isPast
          ? 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
          : daysUntil <= 30
            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
            : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'
      )}>
        <Calendar size={14} className="shrink-0" />
        <div>
          <p className="font-semibold">{examDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="text-xs opacity-75">
            {isPast ? 'Past' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`}
          </p>
        </div>
      </div>

      <button
        id={`add-exam-${exam.id}`}
        onClick={() => onAdd(exam)}
        disabled={isTracking}
        className={cn(
          'mt-auto w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
          isTracking
            ? 'bg-[var(--primary)]/10 text-[var(--primary)] cursor-default'
            : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)] cursor-pointer'
        )}
      >
        {isTracking ? (
          <><Check size={15} /> Added to Countdowns</>
        ) : (
          <>
            <Clock size={15} />
            Add to My Countdowns
            <ChevronRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ExamsLibraryBrowser() {
  const { user } = useAuth();

  const [smartFilter, setSmartFilter] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [selectedQual, setSelectedQual] = useState<string>('all');
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);

  const { createCountdown } = useCountdown(user?.id);

  // Get tracked exam IDs
  const trackedExamIds = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(getUserCountdowns(user.id).map(c => c.exam_id).filter(Boolean) as string[]);
  }, [user]);

  // Library exams
  const libraryExams = useMemo(() => {
    if (!user) return getLibraryExams();
    return smartFilter ? getExamsByEnrolledCourses(user.id) : getLibraryExams();
  }, [user, smartFilter]);

  // Filter
  const filteredExams = useMemo(() => {
    let list = libraryExams;
    if (selectedBoard !== 'all') list = list.filter(e => e.exam_board === selectedBoard);
    if (selectedQual !== 'all') list = list.filter(e => e.qualification === selectedQual);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.exam_board?.toLowerCase().includes(q) ||
        e.qualification?.toLowerCase().includes(q) ||
        e.syllabus_code?.toLowerCase().includes(q) ||
        e.paper_code?.toLowerCase().includes(q) ||
        e.exam_series?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [libraryExams, selectedBoard, selectedQual, searchQuery]);

  const allExams = getLibraryExams();
  const allBoards = useMemo(() => [...new Set(allExams.map(e => e.exam_board).filter(Boolean))], [allExams]);
  const allQuals = useMemo(() => [...new Set(allExams.map(e => e.qualification).filter(Boolean))], [allExams]);

  const handleAdd = (exam: Exam) => {
    // For custom date_type, show the modal to let user pick a date
    // For fixed, pre-fill but still allow override via modal
    setPendingExam(exam);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 p-6 md:p-8">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <BookMarked size={12} /> Official Exam Dates · Contributor-verified
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Exams Library
          </h1>
          <p className="max-w-xl text-sm md:text-base text-[var(--foreground-secondary)]">
            Browse official exam dates and papers by board. Fixed-date exams (IGCSE, A Level) have pre-filled dates — you can still override them. IELTS and OSSD require you to pick your personal date.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            id="smart-filter-exams"
            onClick={() => setSmartFilter(!smartFilter)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer shrink-0',
              smartFilter
                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
                : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)]'
            )}
          >
            {smartFilter ? <Sparkles size={14} /> : <Globe size={14} />}
            {smartFilter ? 'For My Courses' : 'Browse All'}
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
            <input
              id="exams-library-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by subject, code, series…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-[var(--foreground-muted)]" />
          <select
            id="board-filter-exams"
            value={selectedBoard}
            onChange={e => setSelectedBoard(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Boards</option>
            {allBoards.map(b => <option key={b} value={b!}>{b}</option>)}
          </select>
          <select
            id="qual-filter-exams"
            value={selectedQual}
            onChange={e => setSelectedQual(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Qualifications</option>
            {allQuals.map(q => <option key={q} value={q!}>{q}</option>)}
          </select>
          <span className="text-xs text-[var(--foreground-muted)] ml-1">
            {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map(exam => (
            <ExamCard
              key={exam.id}
              exam={exam}
              isTracking={trackedExamIds.has(exam.id)}
              onAdd={handleAdd}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
            <FlaskConical size={28} />
          </div>
          <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">No exams found</h3>
          <p className="mb-4 text-sm text-[var(--foreground-secondary)]">
            {smartFilter ? 'No exams match your enrolled boards. Try "Browse All".' : 'Try adjusting your filters.'}
          </p>
          <button
            onClick={() => { setSmartFilter(false); setSelectedBoard('all'); setSelectedQual('all'); setSearchQuery(''); }}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
          >
            Browse All Exams
          </button>
        </div>
      )}

      {/* Add Countdown Modal */}
      {pendingExam && (
        <AddCountdownModal
          isOpen={true}
          onClose={() => setPendingExam(null)}
          availableExams={[pendingExam]}
          onCreate={(data) => {
            createCountdown(data);
            setPendingExam(null);
          }}
          prefilledExam={pendingExam}
        />
      )}
    </div>
  );
}
