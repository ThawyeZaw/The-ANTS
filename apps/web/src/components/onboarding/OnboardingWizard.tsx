'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Onboarding Wizard (3-step, fully skippable)
// 1 Welcome + features  2 Subjects (CAIE/Edexcel)  3 Exam session + Telegram
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  SkipForward,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import {
  completeOnboardingEnrollment,
  listCurriculumCatalog,
} from '@/actions/curriculum';
import { DEFAULT_EXAM_SESSION } from '@/lib/grading';
import type { OnboardingCurriculumSelection } from '@/types';
import type { SubjectTier } from '@/lib/grading/types';
import { WelcomeStep } from './WelcomeStep';
import { SubjectPickerStep } from './SubjectPickerStep';
import { ExamSessionStep } from './ExamSessionStep';
import {
  ONBOARDING_CURRICULUM_CODES,
  ONBOARDING_STEPS,
  type OnboardingCatalogCurriculum,
  type OnboardingSubjectPick,
} from './types';

export default function OnboardingWizard() {
  const { user, completeOnboarding, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogs, setCatalogs] = useState<OnboardingCatalogCurriculum[]>([]);

  const [preferredName, setPreferredName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Yangon');
  const [selected, setSelected] = useState<Map<string, OnboardingSubjectPick>>(
    new Map()
  );
  const [globalSeries, setGlobalSeries] = useState(DEFAULT_EXAM_SESSION);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      try {
        const rows = await listCurriculumCatalog(false);
        if (cancelled) return;
        const filtered: OnboardingCatalogCurriculum[] = rows
          .filter((c) => ONBOARDING_CURRICULUM_CODES.has(c.code))
          .map((c) => ({
            id: c.id,
            name: c.name,
            title: c.title || c.name,
            code: c.code,
            description: c.description ?? null,
            subjects: (c.subjects ?? []).map((s) => ({
              id: s.id,
              curriculum_id: s.curriculum_id,
              name: s.name,
              title: s.title || s.name,
              code: s.code,
              description: s.description ?? null,
              color_code: (s as { color_code?: string | null }).color_code ?? null,
            })),
          }));
        setCatalogs(filtered);
      } catch (err) {
        console.error('[onboarding] catalog load failed', err);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.profile?.name && !preferredName) {
      setPreferredName(user.profile.name.split(' ')[0] ?? user.profile.name);
    }
  }, [user, preferredName]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user?.profile?.onboardingCompleted) router.push(nextUrl);
  }, [authLoading, user, router, nextUrl]);

  const selectedList = useMemo(() => [...selected.values()], [selected]);

  const changeSelected = useCallback(
    (
      updater: (
        prev: Map<string, OnboardingSubjectPick>
      ) => Map<string, OnboardingSubjectPick>
    ) => {
      setSelected(updater);
    },
    []
  );

  const updateSeriesForSubjects = useCallback(
    (subjectIds: string[], series: string | null) => {
      setSelected((prev) => {
        const next = new Map(prev);
        for (const id of subjectIds) {
          const existing = next.get(id);
          if (existing) next.set(id, { ...existing, targetSeries: series });
        }
        return next;
      });
    },
    []
  );

  const handleFinish = async (skipEnrollment = false) => {
    if (!user) return;
    setIsSaving(true);

    try {
      const subjectsToEnroll = skipEnrollment ? [] : selectedList;

      await completeOnboardingEnrollment({
        defaultSeries: globalSeries || DEFAULT_EXAM_SESSION,
        subjects: subjectsToEnroll.map((s) => ({
          curriculumId: s.curriculumId,
          subjectId: s.subjectId,
          targetSeries: s.targetSeries ?? null,
          tier: (s.tier as SubjectTier | null) ?? null,
          targetGrade: s.targetGrade ?? null,
        })),
      });

      const byCurriculum = new Map<string, OnboardingSubjectPick[]>();
      for (const s of subjectsToEnroll) {
        const list = byCurriculum.get(s.curriculumId) ?? [];
        list.push(s);
        byCurriculum.set(s.curriculumId, list);
      }

      const onboardingData: OnboardingCurriculumSelection[] = [
        ...byCurriculum.entries(),
      ].map(([curriculumId, subjects]) => ({
        curriculumType: curriculumId,
        subjectIds: subjects.map((s) => s.subjectId),
        subjectNames: subjects.map((s) => s.subjectTitle),
        examSeries: subjects[0]?.targetSeries || globalSeries,
      }));

      await completeOnboarding({
        preferredName: preferredName || undefined,
        timezone: timezone || undefined,
        onboardingData,
      });

      router.push(nextUrl);
    } catch (err) {
      console.error('[onboarding] finish failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || catalogLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex animate-pulse-soft flex-col items-center gap-4">
          <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-foreground-muted">Preparing your setup…</p>
        </div>
      </div>
    );
  }

  const progress = ((step - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="z-20 shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="The ANTs logo" width={24} height={24} />
            <span className="hidden font-brand font-bold text-foreground sm:inline">
              The ANTs
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-300',
                  step === s.id
                    ? 'bg-primary text-white shadow-sm'
                    : step > s.id
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-background-secondary text-foreground-muted'
                )}
              >
                {step > s.id ? <Check className="h-3 w-3" /> : <span>{s.id}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleFinish(true)}
            disabled={isSaving}
            className="flex cursor-pointer items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
            id="onboarding-skip-all"
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Skip setup</span>
          </button>
        </div>

        <div className="h-0.5 bg-background-secondary">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain px-4 py-6 sm:py-8">
        <div className="my-auto w-full max-w-2xl">
          {step === 1 && (
            <WelcomeStep
              preferredName={preferredName}
              onPreferredNameChange={setPreferredName}
              timezone={timezone}
              onTimezoneChange={setTimezone}
              firstName={user?.profile?.name?.split(' ')[0]}
            />
          )}

          {step === 2 && (
            <SubjectPickerStep
              catalogs={catalogs}
              selected={selected}
              onChangeSelected={changeSelected}
            />
          )}

          {step === 3 && (
            <ExamSessionStep
              selected={selectedList}
              globalSeries={globalSeries}
              onGlobalSeriesChange={setGlobalSeries}
              onSubjectSeriesChange={updateSeriesForSubjects}
              preferredName={preferredName}
              username={user?.profile?.username ?? ''}
              onFinish={handleFinish}
              isSaving={isSaving}
            />
          )}

          {step === ONBOARDING_STEPS.length && (
            <div className="mt-4 flex justify-start">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                icon={<ArrowLeft className="h-4 w-4" />}
                id="onboarding-back-final"
              >
                Back
              </Button>
            </div>
          )}
        </div>
      </main>

      {step < ONBOARDING_STEPS.length && (
        <div className="z-30 shrink-0 border-t border-border bg-background/95 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {step > 1 ? (
              <Button
                variant="secondary"
                onClick={() => setStep((s) => s - 1)}
                icon={<ArrowLeft className="h-4 w-4" />}
                id="onboarding-back"
              >
                Back
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="cursor-pointer text-sm text-foreground-muted transition-colors hover:text-foreground hover:underline"
                id="onboarding-skip-step"
              >
                Skip this step
              </button>
            )}

            <div className="flex-1" />

            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="hidden cursor-pointer text-sm text-foreground-muted transition-colors hover:text-foreground hover:underline sm:inline"
              >
                Skip →
              </button>
            )}

            <Button
              onClick={() => setStep((s) => s + 1)}
              iconRight={<ArrowRight className="h-4 w-4" />}
              id="onboarding-next"
              className="min-w-[8.5rem] shadow-md shadow-primary/20"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
