'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Tutor Public Profile Component
// Dedicated visitor view for Tutors featuring Telegram Inquiry & Weekly Schedule.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Calendar,
  Send,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Building,
  Layers,
  ArrowRight,
} from 'lucide-react';
import AvatarImage from '@/components/ui/AvatarImage';
import BackButton from '@/components/ui/BackButton';
import TutorWeeklySchedule, { DayOfWeek, SlotStatus } from './TutorWeeklySchedule';
import TutorInquiryModal from './TutorInquiryModal';
import CertificationSection from './CertificationSection';
import { cn, formatDate } from '@/lib/utils';
import type { Profile } from '@/types';
import type { TutorProfileData } from '@/hooks/useProfile';

interface TutorPublicProfileProps {
  profile: Profile;
  tutorProfile: TutorProfileData | null;
  certifications?: any[];
  isOwnProfile?: boolean;
}

type TutorTab = 'schedule' | 'about' | 'credentials' | 'portfolio';

export default function TutorPublicProfile({
  profile,
  tutorProfile,
  certifications = [],
  isOwnProfile = false,
}: TutorPublicProfileProps) {
  const [activeTab, setActiveTab] = useState<TutorTab>('schedule');
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek; time: string; status: SlotStatus } | null>(null);

  const subjects = tutorProfile?.teaching_subjects || profile.teachingSubjects || [];
  const curriculums = tutorProfile?.teaching_curriculums || profile.teachingCurriculums || [];
  const telegramHandle = tutorProfile?.telegram_handle || profile.telegramHandle || profile.username;
  const hourlyRate = tutorProfile?.hourly_rate || profile.hourlyRate;
  const institution = tutorProfile?.institution || profile.institutionName;
  const specialization = tutorProfile?.specialization || profile.title;

  const handleSelectSlot = (slot: { day: DayOfWeek; time: string; status: SlotStatus }) => {
    setSelectedSlot(slot);
    setIsInquiryOpen(true);
  };

  const handleOpenGeneralInquiry = () => {
    setSelectedSlot(null);
    setIsInquiryOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <BackButton href="/team" label="Back to Tutors & Contributors" />
        {isOwnProfile && (
          <Link
            href="/settings/profile?tab=role-profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-background-card border border-border hover:border-primary text-foreground transition-all"
          >
            Edit Tutor Profile & Schedule
          </Link>
        )}
      </div>

      {/* Hero Banner Card */}
      <div className="relative bg-background-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {/* Banner Gradient Top */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-emerald-600/30 via-primary/25 to-teal-500/20" />

        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            {/* Avatar & Identifiers */}
            <div className="flex items-end gap-5">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl p-1 bg-background-card border-2 border-border shadow-xl">
                  <AvatarImage
                    avatar={profile.avatar}
                    name={profile.name}
                    size="xl"
                    className="w-full h-full rounded-2xl object-cover"
                  />
                </div>
                {tutorProfile?.verified && (
                  <div
                    title="Verified Academic Tutor"
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Tutor
                  </span>
                </div>
                <p className="text-sm text-foreground-muted font-mono">@{profile.username}</p>
                {specialization && (
                  <p className="text-sm font-medium text-foreground-secondary">{specialization}</p>
                )}
              </div>
            </div>

            {/* Action & Rate */}
            <div className="flex items-center gap-3 flex-wrap">
              {hourlyRate && (
                <div className="px-4 py-2.5 rounded-2xl bg-background-secondary border border-border">
                  <p className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Rate</p>
                  <p className="text-sm font-bold text-emerald-500">{hourlyRate}</p>
                </div>
              )}

              <button
                onClick={handleOpenGeneralInquiry}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Inquire on Telegram
              </button>
            </div>
          </div>

          {/* Subjects & Curriculums Tags */}
          <div className="mt-6 pt-6 border-t border-border/60 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-foreground-muted mr-1">Teaching:</span>
            {subjects.map((sub, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                <BookOpen className="w-3 h-3" />
                {sub}
              </span>
            ))}
            {curriculums.map((curr, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-background-secondary text-foreground-muted border border-border"
              >
                {curr}
              </span>
            ))}
            {institution && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-background-secondary text-foreground-muted border border-border">
                <Building className="w-3 h-3" />
                {institution}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('schedule')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'schedule'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
          )}
        >
          <Calendar className="w-4 h-4" />
          Weekly Teaching Schedule
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'about'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
          )}
        >
          <BookOpen className="w-4 h-4" />
          About & Bio
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'credentials'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
          )}
        >
          <Award className="w-4 h-4" />
          Credentials ({certifications.length})
        </button>

        {profile.projects && profile.projects.length > 0 && (
          <button
            onClick={() => setActiveTab('portfolio')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'portfolio'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
            )}
          >
            <Layers className="w-4 h-4" />
            Projects ({profile.projects.length})
          </button>
        )}
      </div>

      {/* Tab 1: Weekly Teaching Schedule */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">Weekly Class Schedule</h2>
              <p className="text-xs text-foreground-muted">
                Sunday to Saturday timetable view. Click any open slot to request lessons.
              </p>
            </div>
            <button
              onClick={handleOpenGeneralInquiry}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Need custom timing? Inquire on Telegram
            </button>
          </div>

          <TutorWeeklySchedule
            availability={tutorProfile?.availability_slots}
            isEditable={false}
            onSelectSlot={handleSelectSlot}
          />
        </div>
      )}

      {/* Tab 2: About & Bio */}
      {activeTab === 'about' && (
        <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground mb-2">Teaching Methodology & Bio</h3>
            <p className="text-sm text-foreground-secondary leading-relaxed whitespace-pre-wrap">
              {profile.bio || 'No detailed bio provided yet.'}
            </p>
          </div>

          {subjects.length > 0 && (
            <div className="pt-6 border-t border-border/60">
              <h4 className="text-sm font-bold text-foreground mb-3">Subjects & Specializations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map((sub, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-background-secondary border border-border flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{sub}</p>
                      <p className="text-[11px] text-foreground-muted">Available for personalized tutoring</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Credentials & Certifications */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <CertificationSection certifications={certifications} />
        </div>
      )}

      {/* Tab 4: Portfolio */}
      {activeTab === 'portfolio' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(profile.projects || []).map((p, i) => (
            <div key={i} className="bg-background-card border border-border rounded-2xl p-5 space-y-2">
              <h4 className="text-base font-bold text-foreground">{p.title}</h4>
              <p className="text-xs text-foreground-secondary line-clamp-3">{p.description}</p>
              {p.technologies && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {p.technologies.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-background-secondary text-foreground-muted font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inquiry & QR Modal */}
      <TutorInquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        tutorName={profile.name}
        telegramHandle={telegramHandle}
        hourlyRate={hourlyRate}
        selectedSlot={selectedSlot}
        teachingSubjects={subjects}
      />
    </div>
  );
}
