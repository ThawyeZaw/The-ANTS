'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Save,
  Loader2,
  Check,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn, getInitials } from '@/lib/utils';
import { uploadAvatar } from '@/lib/avatar-upload';
import {
  actionCheckUsernameAvailable,
  actionUpdateUsername,
  actionUpdateDisplayName,
} from '@/actions/profile';

export default function BasicAccountSettings() {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.profile.name || '');
    setUsernameInput(user.profile.username || '');
  }, [user]);

  useEffect(() => {
    if (!usernameInput || !user) return;
    const currentUsername = (user.profile.username || '').trim().toLowerCase();
    const cleanInput = usernameInput.trim().toLowerCase();

    if (cleanInput === currentUsername) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    if (cleanInput.length < 3) {
      setUsernameStatus('taken');
      setUsernameError('Must be at least 3 characters');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const res = await actionCheckUsernameAvailable(cleanInput, user.id);
      if (res.available) {
        setUsernameStatus('available');
        setUsernameError(null);
      } else {
        setUsernameStatus('taken');
        setUsernameError(res.error || 'Taken');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [usernameInput, user]);

  const handleAvatarFile = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarUploadError('Image size must be under 2MB.');
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarUploadError('Only JPEG and PNG images are supported.');
      return;
    }

    setAvatarUploading(true);
    setAvatarUploadError(null);
    const result = await uploadAvatar(file, user.id);
    setAvatarUploading(false);

    if (result.success && result.url) {
      await updateProfile({ avatar: result.url });
    } else {
      setAvatarUploadError(result.error || 'Failed to upload avatar.');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const cleanName = name.trim();
      const cleanUsername = usernameInput.trim().toLowerCase();

      if (!cleanName) {
        setSaveError('Display name cannot be empty.');
        return;
      }

      if (cleanUsername !== user.profile.username.toLowerCase()) {
        if (usernameStatus === 'taken' || usernameStatus === 'checking') {
          setSaveError(usernameError || 'Choose a valid username.');
          return;
        }
        const usernameRes = await actionUpdateUsername(user.id, cleanUsername);
        if (!usernameRes.success) {
          setSaveError(usernameRes.error || 'Failed to update username.');
          return;
        }
      }

      if (cleanName !== user.profile.name) {
        const nameRes = await actionUpdateDisplayName(user.id, cleanName);
        if (!nameRes.success) {
          setSaveError(nameRes.error || 'Failed to update display name.');
          return;
        }
      }

      await updateProfile({
        name: cleanName,
        username: cleanUsername,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {user.profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile.avatar}
              alt={user.profile.name}
              className="w-16 h-16 rounded-2xl object-cover border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-border flex items-center justify-center text-primary font-bold">
              {getInitials(user.profile.name)}
            </div>
          )}
          {avatarUploading && (
            <div className="absolute inset-0 rounded-2xl bg-background/80 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatarFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-background-secondary hover:border-primary/40 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Change photo
          </button>
          {avatarUploadError && (
            <p className="text-[11px] text-destructive">{avatarUploadError}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-xs font-bold text-foreground mb-1.5 block">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Your full name"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-foreground block">Username</label>
            {usernameStatus === 'checking' && (
              <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            )}
            {usernameStatus === 'available' && (
              <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Available
              </span>
            )}
            {usernameStatus === 'taken' && usernameInput !== user.profile.username && (
              <span className="text-[11px] text-destructive font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {usernameError || 'Taken'}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted">@</span>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) =>
                setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
              }
              className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="username"
            />
          </div>
          <p className="text-[11px] text-foreground-muted mt-1">
            Used for sign-in and how tutors address you in the app. Student accounts do not have a public profile page.
          </p>
        </div>
      </div>

      {saveError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {saveError}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-60"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saveSuccess ? 'Saved' : 'Save account info'}
      </button>
    </div>
  );
}
