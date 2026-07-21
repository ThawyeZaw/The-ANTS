'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Signup Form Component
// Simplified public registration: name, email, password.
// All new accounts default to 'student'. Higher roles require approval.
// After signup, shows an email confirmation screen (Supabase email confirm is ON).
// Uses Supabase Auth via AuthContext.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  MailCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, checkPasswordStrength, cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function SignupForm() {
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [signupComplete, setSignupComplete] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});

  const passwordStrength = checkPasswordStrength(password);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const result = await signup(email, password, name.trim(), 'student');

    if (!result.success) {
      setErrors({ form: result.error || 'An unexpected error occurred.' });
      setIsLoading(false);
      return;
    }

    // Show email confirmation screen
    setSignupComplete(true);
    setIsLoading(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage('');
    const supabase = createClient();
    if (!supabase) { setIsResending(false); setResendMessage('Connection failed.'); return; }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setIsResending(false);
    if (error) {
      setResendMessage('Could not resend. Please try again later.');
    } else {
      setResendMessage('Confirmation email resent! Check your inbox.');
    }
  };

  // ── Email confirmation screen ─────────────────────────────────────────────
  if (signupComplete) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-background-card border border-border rounded-2xl p-8 shadow-lg animate-fade-in-up text-center">
          {/* Success icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                <MailCheck className="h-9 w-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-success flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Check your inbox</h1>
          <p className="text-sm text-foreground-muted mb-1">
            We sent a confirmation email to:
          </p>
          <p className="text-sm font-semibold text-foreground mb-5 px-4 py-2 rounded-xl bg-background-secondary inline-block">
            {email}
          </p>

          <div className="text-sm text-foreground-muted mb-6 space-y-1">
            <p>Click the link in the email to verify your account.</p>
            <p className="text-xs">It may take a minute or two to arrive. Check your spam folder too.</p>
          </div>

          {/* Resend */}
          {resendMessage ? (
            <p className="text-sm text-success mb-4">{resendMessage}</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center gap-2 mx-auto text-sm text-primary hover:underline cursor-pointer font-semibold mb-4 disabled:opacity-50"
              id="signup-resend-email"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isResending && 'animate-spin')} />
              {isResending ? 'Resending…' : 'Resend confirmation email'}
            </button>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-xs text-foreground-muted">
              Already confirmed?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline" id="signup-confirmed-login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto auth-corner-accents">
      <div className="bg-background-card border border-border rounded-2xl shadow-lg overflow-hidden animate-fade-in-up flex flex-col lg:flex-row min-h-[560px] auth-pattern-dots">

        {/* ── Left panel: Branding ───────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-8 overflow-hidden auth-pattern-diag auth-brand-lines"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, var(--primary)) 100%)',
          }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.2)' }} />

          <div className="relative z-10">
            <div className="text-4xl mb-4">🐜</div>
            <h2 className="text-2xl font-bold text-white mb-2">Join <span className="font-brand text-on-dark">The ANTs</span></h2>
            <p className="text-white/90 text-sm leading-relaxed text-on-accent">
              Start your academic journey with tools built specifically for UK curriculum students worldwide.
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            {[
              { emoji: '📚', text: 'IGCSE Cambridge & Edexcel' },
              { emoji: '🎓', text: 'Cambridge & IAL A-Levels' },
              { emoji: '🌍', text: 'IELTS Academic' },
              { emoji: '⚡', text: 'Free forever for students' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg">{emoji}</span>
                <p className="text-white/90 text-sm font-medium text-on-accent">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel: Form ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center p-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="text-3xl mb-2">🐜</div>
          </div>

          <div className="mb-7 auth-header-accent">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-foreground-muted mt-1">
              Free forever. No credit card required.
            </p>
          </div>

          {/* Form error */}
          {errors.form ? (
            <div className="mb-5 p-3.5 rounded-xl bg-error/8 border border-error/20 text-error text-sm font-medium animate-fade-in flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errors.form}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              icon={<User className="h-4 w-4" />}
              autoComplete="name"
              id="signup-name"
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              id="signup-email"
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password (8+ characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                icon={<Lock className="h-4 w-4" />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                autoComplete="new-password"
                id="signup-password"
              />
              {/* Password strength meter */}
              {password && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          i <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-background-secondary'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Strength: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              icon={<Lock className="h-4 w-4" />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="cursor-pointer hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              autoComplete="new-password"
              id="signup-confirm-password"
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              iconRight={<ArrowRight className="h-4 w-4" />}
              id="signup-submit"
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-foreground-muted mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline" id="signup-to-login">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-foreground-muted mt-3">
            By creating an account you agree to our{' '}
            <span className="text-foreground-secondary">Terms of Service</span> and{' '}
            <span className="text-foreground-secondary">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
