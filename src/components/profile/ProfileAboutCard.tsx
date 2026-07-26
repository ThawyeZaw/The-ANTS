'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ProfileAboutCard Component (NEW)
// Shows institution, city/country, year of study, and "open to" status.
// Data comes from profile fields: institutionName, timezone, onboardingData.
// ──────────────────────────────────────────────────────────────────────────────

import {
  Building2,
  MapPin,
  CalendarDays,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

// ── "Open to" presets ─────────────────────────────────────────────────────────

const OPEN_TO_PRESETS = [
  { key: 'university', label: 'University Applications', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { key: 'internships', label: 'Internships', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { key: 'tutoring', label: 'Tutoring', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { key: 'collaboration', label: 'Collaboration', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { key: 'networking', label: 'Networking', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
];

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor?: string;
}

function InfoRow({ icon, label, value, iconColor = 'text-foreground-muted' }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={cn('shrink-0', iconColor)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

interface ProfileAboutCardProps {
  profile: Profile;
}

export default function ProfileAboutCard({ profile }: ProfileAboutCardProps) {
  // Derive info from profile fields
  const institution = profile.institutionName;
  const timezone = profile.timezone;

  // Derive year of study from onboardingData (look for an exam year)
  const examYear = profile.onboardingData?.find(d => d.examYear)?.examYear;
  const studyYear = examYear ? `Exams ${examYear}` : null;

  // Nothing to show
  if (!institution && !timezone && !studyYear) return null;

  return (
    <div className="rounded-2xl border border-border bg-background-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-3 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base font-bold text-foreground">About</h2>
      </div>

      <div className="px-5 pt-3 pb-4">
        {/* Info rows */}
        <div>
          {institution && (
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label="Institution"
              value={institution}
              iconColor="text-primary"
            />
          )}
          {timezone && (
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Location / Timezone"
              value={timezone.replace('_', ' ').replace('/', ' — ')}
              iconColor="text-emerald-500"
            />
          )}
          {studyYear && (
            <InfoRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Study Year"
              value={studyYear}
              iconColor="text-amber-500"
            />
          )}
        </div>

        {/* "Open to" status badges — shown if profile has any curriculum data suggesting active student */}
        {profile.onboardingData && profile.onboardingData.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-foreground-muted" />
              <p className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">Studying</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.onboardingData.slice(0, 3).map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {d.curriculumType.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
