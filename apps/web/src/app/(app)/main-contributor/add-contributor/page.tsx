'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Add & Manage Users Page
// Admin user management: assign/toggle roles (student, tutor, contributor, admin).
// Route: /main-contributor/add-contributor
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserPlus, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useContributorManager } from '@/hooks/useContributorManager';
import UsersTable from '@/components/contributor-manager/UsersTable';
import { actionUpdateUserRoles } from '@/actions/role-upgrade';
import type { UserRole } from '@/types';

export default function AddContributorPage() {
  const { user } = useAuth();
  const { isMainContributor, isAdmin } = useRole();
  const canAccess = isMainContributor || isAdmin;

  const {
    isLoading,
    error,
    success,
    fetchAllUsers,
  } = useContributorManager();

  const [users, setUsers] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    fetchAllUsers().then((rows) => {
      setUsers(rows);
      if (rows.length === 0) {
        setLoadError('No users found. If this is unexpected, check database connectivity.');
      }
    });
  }, [fetchAllUsers, success]);

  const handleRolesChange = useCallback(
    async (userId: string, newRoles: UserRole[]) => {
      const result = await actionUpdateUserRoles(userId, newRoles);
      if (result.success) {
        fetchAllUsers().then(setUsers);
      } else {
        console.error('Failed to update roles:', result.error);
      }
    },
    [fetchAllUsers]
  );

  if (!user) return null;

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="p-4 rounded-2xl bg-error/10 text-error mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-foreground-muted mt-2 text-center max-w-sm">
          Only Administrators can access this page. Contact your administrator
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
          <BackButton href="/dashboard" label="Back to Dashboard" />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-amber-500" />
              Manage & Promote Users
            </h1>
            <p className="text-sm text-foreground-muted mt-0.5">
              Directly assign or toggle roles (Student, Tutor, Contributor, Admin)
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-background-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Platform Users & Permissions</h2>
        {loadError && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {loadError}
          </p>
        )}
        <UsersTable users={users} onRolesChange={handleRolesChange} />
      </div>
    </div>
  );
}
