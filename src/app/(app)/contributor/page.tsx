'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { WorkspaceToastProvider } from '@/components/workspace/WorkspaceToast';
import { cn } from '@/lib/utils';

export default function ContributorDashboard() {
  const { user } = useAuth();
  const { role, isContributor } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role && !isContributor) {
      router.replace(`/${role === 'main_contributor' ? 'main-contributor' : role}`);
    }
  }, [role, isContributor, router]);

  if (!user || !isContributor) return null;

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "Your contributions are making a difference. Here's your creator overview.";

  // ── Carousel (replicated from DashboardLayout — PM-locked) ──────────────────

  const slides = [
    {
      greeting: 'Welcome back',
      nameLine: `${firstName} 👋`,
      subtitle: welcomeSubtitle,
    },
    {
      greeting: 'Your Dashboard',
      nameLine: 'At a Glance',
      subtitle: 'Track your contributions, decks, and profile performance in one place.',
    },
    {
      greeting: 'Keep Creating',
      nameLine: 'Make an Impact',
      subtitle: 'Every note, deck, and resource you create helps students across Myanmar.',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetTimer]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentSlide(index);
    resetTimer();
  }, [resetTimer]);

  return (
    <div className="flex flex-col h-full animate-fade-in" data-scroll-behavior="smooth">
      {/* ── Carousel Hero (replicated from DashboardLayout — PM-locked) ────── */}
      <div className="dash-carousel">
        <div
          className="dash-carousel-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={idx} className="dash-carousel-slide">
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-accent p-6 md:p-8 text-white">
                <div className="flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70">{slide.greeting}</p>
                    <h1 className="mt-0.5 text-2xl md:text-3xl font-bold">{slide.nameLine}</h1>
                    <p className="mt-1 text-sm text-white/70 max-w-md">{slide.subtitle}</p>
                  </div>
                  <div className="hidden sm:flex items-center justify-center shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-4xl">
                      🐜
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        {slides.length > 1 && (
          <div className="dash-carousel-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={cn(
                  'dash-carousel-dot',
                  idx === currentSlide && 'dash-carousel-dot--active'
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Workspace */}
      <div className="mt-6">
        <Suspense fallback={<div className="flex items-center justify-center py-16 text-[var(--foreground-muted)]">Loading workspace...</div>}>
          <WorkspaceToastProvider>
            <MyWorkspace />
          </WorkspaceToastProvider>
        </Suspense>
      </div>
    </div>
  );
}
