'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Curriculum Hub Landing
// Route: /curriculum
// Board selector: 4 curriculum cards (CAIE IGCSE, CAIE A Level, Edexcel IGCSE, Edexcel IAL)
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, BookOpen, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCurriculums, type CurriculumWithStats } from '@/actions/curriculum';
import { cn } from '@/lib/utils';

// ── Board color map ────────────────────────────────────────────────────────────

const BOARD_COLORS: Record<string, { from: string; to: string; accent: string; badge: string }> = {
  CAIE_IGCSE:    { from: 'from-violet-500/20', to: 'to-purple-500/10', accent: 'border-violet-500/30', badge: 'bg-violet-500/15 text-violet-500' },
  CAIE_ALEVEL:   { from: 'from-blue-500/20',   to: 'to-cyan-500/10',   accent: 'border-blue-500/30',   badge: 'bg-blue-500/15 text-blue-500' },
  EDEXCEL_IGCSE: { from: 'from-emerald-500/20',to: 'to-teal-500/10',  accent: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-500' },
  EDEXCEL_IAL:   { from: 'from-amber-500/20',  to: 'to-orange-500/10', accent: 'border-amber-500/30',  badge: 'bg-amber-500/15 text-amber-600' },
};

const BOARD_DESCRIPTIONS: Record<string, string> = {
  CAIE_IGCSE:    'Cambridge Assessment International Education — IGCSE syllabi for grades 9–10.',
  CAIE_ALEVEL:   'Cambridge International AS & A Levels — advanced academic qualification.',
  EDEXCEL_IGCSE: 'Pearson Edexcel International GCSE (9-1) — UK-standard global qualification.',
  EDEXCEL_IAL:   'Pearson Edexcel International Advanced Levels — modular unit-based qualification.',
};

const BOARD_SHORT: Record<string, string> = {
  CAIE_IGCSE: 'CAIE',
  CAIE_ALEVEL: 'CAIE',
  EDEXCEL_IGCSE: 'Edexcel',
  EDEXCEL_IAL: 'Edexcel',
};

// ── Board Card ─────────────────────────────────────────────────────────────────

function BoardCard({ curriculum }: { curriculum: CurriculumWithStats }) {
  const colors = BOARD_COLORS[curriculum.code] ?? {
    from: 'from-primary/20', to: 'to-primary/5', accent: 'border-primary/30', badge: 'bg-primary/15 text-primary',
  };

  return (
    <Link
      href={`/curriculum/${curriculum.id}`}
      className={cn(
        'group relative flex flex-col gap-4 rounded-2xl border p-6 overflow-hidden',
        'bg-gradient-to-br', colors.from, colors.to,
        'border-border/60', colors.accent,
        'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      {/* Enrollment badge */}
      {curriculum.isEnrolled && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Enrolled
        </span>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', colors.badge)}>
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className={cn('text-[10px] font-bold uppercase tracking-widest', colors.badge.split(' ')[1])}>
            {BOARD_SHORT[curriculum.code] ?? 'Board'}
          </span>
          <h2 className="text-base font-bold text-foreground leading-tight mt-0.5 line-clamp-2">
            {curriculum.name}
          </h2>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-foreground-muted leading-relaxed flex-1 line-clamp-3">
        {BOARD_DESCRIPTIONS[curriculum.code] ?? curriculum.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <BookOpen className="h-3.5 w-3.5" />
          {curriculum.subjectCount} subject{curriculum.subjectCount !== 1 ? 's' : ''}
        </span>
        <ChevronRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background-card p-6 animate-pulse space-y-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-xl bg-foreground-muted/10" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 rounded bg-foreground-muted/10" />
          <div className="h-5 w-40 rounded bg-foreground-muted/15" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3.5 w-full rounded bg-foreground-muted/10" />
        <div className="h-3.5 w-4/5 rounded bg-foreground-muted/10" />
        <div className="h-3.5 w-3/5 rounded bg-foreground-muted/10" />
      </div>
      <div className="h-px bg-border/40" />
      <div className="h-3 w-24 rounded bg-foreground-muted/10" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CurriculumPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [curriculums, setCurriculums] = useState<CurriculumWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCurriculums([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getCurriculums(user.id)
      .then((data) => {
        if (!cancelled) setCurriculums(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Study Hub
          </div>
          <h1 className="text-3xl font-bold text-foreground">Curriculum</h1>
          <p className="text-foreground-muted text-sm leading-relaxed max-w-prose">
            Select an exam board to explore subjects, track topics, and manage your past paper practice.
          </p>
        </div>

        {/* Board grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <BoardSkeleton key={i} />)
            : curriculums.map((c) => <BoardCard key={c.id} curriculum={c} />)}
        </div>
      </div>
    </div>
  );
}
