'use client';

import { useState, useMemo } from 'react';
import { Search, X, Brain, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import QuizCard from './QuizCard';
import type { QuizStandaloneOfficial } from '@/types/quiz';

interface QuizLibraryViewProps {
  quizzes: QuizStandaloneOfficial[];
  onTakeQuiz: (quizId: string) => void;
}

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function QuizLibraryView({ quizzes, onTakeQuiz }: QuizLibraryViewProps) {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [curriculumFilter, setCurriculumFilter] = useState('');

  // Collect unique curriculums from quizzes
  const curriculumOptions = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.curriculum_id) set.add(q.curriculum_id);
    });
    return Array.from(set).sort();
  }, [quizzes]);

  // Only show approved quizzes
  const approvedQuizzes = useMemo(
    () => quizzes.filter((q) => q.review_status === 'approved'),
    [quizzes]
  );

  const filtered = useMemo(() => {
    return approvedQuizzes.filter((q) => {
      if (search.trim()) {
        const qLower = search.toLowerCase();
        const titleMatch = q.title.toLowerCase().includes(qLower);
        const descMatch = q.description?.toLowerCase().includes(qLower);
        if (!titleMatch && !descMatch) return false;
      }
      if (difficultyFilter && q.difficulty !== difficultyFilter) return false;
      if (curriculumFilter && q.curriculum_id !== curriculumFilter) return false;
      return true;
    });
  }, [approvedQuizzes, search, difficultyFilter, curriculumFilter]);

  const hasActiveFilters = search || difficultyFilter || curriculumFilter;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Quiz Library</h2>
        <p className="text-sm text-[var(--foreground-secondary)]">
          {approvedQuizzes.length} approved quiz{approvedQuizzes.length !== 1 ? 'zes' : ''} available
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title or subject..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] pl-9 pr-8 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--foreground-muted)]">Difficulty:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setDifficultyFilter('')}
                className={(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ' +
                  (!difficultyFilter
                    ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]')
                )}
              >
                All
              </button>
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(difficultyFilter === d ? '' : d)}
                  className={(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ' +
                    (difficultyFilter === d
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]')
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Curriculum filter */}
          {curriculumOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--foreground-muted)]">Curriculum:</span>
              <select
                value={curriculumFilter}
                onChange={(e) => setCurriculumFilter(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="">All</option>
                {curriculumOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setDifficultyFilter(''); setCurriculumFilter(''); }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
          <BookOpen className="h-14 w-14 text-[var(--foreground-muted)] mb-4" />
          {approvedQuizzes.length === 0 ? (
            <>
              <p className="text-sm font-medium text-[var(--foreground-secondary)]">No approved quizzes yet</p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Official quizzes from contributors will appear here once approved.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--foreground-secondary)]">No matching quizzes</p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                className="mt-4"
                size="sm"
                variant="ghost"
                onClick={() => { setSearch(''); setDifficultyFilter(''); setCurriculumFilter(''); }}
              >
                Clear Filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onTakeQuiz={onTakeQuiz}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
