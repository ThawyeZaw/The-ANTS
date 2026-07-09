'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — NoteCard
// Card component for the Notes Library grid.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { Bookmark, BookmarkCheck, FlaskConical, GraduationCap, Zap, Pencil, Trash2, Globe, Lock, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';
import { mockCurriculums, mockSubjects } from '@/lib/mock/database';

interface NoteCardProps {
  note: Note;
  isSaved?: boolean;
  onToggleSave?: (noteId: string) => void;
  contributorName?: string;
  onRead?: (noteId: string) => void;
  onEdit?: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
}


const SUBJECT_COLORS: Record<string, string> = {
  Physics:   'bg-blue-500/10 text-blue-500',
  Chemistry: 'bg-green-500/10 text-green-500',
  Biology:   'bg-teal-500/10 text-teal-500',
  Math:      'bg-violet-500/10 text-violet-500',
  default:   'bg-primary/10 text-primary',
};

export default function NoteCard({ note, isSaved = false, onToggleSave, contributorName, onRead, onEdit, onDelete }: NoteCardProps) {
  const curriculum = note.curriculum_id
    ? mockCurriculums.find((c) => c.id === note.curriculum_id)
    : null;
  const subject = note.subject_id
    ? mockSubjects.find((s) => s.id === note.subject_id)
    : null;


  const subjectColor = subject
    ? (SUBJECT_COLORS[subject.title] ?? SUBJECT_COLORS.default)
    : SUBJECT_COLORS.default;

  const blockCount = note.blocks.length;
  const hasLatex = note.blocks.some((b) => b.type === 'latex');
  const hasAnimation = note.blocks.some((b) => b.type === 'animation');

  return (
    <div className="group relative flex flex-col bg-background-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

      {/* ── Gradient header strip ── */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />

      <div className="flex flex-col flex-1 p-5 gap-3">

        {/* ── Top badges row ── */}
        <div className="flex flex-wrap items-center gap-1.5 relative">
          {/* Visibility badge */}
          {note.visibility === 'public' ? (
            <span className="flex items-center gap-1 rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]" title="Shared in Library">
              <Globe size={10} /> Public
            </span>
          ) : note.visibility === 'link' ? (
            <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500" title="Link Shared">
              <LinkIcon size={10} /> Shared
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-[var(--background-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--foreground-muted)]" title="Private">
              <Lock size={10} /> Private
            </span>
          )}

          {note.exam_board && (
            <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-500">
              {note.exam_board}
            </span>
          )}
          {curriculum && !note.exam_board && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background-secondary text-foreground-muted border border-border">
              {curriculum.qualification} {curriculum.exam_board}
            </span>
          )}
          {subject && (
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', subjectColor)}>
              {subject.title}
            </span>
          )}
          {note.is_syllabus_based && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500">
              Spec-Based
            </span>
          )}
        </div>

        {/* ── Title ── */}
        <Link
          href={`/library/${note.id}`}
          onClick={(e) => {
            if (onRead) {
              e.preventDefault();
              onRead(note.id);
            }
          }}
          className="flex-1"
        >
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
            {note.title}
          </h3>
        </Link>

        {/* ── Summary ── */}
        {note.summary && (
          <p className="text-sm text-foreground-muted line-clamp-2 leading-relaxed">
            {note.summary}
          </p>
        )}

        {/* ── Syllabus point ── */}
        {note.is_syllabus_based && note.syllabus_point && (
          <p className="text-xs text-primary/70 font-mono truncate">{note.syllabus_point}</p>
        )}

        {/* ── Content feature badges ── */}
        <div className="flex flex-wrap gap-1">
          {hasLatex && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">∑ LaTeX</span>
          )}
          {hasAnimation && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-violet-900/40 text-violet-300">🎬 Animation</span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-background-secondary text-foreground-muted">
            {blockCount} block{blockCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Tags ── */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-foreground-muted bg-background-secondary px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-foreground-muted">+{note.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-border">
          <div className="text-xs text-foreground-muted">
            {contributorName ? `by ${contributorName}` : <><span className="font-brand">The ANTs</span> Library</>}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={(e) => { e.preventDefault(); onEdit(note.id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer bg-background-secondary text-foreground-muted hover:text-foreground hover:bg-background-card"
                aria-label="Edit note"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); onDelete(note.id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer bg-red-500/10 text-red-600 hover:bg-red-500/20"
                aria-label="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
            {onToggleSave && (
              <button
                id={`save-note-${note.id}`}
                onClick={(e) => { e.preventDefault(); onToggleSave(note.id); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
                  isSaved
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-background-secondary text-foreground-muted hover:text-foreground hover:bg-background-card'
                )}
                aria-label={isSaved ? 'Remove from saved notes' : 'Save to dashboard'}
              >
                {isSaved
                  ? <><BookmarkCheck className="h-3.5 w-3.5" /> Saved</>
                  : <><Bookmark className="h-3.5 w-3.5" /> Save</>
                }
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
