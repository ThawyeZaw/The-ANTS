'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useContributorManager Hook
// Multi-step state machine for inviting and onboarding new users.
// Steps: 1) Invite (name, email, role) → 2) OTP Verify → 3) Complete Profile
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { UserRole } from '@/types';
import {
  mockInviteUser,
  mockVerifyOtp,
  mockCompleteProfile,
  getAllProfiles,
} from '@/lib/mock/database';

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
  const submitInvite = useCallback((data: InviteFormData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Simulate network delay
    setTimeout(() => {
      const result = mockInviteUser(data.email, data.name, data.role);

      if (!result.success) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        inviteData: data,
        createdUserId: result.userId,
        currentStep: 2,
        error: null,
      }));
    }, 800);
  }, []);

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const verifyOtp = useCallback(
    (otp: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Simulate network delay
      setTimeout(() => {
        const isValid = mockVerifyOtp(state.inviteData.email, otp);

        if (!isValid) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Invalid OTP code. Please try again.',
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          otpCode: otp,
          currentStep: 3,
          error: null,
        }));
      }, 600);
    },
    [state.inviteData.email]
  );

  // ── Step 3: Complete profile ──────────────────────────────────────────────
  const completeProfile = useCallback(
    (data: ProfileFormData) => {
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

      // Simulate network delay
      setTimeout(() => {
        const result = mockCompleteProfile(state.createdUserId!, {
          password: data.password,
          title: data.title || undefined,
          bio: data.bio || undefined,
          website_url: data.website_url || undefined,
          facebook_url: data.facebook_url || undefined,
          linkedin_url: data.linkedin_url || undefined,
          github_url: data.github_url || undefined,
        });

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.error,
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
      }, 1000);
    },
    [state.createdUserId]
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
  const fetchAllUsers = useCallback(() => {
    return getAllProfiles();
  }, []);

  return {
    ...state,
    submitInvite,
    verifyOtp,
    completeProfile,
    reset,
    fetchAllUsers,
  };
}
