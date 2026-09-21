'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Plus,
  Calendar,
  CheckCircle2,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getCurriculums,
  getMySubjectsHub,
  unenrollFromSubject,
  updateEnrollmentSettings,
  type CurriculumWithStats,
  type HubSubject,
} from '@/actions/curriculum';
import { SubjectHubCard } from '@/components/curriculum/SubjectHubCard';
import { IalGroupedHubCard } from '@/components/curriculum/IalGroupedHubCard';
import { groupEdexcelIalSubjects, type GroupedSubject } from '@/lib/edexcel-ial';
import { cn } from '@/lib/utils';
import { DEFAULT_EXAM_SESSION } from '@/lib/grading';
import type { AwardLevel, PaperPreferences } from '@/lib/exam-papers/myanmar-papers';

const BOARD_CONFIG: Record<string, {
  from: string; to: string; accent: string; badge: string; iconBg: string;
}> = {
  CAIE_IGCSE: {
    from: 'from-violet-500/15', to: 'to-purple-600/5', accent: 'border-violet-500/30',
    badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/15 border-violet-500/30',
  },
  CAIE_ALEVEL: {
    from: 'from-blue-500/15', to: 'to-cyan-600/5', accent: 'border-blue-500/30',
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/15 border-blue-500/30',
  },
  EDEXCEL_IGCSE: {
    from: 'from-emerald-500/15', to: 'to-teal-600/5', accent: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30',
  },
  EDEXCEL_IAL: {
    from: 'from-amber-500/15', to: 'to-orange-600/5', accent: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-500',
    iconBg: 'bg-amber-500/15 border-amber-500/30',
  },
};

const DEFAULT_BOARD = {
  from: 'from-primary/15', to: 'to-primary/5', accent: 'border-primary/30',
  badge: 'bg-primary/15 text-primary', iconBg: 'bg-primary/15 border-primary/30',
};

type HubTab = 'mine' | 'add';

export default function CurriculumPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<HubTab>('mine');
  const [hubSubjects, setHubSubjects] = useState<HubSubject[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const [hub, boards] = await Promise.all([
        user
          ? getMySubjectsHub(user.id)
          : Promise.resolve({ subjects: [], defaultExamSeries: DEFAULT_EXAM_SESSION }),
        getCurriculums(user?.id),
      ]);
      setHubSubjects(hub.subjects);
      setCurriculums(boards);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [user?.id, authLoading]);

  const handleUnenroll = async (s: HubSubject) => {
    if (!user) return;
    if (!confirm(`Remove ${s.name} from your study plan? Past paper records are kept.`)) return;
    await unenrollFromSubject(user.id, s.id);
    await reload();
  };

  const handleUpdate = async (
    subjectId: string,
    patch: {
      targetSeries?: string;
      tier?: 'core' | 'extended' | null;
      targetGrade?: string | null;
      awardLevel?: AwardLevel | null;
      paperPreferences?: PaperPreferences | null;
    }
  ) => {
    if (!user) return;
    await updateEnrollmentSettings(user.id, subjectId, patch);
    await reload();
  };

  const groupedHub = useMemo(() => groupEdexcelIalSubjects(hubSubjects), [hubSubjects]);

  const handleUnenrollGroup = async (group: GroupedSubject<HubSubject>) => {
    if (!user) return;
    if (!confirm(`Remove ${group.title} from your study plan? Past paper records are kept.`)) return;
    for (const unit of group.units) {
      if (unit.isEnrolled) {
        await unenrollFromSubject(user.id, unit.id);
      }
    }
    await reload();
  };

  const handleUpdateGroup = async (
    group: GroupedSubject<HubSubject>,
    patch: {
      targetSeries?: string;
      targetGrade?: string | null;
      awardLevel?: AwardLevel | null;
      paperPreferences?: PaperPreferences | null;
    }
  ) => {
    if (!user) return;
    for (const unit of group.units.filter((u) => u.isEnrolled)) {
      await updateEnrollmentSettings(user.id, unit.id, patch);
    }
    await reload();
  };

  const filteredGroups = search.trim()
    ? groupedHub.filter(
        (g) =>
          g.title.toLowerCase().includes(search.toLowerCase()) ||
          g.code.toLowerCase().includes(search.toLowerCase()) ||
          g.units.some(
            (u) =>
              (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
              (u.code ?? '').toLowerCase().includes(search.toLowerCase())
          )
      )
    : groupedHub;

  return (
    <div className="min-h-screen bg-background transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground-muted uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Study Hub
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Curriculum</h1>
          <p className="text-foreground-muted text-sm leading-relaxed max-w-prose">
            Enrolled subjects across every board — past papers, grade calculator, and exam countdown in one place.
          </p>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-background-secondary rounded-2xl w-fit">
          {([
            { id: 'mine' as const, label: 'My Subjects', count: groupedHub.length },
            { id: 'add' as const, label: 'Explore Boards' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                tab === t.id
                  ? 'bg-background-card text-foreground shadow-xs'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              {t.label}
              {'count' in t && t.count !== undefined ? (
                <span className={cn(
                  'ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                  tab === t.id ? 'bg-primary/10 text-primary' : 'bg-border text-foreground-muted'
                )}>
                  {t.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── My Subjects tab ──────────────────────────────────────────── */}
        {tab === 'mine' && (
          <div className="space-y-4">
            {/* Search bar */}
            {hubSubjects.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or code…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background-card text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-2xl border border-border animate-pulse bg-background-card" />
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              hubSubjects.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3">
                  <GraduationCap className="h-12 w-12 mx-auto text-foreground-muted opacity-30" />
                  <p className="font-bold text-foreground">No subjects enrolled yet</p>
                  <p className="text-sm text-foreground-muted">Browse a board and add the syllabi you are sitting.</p>
                  <button
                    onClick={() => setTab('add')}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-4 w-4" /> Explore Boards
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-border p-8 text-center">
                  <p className="text-sm text-foreground-muted">No subjects match &quot;{search}&quot;</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredGroups.map((g) =>
                  g.isVirtual ? (
                    <IalGroupedHubCard
                      key={g.id}
                      group={g}
                      onUnenroll={handleUnenrollGroup}
                      onUpdate={handleUpdateGroup}
                    />
                  ) : (
                    <SubjectHubCard
                      key={g.units[0].id}
                      subject={g.units[0]}
                      onUnenroll={handleUnenroll}
                      onUpdate={handleUpdate}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Explore Boards tab ───────────────────────────────────────── */}
        {tab === 'add' && (
          <div className="space-y-4">
            <p className="text-sm text-foreground-muted">
              Pick an exam board, then enroll catalog subjects. Custom countdowns can be added separately if needed.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {curriculums.map((c) => {
                const cfg = BOARD_CONFIG[c.code] ?? DEFAULT_BOARD;
                return (
                  <Link
                    key={c.id}
                    href={`/curriculum/${c.id}`}
                    className={cn(
                      'group relative flex flex-col gap-4 rounded-2xl border p-6 overflow-hidden bg-gradient-to-br',
                      cfg.from, cfg.to, cfg.accent,
                      'hover:shadow-lg transition-all duration-200'
                    )}
                  >
                    {c.isEnrolled && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Enrolled
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={cn('flex items-center justify-center w-11 h-11 rounded-2xl border', cfg.iconBg)}>
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-foreground">{c.name}</h2>
                        <p className="text-xs text-foreground-muted mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground-muted pt-2 border-t border-border/40">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        {c.subjectCount} subjects available
                      </span>
                      <span className="font-bold text-primary group-hover:underline">Browse catalog →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
