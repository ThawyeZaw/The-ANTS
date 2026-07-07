'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — NoteReaderModal
// Slide-over drawer / modal to read notes directly within the library.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { X, CalendarDays, Bookmark, BookmarkCheck, GraduationCap, Zap, FlaskConical, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useSavedNotes } from '@/hooks/useNotes';
import BlockPreview from './BlockPreview';
import { getProfile, mockCurriculums, mockSubjects } from '@/lib/mock/database';

interface NoteReaderModalProps {
  noteId: string | null;
  onClose: () => void;
  allNotes: Note[]; // To look up note details locally
}


export default function NoteReaderModal({ noteId, onClose, allNotes }: NoteReaderModalProps) {
  const { user } = useAuth();
  const { toggleSave, checkSaved } = useSavedNotes(user?.id);
  const containerRef = useRef<HTMLDivElement>(null);

  const note = allNotes.find((n) => n.id === noteId);

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (noteId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [noteId]);

  if (!note) return null;

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!user) { setIsSaved(false); return; }
    checkSaved(note.id).then(setIsSaved);
  }, [user, note.id, checkSaved]);

  const contributor = getProfile(note.contributor_id);
  const curriculum = note.curriculum_id ? mockCurriculums.find((c) => c.id === note.curriculum_id) : null;
  const subject = note.subject_id ? mockSubjects.find((s) => s.id === note.subject_id) : null;


  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(note.created_at));

  // Handle clicking outside the container to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        ref={containerRef}
        className="w-full max-w-2xl bg-background border-l border-border h-full flex flex-col shadow-2xl animate-slide-in-right overflow-hidden"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-card shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/library/${note.id}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-foreground-muted hover:text-foreground text-xs font-medium hover:bg-background-secondary transition-all cursor-pointer"
              title="Open in full page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Full Page
            </button>
            {user && (
              <button
                onClick={() => toggleSave(note.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer',
                  isSaved
                    ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                    : 'bg-background-secondary text-foreground-muted border-border hover:text-foreground hover:border-border-hover'
                )}
              >
                {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-background-secondary text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-2">
            {curriculum && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background-secondary text-foreground-muted border border-border">
                {curriculum.qualification} — {curriculum.exam_board}
              </span>
            )}
            {subject && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500">
                {subject.title}
              </span>
            )}
            {note.is_syllabus_based && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500">
                📋 Spec-Based
              </span>
            )}
            {note.visibility && (
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border",
                note.visibility === 'public' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                note.visibility === 'link' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                "bg-slate-500/10 text-foreground-muted border-border"
              )}>
                {note.visibility === 'public' ? '📚 Public' :
                 note.visibility === 'link' ? '🔗 Shared Link' : '🔒 Private'}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{note.title}</h1>

          {/* Summary */}
          {note.summary && (
            <p className="text-foreground-secondary text-sm sm:text-base leading-relaxed border-l-2 border-primary/30 pl-4 py-1 italic">
              {note.summary}
            </p>
          )}

          {/* Syllabus point */}
          {note.is_syllabus_based && note.syllabus_point && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-violet-500/80 font-mono bg-violet-500/5 rounded-xl px-4 py-3 border border-violet-500/20">
              <span className="text-base">📌</span>
              <span className="font-semibold">Syllabus Point:</span> {note.syllabus_point}
            </div>
          )}

          {/* Meta Author Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted pt-2 border-b border-border pb-4">
            {contributor && (
              <span className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-[10px]">
                  {contributor.name.charAt(0)}
                </div>
                by <strong className="text-foreground">{contributor.name}</strong>
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
          </div>

          {/* Note content blocks */}
          <div className="prose-note space-y-6 pt-2">
            {note.blocks.map((block) => (
              <BlockPreview key={block.id} block={block} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
