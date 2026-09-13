'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Resources Hub
// Route: /library — accessible to all authenticated users.
// Cleaned up: Courses & Exams now live in /curriculum and /past-papers.
// URL-driven category state with automatic redirects for legacy tabs.
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense, useEffect } from 'react';
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
  BookOpen,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { cn } from '@/lib/utils';

// ── Main Hub Cards ────────────────────────────────────────────────────────────

interface HubCard {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
  itemCount?: string;
}

const HUB_CARDS: HubCard[] = [
  {
    title: 'Curriculum Hub',
    subtitle: 'Exam Boards & Syllabi',
    description: 'Explore Cambridge & Edexcel qualifications, browse subjects, and track topic progress',
    icon: GraduationCap,
    href: '/curriculum',
    badge: 'Core Hub',
    itemCount: '4 Exam Boards',
  },
  {
    title: 'Past Paper Tracker',
    subtitle: 'Excel-Style Grid & Grades',
    description: 'Record solved past papers, monitor grades, UMS points, and track your revision progress',
    icon: BookOpen,
    href: '/past-papers',
    badge: 'Study Tool',
    itemCount: 'Paper Matrices',
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
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (tab === 'courses') {
      router.replace('/curriculum');
    } else if (tab === 'exams') {
      router.replace('/past-papers');
    }
  }, [tab, router]);

  return (
    <div className="animate-fade-in min-h-[75vh] pb-12 space-y-6">
      {/* Header Banner */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide uppercase">
                <BookOpen className="h-3 w-3" />
                Study &amp; Learning Hub
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
              Resource Center
            </h1>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Access your curriculum specs, syllabus progress, past paper trackers, and study tools.
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-5 shrink-0 self-start sm:self-auto">
            <div className="text-center">
              <p className="text-xl font-semibold text-foreground">4</p>
              <p className="text-[11px] text-foreground-muted">Boards</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-foreground">4+</p>
              <p className="text-[11px] text-foreground-muted">Tools</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hubs */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider px-1">
          Academic Hubs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {HUB_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={cn(
                'group relative flex flex-col justify-between p-6 rounded-2xl text-left',
                'border border-border/80 bg-background-card',
                'transition-colors duration-200',
                'hover:border-border-hover hover:bg-background-secondary',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <AppIcon icon={card.icon} size="lg" tone="secondary" frame="soft" />
                  {card.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                      {card.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <span className="text-xs text-foreground-muted font-medium">
                      &middot; {card.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground-muted">{card.itemCount}</span>
                <span className="font-semibold text-foreground-secondary group-hover:text-primary transition-colors inline-flex items-center gap-1">
                  Open Hub <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tools Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" /> Study Tools &amp; Utilities
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 rounded-2xl bg-background-card border border-border/80">
        <AppIcon icon={Sparkles} size="sm" tone="primary" />
        <span className="text-xs font-medium text-foreground-muted">Quick Navigation:</span>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <Link
            href="/curriculum"
            className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Curriculum
          </Link>
          <Link
            href="/past-papers"
            className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Past Papers
          </Link>
          <Link
            href="/countdown"
            className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Exam Countdown
          </Link>
          <Link
            href="/calculator"
            className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Grade Calculator
          </Link>
        </div>
      </div>
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
