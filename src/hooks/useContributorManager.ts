'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useContributorManager Hook
// Multi-step state machine for inviting and onboarding new users.
// Steps: 1) Invite (name, email, role) → 2) OTP Verify → 3) Complete Profile
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { signUpAction } from '@/lib/supabase/auth-actions';

export type InviteStep = 1 | 2 | 3;

export interface InviteFormData {
  name: string;
  email: string;
  role: UserRole;
}

export interface ProfileFormData {
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
  currentStep: InviteStep;
  inviteData: InviteFormData;
  otpCode: string;
  profileData: ProfileFormData;
  createdUserId: string | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

const INITIAL_INVITE_DATA: InviteFormData = {
  name: '',
  email: '',
  role: 'contributor',
};

const INITIAL_PROFILE_DATA: ProfileFormData = {
  password: '',
  confirmPassword: '',
  title: '',
  bio: '',
  website_url: '',
  facebook_url: '',
  linkedin_url: '',
  github_url: '',
};

export function useContributorManager() {
  const supabase = createClient();

  const [state, setState] = useState<ContributorManagerState>({
    currentStep: 1,
    inviteData: { ...INITIAL_INVITE_DATA },
    otpCode: '',
    profileData: { ...INITIAL_PROFILE_DATA },
    createdUserId: null,
    isLoading: false,
    error: null,
    success: false,
  });

  // ── Step 1: Send invite ───────────────────────────────────────────────────
  const submitInvite = useCallback(async (data: InviteFormData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const tempPassword =
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    const result = await signUpAction(data.email, tempPassword, data.name);

    if (!result.success) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Failed to send invite.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: false,
      inviteData: data,
      currentStep: 2,
      error: null,
    }));
  }, []);

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const verifyOtp = useCallback(
    async (otp: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data: verifyData, error } = await supabase.auth.verifyOtp({
        email: state.inviteData.email,
        token: otp,
        type: 'signup',
      });

      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Invalid OTP code. Please try again.',
        }));
        return;
      }

      const userId = verifyData.user?.id ?? null;

      setState((prev) => ({
        ...prev,
        isLoading: false,
        otpCode: otp,
        createdUserId: userId,
        currentStep: 3,
        error: null,
      }));
    },
    [state.inviteData.email, supabase]
  );

  // ── Step 3: Complete profile ──────────────────────────────────────────────
  const completeProfile = useCallback(
    async (data: ProfileFormData) => {
      if (data.password !== data.confirmPassword) {
        setState((prev) => ({
          ...prev,
          error: 'Passwords do not match.',
        }));
        return;
      }

      if (data.password.length < 6) {
        setState((prev) => ({
          ...prev,
          error: 'Password must be at least 6 characters.',
        }));
        return;
      }

      if (!state.createdUserId) {
        setState((prev) => ({
          ...prev,
          error: 'User ID not found. Please restart the invite process.',
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (passwordError) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: passwordError.message,
        }));
        return;
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: state.createdUserId,
        email: state.inviteData.email,
        name: state.inviteData.name,
        role: state.inviteData.role,
      });

      if (profileError) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: profileError.message,
        }));
        return;
      }

      const { error: contribError } = await supabase
        .from('contributor_profiles')
        .upsert({
          id: state.createdUserId,
          title: data.title || null,
          bio: data.bio || null,
          website: data.website_url || null,
          facebook_url: data.facebook_url || null,
          linkedin: data.linkedin_url || null,
          github: data.github_url || null,
        });

      if (contribError) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: contribError.message,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        profileData: data,
        success: true,
        error: null,
      }));
    },
    [state.inviteData, state.createdUserId, supabase]
  );

  // ── Reset to start over ──────────────────────────────────────────────────
  const reset = useCallback(() => {
    setState({
      currentStep: 1,
      inviteData: { ...INITIAL_INVITE_DATA },
      otpCode: '',
      profileData: { ...INITIAL_PROFILE_DATA },
      createdUserId: null,
      isLoading: false,
      error: null,
      success: false,
    });
  }, []);

  // ── Fetch all users (for the table) ───────────────────────────────────────
  const fetchAllUsers = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
  }, [supabase]);

  return {
    ...state,
    submitInvite,
    verifyOtp,
    completeProfile,
    reset,
    fetchAllUsers,
  };
}
