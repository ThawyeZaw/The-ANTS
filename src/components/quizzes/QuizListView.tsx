'use client';

import { useState, useMemo } from 'react';
import { Plus, Brain, Search, Filter, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import QuizCard from './QuizCard';
import type { QuizStandaloneUser, QuizStatus } from '@/types/quiz';

interface QuizListViewProps {
  quizzes: QuizStandaloneUser[];
  onCreateNew: () => void;
  onEdit: (quizId: string) => void;
  onDelete: (quizId: string) => void;
  onShare: (quizId: string) => void;
  onHostLive: (quizId: string) => void;
  onTakeQuiz: (quizId: string) => void;
}

const STATUS_OPTIONS: { label: string; value: QuizStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

export default function QuizListView({
  quizzes,
  onCreateNew,
  onEdit,
  onDelete,
  onShare,
  onHostLive,
  onTakeQuiz,
}: QuizListViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuizStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (search.trim()) {
        const qLower = search.toLowerCase();
        const titleMatch = q.title.toLowerCase().includes(qLower);
        const descMatch = q.description?.toLowerCase().includes(qLower);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [quizzes, search, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">My Quizzes</h2>
          <p className="text-sm text-[var(--foreground-secondary)]">
            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} total
          </p>
        </div>
        <Button onClick={onCreateNew} icon={<Plus className="h-4 w-4" />}>
          Create New Quiz
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title or description..."
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

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-[var(--foreground-muted)] flex-shrink-0" />
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ' +
                  (statusFilter === opt.value
                    ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]')
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
          <Brain className="h-14 w-14 text-[var(--foreground-muted)] mb-4" />
          {quizzes.length === 0 ? (
            <>
              <p className="text-sm font-medium text-[var(--foreground-secondary)]">No quizzes yet</p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Create your first quiz to get started.
              </p>
              <Button className="mt-4" size="sm" onClick={onCreateNew} icon={<Plus className="h-3.5 w-3.5" />}>
                Create Quiz
              </Button>
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
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
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
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
              onHostLive={onHostLive}
              onTakeQuiz={onTakeQuiz}
            />
          ))}
        </div>
      )}
    </div>
  );
}
