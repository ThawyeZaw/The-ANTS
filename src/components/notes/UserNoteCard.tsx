'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — UserNoteCard
// Card for a personal note (user_notes) in the My Notes grid.
// ──────────────────────────────────────────────────────────────────────────────

import { Pencil, Trash2, Pin, Lock, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserNote } from '@/types';

interface UserNoteCardProps {
  note: UserNote;
  /** Resolved names for linked curriculum/subject/topic (optional) */
  subjectName?: string | null;
  topicName?: string | null;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onTogglePin?: (noteId: string, pinned: boolean) => void;
}

function getSnippet(note: UserNote): string {
  if (note.content) return note.content;
  for (const block of note.blocks) {
    if (block.type === 'paragraph' && block.text) return block.text;
    if (block.type === 'heading' && block.text) return block.text;
  }
  return '';
}

export default function UserNoteCard({
  note, subjectName, topicName, onEdit, onDelete, onTogglePin,
}: UserNoteCardProps) {
  const snippet = getSnippet(note);
  const updated = new Date(note.updated_at).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-background-card border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        note.is_pinned ? 'border-primary/40' : 'border-border hover:border-primary/40'
      )}
    >
      {/* Gradient strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-purple-600" />

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-[var(--background-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--foreground-muted)]" title="Personal — only you can see this">
            <Lock size={10} /> Personal
          </span>
          {note.is_pinned && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Pin size={10} /> Pinned
            </span>
          )}
          {subjectName && (
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
              {subjectName}
            </span>
          )}
          {topicName && (
            <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-500">
              {topicName}
            </span>
          )}
        </div>

        {/* Title + snippet */}
        <button
          onClick={() => onEdit(note.id)}
          className="text-left cursor-pointer"
        >
          <h3 className="font-bold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors">
            {note.title || 'Untitled Note'}
          </h3>
          {snippet && (
            <p className="mt-1.5 text-sm text-foreground-muted line-clamp-3">{snippet}</p>
          )}
        </button>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs bg-background-secondary border border-border text-foreground-muted px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
            {note.tags.length > 4 && (
              <span className="text-xs text-foreground-muted">+{note.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/60">
          <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <Layers size={12} />
            {note.blocks.length} block{note.blocks.length !== 1 ? 's' : ''} · {updated}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onTogglePin && (
              <button
                onClick={() => onTogglePin(note.id, !note.is_pinned)}
                title={note.is_pinned ? 'Unpin' : 'Pin'}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  note.is_pinned ? 'text-primary bg-primary/10' : 'text-foreground-muted hover:text-primary hover:bg-primary/10'
                )}
              >
                <Pin size={14} />
              </button>
            )}
            <button
              onClick={() => onEdit(note.id)}
              title="Edit"
              className="p-1.5 rounded-lg text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              title="Delete"
              className="p-1.5 rounded-lg text-foreground-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
