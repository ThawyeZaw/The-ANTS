'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Flame,
  Zap,
  Clock,
  TrendingUp,
  GraduationCap,
  Users,
  FileText,
  CheckSquare,
  Star,
  Send,
  MessageSquare,
  UserCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  color: string;
  key: string;
}

interface CarouselSlide {
  greeting: string;
  nameLine: string;
  subtitle: string;
}

interface DashboardLayoutProps {
  firstName: string;
  welcomeSubtitle: string;
  stats?: StatItem[];
  alertBanner?: React.ReactNode;
  mainContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  /** Use 'three-column' for the redesigned dashboard with carousel + 3 equal columns */
  layoutVariant?: 'default' | 'three-column';
  leftColumn?: React.ReactNode;
  middleColumn?: React.ReactNode;
  rightColumn?: React.ReactNode;
  /** Optional custom carousel slides. Falls back to a single welcome slide. */
  carouselSlides?: CarouselSlide[];
}

const iconMap: Record<string, React.ReactNode> = {
  'study-streak': <Flame className="h-5 w-5" />,
  'cards-due': <Zap className="h-5 w-5" />,
  'next-exam': <Clock className="h-5 w-5" />,
  'avg-confidence': <TrendingUp className="h-5 w-5" />,

  'active-classrooms': <GraduationCap className="h-5 w-5" />,
  'total-students': <Users className="h-5 w-5" />,
  'pending-assignments': <FileText className="h-5 w-5" />,
  'completed-this-week': <CheckSquare className="h-5 w-5" />,

  'published': <Star className="h-5 w-5" />,
  'pending-review': <Send className="h-5 w-5" />,
  'clubs-led': <MessageSquare className="h-5 w-5" />,
  'profile-views': <UserCircle className="h-5 w-5" />,

  'pending-reviews': <AlertTriangle className="h-5 w-5" />,
  'approved-this-week': <CheckCircle className="h-5 w-5" />,
  'rejected-this-week': <XCircle className="h-5 w-5" />,
  'total-reviewed': <ShieldCheck className="h-5 w-5" />,
};

const colorMap: Record<string, string> = {
  orange: 'text-orange-500 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-500/20',
  violet: 'text-violet-500 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/20',
  red: 'text-red-500 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20',
  emerald: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
  mint: 'text-blue-500 bg-blue-500/10 dark:text-blue-300 dark:bg-blue-500/20',
  amber: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
  teal: 'text-teal-500 bg-teal-500/10 dark:text-teal-400 dark:bg-teal-500/20',
  pink: 'text-pink-500 bg-pink-500/10 dark:text-pink-400 dark:bg-pink-500/20',
  sky: 'text-sky-500 bg-sky-500/10 dark:text-sky-400 dark:bg-sky-500/20',
};

// ── Default carousel slides ──────────────────────────────────────────────────
function buildDefaultSlides(firstName: string, welcomeSubtitle: string): CarouselSlide[] {
  return [
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
}

export default function DashboardLayout({
  firstName,
  welcomeSubtitle,
  stats,
  alertBanner,
  mainContent,
  sidebarContent,
  layoutVariant = 'default',
  leftColumn,
  middleColumn,
  rightColumn,
  carouselSlides,
}: DashboardLayoutProps) {
  // ── Carousel state (three-column mode only) ────────────────────────────────
  const slides = carouselSlides ?? buildDefaultSlides(firstName, welcomeSubtitle);
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── Auto-sliding ────────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
  }, [slides.length]);

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

  // ── Three-Column Layout ────────────────────────────────────────────────────
  if (layoutVariant === 'three-column') {
    return (
      <div className="flex flex-col h-full animate-fade-in" data-scroll-behavior="smooth">
        {/* ── Compact Hero Banner ──────────────────────────────────────────── */}
        <div className="dash-carousel">
          {/* Track */}
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

        {/* Alert Banner if present */}
        {alertBanner && (
          <div className="animate-slide-down shrink-0">
            {alertBanner}
          </div>
        )}

        {/* ── Three-Column Content Grid — fills remaining viewport ────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 mt-6">
          {/* Left Column */}
          <div className="space-y-4 overflow-y-auto min-h-0">
            {leftColumn}
          </div>

          {/* Middle Column */}
          <div className="space-y-4 overflow-y-auto min-h-0">
            {middleColumn}
          </div>

          {/* Right Column */}
          <div className="space-y-4 overflow-y-auto min-h-0">
            {rightColumn}
          </div>
        </div>
      </div>
    );
  }

  // ── Default Layout (original) ───────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in" data-scroll-behavior="smooth">
      {/* Welcome Card — clean gradient, no patterns */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-accent p-6 md:p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/70">Welcome back</p>
            <h1 className="mt-0.5 text-2xl md:text-3xl font-bold">{firstName} 👋</h1>
            <p className="mt-1 text-sm text-white/70 max-w-md">
              {welcomeSubtitle}
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-4xl">
              🐜
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner if present */}
      {alertBanner && (
        <div className="animate-slide-down">
          {alertBanner}
        </div>
      )}

      {/* Metrics Stats Grid */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={cn('inline-flex p-2 rounded-xl mb-3', colorMap[stat.color] || 'text-foreground bg-foreground/10')}>
                {iconMap[stat.key] || <Star className="h-5 w-5" />}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-foreground-muted mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Split Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Grid Area */}
        <div className="space-y-6 lg:col-span-2 rounded-2xl p-0.5">
          {mainContent}
        </div>

        {/* Sidebar Grid Area */}
        <div className="space-y-6 lg:col-span-1 rounded-2xl p-0.5">
          {sidebarContent}
        </div>
      </div>
    </div>
  );
}
