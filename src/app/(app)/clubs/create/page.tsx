'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Create Club Page
// Form to create a new club with field category, visuals, and slug.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Input from '@/components/ui/Input';
import type { ClubField } from '@/types';

// ── Field options ────────────────────────────────────────────────────────────

const CLUB_FIELD_OPTIONS: { value: ClubField; label: string; icon: string }[] = [
  { value: 'architecture', label: 'Architecture', icon: 'Building2' },
  { value: 'computer_science', label: 'Computer Science', icon: 'Code2' },
  { value: 'volunteering', label: 'Volunteering', icon: 'HeartHandshake' },
  { value: 'mathematics', label: 'Mathematics', icon: 'Sigma' },
  { value: 'science', label: 'Science', icon: 'FlaskConical' },
  { value: 'literature', label: 'Literature', icon: 'BookOpen' },
  { value: 'arts', label: 'Arts', icon: 'Palette' },
  { value: 'music', label: 'Music', icon: 'Music' },
  { value: 'debate', label: 'Debate', icon: 'MicVocal' },
  { value: 'entrepreneurship', label: 'Entrepreneurship', icon: 'Briefcase' },
  { value: 'engineering', label: 'Engineering', icon: 'Cpu' },
  { value: 'medicine', label: 'Medicine', icon: 'Stethoscope' },
  { value: 'other', label: 'Other', icon: 'Globe' },
];

// ── Form data type ───────────────────────────────────────────────────────────

interface FormData {
  name: string;
  tagline: string;
  description: string;
  field: ClubField | '';
  cover_image_url: string;
  accent_color: string;
  custom_slug: string;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CreateClubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createNewClub } = useClub();

  const [form, setForm] = useState<FormData>({
    name: '',
    tagline: '',
    description: '',
    field: '',
    cover_image_url: '',
    accent_color: '#6366f1',
    custom_slug: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Field updater ───────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error on change
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // ── Validation ──────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Club name is required';
    }

    if (form.tagline.length > 120) {
      newErrors.tagline = 'Tagline must be 120 characters or less';
    }

    if (!form.field) {
      newErrors.field = 'Please select a field/category';
    }

    if (form.custom_slug && !/^[a-z0-9-]+$/.test(form.custom_slug)) {
      newErrors.custom_slug =
        'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validate()) return;
      if (!user?.id) {
        setSubmitError('You must be signed in to create a club.');
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await createNewClub(
          {
            name: form.name.trim(),
            tagline: form.tagline.trim() || undefined,
            description: form.description.trim() || undefined,
            field: form.field as ClubField,
            cover_image_url: form.cover_image_url.trim() || undefined,
            accent_color: form.accent_color || '#6366f1',
            custom_slug: form.custom_slug.trim() || undefined,
          },
          user.id
        );

        if (result.success && result.club) {
          router.push(`/clubs/${result.club.custom_slug}/manage`);
        } else {
          setSubmitError(result.error || 'Failed to create club. Please try again.');
        }
      } catch (err) {
        console.error('Create club error:', err);
        setSubmitError('An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, user, createNewClub, router, validate]
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton href="/clubs" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create a Club</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Start a new community for students with shared interests
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Accent color bar */}
        <div
          className="h-2 rounded-full"
          style={{ backgroundColor: form.accent_color || '#6366f1' }}
        />

        <div className="rounded-2xl border border-border bg-background-card p-6 space-y-6">
          {/* Club Name */}
          <Input
            label="Club Name *"
            placeholder="e.g. Robotics Society"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            maxLength={100}
          />

          {/* Tagline */}
          <Input
            label="Tagline"
            placeholder="A short description of your club"
            value={form.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            error={errors.tagline}
            maxLength={120}
          />
          {form.tagline.length > 0 && (
            <p className="text-xs text-foreground-muted -mt-4 text-right">
              {form.tagline.length}/120
            </p>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y"
              placeholder="Tell potential members what your club is about..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
          </div>

          {/* Field / Category */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-foreground">
              Field/Category *
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none"
              value={form.field}
              onChange={(e) => updateField('field', e.target.value as ClubField)}
            >
              <option value="">Select a field...</option>
              {CLUB_FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.field && (
              <p className="text-xs text-error mt-0.5">{errors.field}</p>
            )}
          </div>
        </div>

        {/* Visual Settings */}
        <div className="rounded-2xl border border-border bg-background-card p-6 space-y-6">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Visual Settings
          </h2>

          {/* Cover Image URL */}
          <Input
            label="Cover Image URL"
            placeholder="https://example.com/cover-image.jpg"
            value={form.cover_image_url}
            onChange={(e) => updateField('cover_image_url', e.target.value)}
          />

          {/* Accent Color */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-foreground">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => updateField('accent_color', e.target.value)}
                className="h-10 w-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
              />
              <span className="text-sm font-mono text-foreground-muted">
                {form.accent_color}
              </span>
            </div>
          </div>
        </div>

        {/* URL Settings */}
        <div className="rounded-2xl border border-border bg-background-card p-6 space-y-6">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            URL Settings
          </h2>

          {/* Custom Slug */}
          <Input
            label="Custom URL Slug"
            placeholder="e.g. robotics-society"
            value={form.custom_slug}
            onChange={(e) =>
              updateField(
                'custom_slug',
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
              )
            }
            error={errors.custom_slug}
            iconRight={
              <span className="text-xs text-foreground-muted">
                /clubs/
              </span>
            }
          />
          {form.custom_slug && !errors.custom_slug && (
            <p className="text-xs text-foreground-muted -mt-4">
              Your club will be accessible at{' '}
              <span className="font-mono text-primary">
                /clubs/{form.custom_slug}
              </span>
            </p>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/clubs')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Club'}
          </Button>
        </div>
      </form>
    </div>
  );
}
