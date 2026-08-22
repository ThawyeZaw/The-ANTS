'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useContributorManager Hook
// Single-step invite flow: main contributor enters name, email, and role.
// The Supabase Admin API sends a magic-link email to the new user, and the
// profile row is pre-seeded with the provided name and role.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { UserRole } from '@/types';
import { inviteUserAction } from '@/lib/supabase/auth-actions';
import { getAllUsers } from '@/actions/role-upgrade';

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

  // ── Submit Invite ─────────────────────────────────────────────────────────
  const submitInvite = useCallback(async (data: InviteFormData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const result = await inviteUserAction(data.email, data.name, data.role);

    if (!result.success) {
      const displayError = result.error && result.error !== '{}'
        ? result.error
        : 'Failed to send invite. Please try again.';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: displayError,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: false,
      inviteData: data,
      success: true,
      invitedEmail: data.email,
      error: null,
    }));
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setState({
      inviteData: { ...INITIAL_INVITE_DATA },
      isLoading: false,
      error: null,
      success: false,
      invitedEmail: null,
    });
  }, []);

  // ── Fetch all users (for the Users Table) ─────────────────────────────────
  const fetchAllUsers = useCallback(async () => {
    return getAllUsers();
  }, []);

  return {
    ...state,
    submitInvite,
    reset,
    fetchAllUsers,
  };
}
