'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CurriculumDashboard
// Unified curriculum hub: subject selector + exam countdowns + notes + flashcards.
// Cross-links between sections for integrated study workflow.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Layers,
  StickyNote,
  Timer,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  ChevronRight,
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockCurriculums, mockSubjects, mockExams } from '@/lib/mock/database';
import { useCurriculumDashboard, type CountdownWithTime } from '@/hooks/useCurriculumDashboard';

// ── Subject Selector ──────────────────────────────────────────────────────────

function SubjectSelector({
  enrolledSubjects,
  selectedSubjectIds,
  unselectedSubjects,
  onToggle,
  onSelectAll,
}: {
  enrolledSubjects: ReturnType<typeof useCurriculumDashboard>['enrolledSubjects'];
  selectedSubjectIds: string[];
  unselectedSubjects: ReturnType<typeof useCurriculumDashboard>['unselectedSubjects'];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}) {
  if (enrolledSubjects.length === 0) return null;

  const allSelected = unselectedSubjects.length === 0;

  return (
    <div className="rounded-xl border border-border bg-background-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Selected Subjects</p>
        {!allSelected && (
          <button
            onClick={onSelectAll}
            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer"
          >
            Select All
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {enrolledSubjects.map(subject => {
          const isSelected = selectedSubjectIds.includes(subject.subjectId);
          return (
            <button
              key={subject.enrollmentId}
              onClick={() => onToggle(subject.subjectId)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer focus-ring',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground-muted hover:border-border-hover hover:text-foreground-secondary'
              )}
            >
              {subject.subjectTitle}
              {isSelected && <X className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Countdown Timer Display ───────────────────────────────────────────────────

function CountdownDigits({ timeLeft }: { timeLeft: { days: number; hours: number; minutes: number; seconds: number; isPast: boolean } }) {
  if (timeLeft.isPast) {
    return (
      <p className="text-sm font-semibold text-success flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4" />
        Exam time has passed
      </p>
    );
  }

  const segments = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-1">
      {segments.map((seg, i) => (
        <span key={seg.label} className="flex items-baseline gap-0.5">
          <span className={cn(
            'font-mono text-lg font-bold tabular-nums',
            seg.label === 'Secs' ? 'text-primary' : 'text-foreground'
          )}>
            {String(seg.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-medium text-foreground-muted uppercase">{seg.label}</span>
          {i < segments.length - 1 && (
            <span className="text-foreground-muted/40 mx-0.5">:</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string | null }) {
  const config: Record<string, { icon: React.ReactNode; classes: string }> = {
    high: { icon: <ArrowUpCircle className="h-3 w-3" />, classes: 'border-error/40 text-error bg-error/5' },
    medium: { icon: <MinusCircle className="h-3 w-3" />, classes: 'border-warning/40 text-warning bg-warning/5' },
    low: { icon: <ArrowDownCircle className="h-3 w-3" />, classes: 'border-border-hover text-foreground-muted bg-background-secondary' },
  };

  const p = priority?.toLowerCase();
  const c = config[p ?? ''] ?? config.low;

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', c.classes)}>
      {c.icon}
      {priority ?? 'Low'}
    </span>
  );
}

// ── Exam Countdown Card ───────────────────────────────────────────────────────

function CountdownCard({
  item,
  onDelete,
  canEdit,
}: {
  item: CountdownWithTime;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  // Find related content links
  const subject = item.countdown.exam_id
    ? mockSubjects.find(s => mockExams.find(e => e.id === item.countdown.exam_id)?.subject_id === s.id)
    : null;

  return (
    <div className="rounded-xl border border-border bg-background-card p-4 space-y-3 transition-all hover:border-border-hover hover:shadow-sm">
      {/* Title & Priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm text-foreground truncate">{item.examTitle}</h4>
          {item.syllabusCode && (
            <p className="text-xs text-foreground-muted mt-0.5">
              {item.examBoard} {item.syllabusCode} — {item.subjectName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <PriorityBadge priority={item.countdown.priority_indicator} />
          {canEdit && (
            <button
              onClick={() => onDelete(item.countdown.id)}
              className="text-foreground-muted/50 hover:text-error transition-colors cursor-pointer p-0.5"
              title="Delete countdown"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="rounded-lg bg-background-secondary px-3 py-2">
        <CountdownDigits timeLeft={item.timeLeft} />
      </div>

      {/* Cross-links to related study resources */}
      {subject && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
          <Link
            href={`/my-notes`}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary/80 hover:text-primary transition-colors"
          >
            <StickyNote className="h-3 w-3" />
            Notes
          </Link>
          <Link
            href={`/flashcards`}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-accent/80 hover:text-accent transition-colors"
          >
            <Layers className="h-3 w-3" />
            Flashcards
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Add Countdown Modal ──────────────────────────────────────────────────────

function AddCountdownModal({
  isOpen,
  onClose,
  availableExams,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  availableExams: ReturnType<typeof useCurriculumDashboard>['availableExams'];
  onCreate: (data: {
    exam_id?: string;
    custom_title?: string;
    target_date: string;
    priority_indicator: string;
    qualification_group: string;
  }) => void;
}) {
  const [tab, setTab] = useState<'library' | 'custom'>('library');
  const [examId, setExamId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('09:00');
  const [qualificationGroup, setQualificationGroup] = useState('IGCSE');
  const [priority, setPriority] = useState('Medium');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedExam = examId
    ? availableExams.find(e => e.id === examId)
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const dateTime = tab === 'library' && selectedExam
      ? selectedExam.exam_date
      : `${targetDate}T${targetTime}:00.000Z`;

    if (!dateTime) {
      setError('Please select a valid date.');
      return;
    }

    if (tab === 'custom' && (!customTitle.trim() || !targetDate)) {
      setError('Title and date are required for custom countdowns.');
      return;
    }

    onCreate({
      exam_id: tab === 'library' ? examId : undefined,
      custom_title: tab === 'custom' ? customTitle.trim() : undefined,
      target_date: dateTime,
      priority_indicator: priority,
      qualification_group: qualificationGroup,
    });

    // Reset
    setExamId('');
    setCustomTitle('');
    setTargetDate('');
    setTargetTime('09:00');
    setQualificationGroup('IGCSE');
    setPriority('Medium');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="animate-fade-in-up scrollbar-none w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-[var(--shadow-lg)]" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Add Exam Countdown</h2>
              <p className="text-xs text-foreground-muted">Contributor only</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-border/60">
            <button
              type="button"
              onClick={() => setTab('library')}
              className={cn('px-4 py-2 border-b-2 font-medium text-sm transition-all -mb-px cursor-pointer',
                tab === 'library' ? 'border-primary text-primary font-semibold' : 'border-transparent text-foreground-muted hover:text-foreground')}
            >
              Library Exam
            </button>
            <button
              type="button"
              onClick={() => setTab('custom')}
              className={cn('px-4 py-2 border-b-2 font-medium text-sm transition-all -mb-px cursor-pointer',
                tab === 'custom' ? 'border-primary text-primary font-semibold' : 'border-transparent text-foreground-muted hover:text-foreground')}
            >
              Custom
            </button>
          </div>

          {tab === 'library' ? (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Select Exam</label>
              <select
                value={examId}
                onChange={e => setExamId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">Choose an exam...</option>
                {availableExams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.exam_series})
                  </option>
                ))}
              </select>
              {selectedExam && (
                <p className="text-xs text-foreground-muted mt-1.5">
                  Exam date: {new Date(selectedExam.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Title <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="e.g. Physics Mock Exam"
                  className="w-full rounded-xl border border-border bg-background-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Date <span className="text-error">*</span></label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Time</label>
                  <input
                    type="time"
                    value={targetTime}
                    onChange={e => setTargetTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Qualification Group */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Qualification Group</label>
            <select
              value={qualificationGroup}
              onChange={e => setQualificationGroup(e.target.value)}
              className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="IGCSE">IGCSE</option>
              <option value="A LEVEL">A Level</option>
              <option value="OSSD">OSSD</option>
              <option value="IELTS">IELTS</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Priority</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn('flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all cursor-pointer',
                    priority === p
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground-secondary hover:border-border-hover')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-error/5 border border-error/20 px-4 py-2.5 text-sm text-error">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground-secondary hover:bg-background-secondary transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-md cursor-pointer">
              Add Countdown
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Section: Notes ────────────────────────────────────────────────────────────

function NotesSection({ notes }: { notes: ReturnType<typeof useCurriculumDashboard>['notes'] }) {
  return (
    <div className="rounded-xl border border-border bg-background-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <StickyNote className="h-4 w-4 text-violet-500" />
          </div>
          <h3 className="font-semibold text-foreground">Study Notes</h3>
          <span className="text-xs text-foreground-muted">({notes.length})</span>
        </div>
        <Link href="/my-notes" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-foreground-muted py-6 text-center">
          No notes available for selected subjects.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.slice(0, 5).map(note => {
            const subject = note.subject_id ? mockSubjects.find(s => s.id === note.subject_id) : null;
            return (
              <Link
                key={note.id}
                href={`/library/${note.id}`}
                className="block rounded-lg border border-border/60 bg-background-secondary/50 px-3 py-2.5 hover:border-primary/30 hover:bg-background-secondary transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
                    {note.summary && (
                      <p className="text-xs text-foreground-muted truncate mt-0.5">{note.summary}</p>
                    )}
                  </div>
                  {subject && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {subject.title}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Section: Flashcards ───────────────────────────────────────────────────────

function FlashcardSection({ decks }: { decks: ReturnType<typeof useCurriculumDashboard>['decks'] }) {
  return (
    <div className="rounded-xl border border-border bg-background-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Layers className="h-4 w-4 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground">Flashcard Decks</h3>
          <span className="text-xs text-foreground-muted">({decks.length})</span>
        </div>
        <Link href="/flashcards" className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors">
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {decks.length === 0 ? (
        <p className="text-sm text-foreground-muted py-6 text-center">
          No flashcard decks available for selected subjects.
        </p>
      ) : (
        <div className="space-y-2">
          {decks.slice(0, 5).map(deck => (
            <Link
              key={deck.id}
              href={`/flashcards/${deck.id}?mode=study`}
              className="block rounded-lg border border-border/60 bg-background-secondary/50 px-3 py-2.5 hover:border-accent/30 hover:bg-background-secondary transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{deck.name}</p>
                  {deck.description && (
                    <p className="text-xs text-foreground-muted truncate mt-0.5">{deck.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {deck.is_public && <Globe className="h-3 w-3 text-foreground-muted" />}
                  {deck.category && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                      {deck.category}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Empty state (no enrolled subjects) ────────────────────────────────────────

function EmptyEnrollment() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl bg-primary/10 p-4 mb-4">
        <BookOpen className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground">No subjects enrolled</h2>
      <p className="mt-2 text-sm text-foreground-muted max-w-sm">
        Enrol in subjects from the Course Manager to see your personalized exam countdowns, study notes, and flashcards here.
      </p>
      <Link
        href="/courses"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
      >
        Go to Course Manager
      </Link>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CurriculumDashboard() {
  const dashboard = useCurriculumDashboard();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    enrolledSubjects,
    selectedSubjectIds,
    countdowns,
    availableExams,
    notes,
    decks,
    imminentExams,
    toggleSubject,
    selectAllSubjects,
    addCountdown,
    removeCountdown,
    canEdit,
  } = dashboard;

  if (enrolledSubjects.length === 0) {
    return (
      <div className="min-h-[60vh]">
        <EmptyEnrollment />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Curriculum</p>
          <h1 className="text-3xl font-bold text-foreground mt-1 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            My Curriculum
          </h1>
          <p className="text-foreground-muted mt-2 max-w-2xl text-sm">
            Personalised exam countdowns, study notes, and flashcard decks for your enrolled subjects.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors shadow-md cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Countdown
          </button>
        )}
      </div>

      {/* ── Subject selector ─────────────────────────────────────────────────── */}
      <SubjectSelector
        enrolledSubjects={enrolledSubjects}
        selectedSubjectIds={selectedSubjectIds}
        unselectedSubjects={dashboard.unselectedSubjects}
        onToggle={toggleSubject}
        onSelectAll={selectAllSubjects}
      />

      {/* ── Imminent exams alert ─────────────────────────────────────────────── */}
      {imminentExams.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {imminentExams.length} exam{imminentExams.length > 1 ? 's' : ''} within 7 days
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">
              {imminentExams.map(e => e.examTitle).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Three-column grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Column 1: Exam Countdowns ──────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-background-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Timer className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Exam Countdowns</h3>
              <span className="text-xs text-foreground-muted">({countdowns.length})</span>
            </div>
            <Link href="/countdown" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {countdowns.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Clock className="h-8 w-8 text-foreground-muted/40" />
              <p className="text-sm text-foreground-muted">No exam countdowns for selected subjects.</p>
              {canEdit && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer"
                >
                  + Add your first countdown
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {countdowns.map(item => (
                <CountdownCard
                  key={item.countdown.id}
                  item={item}
                  onDelete={removeCountdown}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Column 2: Study Notes ──────────────────────────────────────────── */}
        <NotesSection notes={notes} />

        {/* ── Column 3: Flashcard Decks ──────────────────────────────────────── */}
        <FlashcardSection decks={decks} />
      </div>

      {/* ── Add Countdown Modal ──────────────────────────────────────────────── */}
      <AddCountdownModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        availableExams={availableExams}
        onCreate={(data) => { addCountdown(data); }}
      />
    </div>
  );
}
