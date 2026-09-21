'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TopicTracker
// Syllabus topic list with learning-objective (subtopic) checklists.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useTransition } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock4,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Check,
} from 'lucide-react';
import { type TopicWithProgress, updateTopicProgress, toggleSubtopicProgress } from '@/actions/curriculum';
import {
  parseSubtopicsJson,
  subtopicKey,
  isSubtopicCompleted,
  subtopicMatchesSearch,
  type SubtopicEntry,
} from '@/lib/curriculum/subtopics';
import { cn } from '@/lib/utils';
import { useGamificationFeedback } from '@/components/gamification/GamificationFeedbackProvider';

interface TopicTrackerProps {
  curriculumId: string;
  subjectId: string;
  userId: string;
  initialTopics: TopicWithProgress[];
  onTopicChange?: () => void;
}

type FilterStatus = 'all' | 'not_started' | 'in_progress' | 'completed';

interface UnitSection {
  unitCode: string;
  unitTitle: string;
  topics: TopicWithProgress[];
}

function parseCompletedJson(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function groupTopicsByUnit(topics: TopicWithProgress[]): UnitSection[] | null {
  const withUnits = topics.filter((t) => t.unit_code);
  if (withUnits.length === 0) return null;

  const sections: UnitSection[] = [];
  const indexByCode = new Map<string, number>();

  for (const topic of topics) {
    const code = topic.unit_code ?? 'other';
    const title = topic.unit_title ?? code;
    let idx = indexByCode.get(code);
    if (idx === undefined) {
      idx = sections.length;
      indexByCode.set(code, idx);
      sections.push({ unitCode: code, unitTitle: title, topics: [] });
    }
    sections[idx].topics.push(topic);
  }

  return sections;
}

export function TopicTracker({
  curriculumId: _curriculumId,
  subjectId: _subjectId,
  userId,
  initialTopics,
  onTopicChange,
}: TopicTrackerProps) {
  const [topics, setTopics] = useState<TopicWithProgress[]>(initialTopics);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  const objectiveStats = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const topic of topics) {
      const entries = parseSubtopicsJson(topic.subtopics);
      const completed = parseCompletedJson(topic.completed_subtopics);
      total += entries.length;
      done += entries.filter((e) => isSubtopicCompleted(e, completed)).length;
    }
    return { total, done };
  }, [topics]);

  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const inProgressCount = topics.filter((t) => t.status === 'in_progress').length;
  const totalCount = topics.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const objectivePct =
    objectiveStats.total > 0
      ? Math.round((objectiveStats.done / objectiveStats.total) * 100)
      : 0;

  const { handleAwardResult } = useGamificationFeedback();

  const handleStatusChange = (
    topicId: string,
    newStatus: 'not_started' | 'in_progress' | 'completed'
  ) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      const res = await updateTopicProgress(userId, topicId, newStatus);
      if (res.gamification) handleAwardResult(res.gamification);
      onTopicChange?.();
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

  const handleSubtopicToggle = (
    topic: TopicWithProgress,
    entry: SubtopicEntry,
    isCompleted: boolean
  ) => {
    const entries = parseSubtopicsJson(topic.subtopics);
    const key = subtopicKey(entry);
    let completed = parseCompletedJson(topic.completed_subtopics);

    if (isCompleted) {
      if (!completed.includes(key)) completed.push(key);
    } else {
      completed = completed.filter(
        (s) => s !== key && !isSubtopicCompleted(entry, [s])
      );
    }

    const newStatus =
      entries.length > 0 &&
      entries.every((e) => isSubtopicCompleted(e, completed))
        ? 'completed'
        : completed.length > 0
          ? 'in_progress'
          : 'not_started';

    setTopics((prev) =>
      prev.map((t) =>
        t.id === topic.id
          ? {
              ...t,
              completed_subtopics: JSON.stringify(completed),
              status: newStatus,
            }
          : t
      )
    );

    startTransition(async () => {
      const res = await toggleSubtopicProgress(
        userId,
        topic.id,
        key,
        isCompleted,
        entries.length
      );
      if (res.gamification) handleAwardResult(res.gamification);
      if (res.success) onTopicChange?.();
    });
  };

  const filteredTopics = useMemo(() => {
    const q = search.toLowerCase().trim();
    return topics.filter((t) => {
      const entries = parseSubtopicsJson(t.subtopics);
      const matchesSearch =
        q === '' ||
        t.name.toLowerCase().includes(q) ||
        (t.unit_code?.toLowerCase().includes(q) ?? false) ||
        (t.unit_title?.toLowerCase().includes(q) ?? false) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        entries.some((e) => subtopicMatchesSearch(e, q));

      const matchesFilter = filter === 'all' || t.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [topics, search, filter]);

  const unitSections = useMemo(
    () => groupTopicsByUnit(filteredTopics),
    [filteredTopics]
  );

  const renderTopicCard = (topic: TopicWithProgress, idx: number) => {
    const isExpanded = expandedTopicId === topic.id;
    const subtopicEntries = parseSubtopicsJson(topic.subtopics);
    const completedList = parseCompletedJson(topic.completed_subtopics);
    const subtopicsDone = subtopicEntries.filter((e) =>
      isSubtopicCompleted(e, completedList)
    ).length;

    const statusConfig = {
      completed: {
        icon: CheckCircle2,
        color: 'text-success',
        bg: 'bg-success/10 border-success/30',
      },
      in_progress: {
        icon: Clock4,
        color: 'text-warning',
        bg: 'bg-warning/10 border-warning/30',
      },
      not_started: {
        icon: Circle,
        color: 'text-foreground-muted',
        bg: 'bg-background-secondary border-border',
      },
    }[topic.status as 'completed' | 'in_progress' | 'not_started'] || {
      icon: Circle,
      color: 'text-foreground-muted',
      bg: 'bg-background-secondary border-border',
    };

    const StatusIcon = statusConfig.icon;
    const hasExpandable = Boolean(topic.description || subtopicEntries.length > 0);

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
                  hasExpandable &&
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
              {subtopicEntries.length > 0 && (
                <span className="flex items-center gap-1 font-mono">
                  <Layers className="h-3 w-3" />
                  {subtopicsDone}/{subtopicEntries.length} objectives
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

            {hasExpandable && (
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

        {isExpanded && hasExpandable && (
          <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-background-secondary/20">
            {topic.description && (
              <p className="text-xs text-foreground-secondary leading-relaxed mb-3">
                {topic.description}
              </p>
            )}

            {subtopicEntries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Learning objectives
                  </h4>
                  <span className="text-[11px] font-mono text-foreground-muted">
                    {subtopicsDone}/{subtopicEntries.length} checked
                  </span>
                </div>

                <ul className="space-y-2">
                  {subtopicEntries.map((entry) => {
                    const key = subtopicKey(entry);
                    const isSubCompleted = isSubtopicCompleted(entry, completedList);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() =>
                            handleSubtopicToggle(topic, entry, !isSubCompleted)
                          }
                          className={cn(
                            'w-full text-left flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-all cursor-pointer',
                            isSubCompleted
                              ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                              : 'border-border/70 bg-background hover:border-primary/30 hover:bg-background-secondary/60'
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-md border transition-colors',
                              isSubCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-foreground-muted/40 bg-background'
                            )}
                          >
                            {isSubCompleted && <Check className="w-3.5 h-3.5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2 mb-0.5">
                              {entry.code && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                                  {entry.code}
                                </span>
                              )}
                              {isSubCompleted && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-success">
                                  Done
                                </span>
                              )}
                            </span>
                            <span
                              className={cn(
                                'text-sm leading-snug block',
                                isSubCompleted
                                  ? 'text-foreground-muted line-through'
                                  : 'text-foreground'
                              )}
                            >
                              {entry.title}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-background-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Syllabus Progress
              </span>
              <span className="text-xs text-foreground-muted">
                &middot; {completedCount} of {totalCount} topics mastered
              </span>
              {objectiveStats.total > 0 && (
                <span className="text-xs text-foreground-muted font-mono">
                  &middot; {objectiveStats.done}/{objectiveStats.total} objectives
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground">{completionPct}% topics</h2>
            {objectiveStats.total > 0 && (
              <p className="text-sm text-foreground-muted font-mono">
                {objectivePct}% objectives checked
              </p>
            )}
          </div>

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
        {objectiveStats.total > 0 && (
          <div className="w-full h-1.5 rounded-full bg-background-secondary overflow-hidden">
            <div
              className="h-full bg-primary/70 transition-all duration-300"
              style={{ width: `${objectivePct}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics or codes (e.g. 1.1, WMA11)…"
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-background-card text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

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

      {filteredTopics.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-border/80 bg-background-card space-y-2">
          <BookOpen className="h-8 w-8 text-foreground-muted mx-auto" />
          <p className="text-sm font-semibold text-foreground">No topics found</p>
          <p className="text-xs text-foreground-muted">
            {search
              ? 'Try clearing your search query.'
              : 'Enroll in the units you are taking to see syllabus topics here.'}
          </p>
        </div>
      ) : unitSections ? (
        <div className="space-y-8">
          {unitSections.map((section) => (
            <section key={section.unitCode} className="space-y-3">
              <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-background/95 backdrop-blur-sm border-b border-border/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold font-mono px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {section.unitCode}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">
                    {section.unitTitle}
                  </h3>
                  <span className="text-[11px] text-foreground-muted">
                    {section.topics.length} topic{section.topics.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {section.topics.map((topic, idx) => renderTopicCard(topic, idx))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTopics.map((topic, idx) => renderTopicCard(topic, idx))}
        </div>
      )}
    </div>
  );
}
