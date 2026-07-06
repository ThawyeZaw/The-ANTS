'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Add Contributor Page
// Main Contributor only — multi-step invite flow + users table.
// Route: /main-contributor/add-contributor
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, ShieldAlert, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useContributorManager } from '@/hooks/useContributorManager';
import { ROLE_METADATA } from '@/types';
import { cn } from '@/lib/utils';
import StepIndicator from '@/components/contributor-manager/StepIndicator';
import InviteForm from '@/components/contributor-manager/InviteForm';
import OtpVerification from '@/components/contributor-manager/OtpVerification';
import CompleteProfileForm from '@/components/contributor-manager/CompleteProfileForm';
import UsersTable from '@/components/contributor-manager/UsersTable';

export default function AddContributorPage() {
  const { user } = useAuth();
  const { isMainContributor } = useRole();
  const {
    currentStep,
    inviteData,
    isLoading,
    error,
    success,
    submitInvite,
    verifyOtp,
    completeProfile,
    reset,
    fetchAllUsers,
  } = useContributorManager();

  // Fetch users — re-evaluates when success changes (new user added)
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchAllUsers().then(setUsers);
  }, [fetchAllUsers, success]);

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
              Invite and onboard new team members to The ANTS platform
            </p>
          </div>
        </div>
      </div>

      {/* Invite Flow Card */}
      <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
        {/* Step Indicator */}
        <div className="px-6 py-5 border-b border-border bg-background-secondary/30">
          <StepIndicator currentStep={currentStep} success={success} />
        </div>

        {/* Form Area */}
        <div className="p-6 sm:p-8 max-w-lg mx-auto">
          {/* Step 1: Invite */}
          {currentStep === 1 && (
            <InviteForm
              onSubmit={submitInvite}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* Step 2: OTP */}
          {currentStep === 2 && (
            <OtpVerification
              email={inviteData.email}
              onVerify={verifyOtp}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* Step 3: Complete Profile */}
          {currentStep === 3 && (
            <CompleteProfileForm
              invitedName={inviteData.name}
              invitedRole={ROLE_METADATA[inviteData.role].displayName}
              onSubmit={completeProfile}
              isLoading={isLoading}
              error={error}
              success={success}
            />
          )}

          {/* Reset button (visible after success or during step 2/3) */}
          {(success || currentStep > 1) && (
            <div className="mt-6 text-center">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-primary transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                {success ? 'Invite Another User' : 'Start Over'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-background-card border border-border rounded-2xl p-6">
        <UsersTable users={users} />
      </div>
    </div>
  );
}
