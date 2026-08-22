'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ForgotPasswordPanel
// Inline collapsible forgot-password panel that lives inside the LoginForm.
// Calls the existing resetPasswordAction server action.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import { Mail, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { resetPasswordAction } from '@/lib/supabase/auth-actions';
import { isValidEmail } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ForgotPasswordPanelProps {
  onBack: () => void;
}

export default function ForgotPasswordPanel({ onBack }: ForgotPasswordPanelProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }

    setIsLoading(true);
    setError('');
    const result = await resetPasswordAction(email);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Something went wrong. Please try again.');
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="animate-fade-in-up space-y-4 text-center py-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-foreground mb-1">Check your inbox</h3>
          <p className="text-sm text-foreground-muted">
            We sent a password reset link to <span className="text-foreground font-medium">{email}</span>.
            It may take a minute to arrive.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-primary hover:underline cursor-pointer font-semibold"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="text-center">
        <h3 className="font-bold text-foreground mb-1">Reset your password</h3>
        <p className="text-sm text-foreground-muted">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          autoComplete="email"
          id="forgot-email"
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          iconRight={<Send className="h-4 w-4" />}
        >
          Send reset link
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors cursor-pointer mx-auto"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </button>
    </div>
  );
}
