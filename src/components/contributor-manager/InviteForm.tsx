'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Invite Form (Step 1)
// Collects name, email, and role to send an invite to a new user.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  Send,
  Loader2,
  GraduationCap,
  BookOpen,
  Pencil,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidEmail } from '@/lib/utils';
import { UserRole, ROLE_METADATA } from '@/types';
import type { InviteFormData } from '@/hooks/useContributorManager';

interface InviteFormProps {
  onSubmit: (data: InviteFormData) => void;
  isLoading: boolean;
  error: string | null;
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="w-5 h-5" />,
  teacher: <BookOpen className="w-5 h-5" />,
  contributor: <Pencil className="w-5 h-5" />,
  main_contributor: <Shield className="w-5 h-5" />,
};

const ROLE_OPTIONS: UserRole[] = ['student', 'teacher', 'contributor', 'main_contributor'];

export default function InviteForm({ onSubmit, isLoading, error }: InviteFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('contributor');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!name.trim()) {
      setLocalError('Full name is required.');
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    onSubmit({ name: name.trim(), email: email.trim(), role });
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-foreground">
          Invite a New User
        </h3>
        <p className="text-sm text-foreground-muted mt-1">
          Enter the person&apos;s details and choose their role
        </p>
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <label htmlFor="invite-name" className="block text-sm font-medium text-foreground">
          Full Name
        </label>
        <input
          id="invite-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aung Ko Ko"
          className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
          disabled={isLoading}
        />
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="invite-email" className="block text-sm font-medium text-foreground">
          Email Address
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. user@theants.edu"
          className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
          disabled={isLoading}
        />
      </div>

      {/* Role Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Assign Role
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((r) => {
            const meta = ROLE_METADATA[r];
            const isSelected = role === r;

            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                disabled={isLoading}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-background-card hover:border-border-hover hover:bg-background-secondary'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br text-white shrink-0',
                    meta.gradient
                  )}
                >
                  {ROLE_ICONS[r]}
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-semibold',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}>
                    {meta.displayName}
                  </p>
                  <p className="text-xs text-foreground-muted truncate">
                    {r === 'student' && 'Study tools & classrooms'}
                    {r === 'teacher' && 'Manage classrooms'}
                    {r === 'contributor' && 'Create & submit content'}
                    {r === 'main_contributor' && 'Review & approve'}
                  </p>
                </div>
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary animate-pulse-soft" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {displayError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
          <span>⚠️</span>
          <span>{displayError}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 cursor-pointer',
          isLoading
            ? 'bg-primary/50 cursor-not-allowed'
            : 'bg-primary hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending Invite…
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Invite
          </>
        )}
      </button>
    </form>
  );
}
