'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Shared Add Project Form
// Used by both the club member view and the club manage page.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, FormEvent } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

interface AddProjectData {
  title: string;
  description?: string;
  cover_image_url?: string;
  tags?: string[];
  links?: { label: string; url: string }[];
}

interface AddProjectFormProps {
  onAddProject: (data: AddProjectData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function AddProjectForm({ onAddProject, onCancel }: AddProjectFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const links = linkLabel && linkUrl ? [{ label: linkLabel, url: linkUrl }] : [];

    const result = await onAddProject({
      title: title.trim(),
      description: description || undefined,
      cover_image_url: coverImageUrl || undefined,
      tags: tags.length > 0 ? tags : undefined,
      links: links.length > 0 ? links : undefined,
    });

    if (result.success) {
      setTitle('');
      setDescription('');
      setCoverImageUrl('');
      setTagsInput('');
      setLinkLabel('');
      setLinkUrl('');
    } else {
      setError(result.error || 'Could not add project.');
    }
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief description of the project"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Cover Image URL
          </label>
          <input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Tags (comma-separated)
          </label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="react, typescript, api"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Link Label
          </label>
          <input
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="GitHub"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Link URL
          </label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
      </div>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <Button type="submit" size="sm" isLoading={submitting} icon={<Plus className="h-4 w-4" />}>
          Create Project
        </Button>
      </div>
    </form>
  );
}
