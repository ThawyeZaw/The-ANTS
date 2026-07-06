'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Update Password Page
// Landing page for Supabase password-reset email links.
// The URL contains a code fragment that Supabase SSR resolves automatically.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { checkPasswordStrength, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const passwordStrength = checkPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) { setError('Password is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/login'), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float delay-500" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-background-card border border-border rounded-2xl p-8 shadow-lg animate-fade-in-up">
          {done ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-foreground">Password updated!</h1>
              <p className="text-sm text-foreground-muted">
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <div className="text-3xl mb-3">🔐</div>
                <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
                <p className="text-sm text-foreground-muted mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    label="New password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    iconRight={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="cursor-pointer hover:text-foreground transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    autoComplete="new-password"
                    id="update-password-new"
                  />
                  {password && (
                    <div className="mt-2 animate-fade-in">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div key={i}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-all duration-300',
                              i <= passwordStrength.score ? passwordStrength.color : 'bg-background-secondary'
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

                <Input
                  label="Confirm new password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  iconRight={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="cursor-pointer hover:text-foreground transition-colors" tabIndex={-1}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  autoComplete="new-password"
                  id="update-password-confirm"
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  id="update-password-submit"
                >
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
