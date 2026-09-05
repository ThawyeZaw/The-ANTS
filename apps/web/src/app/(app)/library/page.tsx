'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Resources Hub
// Route: /library — accessible to all authenticated users.
// Category grid: Courses, Exams, and Tools.
// URL-driven category state: /library?tab=courses|exams|tools
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  Calculator,
  CalendarDays,
  Timer,
  GraduationCap,
  ArrowRight,
  Sparkles,
  FlaskConical,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CoursesLibraryBrowser from '@/components/library/CoursesLibraryBrowser';
import ExamsLibraryBrowser from '@/components/library/ExamsLibraryBrowser';

// ── Category Definition ───────────────────────────────────────────────────────

type CategoryId = 'courses' | 'exams' | 'tools';

interface MainCategoryCard {
  id: CategoryId;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  borderGlow: string;
  badge?: string;
  itemCount?: string;
}

const MAIN_CATEGORIES: MainCategoryCard[] = [
  {
    id: 'courses',
    title: 'Courses',
    subtitle: 'Curriculum & Subjects',
    description: 'Explore exam boards, syllabus specs & enroll in structured courses',
    icon: <GraduationCap className="h-7 w-7 text-emerald-400" />,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent hover:from-emerald-500/30 hover:via-teal-500/15',
    borderGlow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    badge: 'Core Hub',
    itemCount: 'Exam Boards & Syllabi',
  },
  {
    id: 'exams',
    title: 'Exams',
    subtitle: 'Papers & Schedule',
    description: 'Track upcoming official exam dates, past papers and key assessments',
    icon: <FlaskConical className="h-7 w-7 text-rose-400" />,
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent hover:from-rose-500/30 hover:via-pink-500/15',
    borderGlow: 'hover:border-rose-500/40 hover:shadow-rose-500/10',
    itemCount: 'Timetables & Papers',
  },
  {
    id: 'tools',
    title: 'Tools',
    subtitle: 'Study Utilities',
    description: 'Boost productivity with Pomodoro, Grade Calculators & Timetables',
    icon: <Clock className="h-7 w-7 text-sky-400" />,
    gradient: 'from-sky-500/20 via-blue-500/10 to-transparent hover:from-sky-500/30 hover:via-sky-500/15',
    borderGlow: 'hover:border-sky-500/40 hover:shadow-sky-500/10',
    itemCount: 'Productivity Apps',
  },
];

// ── Tool Items ────────────────────────────────────────────────────────────────

interface ToolItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accentColor: string;
  isNew?: boolean;
}

const TOOLS: ToolItem[] = [
  {
    id: 'countdown',
    label: 'Exam Countdown',
    description: 'Track time until your important exams',
    href: '/countdown',
    icon: <Clock className="h-5 w-5" />,
    accentColor: 'from-sky-500 to-blue-500',
  },
  {
    id: 'calculator',
    label: 'Grade Calculator',
    description: 'Predict grades by qualification & components',
    href: '/calculator',
    icon: <Calculator className="h-5 w-5" />,
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    description: 'Organize your weekly study schedule',
    href: '/timetable',
    icon: <CalendarDays className="h-5 w-5" />,
    accentColor: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Timer',
    description: 'Stay focused with timed study sessions',
    href: '/pomodoro',
    icon: <Timer className="h-5 w-5" />,
    accentColor: 'from-rose-500 to-red-500',
  },
];

