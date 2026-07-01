'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — NoteViewer
// Full-page note renderer for the /library/[noteId] route.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  ArrowLeft, Bookmark, BookmarkCheck, GraduationCap, Zap, FlaskConical,
  CalendarDays, Pencil, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useSavedNotes } from '@/hooks/useNotes';
import BlockPreview from './BlockPreview';
import RelatedContent from '@/components/ui/RelatedContent';
import { getProfile, mockCurriculums, mockSubjects } from '@/lib/mock/database';

interface NoteViewerProps {
  note: Note;
}


export default function NoteViewer({ note }: NoteViewerProps) {
  const { user } = useAuth();
  const { isContributor, isMainContributor } = useRole();
  const { toggleSave, checkSaved } = useSavedNotes(user?.id);

  const isSaved = user ? checkSaved(note.id) : false;
  const isOwner = user?.id === note.contributor_id;
  const canEdit = (isContributor || isMainContributor) && isOwner &&
    (note.status === 'draft' || note.status === 'rejected');

  const contributor = getProfile(note.contributor_id);
  const curriculum = note.curriculum_id ? mockCurriculums.find((c) => c.id === note.curriculum_id) : null;
  const subject = note.subject_id ? mockSubjects.find((s) => s.id === note.subject_id) : null;


  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(note.created_at));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* ── Back nav ── */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Library
      </Link>

      {/* ── Pending / rejected notice ── */}
      {note.status !== 'approved' && (
        <div className={cn(
          'flex items-start gap-3 p-4 rounded-xl border',
          note.status === 'pending_review'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
            : 'bg-red-500/10 border-red-500/30 text-red-600'
        )}>
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              {note.status === 'pending_review' ? 'Pending Review' : 'Note Rejected'}
            </p>
            {note.reviewer_feedback && (
              <p className="text-sm mt-1 opacity-80">{note.reviewer_feedback}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Hero card ── */}
      <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
        {/* Gradient top bar */}
        <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

        <div className="p-6 sm:p-8 space-y-4">
          {/* Badges */}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">{note.title}</h1>

          {/* Summary */}
          {note.summary && (
            <p className="text-foreground-secondary text-base leading-relaxed">{note.summary}</p>
          )}

          {/* Syllabus point */}
          {note.is_syllabus_based && note.syllabus_point && (
            <div className="flex items-center gap-2 text-sm text-violet-500/80 font-mono bg-violet-500/5 rounded-lg px-3 py-2 border border-violet-500/20">
              <span>📌</span>
              {note.syllabus_point}
            </div>
          )}

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span key={tag} className="text-xs bg-background-secondary text-foreground-muted px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-4 text-xs text-foreground-muted">
              {contributor && (
                <span className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-[10px]">
                    {contributor.name.charAt(0)}
                  </div>
                  {contributor.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formattedDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <Link
                  href={`/editor/notes?id=${note.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-secondary text-foreground-muted hover:text-foreground text-xs font-medium transition-colors border border-border hover:border-border-hover"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              )}
              {user && (
                <button
                  id={`save-note-viewer-${note.id}`}
                  onClick={() => toggleSave(note.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border',
                    isSaved
                      ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                      : 'bg-background-secondary text-foreground-muted border-border hover:text-foreground hover:border-border-hover'
                  )}
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

      {/* ── Note Content ── */}
      <div className="bg-background-card border border-border rounded-2xl p-6 sm:p-8">
        <div className="prose-note">
          {note.blocks.map((block) => (
            <BlockPreview key={block.id} block={block} />
          ))}
        </div>
      </div>

      {/* ── Related Content ── */}
      <RelatedContent
        curriculumId={note.curriculum_id}
        subjectId={note.subject_id}
        topicId={note.topic_id}
        excludeNoteId={note.id}
      />

    </div>
  );
}
