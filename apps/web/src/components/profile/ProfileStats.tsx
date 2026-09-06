'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ProfileStats Component
// Clean Lucide outline icons with quiet semantic frames.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { BookOpen, FileText, Eye, CalendarDays, Award, Users, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { formatDate } from '@/lib/utils';
import type { UserRole } from '@/types';

interface StatCardProps {
  label: string;
  value: string | number;
  isDate?: boolean;
  isString?: boolean;
  icon: LucideIcon;
}

function StatCard({ label, value, isDate, isString, icon }: StatCardProps) {
  const numValue = typeof value === 'number' ? value : 0;
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isDate || isString || typeof value !== 'number') return;
    const el = spanRef.current;
    if (!el) return;
    const duration = 900;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numValue);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [numValue, isDate, isString, value]);

  const displayValue = isDate
    ? formatDate(String(value))
    : isString
      ? String(value)
      : null;

  return (
    <div className="relative rounded-2xl border border-border bg-background-card p-5 transition-colors duration-200 hover:border-border-hover">
      <AppIcon icon={icon} size="md" tone="secondary" frame="soft" className="mb-3" />
      <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
        {displayValue ?? <span ref={spanRef}>0</span>}
      </p>
      <p className="text-xs text-foreground-muted mt-1 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

interface ProfileStatsProps {
  role: UserRole;
  contributorStats?: {
    published_curriculums: number;
    published_resources: number;
    total_views: number;
  } | null;
  certificationCount?: number;
  clubMembershipCount?: number;
  activityCount?: number;
  memberSince: string;
}

export default function ProfileStats({
  role,
  contributorStats,
  certificationCount = 0,
  clubMembershipCount = 0,
  activityCount = 0,
  memberSince,
}: ProfileStatsProps) {
  const isContributor = role === 'contributor' || role === 'main_contributor';

  const contributorConfig = [
    { label: 'Curriculums', value: contributorStats?.published_curriculums ?? 0, icon: BookOpen },
    { label: 'Resources', value: contributorStats?.published_resources ?? 0, icon: FileText },
    { label: 'Total Views', value: contributorStats?.total_views ?? 0, isString: true as const, icon: Eye },
    { label: 'Member Since', value: memberSince, isDate: true as const, icon: CalendarDays },
  ];

  const studentConfig = [
    { label: 'Certifications', value: certificationCount, icon: Award },
    { label: 'Club Memberships', value: clubMembershipCount, icon: Users },
    { label: 'Activities', value: activityCount, icon: Activity },
    { label: 'Member Since', value: memberSince, isDate: true as const, icon: CalendarDays },
  ];

  const config = isContributor ? contributorConfig : studentConfig;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {config.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}
