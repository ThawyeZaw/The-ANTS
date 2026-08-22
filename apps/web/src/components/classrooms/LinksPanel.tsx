'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil, ExternalLink, Link2 } from 'lucide-react';
import Button from '@/components/ui/Button';

// ── Simple Links feature — teacher adds external links, students view them

interface ClassroomLink {
  id: string;
  title: string;
  url: string;
  shared_by: string;
  created_at: string;
}

function LinkItem({
  link,
  isOwner,
  onEdit,
  onDelete,
}: {
  link: ClassroomLink;
  isOwner: boolean;
  onEdit?: (l: ClassroomLink) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-3 transition-all duration-200 hover:border-[var(--border-hover)] hover:-translate-y-0.5">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <ExternalLink className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
        <span className="truncate text-sm font-medium text-[var(--foreground)]">{link.title}</span>
      </a>
      {isOwner && (
        <div className="ml-2 flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(link)}
              className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--accent)]"
              title="Edit link"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(link.id)}
              className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]"
              title="Remove link"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface LinksPanelProps {
  classroomId: string;
  links: ClassroomLink[];
  currentUserId?: string;
  isTeacher: boolean;
  onAdd: (title: string, url: string) => void;
  onDelete: (linkId: string) => void;
  onEdit?: (linkId: string, data: { title: string; url: string }) => void;
}

export default function LinksPanel({
  classroomId,
  links,
  currentUserId,
  isTeacher,
  onAdd,
  onDelete,
  onEdit,
}: LinksPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<ClassroomLink | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    if (editingLink && onEdit) {
      onEdit(editingLink.id, { title: title.trim(), url: url.trim() });
    } else {
      onAdd(title.trim(), url.trim());
    }
    setTitle('');
    setUrl('');
    setShowForm(false);
    setEditingLink(null);
  };

  const handleEdit = (link: ClassroomLink) => {
    setTitle(link.title);
    setUrl(link.url);
    setEditingLink(link);
    setShowForm(true);
  };

  const handleCancel = () => {
    setTitle('');
    setUrl('');
    setShowForm(false);
    setEditingLink(null);
  };

  return (
    <div className="space-y-4">
      {isTeacher && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">
            {links.length} link{links.length !== 1 ? 's' : ''}
          </h3>
          <Button size="sm" onClick={() => { handleCancel(); setShowForm(!showForm); }} icon={<Plus className="h-3.5 w-3.5" />}>
            {editingLink ? 'Edit Link' : 'Add Link'}
          </Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Link title"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            required
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (https://...)"
            type="url"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button type="submit" size="sm">{editingLink ? 'Save' : 'Add Link'}</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-12">
            <Link2 className="mb-3 h-8 w-8 text-[var(--foreground-muted)]" />
            <p className="text-sm text-[var(--foreground-muted)]">
              No links shared yet.
            </p>
            {isTeacher && (
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Share useful links with your students.
              </p>
            )}
          </div>
        ) : (
          links.map((l) => (
            <LinkItem
              key={l.id}
              link={l}
              isOwner={currentUserId ? l.shared_by === currentUserId : false}
              onEdit={handleEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
