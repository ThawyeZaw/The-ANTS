'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Signup Form Component
// Full registration form with role selection cards, password strength, and validation.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Home,
  User,
  GraduationCap,
  BookOpen,
  Pencil,
  Shield,
  Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, checkPasswordStrength, getRoleLandingPath, cn } from '@/lib/utils';
import { UserRole, ROLE_METADATA, ALL_ROLES } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="h-6 w-6" />,
  teacher: <BookOpen className="h-6 w-6" />,
  contributor: <Pencil className="h-6 w-6" />,
  main_contributor: <Shield className="h-6 w-6" />,
};

export default function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
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

    if (!selectedRole) {
      newErrors.role = 'Please select a role.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedRole) return;

    setIsLoading(true);
    setErrors({});

    const result = await signup(email, password, name.trim(), selectedRole);

    if (!result.success) {
      setErrors({ form: result.error });
      setIsLoading(false);
      return;
    }

    router.push(getRoleLandingPath(selectedRole));
  };

  return (
    <div className="w-full max-w-lg mx-auto">
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
          <div className="text-4xl mb-3">🐜</div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Join The ANTS and start your learning journey
          </p>
        </div>

        {/* Form Error */}
        {errors.form && (
          <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
            {/* Password Strength Meter */}
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

          {/* Role Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Select your role
            </label>
            {errors.role && (
              <p className="text-xs text-error mb-2">{errors.role}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {ALL_ROLES.map((roleKey) => {
                const meta = ROLE_METADATA[roleKey];
                const isSelected = selectedRole === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setSelectedRole(roleKey)}
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center',
                      'hover:shadow-md',
                      isSelected
                        ? 'border-primary bg-primary-light shadow-md'
                        : 'border-border hover:border-border-hover bg-background-card'
                    )}
                    id={`signup-role-${roleKey}`}
                  >
                    {/* Selected Check */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center animate-fade-in">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isSelected
                          ? 'text-primary'
                          : 'text-foreground-muted'
                      )}
                    >
                      {ROLE_ICONS[roleKey]}
                    </div>
                    <div>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {meta.displayName}
                      </p>
                      <p className="text-xs text-foreground-muted mt-1 leading-relaxed line-clamp-2">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-foreground-muted mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
