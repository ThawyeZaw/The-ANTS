'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Login Form Component
// Full login form with email/password validation, error display, and mock auth.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, getRoleLandingPath } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

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
      setErrors({ form: result.error });
      setIsLoading(false);
      return;
    }

    // Redirect happens via the app layout checking auth state
    // For now we need to get the role from the mock response and redirect
    const { mockLogin } = await import('@/lib/mock/database');
    const user = mockLogin(email, password);
    if (user) {
      router.push(getRoleLandingPath(user.profile.role));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-card border border-border rounded-2xl p-8 shadow-lg animate-fade-in-up">
        {/* Back to Home */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground-secondary hover:text-primary hover:bg-background-secondary transition-all mb-6 w-fit"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <Home className="h-3.5 w-3.5" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{'\u{1F41C}'}</div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Sign in to continue to The ANTS
          </p>
        </div>

        {/* Form Error */}
        {errors.form && (
          <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
                id="login-remember"
              />
              <span className="text-sm text-foreground-secondary">Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-foreground-muted mt-6">
          Don&#39;t have an account?{' '}
          <Link
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>

        {/* Demo Credentials Hint */}
        <div className="mt-6 p-3 rounded-xl bg-background-secondary border border-border">
          <p className="text-xs font-medium text-foreground-secondary mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-foreground-muted">
            <p><span className="font-medium text-foreground-secondary">Student:</span> thiri@theants.edu / student123</p>
            <p><span className="font-medium text-foreground-secondary">Teacher:</span> u.kyaw@theants.edu / teacher123</p>
            <p><span className="font-medium text-foreground-secondary">Contributor:</span> aye.chan@theants.edu / contributor123</p>
            <p><span className="font-medium text-foreground-secondary">Main:</span> daw.hla@theants.edu / maincontributor123</p>
          </div>
        </div>
      </div>
    </div>
  );
}