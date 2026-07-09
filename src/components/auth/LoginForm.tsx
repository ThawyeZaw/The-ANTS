'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Login Form Component
// Premium split-panel login with inline forgot-password, `?next` redirect,
// and email confirmation error handling.
// Uses Supabase Auth via AuthContext.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, BookOpen, Timer, Calculator, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, humanizeAuthError } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ForgotPasswordPanel from './ForgotPasswordPanel';

const FEATURE_HIGHLIGHTS = [
  { icon: BookOpen, label: 'Lesson Tracker', desc: 'Track every topic across all curricula' },
  { icon: Calculator, label: 'Grade Calculator', desc: 'UMS, raw marks, IELTS bands & more' },
  { icon: Timer, label: 'Exam Countdown', desc: 'Never miss a Cambridge or Edexcel deadline' },
  { icon: Sparkles, label: 'Flashcards', desc: 'Tagged by board and syllabus code' },
];

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [showForgot, setShowForgot] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const result = await login(email, password);

    if (!result.success) {
      setErrors({ form: humanizeAuthError(result.error) });
      setIsLoading(false);
      return;
    }

    router.push(nextUrl);
  };

  return (
    <div className="w-full max-w-5xl mx-auto auth-corner-accents">
      <div className="bg-background-card border border-border rounded-2xl shadow-lg overflow-hidden animate-fade-in-up flex flex-col lg:flex-row min-h-[540px] auth-pattern-dots">

        {/* ── Left panel: Branding ─────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-8 overflow-hidden auth-pattern-diag auth-brand-lines"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent)) 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="absolute top-1/2 right-0 w-32 h-32 rounded-full opacity-5"
            style={{ background: 'rgba(255,255,255,0.4)' }} />

          <div className="relative z-10">
            <div className="text-4xl mb-4">🐜</div>
            <h2 className="text-2xl font-bold text-white mb-2 font-brand text-on-dark">The ANTs</h2>
            <p className="text-white/90 text-sm leading-relaxed text-on-accent">
              Your all-in-one academic productivity platform for IGCSE, A-Level, and IELTS.
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            {FEATURE_HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold text-on-accent">{label}</p>
                  <p className="text-white/75 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel: Form ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center p-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="text-3xl mb-2">🐜</div>
          </div>

          {/* Toggle between sign-in and forgot-password */}
          <div className={showForgot ? 'block' : 'hidden'}>
            <ForgotPasswordPanel onBack={() => setShowForgot(false)} />
          </div>

          <div className={showForgot ? 'hidden' : 'block'}>
            {/* Header */}
            <div className="mb-7 auth-header-accent">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="text-sm text-foreground-muted mt-1">Sign in to continue your studies</p>
            </div>

            {/* Form error */}
            {errors.form ? (
              <div className="mb-5 p-3.5 rounded-xl bg-error/8 border border-error/20 text-error text-sm font-medium animate-fade-in flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errors.form}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                icon={<Mail className="h-4 w-4" />}
                autoComplete="email"
                id="login-email"
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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
                  autoComplete="current-password"
                  id="login-password"
                />
                {/* Forgot password link */}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-primary hover:underline cursor-pointer font-semibold"
                    id="login-forgot-password"
                    suppressHydrationWarning
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
                iconRight={<ArrowRight className="h-4 w-4" />}
                id="login-submit"
              >
                Sign In
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-foreground-muted mt-6">
              Don&#39;t have an account?{' '}
              <Link href="/signup" className="text-primary font-semibold hover:underline" id="login-to-signup">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
