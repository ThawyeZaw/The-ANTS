  'use client';

import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: 'Board & Qualification' },
    { number: 2, label: 'Exam Details & Papers' },
    { number: 3, label: 'Grade Boundaries' },
  ];

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
      {steps.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${isCompleted ? 'bg-primary border-primary text-white' :
                    isActive ? 'border-primary bg-primary/10 text-primary' :
                    'border-border text-foreground-muted'}`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.number}
              </div>
              <span
                className={`mt-2 text-sm font-medium
                  ${isActive ? 'text-primary' :
                    isCompleted ? 'text-foreground' : 'text-foreground-muted'}`}
              >
                {step.label}
              </span>
            </div>

            {index < totalSteps - 1 && (
              <div className="flex-1 mx-4 border-t border-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
