'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Onboarding Wizard
// 4-step guided setup flow for new users after email confirmation.
// All steps are optional and skippable.
// Saves to student_profiles / teacher_profiles and marks onboarding_completed.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  SkipForward,
  Globe,
  User,
  Search,
  X,
  ChevronDown,
  Calendar,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { OnboardingCurriculumSelection } from '@/types';
import { createClient } from '@/lib/supabase/client';

// ── Curriculum config ──────────────────────────────────────────────────────

type CurriculumTypeKey =
  | 'igcse_cambridge'
  | 'igcse_edexcel'
  | 'ial_edexcel'
  | 'caie_alevel'
  | 'ielts'
  | 'ossd'
  | 'ged';

interface CurriculumConfig {
  key: CurriculumTypeKey;
  label: string;
  board: string;
  emoji: string;
  description: string;
  examSeries: string[];
  usesCustomDate?: boolean;
  comingSoon?: boolean;
}

const CURRICULA: CurriculumConfig[] = [
  {
    key: 'igcse_cambridge',
    label: 'IGCSE',
    board: 'Cambridge (CAIE)',
    emoji: '📘',
    description: 'Linear. Grades A*–G or 9–1. Papers in May/June & Oct/Nov.',
    examSeries: ['May/June', 'Oct/Nov'],
  },
  {
    key: 'igcse_edexcel',
    label: 'IGCSE',
    board: 'Pearson Edexcel',
    emoji: '📗',
    description: 'Linear. Grades 9–1. Papers in May/June, Oct/Nov & January.',
    examSeries: ['May/June', 'Oct/Nov', 'January'],
  },
  {
    key: 'ial_edexcel',
    label: 'IAL',
    board: 'Pearson Edexcel',
    emoji: '📙',
    description: 'Modular. UMS grading. Unit retakes. Cash-in codes required.',
    examSeries: ['January', 'May/June', 'October'],
  },
  {
    key: 'caie_alevel',
    label: 'AS & A Level',
    board: 'Cambridge (CAIE)',
    emoji: '📕',
    description: 'Staged linear. Raw marks. May/June & Oct/Nov series.',
    examSeries: ['May/June', 'Oct/Nov'],
  },
  {
    key: 'ielts',
    label: 'IELTS Academic',
    board: 'British Council / IDP',
    emoji: '🌐',
    description: 'Band scores 0–9. Single-sitting. Tests available almost daily.',
    examSeries: [],
    usesCustomDate: true,
  },
  {
    key: 'ossd',
    label: 'OSSD',
    board: 'Ontario, Canada',
    emoji: '🍁',
    description: 'Credit-based Canadian diploma. 30 credits + community service.',
    examSeries: [],
    comingSoon: true,
  },
  {
    key: 'ged',
    label: 'GED',
    board: 'GED Testing Service',
    emoji: '🎯',
    description: 'High school equivalency. Four subjects, on-demand.',
    examSeries: [],
    comingSoon: true,
  },
];

// ── Common IGCSE/A-Level subjects fallback (used when DB is empty) ──────────

