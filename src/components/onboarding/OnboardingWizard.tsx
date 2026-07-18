'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Onboarding Wizard
// 4-step guided setup. All data comes from the database (no hardcoded curricula).
// Subjects are enrolled on finish → lesson tracker works automatically.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, Check, SkipForward,
  Globe, User, Search, X, ChevronDown,
  Building2, GraduationCap, BookOpen, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager, type CurriculumSummary, type SubjectSummary } from '@/hooks/useCourseManager';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { OnboardingCurriculumSelection } from '@/types';

// ── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Curriculum' },
  { id: 3, label: 'Subjects' },
  { id: 4, label: 'Institution' },
];

// ── Subject selection helper (keyed by curriculum+subject) ─────────────────

function subjectKey(cid: string, sid: string) { return `${cid}::${sid}`; }

interface SelectedSubjectEntry {
  curriculum_id: string;
  subject_id: string;
  subject: SubjectSummary;
}

// ── Timezone list ──────────────────────────────────────────────────────────

const TIMEZONES = [
  'Asia/Yangon', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Kuala_Lumpur',
  'Asia/Jakarta', 'Asia/Manila', 'Asia/Hong_Kong', 'Asia/Shanghai',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'Pacific/Auckland', 'Australia/Sydney',
  'Africa/Cairo', 'Africa/Lagos', 'UTC',
];

// ── Curriculum Emoji Map (these are just for visual flair) ─────────────────

const BOARD_EMOJI: Record<string, string> = {
  'Cambridge (CAIE)': '\uD83D\uDCD8',
  'Cambridge': '\uD83D\uDCD8',
  'CAIE': '\uD83D\uDCD8',
  'Pearson Edexcel': '\uD83D\uDCD7',
  'Edexcel': '\uD83D\uDCD7',
  'British Council': '\uD83C\uDF10',
  'IDP': '\uD83C\uDF10',
  'GED Testing Service': '\uD83C\uDFAF',
  'Ontario': '\uD83C\uDF41',
};

