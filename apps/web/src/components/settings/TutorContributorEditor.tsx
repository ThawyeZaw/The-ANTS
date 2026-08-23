'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Tutor & Contributor Profile Editor (Tab 2)
// Configures Teaching Subjects, Telegram handle, Hourly Rate, and Weekly Timetable.
// Also supports Contributor & Admin profile metadata.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Send,
  Sparkles,
  BookOpen,
  DollarSign,
  Building,
  Save,
  Loader2,
  Check,
  Plus,
  X,
  Award,
  Globe,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import TutorWeeklySchedule, {
  DayOfWeek,
  SlotStatus,
  WeeklyAvailability,
  DAYS_OF_WEEK,
  TIME_SLOTS,
} from '@/components/profile/TutorWeeklySchedule';
import { actionGetFullProfile, actionUpdateTutorProfile } from '@/actions/profile';
import { cn } from '@/lib/utils';

const POPULAR_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English Literature',
  'Economics',
  'Computer Science',
  'Business Studies',
  'Accounting',
];

const POPULAR_CURRICULUMS = [
  'Cambridge IGCSE',
  'Cambridge International AS/A Level',
  'Edexcel IGCSE',
  'Edexcel International A-Level',
  'Matriculation (Grade 12)',
  'IELTS / English Prep',
  'GED',
];

