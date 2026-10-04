'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Subject Detail Page
// Route: /curriculum/[curriculumId]/[subjectId]
// Tabs: Topic Tracker (default) | Past Papers (Excel grid)
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, GraduationCap, ArrowLeft, Calculator, Timer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getSubjectsByCurriculum,
  getSubjectTopicsWithProgress,
  type SubjectWithProgress,
  type TopicWithProgress,
} from '@/actions/curriculum';
import { TopicTracker } from '@/components/curriculum/TopicTracker';
import { groupEdexcelIalSubjects, isIalVirtualGroupId, applyMathFmCombineRule, IAL_MATH_FM_COMBINED_ID } from '@/lib/edexcel-ial';

const CURRICULUM_LABELS: Record<string, string> = {
  'curr-caie-igcse':    'Cambridge IGCSE',
  'curr-caie-alevel':   'Cambridge A Level',
  'curr-edexcel-igcse': 'Pearson Edexcel IGCSE',
  'curr-edexcel-ial':   'Pearson Edexcel IAL',
};

export default function SubjectDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ curriculumId: string; subjectId: string }>();

  const curriculumId = params.curriculumId;
  const subjectId = params.subjectId;

  const [subject, setSubject] = useState<SubjectWithProgress | null>(null);
  const [subjectNotFound, setSubjectNotFound] = useState(false);
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Load subject metadata & topics (initial mount only)
  const loadSubjectData = useCallback(async (showLoader = true) => {
    if (!curriculumId || !subjectId) return;

    try {
      if (showLoader) setLoadingTopics(true);
      setSubjectNotFound(false);
      let targetSubjectId = subjectId;
      const allSubjects = await getSubjectsByCurriculum(curriculumId, user?.id);

      const found = allSubjects.find((s) => s.id === subjectId);
      if (found) {
        setSubject(found);
      } else if (isIalVirtualGroupId(subjectId) || subjectId === IAL_MATH_FM_COMBINED_ID) {
        const { options: groups, bothTaken, combined } = applyMathFmCombineRule(
          groupEdexcelIalSubjects(allSubjects)
        );

        const isMathOrFm =
          subjectId === 'subj-edx-ial-math-group' ||
          subjectId === 'subj-edx-ial-fmath-group' ||
          subjectId === IAL_MATH_FM_COMBINED_ID;

        const shouldCombine = Boolean(bothTaken && combined && isMathOrFm);
        const group = shouldCombine
          ? combined
          : groups.find((g) => g.id === subjectId);

        if (shouldCombine) {
          targetSubjectId = IAL_MATH_FM_COMBINED_ID;
        }

        if (group) {
          setSubject({
            id: group.id,
            curriculum_id: curriculumId,
            name: group.title,
            title: group.title,
            code: group.code,
            description: group.description ?? null,
            icon_url: null,
            color_code: group.color_code,
            created_at: null,
            subject_type:
              group.title === 'Mathematics' ||
              group.title === 'Further Mathematics' ||
              group.id === IAL_MATH_FM_COMBINED_ID
                ? 'modular_maths_suite'
                : null,
            qualification_data: group.qualification_data,
            topicCount: group.topicCount,
            completedTopics: group.completedTopics,
            paperCount: group.paperCount,
            completedPapers: group.completedPapers,
            isEnrolled: group.isEnrolled,
            target_series: null,
            target_grade: null,
            tier: null,
            award_level: null,
            paper_preferences: null,
          });
        } else {
          setSubject(null);
          setSubjectNotFound(true);
        }
      } else {
        setSubject(null);
        setSubjectNotFound(true);
      }

      const topicList = await getSubjectTopicsWithProgress(targetSubjectId, user?.id);
      setTopics(topicList);
    } catch {
      setSubject(null);
      setSubjectNotFound(true);
      setTopics([]);
    } finally {
      if (showLoader) setLoadingTopics(false);
    }
  }, [user?.id, curriculumId, subjectId]);

  useEffect(() => {
    loadSubjectData(true);
  }, [loadSubjectData]);



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

        {subjectNotFound && !loadingTopics ? (
          <div className="rounded-2xl border border-dashed border-border bg-background-card p-10 text-center space-y-4">
            <GraduationCap className="h-10 w-10 mx-auto text-foreground-muted opacity-40" />
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-foreground">Subject not found</h1>
              <p className="text-sm text-foreground-muted max-w-md mx-auto">
                This syllabus workspace does not exist or is not available in the catalog yet.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={`/curriculum/${curriculumId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40"
              >
                Browse {curriculumLabel}
              </Link>
              <Link
                href="/curriculum"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                My Curriculum
              </Link>
            </div>
          </div>
        ) : (
          <>
        {/* Subject header */}
        <div className="flex items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-border bg-background-card shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <GraduationCap className="h-5 w-5" style={{ color }} />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
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
                <span className="text-[11px] text-foreground-muted">{curriculumLabel} &middot; Syllabus Specification</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight truncate">
                {loadingTopics && !subject ? (
                  <span className="animate-pulse bg-foreground-muted/15 rounded w-48 h-6 inline-block" />
                ) : (
                  subject?.name ?? 'Subject'
                )}
              </h1>
            </div>
          </div>
          {subject && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <Link
                href={`/past-papers?subject=${subject.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background-secondary/50 px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40 text-foreground transition-colors shadow-2xs"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Past Papers
              </Link>
              <Link
                href={`/calculator?curriculum=${curriculumId}&subject=${subject.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background-secondary/50 px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40 text-foreground transition-colors shadow-2xs"
              >
                <Calculator className="h-3.5 w-3.5 text-amber-500" /> Grade Calc
              </Link>
              <Link
                href={`/countdown?subject=${subject.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background-secondary/50 px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40 text-foreground transition-colors shadow-2xs"
              >
                <Timer className="h-3.5 w-3.5 text-sky-500" /> Countdown
              </Link>
            </div>
          )}
        </div>

        {/* Mobile quick action buttons */}
        {subject && (
          <div className="flex sm:hidden flex-wrap gap-1.5 -mt-3">
            <Link
              href={`/past-papers?subject=${subject.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background-secondary/50 px-2 py-1 text-[11px] font-semibold hover:border-primary/40 text-foreground transition-colors"
            >
              <BookOpen className="h-3 w-3 text-primary" /> Past Papers
            </Link>
            <Link
              href={`/calculator?curriculum=${curriculumId}&subject=${subject.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background-secondary/50 px-2 py-1 text-[11px] font-semibold hover:border-primary/40 text-foreground transition-colors"
            >
              <Calculator className="h-3 w-3 text-amber-500" /> Calculator
            </Link>
            <Link
              href={`/countdown?subject=${subject.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background-secondary/50 px-2 py-1 text-[11px] font-semibold hover:border-primary/40 text-foreground transition-colors"
            >
              <Timer className="h-3 w-3 text-sky-500" /> Countdown
            </Link>
          </div>
        )}

        {/* Topic Tracker */}
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
          </>
        )}
      </div>
    </div>
  );
}
