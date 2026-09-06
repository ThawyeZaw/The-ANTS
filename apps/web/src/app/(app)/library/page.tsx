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
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
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
  icon: LucideIcon;
  badge?: string;
  itemCount?: string;
}

const MAIN_CATEGORIES: MainCategoryCard[] = [
  {
    id: 'courses',
    title: 'Courses',
    subtitle: 'Curriculum & Subjects',
    description: 'Explore exam boards, syllabus specs & enroll in structured courses',
    icon: GraduationCap,
    badge: 'Core Hub',
    itemCount: 'Exam Boards & Syllabi',
  },
  {
    id: 'exams',
    title: 'Exams',
    subtitle: 'Papers & Schedule',
    description: 'Track upcoming official exam dates, past papers and key assessments',
    icon: FlaskConical,
    itemCount: 'Timetables & Papers',
  },
  {
    id: 'tools',
    title: 'Tools',
    subtitle: 'Study Utilities',
    description: 'Boost productivity with Pomodoro, Grade Calculators & Timetables',
    icon: Clock,
    itemCount: 'Productivity Apps',
  },
];

// ── Tool Items ────────────────────────────────────────────────────────────────

interface ToolItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  isNew?: boolean;
}

const TOOLS: ToolItem[] = [
  {
    id: 'countdown',
    label: 'Exam Countdown',
    description: 'Track time until your important exams',
    href: '/countdown',
    icon: Clock,
  },
  {
    id: 'calculator',
    label: 'Grade Calculator',
    description: 'Predict grades by qualification & components',
    href: '/calculator',
    icon: Calculator,
  },
  {
    id: 'timetable',
    label: 'Timetable',
    description: 'Organize your weekly study schedule',
    href: '/timetable',
    icon: CalendarDays,
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Timer',
    description: 'Stay focused with timed study sessions',
    href: '/pomodoro',
    icon: Timer,
  },
];

// ── Tool Card Component ───────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <Link
      href={tool.href}
      className={cn(
        'group relative flex items-start gap-3.5 p-4 rounded-2xl border border-border/80',
        'bg-background-card hover:bg-background-secondary hover:border-border-hover',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      <AppIcon icon={tool.icon} size="md" tone="secondary" frame="soft" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{tool.label}</h3>
          {tool.isNew && (
            <span className="text-[9px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
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
      <div className="overflow-hidden rounded-2xl border border-border bg-background-card p-5 sm:p-6">
        <div className="space-y-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => selectCategory(null)}
              className="font-medium text-foreground-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            >
              {isCategorySelected && <ChevronLeft className="h-3.5 w-3.5" />}
              Categories
            </button>
            {isCategorySelected && selectedCategoryObj && (
              <>
                <span className="text-foreground-muted/40">/</span>
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <AppIcon icon={selectedCategoryObj.icon} size="sm" tone="primary" />
                  {selectedCategoryObj.title}
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide uppercase">
                  <BookOpen className="h-3 w-3" />
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

      {!isCategorySelected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Select a Resource Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MAIN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={cn(
                  'group relative flex flex-col justify-between p-6 rounded-2xl text-left cursor-pointer',
                  'border border-border/80 bg-background-card',
                  'transition-colors duration-200',
                  'hover:border-border-hover hover:bg-background-secondary',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <AppIcon icon={cat.icon} size="lg" tone="secondary" frame="soft" />

                    {cat.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
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
                  <span className="font-semibold text-foreground-secondary group-hover:text-primary transition-colors inline-flex items-center gap-1">
                    View <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 px-5 py-3.5 rounded-2xl bg-background-card border border-border/80">
            <AppIcon icon={Sparkles} size="sm" tone="primary" />
            <span className="text-xs font-medium text-foreground-muted">Quick Navigation:</span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <Link
                href="/library?tab=courses"
                className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Courses
              </Link>
              <Link
                href="/library?tab=exams"
                className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Exams
              </Link>
              <Link
                href="/countdown"
                className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
              <div className="rounded-2xl border border-border bg-background-card px-5 py-4">
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

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-background-secondary animate-pulse" />}>
      <LibraryPageInner />
    </Suspense>
  );
}
