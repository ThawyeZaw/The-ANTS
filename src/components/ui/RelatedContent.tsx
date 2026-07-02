'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — RelatedContent
// Content-aware cross-feature linking: shows related flashcards and notes
// based on curriculum, subject, and/or topic context.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { Layers, BookOpen, ExternalLink, Package } from 'lucide-react';
import type { Deck, Note } from '@/types';
import { getNotes, getRelatedDecks, mockCurriculums, mockSubjects } from '@/lib/mock/database';

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

  if (relatedDecks.length === 0 && relatedNotes.length === 0) {
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
      </div>
    </section>
  );
}
