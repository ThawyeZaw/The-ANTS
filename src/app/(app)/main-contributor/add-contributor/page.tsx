'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Add Contributor Page
// Main Contributor only — invite flow via Supabase Admin API + Users Table.
// The main contributor enters name, email, and role; Supabase sends the new
// user a magic-link email so they can set their own password.
// Route: /main-contributor/add-contributor
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserPlus, ShieldAlert, RotateCcw, MailCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useContributorManager } from '@/hooks/useContributorManager';
import { cn } from '@/lib/utils';
import InviteForm from '@/components/contributor-manager/InviteForm';
import UsersTable from '@/components/contributor-manager/UsersTable';
import { changeUserRole } from '@/actions/role-upgrade';
import type { UserRole } from '@/types';

export default function AddContributorPage() {
  const { user } = useAuth();
  const { isMainContributor } = useRole();
  const {
    inviteData,
    isLoading,
    error,
    success,
    invitedEmail,
    submitInvite,
    reset,
    fetchAllUsers,
  } = useContributorManager();

  // Fetch users — re-evaluates when success changes (new user added)
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchAllUsers().then(setUsers);
  }, [fetchAllUsers, success]);

  // ── Role Change Handler ──────────────────────────────────────────────────
  const handleRoleChange = useCallback(
    async (userId: string, newRole: UserRole) => {
      const result = await changeUserRole(userId, newRole);
      if (result.success) {
        // Refresh the users list
        fetchAllUsers().then(setUsers);
      } else {
        console.error('Failed to change role:', result.error);
      }
    },
    [fetchAllUsers]
  );

  // ── Access Guard ──────────────────────────────────────────────────────────
  if (!user) return null;

  if (!isMainContributor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="p-4 rounded-2xl bg-error/10 text-error mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-foreground-muted mt-2 text-center max-w-sm">
          Only Main Contributors can access this page. Contact your administrator
          to request access.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard" label="Back" />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-amber-500" />
              Add New User
            </h1>
            <p className="text-sm text-foreground-muted mt-0.5">
              Invite new team members — they&apos;ll receive a magic link to set their password
            </p>
          </div>
        </div>
      </div>

      {/* Invite Flow Card */}
      <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
        {/* Card Body */}
        <div className="p-6 sm:p-8 max-w-lg mx-auto">
          {/* Not yet sent — show the invite form */}
          {!success && (
            <InviteForm
              onSubmit={submitInvite}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* Success state */}
          {success && (
            <div className="flex flex-col items-center text-center gap-5 py-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <MailCheck className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Invite Sent!</h3>
                <p className="text-sm text-foreground-muted mt-1.5">
                  A magic-link email has been sent to{' '}
                  <span className="font-semibold text-foreground">{invitedEmail}</span>.
                  They&apos;ll click it to set their password and join The ANTS.
                </p>
              </div>
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium',
                'bg-background-secondary border border-border text-foreground-muted'
              )}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {inviteData.name} · {inviteData.role.replace('_', ' ')}
              </div>

              {/* Invite another */}
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-primary transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Invite Another User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-background-card border border-border rounded-2xl p-6">
        <UsersTable users={users} onRoleChange={handleRoleChange} />
      </div>
    </div>
  );
}
