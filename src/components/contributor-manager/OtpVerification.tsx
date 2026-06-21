'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — OTP Verification (Step 2)
// Premium 6-digit OTP input with auto-focus advance.
// Mock OTP code: 123456
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OtpVerificationProps {
  email: string;
  onVerify: (otp: string) => void;
  isLoading: boolean;
  error: string | null;
}

const OTP_LENGTH = 6;

export default function OtpVerification({
  email,
  onVerify,
  isLoading,
  error,
}: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only accept single digits
      const digit = value.replace(/\D/g, '').slice(-1);

      setDigits((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });

      // Auto-advance to next input
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      const newDigits = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((d, i) => {
        newDigits[i] = d;
      });
      setDigits(newDigits);
      // Focus last filled digit or the next empty one
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  }, []);

  const otpString = digits.join('');
  const isComplete = otpString.length === OTP_LENGTH;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isComplete) {
      onVerify(otpString);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
          <KeyRound className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Verify OTP Code
        </h3>
        <p className="text-sm text-foreground-muted mt-1">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {/* OTP Digit Inputs */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={isLoading}
            className={cn(
              'w-11 h-14 sm:w-14 sm:h-16 rounded-xl text-center text-xl sm:text-2xl font-bold border-2 transition-all duration-200 bg-background-secondary focus:outline-none',
              digit
                ? 'border-primary text-foreground shadow-md'
                : 'border-border text-foreground-muted',
              !isLoading && 'focus:ring-2 focus:ring-primary/30 focus:border-primary',
              isLoading && 'opacity-60 cursor-not-allowed'
            )}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {/* Mock hint */}
      <div className="text-center">
        <p className="text-xs text-foreground-muted bg-background-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
          Test code: <span className="font-mono font-semibold text-warning">123456</span>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isComplete || isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 cursor-pointer',
          !isComplete || isLoading
            ? 'bg-primary/30 cursor-not-allowed'
            : 'bg-primary hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            <KeyRound className="w-5 h-5" />
            Verify Code
          </>
        )}
      </button>
    </form>
  );
}
