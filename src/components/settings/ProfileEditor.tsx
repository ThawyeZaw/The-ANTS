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
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { RoleBadge } from '@/components/ui/Badge';
import { cn, getInitials } from '@/lib/utils';
import type { SocialLinkItem } from '@/types';

interface ProfileFormData {
  name: string;
  bio: string;
  title: string;
  socialLinks: SocialLinkItem[];
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
    socialLinks: [],
  });

  const [originalData, setOriginalData] = useState<ProfileFormData>({
    name: '',
    bio: '',
    title: '',
    socialLinks: [],
  });

  // Sync form data when user changes
  useEffect(() => {
    if (user) {
      const data: ProfileFormData = {
        name: user.profile.name,
    bio: user.profile.bio || '',
    title: user.profile.title || '',
    socialLinks: user.profile.socialLinks ? [...user.profile.socialLinks] : [],
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
            <p className="text-sm text-foreground-secondary">
              Manage your social links in the <strong>Social Links</strong> tab of the profile editor.
            </p>
          </div>
        )}

        {/* Non-editing social links display */}
        {!isEditing && formData.socialLinks.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3">Social Links</p>
            <div className="flex flex-wrap gap-2">
              {formData.socialLinks.filter(l => l.visible && l.url).map((link) => (
                <SocialChip key={link.id} href={link.url} label={link.label} />
              ))}
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

function SocialChip({
  href,
  label,
}: {
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
      {label}
    </a>
  );
}
