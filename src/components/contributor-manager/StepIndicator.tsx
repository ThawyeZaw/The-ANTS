'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Step Indicator
// Visual progress indicator for the 3-step invite flow.
// ──────────────────────────────────────────────────────────────────────────────

import { Check, Send, KeyRound, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InviteStep } from '@/hooks/useContributorManager';

interface StepIndicatorProps {
  currentStep: InviteStep;
  success: boolean;
}

const STEPS = [
  { step: 1 as const, label: 'Send Invite', icon: Send },
  { step: 2 as const, label: 'Verify OTP', icon: KeyRound },
  { step: 3 as const, label: 'Complete Profile', icon: UserCheck },
];

export default function StepIndicator({ currentStep, success }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((s, i) => {
        const isCompleted = success ? true : currentStep > s.step;
        const isActive = !success && currentStep === s.step;
        const Icon = isCompleted ? Check : s.icon;

        return (
          <div key={s.step} className="flex items-center gap-2 sm:gap-4">
            {/* Step Circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-500',
                  isCompleted && 'bg-accent border-accent text-white scale-100',
                  isActive && 'border-primary bg-primary/10 text-primary animate-pulse-soft',
                  !isCompleted && !isActive && 'border-border text-foreground-muted'
                )}
              >
                {/* Glow ring for active step */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-glow" />
                )}
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-300 text-center',
                  isCompleted && 'text-accent',
                  isActive && 'text-primary',
                  !isCompleted && !isActive && 'text-foreground-muted'
                )}
              >
                {s.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-16 rounded-full transition-all duration-500 mb-6',
                  currentStep > s.step || success
                    ? 'bg-accent'
                    : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
