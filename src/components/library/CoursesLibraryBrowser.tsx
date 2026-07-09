'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CoursesLibraryBrowser
// Browse approved curriculum templates, filter by board/qualification.
// Smart mode shows only boards matching user's enrolled courses.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, BookOpen, Star, ChevronRight,
  Sparkles, ScrollText, Check, Users, Layers,
  GraduationCap, Globe, Lock, BookMarked,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useCourseManager } from '@/hooks/useCourseManager';
import { getPublishedCurriculums, getPublicSubjects, autoPopulateLessonTracker, autoPopulateGradeCalculator } from '@/lib/mock/database';
import { QUALIFICATION_REGISTRY, LIVE_QUALIFICATIONS } from '@/constants/qualifications';
import { cn } from '@/lib/utils';
import type { CurriculumSummary } from '@/hooks/useCourseManager';

// ── Course Card ───────────────────────────────────────────────────────────────

interface CourseCardProps {
  curriculum: CurriculumSummary & { subjectCount: number; isEnrolled: boolean };
  onAdd: (id: string) => void;
  isAdding: boolean;
}

function CourseCard({ curriculum, onAdd, isAdding }: CourseCardProps) {
  const qualKey = curriculum.exam_board && curriculum.qualification
    ? `${curriculum.exam_board}_${curriculum.qualification}` as keyof typeof QUALIFICATION_REGISTRY
    : null;
  const qualMeta = qualKey && QUALIFICATION_REGISTRY[qualKey] ? QUALIFICATION_REGISTRY[qualKey] : null;

  const gradingLabel: Record<string, string> = {
    raw_marks_AG: 'A*–G Grades',
    raw_marks_91: '9–1 Grades',
    ums: 'UMS System',
    band: 'Band 0–9',
    percentage: 'Percentage',
    scaled: '145–200 Scale',
  };

  const hierarchyLabel = curriculum.hierarchy_model
    ? `${curriculum.hierarchy_model.level1} → ${curriculum.hierarchy_model.level2} → ${curriculum.hierarchy_model.level3}`
    : 'Subject → Paper → Topic';

  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl border bg-[var(--background-card)] p-5 transition-all duration-300',
      'hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 hover:border-[var(--primary)]/30',
      curriculum.isEnrolled
        ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5'
        : 'border-[var(--border)]'
    )}>
      {/* Enrolled badge */}
      {curriculum.isEnrolled && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
          <Check size={10} />
          Enrolled
        </div>
      )}

      {/* Board + Qualification badge */}
      <div className="flex items-center gap-2 mb-3">
        {qualMeta ? (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', qualMeta.colorClass)}>
            {qualMeta.boardCode} · {qualMeta.shortLabel}
          </span>
        ) : (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">
            {curriculum.exam_board ?? 'General'} · {curriculum.qualification ?? 'Curriculum'}
          </span>
        )}
        {curriculum.syllabus_code && (
          <span className="text-xs font-mono text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-md">
            {curriculum.syllabus_code}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-[var(--foreground)] mb-1 leading-tight">
        {curriculum.title}
      </h3>
      {curriculum.description && (
        <p className="text-xs text-[var(--foreground-secondary)] mb-4 line-clamp-2">
          {curriculum.description}
        </p>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-[var(--foreground-muted)]">
        <span className="flex items-center gap-1">
          <Layers size={12} />
          {curriculum.subjectCount} subject{curriculum.subjectCount !== 1 ? 's' : ''}
        </span>
        {curriculum.grading_system && (
          <span className="flex items-center gap-1">
            <Star size={12} />
            {gradingLabel[curriculum.grading_system] ?? curriculum.grading_system}
          </span>
        )}
        {curriculum.structure_type && (
          <span className="flex items-center gap-1 capitalize">
            <BookOpen size={12} />
            {curriculum.structure_type}
          </span>
        )}
      </div>

      {/* Hierarchy model */}
      <div className="flex items-center gap-1 text-[10px] text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-lg px-2.5 py-1.5 mb-4 font-mono">
        <ScrollText size={11} className="shrink-0" />
        <span>{hierarchyLabel}</span>
      </div>

      {/* Add button */}
      <button
        id={`add-course-${curriculum.id}`}
        onClick={() => onAdd(curriculum.id)}
        disabled={curriculum.isEnrolled || isAdding}
        className={cn(
          'mt-auto w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
          curriculum.isEnrolled
            ? 'bg-[var(--primary)]/10 text-[var(--primary)] cursor-default'
            : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)] cursor-pointer'
        )}
      >
        {curriculum.isEnrolled ? (
          <>
            <Check size={15} />
            Added to My Courses
          </>
        ) : isAdding ? (
          <span className="animate-pulse">Adding…</span>
        ) : (
          <>
            <GraduationCap size={15} />
            Add to My Courses
            <ChevronRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CoursesLibraryBrowser() {
  const { user } = useAuth();
  const { role } = useRole();
  const router = useRouter();
  const { allCurriculums, enrolledCurriculumIds, enroll, getSubjectsForCurriculum } = useCourseManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [selectedQual, setSelectedQual] = useState<string>('all');
  const [smartFilter, setSmartFilter] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Enrich curriculums with subject counts and enrollment status
  const enrichedCurriculums = useMemo(() => {
    return allCurriculums.map(c => {
      const subjects = getSubjectsForCurriculum(c.id);
      return {
        ...c,
        subjectCount: subjects.length,
        isEnrolled: enrolledCurriculumIds.includes(c.id),
      };
    });
  }, [allCurriculums, enrolledCurriculumIds, getSubjectsForCurriculum]);

  // Get enrolled boards for smart filter
  const enrolledBoards = useMemo(() => {
    const enrolledCurriculums = enrichedCurriculums.filter(c => c.isEnrolled);
    return new Set(enrolledCurriculums.map(c => c.exam_board).filter(Boolean));
  }, [enrichedCurriculums]);

  // Filter logic
  const filteredCurriculums = useMemo(() => {
    let list = enrichedCurriculums;

    if (smartFilter && enrolledBoards.size > 0) {
      list = list.filter(c => c.exam_board && enrolledBoards.has(c.exam_board));
    }

    if (selectedBoard !== 'all') {
      list = list.filter(c => c.exam_board === selectedBoard);
    }

    if (selectedQual !== 'all') {
      list = list.filter(c => c.qualification === selectedQual);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.exam_board?.toLowerCase().includes(q) ||
        c.qualification?.toLowerCase().includes(q) ||
        c.syllabus_code?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [enrichedCurriculums, smartFilter, enrolledBoards, selectedBoard, selectedQual, searchQuery]);

  // All unique boards + qualifications for filter dropdowns
  const allBoards = useMemo(() => [...new Set(allCurriculums.map(c => c.exam_board).filter(Boolean))], [allCurriculums]);
  const allQuals = useMemo(() => [...new Set(allCurriculums.map(c => c.qualification).filter(Boolean))], [allCurriculums]);

  const handleAdd = async (curriculumId: string) => {
    if (!user) return;
    setAddingId(curriculumId);
    try {
      // Enroll in all subjects of this curriculum
      const subjects = getSubjectsForCurriculum(curriculumId);
      for (const subject of subjects) {
        enroll(curriculumId, subject.id, null);
      }
      // Auto-populate lesson tracker and grade calculator
      autoPopulateLessonTracker(user.id, curriculumId);
      autoPopulateGradeCalculator(user.id, curriculumId);

      showToast('Course added! Lesson Tracker and Grade Calculator have been populated.', 'success');
      setTimeout(() => router.push('/courses'), 1500);
    } catch {
      showToast('Failed to add course. Please try again.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg animate-slide-in-right',
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          {toast.message}
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-blue-500/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <BookMarked size={12} /> Verified by Contributors
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              Courses Library
            </h1>
            <p className="max-w-xl text-sm md:text-base text-[var(--foreground-secondary)]">
              Browse verified curriculum templates from CAIE, Edexcel, IELTS and more.
              Adding a course automatically populates your Lesson Tracker and Grade Calculator.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">{allCurriculums.length}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Curricula</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">{LIVE_QUALIFICATIONS.length}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Boards</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-4">
        {/* Smart toggle + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Smart filter toggle */}
          <button
            id="smart-filter-toggle"
            onClick={() => setSmartFilter(!smartFilter)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer shrink-0',
              smartFilter
                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
                : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            {smartFilter ? <Sparkles size={14} /> : <Globe size={14} />}
            {smartFilter ? 'For My Courses' : 'Browse All'}
          </button>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
            <input
              id="courses-library-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, board, code…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Board + Qual filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-[var(--foreground-muted)]" />
          <select
            id="board-filter"
            value={selectedBoard}
            onChange={e => setSelectedBoard(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Boards</option>
            {allBoards.map(b => <option key={b} value={b!}>{b}</option>)}
          </select>
          <select
            id="qual-filter"
            value={selectedQual}
            onChange={e => setSelectedQual(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Qualifications</option>
            {allQuals.map(q => <option key={q} value={q!}>{q}</option>)}
          </select>
          <span className="text-xs text-[var(--foreground-muted)] ml-1">
            {filteredCurriculums.length} result{filteredCurriculums.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Qualification guide chips */}
      <div className="flex flex-wrap gap-2">
        {LIVE_QUALIFICATIONS.map(q => (
          <button
            key={q.key}
            onClick={() => {
              setSelectedBoard(q.boardCode);
              setSelectedQual(q.shortLabel);
              setSmartFilter(false);
            }}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer',
              selectedBoard === q.boardCode && selectedQual === q.shortLabel
                ? `${q.colorClass} border-current`
                : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/40'
            )}
          >
            {q.boardCode} · {q.shortLabel}
          </button>
        ))}
        {(selectedBoard !== 'all' || selectedQual !== 'all' || searchQuery) && (
          <button
            onClick={() => { setSelectedBoard('all'); setSelectedQual('all'); setSearchQuery(''); }}
            className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-full border border-dashed border-[var(--border)] transition-all cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filteredCurriculums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCurriculums.map(c => (
            <CourseCard
              key={c.id}
              curriculum={c}
              onAdd={handleAdd}
              isAdding={addingId === c.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
            <BookOpen size={28} />
          </div>
          <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">No curricula found</h3>
          <p className="mb-6 max-w-sm text-sm text-[var(--foreground-secondary)]">
            {smartFilter
              ? 'No library courses match your enrolled boards. Switch to "Browse All" to see everything.'
              : 'No curricula match your current filters. Try clearing some filters.'}
          </p>
          <button
            onClick={() => { setSmartFilter(false); setSelectedBoard('all'); setSelectedQual('all'); setSearchQuery(''); }}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
          >
            Browse All Curricula
          </button>
        </div>
      )}
    </div>
  );
}
