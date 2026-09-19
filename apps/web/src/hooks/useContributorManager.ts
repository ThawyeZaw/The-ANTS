'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useContributorManager Hook (Admin Contributor Operations)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import type { UserRole } from '@/types';

export type InviteStep = 1;

export interface InviteFormData {
  name: string;
  email: string;
  role: UserRole;
}

export interface ProfileFormData {
  name?: string;
  password: string;
  confirmPassword: string;
  title: string;
  bio: string;
  website_url: string;
  facebook_url: string;
  linkedin_url: string;
  github_url: string;
}

export interface ContributorManagerState {
  inviteData: InviteFormData;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  invitedEmail: string | null;
}

const INITIAL_INVITE_DATA: InviteFormData = {
  name: '',
  email: '',
  role: 'student',
};

export function useContributorManager() {
  const [state, setState] = useState<ContributorManagerState>({
    inviteData: { ...INITIAL_INVITE_DATA },
    isLoading: false,
    error: null,
    success: false,
    invitedEmail: null,
  });

  const submitInvite = useCallback(async (data: InviteFormData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        inviteData: data,
        success: true,
        invitedEmail: data.email,
        error: null,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to process invite',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      inviteData: { ...INITIAL_INVITE_DATA },
      isLoading: false,
      error: null,
      success: false,
      invitedEmail: null,
    });
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';
      const res = await fetch(`${apiBase}/api/role-upgrade/users`, { cache: 'no-store' });
      if (!res.ok) {
        console.error('[fetchAllUsers] API', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data.users) ? data.users : [];
    } catch (err) {
      console.error('[fetchAllUsers]', err);
      return [];
    }
  }, []);

  const changeUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';
      const res = await fetch(`${apiBase}/api/role-upgrade/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roles: [newRole] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update user roles' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update user roles' };
    }
  }, []);

  return {
    ...state,
    submitInvite,
    reset,
    fetchAllUsers,
    changeUserRole,
  };
}
