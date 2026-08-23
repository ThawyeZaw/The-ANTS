'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Forgot & Reset Password Panel
// Supports dual verification via Telegram Bot OTP and Email delivery.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  Send,
  Lock,
  KeyRound,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { actionRequestPasswordReset, actionResetPasswordWithCode } from '@/actions/profile';
import { checkPasswordStrength, cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ForgotPasswordPanelProps {
  onBack: () => void;
}

export default function ForgotPasswordPanel({ onBack }: ForgotPasswordPanelProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStrength = checkPasswordStrength(newPassword);

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await actionRequestPasswordReset(identifier, 'both');
      if (!result.success) {
        setError(result.error || 'Account not found. Please check your username or email.');
      } else {
        setDeliveryMessage(result.message || 'Reset code sent.');
        setStep('verify');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await actionResetPasswordWithCode(identifier, code, newPassword);
      if (!result.success) {
        setError(result.error || 'Invalid or expired verification code.');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in-up space-y-4 text-center py-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Password Reset Complete!</h3>
          <p className="text-xs text-foreground-muted">
            Your password has been successfully updated. You can now sign in with your new credentials.
          </p>
        </div>
        <Button type="button" fullWidth size="lg" onClick={onBack} className="cursor-pointer font-bold">
          Sign In Now
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
          <KeyRound className="w-3.5 h-3.5" />
          Account Security
        </div>
        <h3 className="text-lg font-bold text-foreground">
          {step === 'request' ? 'Reset your password' : 'Enter verification code'}
        </h3>
        <p className="text-xs text-foreground-muted mt-1">
          {step === 'request'
            ? 'Enter your email or username to receive a secure 6-digit reset code via Telegram / Email.'
            : deliveryMessage}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <Input
            label="Email or Username"
            type="text"
            placeholder="you@example.com or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            autoComplete="username"
            id="forgot-identifier"
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="cursor-pointer font-bold shadow-md"
          >
            Send Verification Code
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-semibold text-foreground-muted hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* OTP Code Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">6-Digit Code</label>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="cursor-pointer font-bold shadow-md"
          >
            Update Password
          </Button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-foreground-muted hover:text-foreground cursor-pointer"
            >
              Re-send Code
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
