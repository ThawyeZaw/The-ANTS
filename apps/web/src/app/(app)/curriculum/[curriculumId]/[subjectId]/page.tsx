'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Subject Detail Page
// Route: /curriculum/[curriculumId]/[subjectId]
// Tabs: Topic Tracker (default) | Past Papers (Excel grid)
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ClipboardCheck, BookOpen, GraduationCap, ArrowLeft, Calculator, Timer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getSubjectsByCurriculum,
  getSubjectTopicsWithProgress,
  getPaperGridData,
  type SubjectWithProgress,
  type TopicWithProgress,
  type PaperGridData,
} from '@/actions/curriculum';
import { TopicTracker } from '@/components/curriculum/TopicTracker';
import { PaperGrid } from '@/components/past-papers/PaperGrid';
import { cn } from '@/lib/utils';

type Tab = 'topics' | 'papers';

const CURRICULUM_LABELS: Record<string, string> = {
  'curr-caie-igcse':    'Cambridge IGCSE',
  'curr-caie-alevel':   'Cambridge A Level',
  'curr-edexcel-igcse': 'Pearson Edexcel IGCSE',
  'curr-edexcel-ial':   'Pearson Edexcel IAL',
};

export default function SubjectDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ curriculumId: string; subjectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const curriculumId = params.curriculumId;
  const subjectId = params.subjectId;

  const activeTab = (searchParams.get('tab') as Tab | null) ?? 'topics';

  const [subject, setSubject] = useState<SubjectWithProgress | null>(null);
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [paperGridData, setPaperGridData] = useState<PaperGridData | null>(null);
  const [loadingPapers, setLoadingPapers] = useState(false);

  const setTab = (tab: Tab) => {
    const p = new URLSearchParams(searchParams.toString());
    if (tab === 'topics') {
      p.delete('tab');
    } else {
      p.set('tab', tab);
    }
    router.replace(`/curriculum/${curriculumId}/${subjectId}?${p.toString()}`);
  };

  // Load subject metadata & topics (initial mount only)
  const loadSubjectData = useCallback(async (showLoader = true) => {
    if (!user || !curriculumId || !subjectId) return;

    try {
      if (showLoader) setLoadingTopics(true);
      const [allSubjects, topicList] = await Promise.all([
        getSubjectsByCurriculum(curriculumId, user.id),
        getSubjectTopicsWithProgress(subjectId, user.id),
      ]);

      const found = allSubjects.find((s) => s.id === subjectId);
      setSubject(found ?? null);
      setTopics(topicList);
    } finally {
      if (showLoader) setLoadingTopics(false);
    }
  }, [user, curriculumId, subjectId]);

  useEffect(() => {
    loadSubjectData(true);
  }, [loadSubjectData]);

  // Load paper grid when tab = papers (initial tab switch only)
  const loadPapers = useCallback(async (showLoader = true) => {
    if (!user || !subjectId) return;
    if (showLoader) setLoadingPapers(true);
    try {
      const data = await getPaperGridData(user.id, subjectId);
      setPaperGridData(data);
    } finally {
      if (showLoader) setLoadingPapers(false);
    }
  }, [user, subjectId]);

  useEffect(() => {
    if (activeTab === 'papers' && !paperGridData) loadPapers(true);
  }, [activeTab, loadPapers, paperGridData]);

  const color = subject?.color_code ?? '#6366f1';
  const curriculumLabel = CURRICULUM_LABELS[curriculumId] ?? 'Curriculum';

  return (
    <div className="min-h-screen bg-background transition-colors pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-foreground-muted flex-wrap">
          <Link href="/curriculum" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Curriculum
          </Link>
          <span>/</span>
          <Link href={`/curriculum/${curriculumId}`} className="hover:text-foreground transition-colors">
            {curriculumLabel}
          </Link>
          {subject && (
            <>
              <span>/</span>
              <span className="text-foreground font-medium">{subject.name}</span>
            </>
          )}
        </nav>

        {/* Subject header */}
        <div className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-background-card">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <GraduationCap className="h-6 w-6" style={{ color }} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {subject && (
              <span
                className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full inline-block border"
                style={{
                  backgroundColor: `${color}15`,
                  color,
                  borderColor: `${color}30`,
                }}
              >
                {subject.code}
              </span>
            )}
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {subject?.name ?? <span className="animate-pulse bg-foreground-muted/15 rounded w-48 h-7 inline-block" />}
            </h1>
            <p className="text-xs text-foreground-muted">{curriculumLabel} &middot; Syllabus Specification</p>
            {subject && (
              <div className="flex flex-wrap gap-2 pt-3">
                <Link
                  href={`/past-papers?subject=${subject.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold hover:border-primary/40"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Past Papers
                </Link>
                <Link
                  href={`/calculator?curriculum=${curriculumId}&subject=${subject.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold hover:border-primary/40"
                >
                  <Calculator className="h-3.5 w-3.5" /> Grade Calculator
                </Link>
                <Link
                  href={`/countdown?subject=${subject.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold hover:border-primary/40"
                >
                  <Timer className="h-3.5 w-3.5" /> Exam Countdown
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {([
            { id: 'topics' as Tab, label: 'Topic Tracker', icon: ClipboardCheck },
            { id: 'papers' as Tab, label: 'Past Papers', icon: BookOpen },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer',
                activeTab === id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-foreground-muted hover:text-foreground hover:border-border-hover'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'topics' && (
          <div>
            {loadingTopics ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <TopicTracker
                curriculumId={curriculumId}
                subjectId={subjectId}
                userId={user?.id ?? ''}
                initialTopics={topics}
                onTopicChange={() => {
                  // TopicTracker already manages topic status optimistically.
                  // Background sync happens silently with zero screen reload.
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'papers' && (
          <div>
            {loadingPapers ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : paperGridData ? (
              <PaperGrid
                userId={user?.id ?? ''}
                data={paperGridData}
                onRecordChange={() => {
                  // PaperGrid manages cell score and status optimistically.
                  // Background sync happens silently with zero screen reload.
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
