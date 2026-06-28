'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile Editor Component
// Inline editable profile form for the Settings page.
// Replaces the read-only AccountInfo component.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  FileText,
  Briefcase,
  Globe,
  Save,
  Loader2,
  Check,
  Pencil,
} from 'lucide-react';

/** Lightweight brand SVGs — lucide-react doesn't include brand/social icons */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { RoleBadge } from '@/components/ui/Badge';
import { cn, getInitials } from '@/lib/utils';
import type { SocialLinks } from '@/types';

interface ProfileFormData {
  name: string;
  bio: string;
  title: string;
  socialLinks: SocialLinks;
}

export default function ProfileEditor() {
  const { user, updateProfile } = useAuth();
  const { role } = useRole();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    bio: '',
    title: '',
    socialLinks: {},
  });

  const [originalData, setOriginalData] = useState<ProfileFormData>({
    name: '',
    bio: '',
    title: '',
    socialLinks: {},
  });

  // Sync form data when user changes
  useEffect(() => {
    if (user) {
      const data: ProfileFormData = {
        name: user.profile.name,
        bio: user.profile.bio || '',
        title: user.profile.title || '',
        socialLinks: { ...user.profile.socialLinks },
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [user]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const result = await updateProfile({
      name: formData.name.trim(),
      bio: formData.bio.trim() || undefined,
      title: formData.title.trim() || undefined,
      socialLinks: formData.socialLinks,
    });

    setIsSaving(false);
    if (result.success) {
      setSaveSuccess(true);
      setOriginalData({ ...formData });
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(result.error || 'Failed to save changes.');
    }
  }, [formData, isDirty, updateProfile]);

  const handleCancel = () => {
    setFormData({ ...originalData });
    setIsEditing(false);
    setSaveError(null);
  };

  if (!user) return null;

  return (
    <div className="space-y-5">
      {/* Avatar + name header */}
      <div className="flex items-center gap-4 pb-5 border-b border-border">
        <div className="relative group">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-lg ring-2 ring-primary/20">
            {getInitials(user.profile.name)}
          </div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg text-foreground">{user.profile.name}</p>
          <p className="text-sm text-foreground-muted">@{user.profile.username}</p>
          <div className="mt-1.5">{role && <RoleBadge role={role} />}</div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {/* Name */}
        <FieldRow icon={<User className="h-4 w-4" />} label="Display Name">
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="Your display name"
            />
          ) : (
            <p className="text-sm font-medium text-foreground">{formData.name}</p>
          )}
        </FieldRow>

        {/* Email (always read-only) */}
        <FieldRow icon={<Mail className="h-4 w-4" />} label="Email">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{user.email}</p>
            <span className="text-xs text-foreground-muted bg-background-secondary px-2 py-0.5 rounded-md">
              Read-only
            </span>
          </div>
        </FieldRow>

        {/* Title */}
        <FieldRow icon={<Briefcase className="h-4 w-4" />} label="Title">
          {isEditing ? (
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="e.g. Curriculum Developer"
            />
          ) : (
            <p className="text-sm text-foreground-secondary">
              {formData.title || <span className="italic text-foreground-muted">No title set</span>}
            </p>
          )}
        </FieldRow>

        {/* Bio */}
        <FieldRow icon={<FileText className="h-4 w-4" />} label="Bio">
          {isEditing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
              placeholder="Tell others about yourself..."
            />
          ) : (
            <p className="text-sm text-foreground-secondary">
              {formData.bio || <span className="italic text-foreground-muted">No bio set</span>}
            </p>
          )}
        </FieldRow>

        {/* Social Links Section */}
        {isEditing && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3">Social Links</p>
            <div className="space-y-3">
              <SocialInput
                icon={<Globe className="h-4 w-4" />}
                label="Website"
                value={formData.socialLinks.website || ''}
                onChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, website: v || undefined },
                  }))
                }
                placeholder="https://yoursite.com"
              />
              <SocialInput
                icon={<LinkedinIcon className="h-4 w-4" />}
                label="LinkedIn"
                value={formData.socialLinks.linkedin || ''}
                onChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, linkedin: v || undefined },
                  }))
                }
                placeholder="https://linkedin.com/in/username"
              />
              <SocialInput
                icon={<GithubIcon className="h-4 w-4" />}
                label="GitHub"
                value={formData.socialLinks.github || ''}
                onChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, github: v || undefined },
                  }))
                }
                placeholder="https://github.com/username"
              />
              <SocialInput
                icon={<FacebookIcon className="h-4 w-4" />}
                label="Facebook"
                value={formData.socialLinks.facebook || ''}
                onChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, facebook: v || undefined },
                  }))
                }
                placeholder="https://facebook.com/username"
              />
            </div>
          </div>
        )}

        {/* Non-editing social links display */}
        {!isEditing && user.profile.socialLinks && Object.values(user.profile.socialLinks).some(Boolean) && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3">Social Links</p>
            <div className="flex flex-wrap gap-2">
              {user.profile.socialLinks.website && (
                <SocialChip icon={<Globe className="h-3.5 w-3.5" />} href={user.profile.socialLinks.website} label="Website" />
              )}
              {user.profile.socialLinks.linkedin && (
                <SocialChip icon={<LinkedinIcon className="h-3.5 w-3.5" />} href={user.profile.socialLinks.linkedin} label="LinkedIn" />
              )}
              {user.profile.socialLinks.github && (
                <SocialChip icon={<GithubIcon className="h-3.5 w-3.5" />} href={user.profile.socialLinks.github} label="GitHub" />
              )}
              {user.profile.socialLinks.facebook && (
                <SocialChip icon={<FacebookIcon className="h-3.5 w-3.5" />} href={user.profile.socialLinks.facebook} label="Facebook" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
              isDirty
                ? 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-md'
                : 'bg-background-secondary text-foreground-muted cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary border border-border transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Status Messages */}
      {saveSuccess && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 text-success text-sm font-medium animate-fade-in">
          <Check className="h-4 w-4" />
          Profile updated successfully!
        </div>
      )}
      {saveError && (
        <div className="px-4 py-2.5 rounded-xl bg-error/10 text-error text-sm font-medium animate-fade-in">
          {saveError}
        </div>
      )}
    </div>
  );
}

// ── Helper Sub-Components ─────────────────────────────────────────────────────

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="text-foreground-muted shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground-muted mb-1">{label}</p>
        {children}
      </div>
    </div>
  );
}

function SocialInput({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-foreground-muted shrink-0">{icon}</div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        placeholder={placeholder}
        aria-label={label}
      />
    </div>
  );
}

function SocialChip({
  icon,
  href,
  label,
}: {
  icon: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-secondary border border-border text-xs font-medium text-foreground-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
    >
      {icon}
      {label}
    </a>
  );
}
