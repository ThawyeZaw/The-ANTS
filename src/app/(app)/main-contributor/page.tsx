'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Star,
  CheckCircle,
  XCircle,
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
import { mockReviewQueue, getMainContributorDashboardStats } from '@/lib/mock/database';

// ── Icon & Color maps (replicated from DashboardLayout — PM-locked) ──────────

const iconMap: Record<string, React.ReactNode> = {
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

export default function MainContributorDashboard() {
  const { user } = useAuth();
  const { role, isMainContributor } = useRole();
  const router = useRouter();

  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (role && !isMainContributor) {
      router.replace(`/${role === 'main_contributor' ? 'main-contributor' : role}`);
    }
  }, [role, isMainContributor, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setPendingReviews(mockReviewQueue.filter((q) => q.status === 'pending'));
    setStats(getMainContributorDashboardStats(user.id));
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user || !isMainContributor) return null;

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "You have pending reviews waiting. Here's your gatekeeper overview.";

  const alertBanner =
    pendingReviews.length > 0 ? (
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 shadow-sm">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0 self-start sm:self-auto">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            {pendingReviews.length} submissions awaiting review
          </p>
          <p className="text-sm text-foreground-muted">
            Contributor curriculum, subject, or topic submissions need your approval.
          </p>
        </div>
        <Link href="/main-contributor/review-queue" className="shrink-0 self-start sm:self-auto">
          <button className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer shadow-md shadow-amber-500/10">
            Review Now
          </button>
        </Link>
      </div>
    ) : null;

  const mainContent = (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Pending Submissions
          </h2>
          <Link
            href="/main-contributor/review-queue"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All Queue →
          </Link>
        </div>

        {pendingReviews.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center text-foreground-muted">
            <p className="text-sm font-medium">No pending submissions in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReviews.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-4 bg-background-card/50 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-primary/45 transition-colors"
              >
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    {item.submission_type.toUpperCase()}
                  </span>
                  <h4 className="font-semibold text-sm text-foreground mt-2">
                    {item.submitted_data.title || item.submitted_data.name}
                  </h4>
                  <p className="text-xs text-foreground-muted mt-1">
                    Submitted · {new Date(item.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <Link href="/main-contributor/review-queue" className="self-start sm:self-auto shrink-0">
                  <button className="px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer">
                    Review Submission
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="space-y-3">
      <div className="glass rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-1.5 text-foreground text-sm">
            <ShieldCheck className="h-4 w-4 text-purple-500" />
            Review Policy
          </h3>
        </div>
        <div className="text-[11px] text-foreground-muted leading-relaxed space-y-1.5">
          <p>
            As a <strong>Main Contributor</strong>, you are responsible for maintaining curriculum and
            notes standards:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure curriculum names, syllabus codes, and exam boards align with official documents.</li>
            <li>Verify role upgrade reasons match verified educator credentials.</li>
            <li>Provide constructive feedback for rejected submissions.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in" data-scroll-behavior="smooth">
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-accent p-6 md:p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/70">Welcome back</p>
            <h1 className="mt-0.5 text-2xl md:text-3xl font-bold">{firstName} 👋</h1>
            <p className="mt-1 text-sm text-white/70 max-w-md">{welcomeSubtitle}</p>
          </div>
          <div className="hidden sm:flex items-center justify-center shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
              <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} className="md:w-[52px] md:h-[52px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {alertBanner && <div className="animate-slide-down">{alertBanner}</div>}

      {/* Quick Actions — Library & Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Stats Grid */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="glass rounded-xl p-3 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={cn('inline-flex p-1.5 rounded-lg mb-1.5', colorMap[stat.color] || 'text-foreground bg-foreground/10')}>
                {iconMap[stat.key] || <Star className="h-4 w-4" />}
              </div>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Workspace — upper position */}
      <Suspense fallback={<div className="flex items-center justify-center py-16 text-[var(--foreground-muted)]">Loading workspace...</div>}>
        <WorkspaceToastProvider>
          <MyWorkspace />
        </WorkspaceToastProvider>
      </Suspense>

      {/* Original dashboard content — below workspace */}
      <div className="border-t border-[var(--border)] pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">{mainContent}</div>
          <div className="space-y-6 lg:col-span-1">{sidebarContent}</div>
        </div>
      </div>
    </div>
  );
}
