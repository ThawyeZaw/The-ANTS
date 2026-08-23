'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Update Password Page
// Clean Next.js App Router landing page for password resets with OTP code validation.
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordPanel from '@/components/auth/ForgotPasswordPanel';

export default function UpdatePasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-background-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
        <Suspense fallback={<div className="text-center py-8 text-xs text-foreground-muted">Loading...</div>}>
          <ForgotPasswordPanel onBack={() => router.push('/login')} />
        </Suspense>
      </div>
    </div>
  );
}