function getEmoji(curriculum: CurriculumSummary): string {
  const board = curriculum.exam_board ?? '';
  for (const [key, emoji] of Object.entries(BOARD_EMOJI)) {
    if (board.includes(key) || key.includes(board)) return emoji;
  }
  return '\uD83D\uDCDA';
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Wizard
// ═══════════════════════════════════════════════════════════════════════════

export default function OnboardingWizard() {
  const { user, completeOnboarding, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';

  // ── Database-backed course data ──────────────────────────────────────
  const {
    allCurriculums, getSubjectsForCurriculum, enroll,
    isLoading: cmLoading,
  } = useCourseManager();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1
  const [preferredName, setPreferredName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [tzSearch, setTzSearch] = useState('');
  const [tzOpen, setTzOpen] = useState(false);

  // Step 2 — selected curriculum IDs (from DB)
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState<string[]>([]);

  // Step 3 — subjects per curriculum
  const [selectedSubjects, setSelectedSubjects] = useState<Map<string, SelectedSubjectEntry>>(new Map());
  const [subjectSearch, setSubjectSearch] = useState<Record<string, string>>({});

  // Step 4
  const [institutionName, setInstitutionName] = useState('');

  // Auto-detect timezone
  useEffect(() => {
    if (!timezone) {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected) setTimezone(detected);
      } catch { /* ignore */ }
    }
  }, [timezone]);

  // Pre-fill preferred name
  useEffect(() => {
    if (user?.profile?.name && !preferredName) {
      setPreferredName(user.profile.name.split(' ')[0] ?? user.profile.name);
    }
  }, [user, preferredName]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user?.profile?.onboardingCompleted) router.push(nextUrl);
  }, [authLoading, user, router, nextUrl]);

  // ── Derived ──────────────────────────────────────────────────────────

  const selectedCurriculums = useMemo(
    () => allCurriculums.filter((c) => selectedCurriculumIds.includes(c.id)),
    [allCurriculums, selectedCurriculumIds]
  );

  const totalSelectedSubjects = useMemo(() => {
    let count = 0;
    selectedSubjects.forEach((v) => {
      if (selectedCurriculumIds.includes(v.curriculum_id)) count++;
    });
    return count;
  }, [selectedSubjects, selectedCurriculumIds]);

  // ── Curriculum toggle ────────────────────────────────────────────────

  const toggleCurriculum = (id: string) => {
    setSelectedCurriculumIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // ── Subject toggle ───────────────────────────────────────────────────

  const toggleSubject = useCallback((curriculumId: string, subject: SubjectSummary) => {
    const key = subjectKey(curriculumId, subject.id);
    setSelectedSubjects((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { curriculum_id: curriculumId, subject_id: subject.id, subject });
      }
      return next;
    });
  }, []);

  // ── Finish — Enroll subjects + save onboarding ───────────────────────

  const handleFinish = async (skip = false) => {
    if (!user) return;
    setIsSaving(true);

    // Enroll selected subjects so lesson tracker picks them up
    if (!skip && selectedSubjects.size > 0) {
      const subjectsToEnroll = [...selectedSubjects.values()].filter(
        (s) => selectedCurriculumIds.includes(s.curriculum_id)
      );

      // Enroll in parallel (fire-and-forget — we don't need to wait per item)
      await Promise.allSettled(
        subjectsToEnroll.map((s) => enroll(s.curriculum_id, s.subject_id))
      );
    }

    // Build onboardingData for profile
    const onboardingData: OnboardingCurriculumSelection[] = skip
      ? []
      : selectedCurriculums.map((curr) => {
          const subs: SelectedSubjectEntry[] = [];
          selectedSubjects.forEach((v) => {
            if (v.curriculum_id === curr.id) subs.push(v);
          });
          return {
            curriculumType: curr.id,
            subjectIds: subs.map((s) => s.subject_id),
            subjectNames: subs.map((s) => s.subject.title),
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

  // ── Timezone filter ──────────────────────────────────────────────────

  const filteredTimezones = TIMEZONES.filter((tz) =>
    tz.toLowerCase().includes(tzSearch.toLowerCase())
  );

  // ── Loading states ───────────────────────────────────────────────────

  if (authLoading || cmLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse-soft">
          <div className="text-4xl">🐜</div>
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <p className="text-sm text-foreground-muted">Preparing your setup…</p>
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

          <div className="flex items-center gap-1.5">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300',
                  step === s.id
                    ? 'bg-primary text-white shadow-sm'
                    : step > s.id
                    ? 'bg-emerald-500/20 text-emerald-500'
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
            onClick={handleSkipAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
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

      {/* ── Step content ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* ═══════════════ STEP 1: Welcome ═══════════════ */}
          {step === 1 && (
            <div className="animate-fade-in-up space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">👋</div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Hi {user?.profile?.name?.split(' ')[0] ?? 'there'}, welcome to <span className="font-brand">The ANTs</span>!
                </h1>
                <p className="text-foreground-muted">
                  Let&apos;s personalise your experience. You can always change these later in Settings.
                </p>
              </div>

              <div className="bg-background-card border border-border rounded-2xl p-6 space-y-5">
                <Input
                  label="Preferred name (optional)"
                  type="text"
                  placeholder="What should we call you?"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                  id="onboarding-preferred-name"
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Your timezone <span className="text-foreground-muted font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTzOpen(!tzOpen)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border bg-background-card text-sm transition-all cursor-pointer',
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

          {/* ═══════════════ STEP 2: Curriculum ═══════════════ */}
          {step === 2 && (
            <div className="animate-fade-in-up space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">📚</div>
                <h1 className="text-2xl font-bold text-foreground mb-2">What are you studying?</h1>
                <p className="text-foreground-muted text-sm">
                  Select one or more curricula from our database. You can always add more from the Course Manager.
                </p>
              </div>

              {allCurriculums.length === 0 ? (
                <div className="bg-background-card border border-border rounded-2xl p-8 text-center">
                  <p className="text-foreground-muted text-sm">No curricula available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allCurriculums.map((curr) => {
                    const isSelected = selectedCurriculumIds.includes(curr.id);
                    return (
                      <button
                        key={curr.id}
                        type="button"
                        onClick={() => toggleCurriculum(curr.id)}
                        className={cn(
                          'relative flex flex-col items-start gap-2 p-5 rounded-2xl border-2 transition-all duration-200 text-left group',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md cursor-pointer'
                            : 'border-border hover:border-primary/40 bg-background-card cursor-pointer hover:shadow-md'
                        )}
                        id={`onboarding-curriculum-${curr.id}`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center animate-fade-in">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                        <span className="text-3xl">{getEmoji(curr)}</span>
                        <div>
                          <p className={cn('font-bold', isSelected ? 'text-primary' : 'text-foreground')}>
                            {curr.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {curr.qualification && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {curr.qualification}
                              </span>
                            )}
                            {curr.exam_board && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-foreground-muted font-medium">
                                {curr.exam_board}
                              </span>
                            )}
                          </div>
                        </div>
                        {curr.description && (
                          <p className="text-xs text-foreground-secondary leading-relaxed line-clamp-2">
                            {curr.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedCurriculumIds.length === 0 && (
                <p className="text-center text-sm text-foreground-muted">
                  Not sure? You can set this up later in the Course Manager.
                </p>
              )}
            </div>
          )}

          {/* ═══════════════ STEP 3: Subjects (DB-driven) ═══════════════ */}
          {step === 3 && (
            <div className="animate-fade-in-up space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">📖</div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Choose your subjects</h1>
                <p className="text-foreground-muted text-sm">
                  Select the subjects you&apos;re studying. These will sync with your lesson tracker.
                </p>
              </div>

              {selectedCurriculumIds.length === 0 ? (
                <div className="bg-background-card border border-border rounded-2xl p-8 text-center">
                  <p className="text-foreground-muted text-sm">
                    You didn&apos;t select any curricula in the previous step.
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
                  {selectedCurriculums.map((curr) => {
                    const subjects = getSubjectsForCurriculum(curr.id);
                    const search = subjectSearch[curr.id] ?? '';
                    const filtered = subjects.filter(
                      (s) =>
                        s.title.toLowerCase().includes(search.toLowerCase())
                    );

                    // Group selected subjects for this curriculum
                    const selected: SelectedSubjectEntry[] = [];
                    selectedSubjects.forEach((v) => {
                      if (v.curriculum_id === curr.id) selected.push(v);
                    });

                    return (
                      <div key={curr.id} className="bg-background-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-background-secondary/30">
                          <span className="text-2xl">{getEmoji(curr)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm">{curr.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {curr.qualification && (
                                <span className="text-xs text-primary">{curr.qualification}</span>
                              )}
                              {curr.exam_board && (
                                <span className="text-xs text-foreground-muted">{curr.exam_board}</span>
                              )}
                            </div>
                          </div>
                          {selected.length > 0 && (
                            <span className="text-xs bg-primary text-white px-2.5 py-1 rounded-full font-semibold shrink-0">
                              {selected.length} selected
                            </span>
                          )}
                        </div>

                        <div className="p-5 space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                            <input
                              type="text"
                              placeholder={`Search ${curr.title} subjects…`}
                              value={search}
                              onChange={(e) =>
                                setSubjectSearch((prev) => ({ ...prev, [curr.id]: e.target.value }))
                              }
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                          </div>

                          {selected.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selected.map((s) => (
                                <span
                                  key={s.subject_id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium"
                                >
                                  {s.subject.title}
                                  <button
                                    type="button"
                                    onClick={() => toggleSubject(curr.id, s.subject)}
                                    className="cursor-pointer hover:text-primary-hover"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                            {filtered.map((subject) => {
                              const isSelected = selectedSubjects.has(subjectKey(curr.id, subject.id));
                              return (
                                <button
                                  key={subject.id}
                                  type="button"
                                  onClick={() => toggleSubject(curr.id, subject)}
                                  className={cn(
                                    'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all border cursor-pointer',
                                    isSelected
                                      ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                                      : 'border-transparent hover:bg-background-secondary text-foreground'
                                  )}
                                >
                                  <span>{subject.title}</span>
                                  {subject.description && (
                                    <span className="text-xs text-foreground-muted truncate max-w-[40%]">
                                      {subject.description}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                            {filtered.length === 0 && (
                              <p className="text-center text-sm text-foreground-muted py-4">No subjects found</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ STEP 4: Institution + Summary ═══════════════ */}
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
                      <User className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Preferred name: <strong className="text-foreground">{preferredName}</strong></span>
                    </div>
                  )}
                  {timezone && (
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Timezone: <strong className="text-foreground">{timezone}</strong></span>
                    </div>
                  )}
                  {selectedCurriculums.length > 0 && (
                    <div className="flex items-start gap-2 text-foreground-secondary">
                      <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>
                        Curricula:{' '}
                        <strong className="text-foreground">
                          {selectedCurriculums.map((c) => c.title).join(', ')}
                        </strong>
                      </span>
                    </div>
                  )}
                  {totalSelectedSubjects > 0 && (
                    <div className="flex items-start gap-2 text-foreground-secondary">
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>
                        Subjects:{' '}
                        <strong className="text-foreground">{totalSelectedSubjects} selected</strong>
                      </span>
                    </div>
                  )}
                  {selectedCurriculumIds.length === 0 && (
                    <p className="text-foreground-muted">
                      No curricula selected — you can add them from the Course Manager.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────────────────── */}
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
