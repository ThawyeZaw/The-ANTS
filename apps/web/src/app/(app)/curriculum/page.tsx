'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Plus,
  Calendar,
  CheckCircle2,
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
import { cn } from '@/lib/utils';
import { DEFAULT_EXAM_SESSION } from '@/lib/grading';
import type { AwardLevel, PaperPreferences } from '@/lib/exam-papers/myanmar-papers';

const BOARD_COLORS: Record<string, { from: string; to: string; accent: string; badge: string }> = {
  CAIE_IGCSE: { from: 'from-violet-500/20', to: 'to-purple-500/10', accent: 'border-violet-500/30', badge: 'bg-violet-500/15 text-violet-500' },
  CAIE_ALEVEL: { from: 'from-blue-500/20', to: 'to-cyan-500/10', accent: 'border-blue-500/30', badge: 'bg-blue-500/15 text-blue-500' },
  EDEXCEL_IGCSE: { from: 'from-emerald-500/20', to: 'to-teal-500/10', accent: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-500' },
  EDEXCEL_IAL: { from: 'from-amber-500/20', to: 'to-orange-500/10', accent: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-600' },
};

type HubTab = 'mine' | 'add';

export default function CurriculumPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<HubTab>('mine');
  const [hubSubjects, setHubSubjects] = useState<HubSubject[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const [hub, boards] = await Promise.all([
        user ? getMySubjectsHub(user.id) : Promise.resolve({ subjects: [], defaultExamSeries: DEFAULT_EXAM_SESSION }),
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



  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Study Hub
          </div>
          <h1 className="text-3xl font-bold text-foreground">My Subjects</h1>
          <p className="text-foreground-muted text-sm leading-relaxed max-w-prose">
            Enrolled subjects across every board, with shortcuts to past papers, grade calculator, and exam countdown.
          </p>
        </div>



        <div className="flex gap-2 border-b border-border">
          {([
            { id: 'mine' as const, label: 'My Subjects', count: hubSubjects.length },
            { id: 'add' as const, label: 'Explore subjects' },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px',
                tab === t.id ? 'border-primary text-primary font-semibold' : 'border-transparent text-foreground-muted'
              )}
            >
              {t.label}
              {'count' in t && t.count !== undefined ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {tab === 'mine' && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl border border-border animate-pulse bg-background-card" />
                ))}
              </div>
            ) : hubSubjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
                <GraduationCap className="h-10 w-10 mx-auto text-foreground-muted opacity-40" />
                <p className="font-semibold text-foreground">No subjects enrolled yet</p>
                <p className="text-sm text-foreground-muted">Browse a board and add the syllabi you are sitting.</p>
                <button
                  onClick={() => setTab('add')}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Add subjects
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hubSubjects.map((s) => (
                  <SubjectHubCard
                    key={s.id}
                    subject={s}
                    onUnenroll={handleUnenroll}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="space-y-4">
            <p className="text-sm text-foreground-muted">
              Pick an exam board, then enroll catalog subjects. Custom subjects are not supported — add a custom countdown instead if you need an extra date.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {curriculums.map((c) => {
                const colors = BOARD_COLORS[c.code] ?? {
                  from: 'from-primary/20',
                  to: 'to-primary/5',
                  accent: 'border-primary/30',
                  badge: 'bg-primary/15 text-primary',
                };
                return (
                  <Link
                    key={c.id}
                    href={`/curriculum/${c.id}`}
                    className={cn(
                      'group relative flex flex-col gap-4 rounded-2xl border p-6 overflow-hidden bg-gradient-to-br',
                      colors.from,
                      colors.to,
                      colors.accent,
                      'hover:border-primary/40 hover:shadow-lg transition-all'
                    )}
                  >
                    {c.isEnrolled && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Enrolled
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', colors.badge)}>
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-foreground">{c.name}</h2>
                        <p className="text-xs text-foreground-muted mt-1 line-clamp-2">{c.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground-muted pt-2 border-t border-border/40">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        {c.subjectCount} subjects
                      </span>
                      <span className="font-semibold text-primary">Browse catalog</span>
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
