'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Authenticated App Shell Layout
// Wraps all authenticated routes with universal NavBar and LessonProvider.
// Redirects to /login if the user is not authenticated.
// ──────────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LessonProvider } from '@/context/LessonContext';
import NavBar from '@/components/layout/NavBar';
import RelatedPagesSidebar from '@/components/layout/RelatedPagesSidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    // Gate: redirect to onboarding if user hasn't completed it yet
    if (!isLoading && isAuthenticated && user?.profile?.onboardingCompleted === false) {
      router.push('/onboarding');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading skeleton while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse-soft">
          <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} priority />
          <p className="text-sm text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LessonProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <NavBar />
          <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-start gap-6">
            <RelatedPagesSidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </LessonProvider>
    </Suspense>
  );
}