// ── Tool Card Component ───────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <Link
      href={tool.href}
      className={cn(
        'group relative flex items-start gap-3.5 p-4 rounded-2xl border border-border/80',
        'bg-background-card hover:bg-background-secondary hover:border-border',
        'transition-all duration-200 shadow-sm hover:shadow-md'
      )}
    >
      <div
        className={cn(
          'inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5',
          'bg-gradient-to-br text-white shadow-sm',
          tool.accentColor
        )}
      >
        {tool.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{tool.label}</h3>
          {tool.isNew && (
            <span className="text-[9px] font-bold uppercase tracking-wide bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-foreground-muted mt-1 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
    </Link>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('tab') as CategoryId | null;
  const isCategorySelected = activeCategory && MAIN_CATEGORIES.some((cat) => cat.id === activeCategory);

  const selectCategory = (categoryId: CategoryId | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!categoryId) {
      params.delete('tab');
    } else {
      params.set('tab', categoryId);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  };

  const selectedCategoryObj = MAIN_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="animate-fade-in min-h-[75vh] pb-12 space-y-5">
      {/* ── Unified Header Section ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 p-5 sm:p-6">
        <div className="space-y-3">
          {/* ── Breadcrumb trail (main nav indicator) ───────────────────────── */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
            <button
              onClick={() => selectCategory(null)}
              className="font-medium text-foreground-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
            >
              {isCategorySelected && <ChevronLeft className="h-3.5 w-3.5" />}
              Categories
            </button>
            {isCategorySelected && (
              <>
                <span className="text-foreground-muted/40">/</span>
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  {selectedCategoryObj?.icon}
                  {selectedCategoryObj?.title}
                </span>
              </>
            )}
          </nav>

          {/* ── Combined compact header ───────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide uppercase">
                  <Sparkles className="h-3 w-3" />
                  Study &amp; Learning Hub
                </div>
                {isCategorySelected && (
                  <span className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wide">
                    &middot; Resource Center
                  </span>
                )}
                {isCategorySelected && selectedCategoryObj?.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                    {selectedCategoryObj.badge}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
                {isCategorySelected ? (
                  <span className="flex items-center gap-2">
                    {selectedCategoryObj?.title}
                    <span className="text-sm font-normal text-foreground-muted">
                      &middot; {selectedCategoryObj?.subtitle}
                    </span>
                  </span>
                ) : (
                  'Resource Library'
                )}
              </h1>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {isCategorySelected
                  ? selectedCategoryObj?.description
                  : 'Choose a category below to explore curated courses, exams, and productivity tools.'}
              </p>
            </div>

            {!isCategorySelected && (
              <div className="flex items-center gap-4 sm:gap-5 shrink-0 self-start sm:self-auto">
                <div className="text-center">
                  <p className="text-xl font-semibold text-foreground">3</p>
                  <p className="text-[11px] text-foreground-muted">Categories</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-foreground">4+</p>
                  <p className="text-[11px] text-foreground-muted">Tools</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Content: Card Grid OR Category Detail Browser */}
      {!isCategorySelected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Select a Resource Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MAIN_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className={cn(
                  'group relative flex flex-col justify-between p-6 rounded-2xl cursor-pointer',
                  'border border-border/80 bg-background-card',
                  'bg-gradient-to-br', cat.gradient,
                  'transition-all duration-300 ease-out',
                  'hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5',
                  cat.borderGlow
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3.5 rounded-2xl bg-background-card/80 border border-border/50 shadow-sm group-hover:scale-110 group-hover:bg-background-card transition-all duration-300">
                      {cat.icon}
                    </div>

                    {cat.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {cat.title}
                      </h3>
                      <span className="text-xs text-foreground-muted font-medium">
                        &middot; {cat.subtitle}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground-muted">{cat.itemCount}</span>
                  <span className="font-semibold text-foreground-secondary group-hover:text-primary transition-colors inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-3 px-5 py-3.5 rounded-2xl bg-background-card border border-border/80 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground-muted">Quick Navigation:</span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <Link
                href="/library?tab=courses"
                className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/library?tab=exams"
                className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors"
              >
                Exams
              </Link>
              <Link
                href="/countdown"
                className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors"
              >
                Exam Timetable
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {activeCategory === 'courses' && (
            <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
              <CoursesLibraryBrowser />
            </Suspense>
          )}

          {activeCategory === 'exams' && (
            <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
              <ExamsLibraryBrowser />
            </Suspense>
          )}

          {activeCategory === 'tools' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-indigo-500/10 px-5 py-4">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold text-foreground tracking-tight">
                    Study Tools &amp; Utilities
                  </h2>
                  <p className="text-xs text-foreground-secondary max-w-md">
                    Productivity tools designed to boost your daily study efficiency
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {TOOLS.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Exported Page (wrapped in Suspense for useSearchParams) ────────────────────

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-background-secondary animate-pulse" />}>
      <LibraryPageInner />
    </Suspense>
  );
}
