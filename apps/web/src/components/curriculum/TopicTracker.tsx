'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TopicTracker
// Redesigned Topic Tracker component for subject syllabus progress.
// Shows topic list with status toggles, difficulty, hours, and progress bar.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useTransition } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock4,
  Search,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Filter,
} from 'lucide-react';
import { type TopicWithProgress, updateTopicProgress } from '@/actions/curriculum';
import { cn } from '@/lib/utils';

interface TopicTrackerProps {
  curriculumId: string;
  subjectId: string;
  userId: string;
  initialTopics: TopicWithProgress[];
  onTopicChange?: () => void;
}

type FilterStatus = 'all' | 'not_started' | 'in_progress' | 'completed';

export function TopicTracker({
  curriculumId,
  subjectId,
  userId,
  initialTopics,
  onTopicChange,
}: TopicTrackerProps) {
  const [topics, setTopics] = useState<TopicWithProgress[]>(initialTopics);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const inProgressCount = topics.filter((t) => t.status === 'in_progress').length;
  const totalCount = topics.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStatusChange = (
    topicId: string,
    newStatus: 'not_started' | 'in_progress' | 'completed'
  ) => {
    // Optimistic update
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      await updateTopicProgress(userId, topicId, newStatus);
      if (onTopicChange) onTopicChange();
    });
  };

  const cycleStatus = (topicId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'not_started'
        ? 'in_progress'
        : currentStatus === 'in_progress'
        ? 'completed'
        : 'not_started';
    handleStatusChange(topicId, nextStatus);
  };

  // Filtering
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchesSearch =
        search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

      const matchesFilter = filter === 'all' || t.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [topics, search, filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-background-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Syllabus Progress
              </span>
              <span className="text-xs text-foreground-muted">
                &middot; {completedCount} of {totalCount} topics mastered
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {completionPct}% Completed
            </h2>
          </div>

          {/* Stat Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background-secondary font-medium text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {completedCount} Done
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background-secondary font-medium text-foreground">
              <Clock4 className="h-3.5 w-3.5 text-warning" />
              {inProgressCount} Learning
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background-secondary font-medium text-foreground-muted">
              <Circle className="h-3.5 w-3.5" />
              {totalCount - completedCount - inProgressCount} Remaining
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-background-secondary overflow-hidden flex">
          <div
            className="h-full bg-success transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
          <div
            className="h-full bg-warning transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-background-card text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Topics' },
              { id: 'not_started', label: 'Not Started' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors cursor-pointer',
                filter === tab.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background-card border-border text-foreground-muted hover:text-foreground hover:bg-background-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic List */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-border/80 bg-background-card space-y-2">
          <BookOpen className="h-8 w-8 text-foreground-muted mx-auto" />
          <p className="text-sm font-semibold text-foreground">No topics found</p>
          <p className="text-xs text-foreground-muted">
            {search ? 'Try clearing your search query.' : 'No topics are available for this subject yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTopics.map((topic, idx) => {
            const isExpanded = expandedTopicId === topic.id;
            const statusConfig = {
              completed: {
                icon: CheckCircle2,
                label: 'Completed',
                color: 'text-success',
                bg: 'bg-success/10 border-success/30',
              },
              in_progress: {
                icon: Clock4,
                label: 'In Progress',
                color: 'text-warning',
                bg: 'bg-warning/10 border-warning/30',
              },
              not_started: {
                icon: Circle,
                label: 'Not Started',
                color: 'text-foreground-muted',
                bg: 'bg-background-secondary border-border',
              },
            }[topic.status as 'completed' | 'in_progress' | 'not_started'] || {
              icon: Circle,
              label: 'Not Started',
              color: 'text-foreground-muted',
              bg: 'bg-background-secondary border-border',
            };

            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={topic.id}
                className={cn(
                  'rounded-xl border transition-all duration-150 overflow-hidden bg-background-card',
                  topic.status === 'completed'
                    ? 'border-success/30 hover:border-success/50'
                    : topic.status === 'in_progress'
                    ? 'border-warning/30 hover:border-warning/50'
                    : 'border-border/80 hover:border-border-hover'
                )}
              >
                <div className="p-3.5 sm:p-4 flex items-center gap-3.5">
                  {/* Status click toggle */}
                  <button
                    type="button"
                    title="Click to cycle status (Not Started → In Progress → Completed)"
                    onClick={() => cycleStatus(topic.id, topic.status)}
                    className={cn(
                      'p-2 rounded-lg border transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0',
                      statusConfig.bg
                    )}
                  >
                    <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                  </button>

                  {/* Topic Title & Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-semibold text-foreground-muted">
                        #{topic.order_index ?? idx + 1}
                      </span>
                      <h3
                        className={cn(
                          'text-sm font-semibold text-foreground leading-snug cursor-pointer',
                          topic.status === 'completed' && 'line-through text-foreground-muted'
                        )}
                        onClick={() =>
                          setExpandedTopicId(isExpanded ? null : topic.id)
                        }
                      >
                        {topic.name}
                      </h3>
                      {topic.difficulty_level && (
                        <span
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                            topic.difficulty_level === 'hard'
                              ? 'bg-error/10 text-error border-error/20'
                              : topic.difficulty_level === 'medium'
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : 'bg-info/10 text-info border-info/20'
                          )}
                        >
                          {topic.difficulty_level}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-foreground-muted">
                      {topic.subtopics_count && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {topic.subtopics_count} subtopics
                        </span>
                      )}
                      {topic.estimated_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {topic.estimated_hours}h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Status Dropdown / Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={topic.status}
                      onChange={(e) =>
                        handleStatusChange(
                          topic.id,
                          e.target.value as 'not_started' | 'in_progress' | 'completed'
                        )
                      }
                      className="text-xs bg-background-secondary border border-border rounded-lg px-2.5 py-1.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    {topic.description && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTopicId(isExpanded ? null : topic.id)
                        }
                        className="p-1.5 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background-secondary transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Description / Notes */}
                {isExpanded && topic.description && (
                  <div className="px-4 pb-3.5 pt-1 text-xs text-foreground-secondary border-t border-border/40 bg-background-secondary/30 leading-relaxed">
                    <p>{topic.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
