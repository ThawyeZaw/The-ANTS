'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — RelatedContent
// Content-aware cross-feature linking: shows related flashcards and notes
// based on curriculum, subject, and/or topic context.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { Layers, BookOpen, ExternalLink, Package, Calendar, LineChart } from 'lucide-react';
import type { Deck, Note, Exam } from '@/types';
import { getNotes, getRelatedDecks, getExams, mockCurriculums, mockSubjects } from '@/lib/mock/database';

interface RelatedContentProps {
  curriculumId?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  /** Exclude specific note IDs (e.g. the current note being viewed) */
  excludeNoteId?: string;
  /** Exclude specific deck IDs (e.g. the current deck being viewed) */
  excludeDeckId?: string;
  maxItems?: number;
}

export default function RelatedContent({
  curriculumId,
  subjectId,
  topicId,
  excludeNoteId,
  excludeDeckId,
  maxItems = 3,
}: RelatedContentProps) {
  // Query related decks
  const relatedDecks = getRelatedDecks(curriculumId, subjectId)
    .filter((d) => d.is_public && d.id !== excludeDeckId)
    .slice(0, maxItems);

  // Query related notes (approved only, matching curriculum/subject/topic)
  const relatedNotes = getNotes({
    curriculumId: curriculumId ?? undefined,
    subjectId: subjectId ?? undefined,
    topicId: topicId ?? undefined,
  })
    .filter((n) => n.id !== excludeNoteId)
    .slice(0, maxItems);

  // Query related exams
  const relatedExams = getExams()
    .filter(
      (e) =>
        (curriculumId ? e.curriculum_id === curriculumId : true) &&
        (subjectId ? e.subject_id === subjectId : true)
    )
    .slice(0, maxItems);

  if (relatedDecks.length === 0 && relatedNotes.length === 0 && relatedExams.length === 0 && (!curriculumId || !subjectId)) {
    return null;
  }

  const curriculum = curriculumId
    ? mockCurriculums.find((c) => c.id === curriculumId)
    : null;
  const subject = subjectId
    ? mockSubjects.find((s) => s.id === subjectId)
    : null;

  const contextLabel = subject
    ? subject.title
    : curriculum
      ? `${curriculum.qualification} ${curriculum.exam_board}`
      : 'this topic';

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-[var(--foreground-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
          Related in {contextLabel}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Related decks */}
        {relatedDecks.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              <Layers className="h-3.5 w-3.5" />
              Flashcard Decks
            </div>
            <ul className="space-y-2">
              {relatedDecks.map((deck) => (
                <li key={deck.id}>
                  <Link
                    href={`/flashcards/${deck.id}`}
                    className="group flex items-start gap-2 text-sm"
                  >
                    <span className="flex-1 font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                      {deck.name}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related notes */}
        {relatedNotes.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              <BookOpen className="h-3.5 w-3.5" />
              Study Notes
            </div>
            <ul className="space-y-2">
              {relatedNotes.map((note) => (
                <li key={note.id}>
                  <Link
                    href={`/library/${note.id}`}
                    className="group flex items-start gap-2 text-sm"
                  >
                    <span className="flex-1 font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                      {note.title}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--foreground-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related exams */}
        {relatedExams.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              <Calendar className="h-3.5 w-3.5" />
              Exams & Milestones
            </div>
            <ul className="space-y-2">
              {relatedExams.map((exam) => (
                <li key={exam.id}>
                  <div className="group flex flex-col gap-1 text-sm">
                    <span className="font-medium text-[var(--foreground)] line-clamp-1">
                      {exam.title}
                    </span>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Link */}
        {curriculumId && subjectId && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              <LineChart className="h-3.5 w-3.5" />
              Your Progress
            </div>
            <Link
              href={`/lessons/${curriculumId}/${subjectId}`}
              className="group flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
            >
              <div className="flex flex-col">
                <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                  Lesson Tracker
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  Track your topics and mastery
                </span>
              </div>
              <ExternalLink className="h-4 w-4 text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
