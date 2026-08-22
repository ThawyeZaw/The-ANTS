'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile Editor Component
// Inline editable profile form for the Settings page.
// Supports avatar upload via Supabase Storage and inline field editing.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Mail,
  FileText,
  Briefcase,
  Save,
  Loader2,
  Check,
  Pencil,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { RoleBadge } from '@/components/ui/Badge';
import { cn, getInitials } from '@/lib/utils';
import type { SocialLinkItem } from '@/types';
import { uploadAvatar } from '@/lib/avatar-upload';

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

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ── Avatar upload handler ─────────────────────────────────────────────────
  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setAvatarUploading(true);
    setAvatarUploadError(null);

    const result = await uploadAvatar(file, user.profile.id);

    if (result.success && result.url) {
      await updateProfile({ avatar: result.url });
    } else {
      setAvatarUploadError(result.error || 'Upload failed.');
    }

    setAvatarUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setAvatarDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAvatarUpload(file);
  };

  if (!user) return null;

  const currentAvatar = user.profile.avatar;

  return (
    <div className="space-y-5">
      {/* Avatar + name header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-border">
        <div className="relative shrink-0 self-center sm:self-start">
          {/* Current Avatar */}
          <div className="relative">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-lg ring-2 ring-primary/20">
                {getInitials(user.profile.name)}
              </div>
            )}
            {/* Uploading overlay */}
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="font-semibold text-lg text-foreground">{user.profile.name}</p>
          <p className="text-sm text-foreground-muted">@{user.profile.username}</p>
          <div className="mt-1.5 flex justify-center sm:justify-start">{role && <RoleBadge role={role} />}</div>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer self-center sm:self-start"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Avatar upload section (visible when editing) */}
      {isEditing && (
        <div className="pb-5 border-b border-border">
          <label className="text-sm font-medium text-foreground-muted mb-3 block">Profile Picture</label>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setAvatarDragOver(true); }}
            onDragLeave={() => setAvatarDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 cursor-pointer',
              avatarDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-background-secondary'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
            {avatarUploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <p className="text-sm text-foreground-muted">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {avatarDragOver ? 'Drop image here' : 'Click or drag to upload'}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    JPEG or PNG, max 2MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload error */}
          {avatarUploadError && (
            <div className="flex items-center gap-2 mt-2 text-sm text-error">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{avatarUploadError}</span>
            </div>
          )}
        </div>
      )}

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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
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
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary border border-border transition-all duration-200 cursor-pointer text-center"
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
