'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  FileText,
  Video,
  Link as LinkIcon,
  Image as ImageIcon,
  File,
  ExternalLink,
  Paperclip,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ClassroomResource, ResourceType } from '@/types';

// ── Resource Icon ───────────────────────────────────────────────────────────
const TYPE_ICONS: Record<ResourceType, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-400" />,
  video: <Video className="h-4 w-4 text-blue-400" />,
  document: <File className="h-4 w-4 text-amber-400" />,
  link: <LinkIcon className="h-4 w-4 text-emerald-400" />,
  image: <ImageIcon className="h-4 w-4 text-purple-400" />,
};

// ── Resource Item ───────────────────────────────────────────────────────────
function ResourceItem({
  resource,
  isOwner,
  onEdit,
  onDelete,
}: {
  resource: ClassroomResource;
  isOwner: boolean;
  onEdit?: (r: ClassroomResource) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-3 transition-all duration-200 hover:border-[var(--border-hover)] hover:-translate-y-0.5">
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="flex-shrink-0">{TYPE_ICONS[resource.type]}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {resource.title}
            <ExternalLink className="ml-1 inline h-3 w-3 text-[var(--foreground-muted)]" />
          </p>
          {resource.description && (
            <p className="truncate text-xs text-[var(--foreground-muted)]">{resource.description}</p>
          )}
        </div>
      </a>
      {isOwner && (
        <div className="ml-2 flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(resource)}
              className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--accent)]"
              title="Edit resource"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(resource.id)}
              className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]"
              title="Delete resource"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add/Edit Resource Form ───────────────────────────────────────────────────
function ResourceForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; type: ResourceType; url: string; description: string } | null;
  onSubmit: (title: string, type: ResourceType, url: string, description: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [url, setUrl] = useState(initial?.url || '');
  const [type, setType] = useState<ResourceType>(initial?.type || 'link');
  const [description, setDescription] = useState(initial?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    onSubmit(title, type, url, description);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4">
      <h4 className="mb-3 font-medium text-[var(--foreground)]">{initial ? 'Edit Resource' : 'Add Resource'}</h4>
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resource title"
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
        <div className="flex flex-wrap gap-2">
          {(['pdf', 'video', 'document', 'link', 'image'] as ResourceType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors',
                type === t
                  ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-secondary)] hover:border-[var(--border-hover)]'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          rows={2}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm">{initial ? 'Save' : 'Add'}</Button>
        </div>
      </div>
    </form>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────────────
interface ResourcesPanelProps {
  classroomId: string;
  resources: ClassroomResource[];
  currentUserId?: string;
  isTeacher: boolean;
  onAdd: (title: string, type: ResourceType, url: string, description: string) => void;
  onDelete: (resourceId: string) => void;
  onEdit?: (resourceId: string, data: { title: string; type: ResourceType; url: string; description?: string }) => void;
}

export default function ResourcesPanel({
  classroomId,
  resources,
  currentUserId,
  isTeacher,
  onAdd,
  onDelete,
  onEdit,
}: ResourcesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<ClassroomResource | null>(null);

  const classroomResources = resources.filter((r) => r.classroom_id === classroomId);

  const handleEdit = (r: ClassroomResource) => {
    setEditingResource(r);
    setShowForm(false);
  };

  const handleFormSubmit = (title: string, type: ResourceType, url: string, description: string) => {
    if (editingResource && onEdit) {
      onEdit(editingResource.id, { title, type, url, description });
      setEditingResource(null);
    } else {
      onAdd(title, type, url, description);
      setShowForm(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingResource(null);
  };

  return (
    <div className="space-y-4">
      {isTeacher && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">
            {classroomResources.length} resource{classroomResources.length !== 1 ? 's' : ''}
          </h3>
          <Button size="sm" onClick={() => { setEditingResource(null); setShowForm(!showForm); }} icon={<Plus className="h-3.5 w-3.5" />}>
            Add Resource
          </Button>
        </div>
      )}

      {(showForm || editingResource) && (
        <ResourceForm
          initial={editingResource ? { title: editingResource.title, type: editingResource.type, url: editingResource.url, description: editingResource.description || '' } : null}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      )}

      <div className="space-y-2">
        {classroomResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-12">
            <Paperclip className="mb-3 h-8 w-8 text-[var(--foreground-muted)]" />
            <p className="text-sm text-[var(--foreground-muted)]">
              No resources yet.
            </p>
            {isTeacher && (
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Share links, PDFs, and more with your students.
              </p>
            )}
          </div>
        ) : (
          classroomResources.map((r) => (
            <ResourceItem
              key={r.id}
              resource={r}
              isOwner={currentUserId ? r.uploaded_by === currentUserId : false}
              onEdit={handleEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
