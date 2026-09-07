'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Authenticated App Shell Layout
// Guests may access /pomodoro and /tools (try-before-login tools).
// ──────────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LessonProvider } from '@/context/LessonContext';
import NavBar from '@/components/layout/NavBar';

const GUEST_ALLOWLIST = ['/pomodoro', '/tools'] as const;

function isGuestAllowed(pathname: string): boolean {
  return GUEST_ALLOWLIST.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isImmersivePath(pathname: string): boolean {
  return pathname === '/pomodoro' || pathname.startsWith('/pomodoro/');
}

function GuestChrome({
  children,
  immersive = false,
}: {
  children: React.ReactNode;
  immersive?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 focus-ring rounded-lg">
            <Image src="/logo.png" alt="The ANTs" width={28} height={28} />
            <span className="text-sm font-bold tracking-tight text-foreground">The ANTs</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-foreground-secondary hover:text-foreground focus-ring"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 focus-ring"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className={immersive ? 'h-[calc(100dvh-3.5rem)] w-full overflow-hidden' : 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'}
      >
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const guestOk = isGuestAllowed(pathname);
  const immersive = isImmersivePath(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !guestOk) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && user?.profile?.onboardingCompleted === false) {
      router.push('/onboarding');
    }
  }, [isAuthenticated, isLoading, user, router, guestOk]);

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

  if (!isAuthenticated) {
    if (!guestOk) return null;
    return <GuestChrome immersive={immersive}>{children}</GuestChrome>;
  }

  return (
    <Suspense fallback={null}>
      <LessonProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <div
            className={
              immersive
                ? 'h-dvh overflow-hidden md:pl-[var(--sidebar-width-collapsed)] lg:pl-[var(--sidebar-width)] transition-[padding] duration-200 ease-out motion-reduce:transition-none'
                : 'min-h-screen pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0 md:pl-[var(--sidebar-width-collapsed)] lg:pl-[var(--sidebar-width)] transition-[padding] duration-200 ease-out motion-reduce:transition-none'
            }
          >
            <main
              id="main-content"
              className={immersive ? 'h-full w-full overflow-hidden' : 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'}
            >
              {children}
            </main>
          </div>
        </div>
      </LessonProvider>
    </Suspense>
  );
}