export default function TutorContributorEditor() {
  const { user } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tutor fields
  const [telegramHandle, setTelegramHandle] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [institution, setInstitution] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>([]);
  const [teachingCurriculums, setTeachingCurriculums] = useState<string[]>([]);
  const [availability, setAvailability] = useState<WeeklyAvailability>({});
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // Contributor fields
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    actionGetFullProfile(user.profile.username)
      .then((data) => {
        if (data.tutorProfile) {
          setTelegramHandle(data.tutorProfile.telegram_handle || '');
          setHourlyRate(data.tutorProfile.hourly_rate || '');
          setInstitution(data.tutorProfile.institution || '');
          setSpecialization(data.tutorProfile.specialization || '');
          setTeachingSubjects(data.tutorProfile.teaching_subjects || []);
          setTeachingCurriculums(data.tutorProfile.teaching_curriculums || []);
          setAvailability(data.tutorProfile.availability_slots || {});
        } else {
          setTelegramHandle(user.profile.username);
        }

        if (data.contributorProfile) {
          setWebsiteUrl(data.contributorProfile.website_url || '');
          setGithubUrl(data.contributorProfile.github_url || '');
          setLinkedinUrl(data.contributorProfile.linkedin_url || '');
        }
      })
      .catch((err) => console.error('Failed to load tutor profile:', err))
      .finally(() => setIsLoading(false));
  }, [user]);

  // Slot changer
  const handleSlotChange = (day: DayOfWeek, time: string, newStatus: SlotStatus) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [time]: newStatus,
      },
    }));
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'weekday-evenings' | 'weekend-mornings' | 'all-available' | 'clear') => {
    const updated: WeeklyAvailability = {};

    if (preset === 'clear') {
      setAvailability({});
      return;
    }

    // Clone current
    for (const d of DAYS_OF_WEEK) {
      updated[d] = { ...(availability[d] || {}) };
    }

    if (preset === 'weekday-evenings') {
      const weekdays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const eveningHours = ['18:00', '19:00', '20:00', '21:00'];
      for (const d of weekdays) {
        if (!updated[d]) updated[d] = {};
        for (const h of eveningHours) {
          updated[d][h] = 'available';
        }
      }
    } else if (preset === 'weekend-mornings') {
      const weekends: DayOfWeek[] = ['Saturday', 'Sunday'];
      const morningHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
      for (const d of weekends) {
        if (!updated[d]) updated[d] = {};
        for (const h of morningHours) {
          updated[d][h] = 'available';
        }
      }
    } else if (preset === 'all-available') {
      for (const d of DAYS_OF_WEEK) {
        if (!updated[d]) updated[d] = {};
        for (const h of TIME_SLOTS) {
          updated[d][h] = 'available';
        }
      }
    }

    setAvailability(updated);
  };

  const handleToggleSubject = (sub: string) => {
    if (teachingSubjects.includes(sub)) {
      setTeachingSubjects(teachingSubjects.filter((s) => s !== sub));
    } else {
      setTeachingSubjects([...teachingSubjects, sub]);
    }
  };

  const handleAddCustomSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (trimmed && !teachingSubjects.includes(trimmed)) {
      setTeachingSubjects([...teachingSubjects, trimmed]);
      setNewSubjectInput('');
    }
  };

  const handleToggleCurriculum = (curr: string) => {
    if (teachingCurriculums.includes(curr)) {
      setTeachingCurriculums(teachingCurriculums.filter((c) => c !== curr));
    } else {
      setTeachingCurriculums([...teachingCurriculums, curr]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await actionUpdateTutorProfile(user.id, {
        telegram_handle: telegramHandle.replace('@', '').trim(),
        hourly_rate: hourlyRate.trim(),
        institution: institution.trim(),
        specialization: specialization.trim(),
        teaching_subjects: teachingSubjects,
        teaching_curriculums: teachingCurriculums,
        availability_slots: availability,
        is_active: true,
      });

      if (!res.success) {
        setError(res.error || 'Failed to save tutor profile');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isTutor && !isContributor && !isAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-background-card border border-border text-center space-y-4 max-w-lg mx-auto my-12 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Staff Access Required</h3>
        <p className="text-xs text-foreground-muted leading-relaxed">
          Teaching schedules and contributor credentials can only be edited by verified Tutors, Contributors, and Administrators.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-foreground-muted">Loading role credentials & schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-background-card to-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            Tutor & Academic Persona
          </div>
          <h2 className="text-xl font-bold text-foreground">Teaching Profile & Weekly Availability</h2>
          <p className="text-xs text-foreground-muted mt-1">
            Configure your Telegram booking link, hourly rate, subjects, and weekly timetable slots.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover active:scale-98 transition-all cursor-pointer shrink-0"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveSuccess ? 'Saved Changes!' : 'Save Tutor Profile'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {/* Tutor Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background-card border border-border rounded-3xl p-6 sm:p-8">
        {/* Telegram Handle */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-primary" />
            Telegram Username (Without @)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted font-mono text-sm">
              @
            </span>
            <input
              type="text"
              placeholder="username"
              value={telegramHandle}
              onChange={(e) => setTelegramHandle(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 text-xs font-mono bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <p className="text-[11px] text-foreground-muted">
            Used to generate instant booking links and Telegram inquiry QR codes.
          </p>
        </div>

        {/* Hourly Rate */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            Hourly Tutoring Rate
          </label>
          <input
            type="text"
            placeholder="e.g. 20,000 MMK/hr or $25/hr"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-full px-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <p className="text-[11px] text-foreground-muted">
            Displayed prominently on your public tutor card and profile header.
          </p>
        </div>

        {/* Institution / University */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-foreground-muted" />
            Institution / University
          </label>
          <input
            type="text"
            placeholder="e.g. University of Yangon / Cambridge Alum"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="w-full px-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Headline / Specialization */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Headline / Specialization
          </label>
          <input
            type="text"
            placeholder="e.g. IGCSE & A-Level Pure Math Specialist"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full px-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Teaching Subjects Picker */}
      <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Teaching Subjects</h3>
            <p className="text-xs text-foreground-muted">
              Select the subjects you offer for student tutoring.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {POPULAR_SUBJECTS.map((sub) => {
            const isSelected = teachingSubjects.includes(sub);
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleToggleSubject(sub)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                    : 'bg-background-secondary text-foreground-muted hover:text-foreground border-border hover:bg-background-secondary/80'
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                {sub}
              </button>
            );
          })}
        </div>

        {/* Custom Subject Input */}
        <div className="flex items-center gap-2 pt-2 max-w-sm">
          <input
            type="text"
            placeholder="Add custom subject..."
            value={newSubjectInput}
            onChange={(e) => setNewSubjectInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSubject();
              }
            }}
            className="flex-1 px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleAddCustomSubject}
            className="px-3 py-2 rounded-xl bg-background-secondary hover:bg-primary hover:text-white border border-border text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Teaching Curriculums Picker */}
      <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Exam Boards & Curriculums</h3>
          <p className="text-xs text-foreground-muted">
            Specify syllabus qualifications you prepare students for.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {POPULAR_CURRICULUMS.map((curr) => {
            const isSelected = teachingCurriculums.includes(curr);
            return (
              <button
                key={curr}
                type="button"
                onClick={() => handleToggleCurriculum(curr)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs font-semibold'
                    : 'bg-background-secondary text-foreground-muted hover:text-foreground border-border'
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                {curr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekly Timetable Schedule Editor */}
      <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Weekly Teaching Schedule (Sunday to Saturday)</h3>
            <p className="text-xs text-foreground-muted">
              Click any time block to toggle its availability: <b>Available / Free</b> (emerald), <b>Flexible</b> (amber), or <b>Taken</b> (busy).
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
              Quick Fill:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('weekday-evenings')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-background-secondary border border-border hover:border-primary/40 transition-colors cursor-pointer"
            >
              Weekday Evenings (18:00–21:00)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('weekend-mornings')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-background-secondary border border-border hover:border-primary/40 transition-colors cursor-pointer"
            >
              Weekend Mornings (09:00–14:00)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('clear')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-background-secondary border border-border text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Reset All
            </button>
          </div>
        </div>

        <TutorWeeklySchedule
          availability={availability}
          isEditable={true}
          onSlotChange={handleSlotChange}
        />
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveSuccess ? 'Saved Successfully!' : 'Save All Tutor Changes'}
        </button>
      </div>
    </div>
  );
}
