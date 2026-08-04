'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Authenticated App Shell Layout
// Wraps all authenticated routes with NavBar, BackButton, and PersonaProvider.
// Redirects to /login if the user is not authenticated.
// ──────────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import { useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PersonaProvider } from '@/context/PersonaContext';
import { LessonProvider } from '@/context/LessonContext';
import NavBar from '@/components/layout/NavBar';
import BackButton from '@/components/ui/BackButton';
import RelatedPagesSidebar from '@/components/layout/RelatedPagesSidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
          <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
          <p className="text-sm text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Hide back button on dashboard and root-level pages
  const hideBackButton =
    pathname === '/dashboard' ||
    pathname === '/student' ||
    pathname === '/teacher' ||
    pathname === '/contributor' ||
    pathname === '/community' ||
    pathname === '/main-contributor';

  return (
    <PersonaProvider>
      <Suspense fallback={null}>
        <LessonProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <NavBar />
            <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-6 pt-18 flex items-start gap-6">
              <RelatedPagesSidebar />
              <main className="flex-1 min-w-0">
                {!hideBackButton && (
                  <div className="mb-4">
                    <BackButton href="/dashboard" label="Back" />
                  </div>
                )}
                {children}
              </main>
            </div>
          </div>
        </LessonProvider>
      </Suspense>
    </PersonaProvider>
  );
}
