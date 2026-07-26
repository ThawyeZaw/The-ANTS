'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ProfileStats Component (v2 — All Roles)
// Shows stats for all roles:
//   Contributors: Published Curriculums · Resources · Total Views · Member Since
//   Students/Teachers: Certifications · Club Memberships · Activities · Member Since
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { BookOpen, FileText, Eye, CalendarDays, Award, Users, Activity } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { UserRole } from '@/types';

// ── Animated counter hook ─────────────────────────────────────────────────────

function useAnimatedCount(target: number, duration = 900): number {
  const ref = useRef(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(eased * target);
      if (elementRef.current) {
        elementRef.current.textContent = current.toLocaleString();
      }
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return ref.current;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  isDate?: boolean;
  isString?: boolean;
  icon: React.ReactNode;
  gradient: string;
  iconColor: string;
  accentBg: string;
  accentBorder: string;
}

function StatCard({ label, value, isDate, isString, icon, gradient, iconColor, accentBg, accentBorder }: StatCardProps) {
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
    <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-0.5">
      {/* Hover gradient bg */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      {/* Content */}
      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${accentBg} border ${accentBorder} mb-3`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
          {displayValue ?? (
            <span ref={spanRef}>0</span>
          )}
        </p>
        <p className="text-xs text-foreground-muted mt-1 font-medium uppercase tracking-wider">{label}</p>
      </div>
      {/* Accent line at bottom */}
      <div className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-10 ${iconColor}`} />
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProfileStatsProps {
  role: UserRole;
  // Contributor stats
  contributorStats?: {
    published_curriculums: number;
    published_resources: number;
    total_views: number;
  } | null;
  // Student/teacher stats
  certificationCount?: number;
  clubMembershipCount?: number;
  activityCount?: number;
  memberSince: string;
}

// ── Main Component ────────────────────────────────────────────────────────────

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
    {
      label: 'Curriculums',
      value: contributorStats?.published_curriculums ?? 0,
      icon: <BookOpen className="h-5 w-5" />,
      gradient: 'from-violet-500/20 to-violet-500/5',
      iconColor: 'text-violet-400',
      accentBg: 'bg-violet-500/10',
      accentBorder: 'border-violet-500/20',
    },
    {
      label: 'Resources',
      value: contributorStats?.published_resources ?? 0,
      icon: <FileText className="h-5 w-5" />,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
      accentBg: 'bg-emerald-500/10',
      accentBorder: 'border-emerald-500/20',
    },
    {
      label: 'Total Views',
      value: contributorStats?.total_views ?? 0,
      isString: true as const,
      icon: <Eye className="h-5 w-5" />,
      gradient: 'from-sky-500/20 to-sky-500/5',
      iconColor: 'text-sky-400',
      accentBg: 'bg-sky-500/10',
      accentBorder: 'border-sky-500/20',
    },
    {
      label: 'Member Since',
      value: memberSince,
      isDate: true as const,
      icon: <CalendarDays className="h-5 w-5" />,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-400',
      accentBg: 'bg-amber-500/10',
      accentBorder: 'border-amber-500/20',
    },
  ];

  const studentConfig = [
    {
      label: 'Certifications',
      value: certificationCount,
      icon: <Award className="h-5 w-5" />,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-400',
      accentBg: 'bg-amber-500/10',
      accentBorder: 'border-amber-500/20',
    },
    {
      label: 'Club Memberships',
      value: clubMembershipCount,
      icon: <Users className="h-5 w-5" />,
      gradient: 'from-pink-500/20 to-pink-500/5',
      iconColor: 'text-pink-400',
      accentBg: 'bg-pink-500/10',
      accentBorder: 'border-pink-500/20',
    },
    {
      label: 'Activities',
      value: activityCount,
      icon: <Activity className="h-5 w-5" />,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
      accentBg: 'bg-emerald-500/10',
      accentBorder: 'border-emerald-500/20',
    },
    {
      label: 'Member Since',
      value: memberSince,
      isDate: true as const,
      icon: <CalendarDays className="h-5 w-5" />,
      gradient: 'from-sky-500/20 to-sky-500/5',
      iconColor: 'text-sky-400',
      accentBg: 'bg-sky-500/10',
      accentBorder: 'border-sky-500/20',
    },
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
