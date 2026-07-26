'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  NotebookPen,
  Layers,
  FlaskConical,
  Calculator,
  CalendarDays,
  Timer,
  ArrowRight,
  Sparkles,
  Clock,
} from 'lucide-react';
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
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                      <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} className="md:w-[52px] md:h-[52px]" />
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

      {/* Quick Actions — Library & Tools */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Library Card */}
        <Link
          href="/library"
          className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 p-6 md:p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  Resources Library
                </h3>
                <p className="text-xs text-foreground-muted">All your study resources in one place</p>
              </div>
              <ArrowRight className="h-5 w-5 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: <GraduationCap className="h-3.5 w-3.5" />, label: 'Courses', color: 'text-emerald-500 bg-emerald-500/10' },
                { icon: <NotebookPen className="h-3.5 w-3.5" />, label: 'Notes', color: 'text-amber-500 bg-amber-500/10' },
                { icon: <Layers className="h-3.5 w-3.5" />, label: 'Flashcards', color: 'text-violet-500 bg-violet-500/10' },
                { icon: <FlaskConical className="h-3.5 w-3.5" />, label: 'Exams', color: 'text-rose-500 bg-rose-500/10' },
              ].map((item) => (
                <span
                  key={item.label}
                  className={cn('inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium', item.color)}
                >
                  {item.icon}
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-12 -mt-12 h-36 w-36 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        </Link>

        {/* Tools Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-indigo-500/10 p-6 md:p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-sky-500/40">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Study Tools</h3>
                <p className="text-xs text-foreground-muted">Productivity boosters for your sessions</p>
              </div>
              <Link
                href="/library?tab=tools"
                className="ml-auto shrink-0 flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-2"
              >
                All tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: <Clock className="h-3.5 w-3.5" />, label: 'Countdown', href: '/countdown', color: 'text-sky-500 bg-sky-500/10' },
                { icon: <Calculator className="h-3.5 w-3.5" />, label: 'Calculator', href: '/calculator', color: 'text-emerald-500 bg-emerald-500/10' },
                { icon: <CalendarDays className="h-3.5 w-3.5" />, label: 'Timetable', href: '/timetable', color: 'text-indigo-500 bg-indigo-500/10' },
                { icon: <Timer className="h-3.5 w-3.5" />, label: 'Pomodoro', href: '/pomodoro', color: 'text-rose-500 bg-rose-500/10' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn('inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:opacity-80', item.color)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-12 -mt-12 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        </div>
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