const STATIC_SUBJECTS: Record<string, Array<{ id: string; name: string; code: string }>> = {
  igcse_cambridge: [
    { id: 's-0580', name: 'Mathematics', code: '0580' },
    { id: 's-0606', name: 'Additional Mathematics', code: '0606' },
    { id: 's-0620', name: 'Chemistry', code: '0620' },
    { id: 's-0610', name: 'Biology', code: '0610' },
    { id: 's-0625', name: 'Physics', code: '0625' },
    { id: 's-0478', name: 'Computer Science', code: '0478' },
    { id: 's-0500', name: 'English — First Language', code: '0500' },
    { id: 's-0510', name: 'English — Second Language', code: '0510' },
    { id: 's-0455', name: 'Economics', code: '0455' },
    { id: 's-0450', name: 'Business Studies', code: '0450' },
    { id: 's-0460', name: 'Geography', code: '0460' },
    { id: 's-0470', name: 'History', code: '0470' },
    { id: 's-0417', name: 'Information Technology', code: '0417' },
    { id: 's-0654', name: 'Co-ordinated Sciences (Double)', code: '0654' },
  ],
  igcse_edexcel: [
    { id: 'e-4MA1', name: 'Mathematics A', code: '4MA1' },
    { id: 'e-4MB1', name: 'Mathematics B', code: '4MB1' },
    { id: 'e-4CH1', name: 'Chemistry', code: '4CH1' },
    { id: 'e-4BI1', name: 'Biology', code: '4BI1' },
    { id: 'e-4PH1', name: 'Physics', code: '4PH1' },
    { id: 'e-4CP1', name: 'Computer Science', code: '4CP1' },
    { id: 'e-4EA1', name: 'English Language A', code: '4EA1' },
    { id: 'e-4EC1', name: 'Economics', code: '4EC1' },
    { id: 'e-4BS1', name: 'Business', code: '4BS1' },
  ],
  ial_edexcel: [
    { id: 'i-WMA11', name: 'Pure Mathematics 1', code: 'WMA11' },
    { id: 'i-WMA12', name: 'Pure Mathematics 2', code: 'WMA12' },
    { id: 'i-WMA13', name: 'Pure Mathematics 3', code: 'WMA13' },
    { id: 'i-WMA14', name: 'Pure Mathematics 4', code: 'WMA14' },
    { id: 'i-WCH11', name: 'Chemistry Unit 1', code: 'WCH11' },
    { id: 'i-WCH12', name: 'Chemistry Unit 2', code: 'WCH12' },
    { id: 'i-WBI11', name: 'Biology Unit 1', code: 'WBI11' },
    { id: 'i-WBI12', name: 'Biology Unit 2', code: 'WBI12' },
    { id: 'i-WPH11', name: 'Physics Unit 1', code: 'WPH11' },
    { id: 'i-WPH12', name: 'Physics Unit 2', code: 'WPH12' },
    { id: 'i-WCS11', name: 'Computer Science Unit 1', code: 'WCS11' },
  ],
  caie_alevel: [
    { id: 'a-9709', name: 'Mathematics', code: '9709' },
    { id: 'a-9700', name: 'Biology', code: '9700' },
    { id: 'a-9701', name: 'Chemistry', code: '9701' },
    { id: 'a-9702', name: 'Physics', code: '9702' },
    { id: 'a-9608', name: 'Computer Science', code: '9608' },
    { id: 'a-9093', name: 'English Language', code: '9093' },
    { id: 'a-9708', name: 'Economics', code: '9708' },
    { id: 'a-9609', name: 'Business', code: '9609' },
    { id: 'a-9696', name: 'Geography', code: '9696' },
    { id: 'a-9389', name: 'History', code: '9389' },
    { id: 'a-9231', name: 'Further Mathematics', code: '9231' },
  ],
  ielts: [
    { id: 'il-reading', name: 'Academic Reading', code: 'Reading' },
    { id: 'il-writing', name: 'Academic Writing', code: 'Writing' },
    { id: 'il-listening', name: 'Listening', code: 'Listening' },
    { id: 'il-speaking', name: 'Speaking', code: 'Speaking' },
  ],
};

// ── Timezone list (common ones shown first) ─────────────────────────────────

const TIMEZONES = [
  'Asia/Yangon',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Jakarta',
  'Asia/Manila',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Pacific/Auckland',
  'Australia/Sydney',
  'Africa/Cairo',
  'Africa/Lagos',
  'UTC',
];

// ── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Curriculum' },
  { id: 3, label: 'Subjects' },
  { id: 4, label: 'Institution' },
];

// ── State for each curriculum selection ────────────────────────────────────

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

interface CurriculumSelectionState {
  curriculumType: CurriculumTypeKey;
  subjects: SubjectItem[];
  examSeries: string;
  examYear: string;
  examDate: string; // ISO date for IELTS
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Wizard
// ═══════════════════════════════════════════════════════════════════════════

export default function OnboardingWizard() {
  const { user, completeOnboarding, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1 state
  const [preferredName, setPreferredName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [tzSearch, setTzSearch] = useState('');
  const [tzOpen, setTzOpen] = useState(false);

  // Step 2 state — selected curriculum types
  const [selectedCurricula, setSelectedCurricula] = useState<CurriculumTypeKey[]>([]);

  // Step 3 state — one entry per selected curriculum
  const [curriculumSelections, setCurriculumSelections] = useState<
    Record<CurriculumTypeKey, CurriculumSelectionState>
  >({} as Record<CurriculumTypeKey, CurriculumSelectionState>);
  const [subjectSearch, setSubjectSearch] = useState<Record<CurriculumTypeKey, string>>(
    {} as Record<CurriculumTypeKey, string>
  );

  // Step 4 state
  const [institutionName, setInstitutionName] = useState('');

  // Subjects from DB (keyed by curriculum type key — falls back to static)
  const [dbSubjects] = useState<Record<string, SubjectItem[]>>({});

  // Auto-detect timezone on mount
  useEffect(() => {
    if (!timezone) {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected) setTimezone(detected);
      } catch {
        // ignore
      }
    }
  }, [timezone]);

  // Pre-fill preferred name from user profile
  useEffect(() => {
    if (user?.profile?.name && !preferredName) {
      setPreferredName(user.profile.name.split(' ')[0] ?? user.profile.name);
    }
  }, [user, preferredName]);

  // Auth guard: if not authenticated redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user?.profile?.onboardingCompleted) {
      router.push(nextUrl);
    }
  }, [authLoading, user, router, nextUrl]);

  // Sync curriculum selections when selected curricula change
  useEffect(() => {
    setCurriculumSelections((prev) => {
      const updated = { ...prev };
      selectedCurricula.forEach((key) => {
        if (!updated[key]) {
          updated[key] = {
            curriculumType: key,
            subjects: [],
            examSeries: '',
            examYear: String(new Date().getFullYear() + 1),
            examDate: '',
          };
        }
      });
      return updated;
    });
  }, [selectedCurricula]);

  const getSubjectList = useCallback((key: CurriculumTypeKey): SubjectItem[] => {
    return dbSubjects[key] ?? STATIC_SUBJECTS[key] ?? [];
  }, [dbSubjects]);

  // ── Skip / Finish ─────────────────────────────────────────────────────────

  const handleFinish = async (skip = false) => {
    setIsSaving(true);

    const onboardingData: OnboardingCurriculumSelection[] = skip
      ? []
      : selectedCurricula.map((key) => {
          const sel = curriculumSelections[key];
          const cfg = CURRICULA.find((c) => c.key === key)!;
          return {
            curriculumType: key,
            subjectIds: sel?.subjects.map((s) => s.id) ?? [],
            subjectNames: sel?.subjects.map((s) => `${s.name} ${s.code}`) ?? [],
            examSeries: cfg.usesCustomDate ? undefined : sel?.examSeries || undefined,
            examYear: cfg.usesCustomDate ? undefined : Number(sel?.examYear) || undefined,
            examDate: cfg.usesCustomDate ? sel?.examDate || undefined : undefined,
          };
        });

    await completeOnboarding({
      preferredName: preferredName || undefined,
      timezone: timezone || undefined,
      institutionName: institutionName || undefined,
      onboardingData,
    });

    setIsSaving(false);
    router.push(nextUrl);
  };

  const handleSkipAll = () => handleFinish(true);

  // ── Curriculum toggle ─────────────────────────────────────────────────────
  const toggleCurriculum = (key: CurriculumTypeKey) => {
    setSelectedCurricula((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ── Subject toggle ────────────────────────────────────────────────────────
  const toggleSubject = (currKey: CurriculumTypeKey, subject: SubjectItem) => {
    setCurriculumSelections((prev) => {
      const current = prev[currKey];
      const isSelected = current?.subjects.some((s) => s.id === subject.id);
      return {
        ...prev,
        [currKey]: {
          ...current,
          subjects: isSelected
            ? current.subjects.filter((s) => s.id !== subject.id)
            : [...(current?.subjects ?? []), subject],
        },
      };
    });
  };

  const filteredTimezones = TIMEZONES.filter((tz) =>
    tz.toLowerCase().includes(tzSearch.toLowerCase())
  );

  // ── Render guard ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse-soft">
          <div className="text-4xl">🐜</div>
          <p className="text-sm text-foreground-muted">Loading…</p>
        </div>
      </div>
    );
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐜</span>
            <span className="font-bold text-foreground hidden sm:inline font-brand">The ANTs</span>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300',
                  step === s.id
                    ? 'bg-primary text-white shadow-sm'
                    : step > s.id
                    ? 'bg-success/20 text-success'
                    : 'bg-background-secondary text-foreground-muted'
                )}
              >
                {step > s.id ? <Check className="h-3 w-3" /> : <span>{s.id}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Skip all */}
          <button
            type="button"
            onClick={handleSkipAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
            id="onboarding-skip-all"
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Skip setup</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-background-secondary">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Step content ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* ───────────────── STEP 1: Welcome & Preferences ─────────── */}
          {step === 1 && (
            <div className="animate-fade-in-up space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">👋</div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Hi {user?.profile?.name?.split(' ')[0] ?? 'there'}, welcome to <span className="font-brand">The ANTs</span>!
                </h1>
                <p className="text-foreground-muted">
                  Let's personalise your experience. You can always change these later in Settings.
                </p>
              </div>

              <div className="bg-background-card border border-border rounded-2xl p-6 space-y-5">
                {/* Preferred name */}
                <Input
                  label="Preferred name (optional)"
                  type="text"
                  placeholder="What should we call you?"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                  id="onboarding-preferred-name"
                />

                {/* Timezone selector */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Your timezone <span className="text-foreground-muted font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTzOpen(!tzOpen)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border bg-background-card text-sm transition-all',
                        'hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                        'border-border'
                      )}
                      id="onboarding-timezone"
                    >
                      <span className="flex items-center gap-2 text-foreground">
                        <Globe className="h-4 w-4 text-foreground-muted" />
                        {timezone || <span className="text-foreground-muted">Select timezone</span>}
                      </span>
                      <ChevronDown className={cn('h-4 w-4 text-foreground-muted transition-transform', tzOpen && 'rotate-180')} />
                    </button>

                    {tzOpen && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-background-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
                            <input
                              type="text"
                              placeholder="Search timezone…"
                              value={tzSearch}
                              onChange={(e) => setTzSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-sm bg-background-secondary rounded-lg border-none outline-none text-foreground placeholder:text-foreground-muted"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredTimezones.map((tz) => (
                            <button
                              key={tz}
                              type="button"
                              onClick={() => { setTimezone(tz); setTzOpen(false); setTzSearch(''); }}
                              className={cn(
                                'w-full text-left px-4 py-2 text-sm hover:bg-background-secondary transition-colors',
                                timezone === tz ? 'text-primary font-medium' : 'text-foreground'
                              )}
                            >
                              {tz}
                            </button>
                          ))}
                          {filteredTimezones.length === 0 && (
                            <p className="text-center text-sm text-foreground-muted py-4">No results</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── STEP 2: Curriculum Selection ─────────── */}
          {step === 2 && (
            <div className="animate-fade-in-up space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">📚</div>
                <h1 className="text-2xl font-bold text-foreground mb-2">What are you studying?</h1>
                <p className="text-foreground-muted text-sm">
                  Select all that apply — you can study multiple curricula at once.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CURRICULA.map((curr) => {
                  const isSelected = selectedCurricula.includes(curr.key);
                  const isDisabled = curr.comingSoon;
                  return (
                    <button
                      key={curr.key}
                      type="button"
                      onClick={() => !isDisabled && toggleCurriculum(curr.key)}
                      disabled={isDisabled}
                      className={cn(
                        'relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed border-border bg-background-secondary'
                          : isSelected
                          ? 'border-primary bg-primary/5 shadow-md cursor-pointer'
                          : 'border-border hover:border-border-hover bg-background-card cursor-pointer hover:shadow-sm'
                      )}
                      id={`onboarding-curriculum-${curr.key}`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center animate-fade-in">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {curr.comingSoon && (
                        <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning font-medium">
                          Soon
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{curr.emoji}</span>
                        <div>
                          <p className={cn('text-sm font-bold', isSelected ? 'text-primary' : 'text-foreground')}>
                            {curr.label}
                          </p>
                          <p className="text-xs text-foreground-muted">{curr.board}</p>
                        </div>
                      </div>
                      <p className="text-xs text-foreground-secondary leading-relaxed">
                        {curr.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedCurricula.length === 0 && (
                <p className="text-center text-sm text-foreground-muted">
                  Not sure? You can set this up later in Settings.
                </p>
              )}
            </div>
          )}

          {/* ───────────────── STEP 3: Subjects & Exam Targets ────────── */}
          {step === 3 && (
            <div className="animate-fade-in-up space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Subjects & exam targets</h1>
                <p className="text-foreground-muted text-sm">
                  Select your subjects and when you're sitting the exam.
                </p>
              </div>

              {selectedCurricula.length === 0 ? (
                <div className="bg-background-card border border-border rounded-2xl p-8 text-center">
                  <p className="text-foreground-muted text-sm">
                    You didn't select any curricula in the previous step.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-3 text-sm text-primary hover:underline cursor-pointer font-medium"
                  >
                    Go back and select curricula
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCurricula.map((currKey) => {
                    const cfg = CURRICULA.find((c) => c.key === currKey)!;
                    const sel = curriculumSelections[currKey];
                    const allSubjects = getSubjectList(currKey);
                    const search = subjectSearch[currKey] ?? '';
                    const filtered = allSubjects.filter(
                      (s) =>
                        s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.code.toLowerCase().includes(search.toLowerCase())
                    );
                    const currentYear = new Date().getFullYear();
                    const years = [currentYear, currentYear + 1, currentYear + 2];

                    return (
                      <div key={currKey} className="bg-background-card border border-border rounded-2xl overflow-hidden">
                        {/* Curriculum header */}
                        <div className="px-5 py-3 border-b border-border flex items-center gap-2"
                          style={{ background: 'linear-gradient(90deg, var(--primary-light), transparent)' }}>
                          <span className="text-xl">{cfg.emoji}</span>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{cfg.label}</p>
                            <p className="text-xs text-foreground-muted">{cfg.board}</p>
                          </div>
                          {sel?.subjects.length > 0 && (
                            <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                              {sel.subjects.length} selected
                            </span>
                          )}
                        </div>

                        <div className="p-5 space-y-4">
                          {/* Subject search */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                            <input
                              type="text"
                              placeholder={`Search ${cfg.label} subjects…`}
                              value={search}
                              onChange={(e) =>
                                setSubjectSearch((prev) => ({ ...prev, [currKey]: e.target.value }))
                              }
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                          </div>

                          {/* Selected subjects chips */}
                          {(sel?.subjects.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {sel.subjects.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium"
                                >
                                  {s.name} <span className="opacity-60">{s.code}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleSubject(currKey, s)}
                                    className="cursor-pointer hover:text-primary-hover"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Subject grid */}
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                            {filtered.map((subject) => {
                              const isSelected = sel?.subjects.some((s) => s.id === subject.id);
                              return (
                                <button
                                  key={subject.id}
                                  type="button"
                                  onClick={() => toggleSubject(currKey, subject)}
                                  className={cn(
                                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer',
                                    isSelected
                                      ? 'bg-primary/10 border border-primary/20 text-primary'
                                      : 'hover:bg-background-secondary text-foreground'
                                  )}
                                >
                                  <span className="font-medium">{subject.name}</span>
                                  <span className={cn('text-xs px-2 py-0.5 rounded font-mono',
                                    isSelected ? 'bg-primary/20 text-primary' : 'bg-background-secondary text-foreground-muted'
                                  )}>
                                    {subject.code}
                                  </span>
                                </button>
                              );
                            })}
                            {filtered.length === 0 && (
                              <p className="text-center text-sm text-foreground-muted py-4">No subjects found</p>
                            )}
                          </div>

                          {/* Exam target */}
                          {cfg.usesCustomDate ? (
                            <div className="pt-3 border-t border-border">
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                Target exam date <span className="text-foreground-muted font-normal">(optional)</span>
                              </label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                                <input
                                  type="date"
                                  value={sel?.examDate ?? ''}
                                  onChange={(e) =>
                                    setCurriculumSelections((prev) => ({
                                      ...prev,
                                      [currKey]: { ...prev[currKey], examDate: e.target.value },
                                    }))
                                  }
                                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                              </div>
                            </div>
                          ) : cfg.examSeries.length > 0 ? (
                            <div className="pt-3 border-t border-border space-y-3">
                              <p className="text-sm font-medium text-foreground">
                                Target exam series <span className="text-foreground-muted font-normal">(optional)</span>
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {cfg.examSeries.map((series) => (
                                  <button
                                    key={series}
                                    type="button"
                                    onClick={() =>
                                      setCurriculumSelections((prev) => ({
                                        ...prev,
                                        [currKey]: { ...prev[currKey], examSeries: series },
                                      }))
                                    }
                                    className={cn(
                                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer',
                                      sel?.examSeries === series
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-foreground hover:border-border-hover'
                                    )}
                                  >
                                    {series}
                                  </button>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {years.map((y) => (
                                  <button
                                    key={y}
                                    type="button"
                                    onClick={() =>
                                      setCurriculumSelections((prev) => ({
                                        ...prev,
                                        [currKey]: { ...prev[currKey], examYear: String(y) },
                                      }))
                                    }
                                    className={cn(
                                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer',
                                      sel?.examYear === String(y)
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-foreground hover:border-border-hover'
                                    )}
                                  >
                                    {y}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── STEP 4: Institution ───────────────────── */}
          {step === 4 && (
            <div className="animate-fade-in-up space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🏫</div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {user?.profile?.role === 'teacher' ? 'Where do you teach?' : 'Where do you study?'}
                </h1>
                <p className="text-foreground-muted text-sm">
                  This helps us tailor the experience. You can always update this later.
                </p>
              </div>

              <div className="bg-background-card border border-border rounded-2xl p-6">
                <Input
                  label={user?.profile?.role === 'teacher' ? 'Institution / School name (optional)' : 'School / College name (optional)'}
                  type="text"
                  placeholder={
                    user?.profile?.role === 'teacher'
                      ? 'e.g. International School of Yangon'
                      : 'e.g. ISSY, ILBC, Dulwich College'
                  }
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  icon={<Building2 className="h-4 w-4" />}
                  id="onboarding-institution"
                />
              </div>

              {/* Summary card */}
              <div className="bg-background-secondary border border-border rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">Your setup summary</p>
                <div className="space-y-2 text-sm">
                  {preferredName && (
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>Preferred name: <strong className="text-foreground">{preferredName}</strong></span>
                    </div>
                  )}
                  {timezone && (
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      <span>Timezone: <strong className="text-foreground">{timezone}</strong></span>
                    </div>
                  )}
                  {selectedCurricula.length > 0 && (
                    <div className="flex items-start gap-2 text-foreground-secondary">
                      <span className="text-primary text-sm mt-0.5">📚</span>
                      <span>
                        Curricula:{' '}
                        <strong className="text-foreground">
                          {selectedCurricula
                            .map((k) => {
                              const c = CURRICULA.find((cc) => cc.key === k)!;
                              return `${c.label} (${c.board})`;
                            })
                            .join(', ')}
                        </strong>
                      </span>
                    </div>
                  )}
                  {selectedCurricula.length === 0 && (
                    <p className="text-foreground-muted">No curricula selected — you can add them from Settings.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation buttons ─────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8">
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
              <div />
            )}

            {step < STEPS.length ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                iconRight={<ArrowRight className="h-4 w-4" />}
                id="onboarding-next"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={() => handleFinish(false)}
                isLoading={isSaving}
                iconRight={<Check className="h-4 w-4" />}
                id="onboarding-finish"
              >
                {isSaving ? 'Saving…' : 'Finish setup'}
              </Button>
            )}
          </div>

          {/* Step skip hint */}
          {step < STEPS.length && (
            <p className="text-center text-xs text-foreground-muted mt-4">
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="hover:text-foreground transition-colors cursor-pointer hover:underline"
              >
                Skip this step →
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
