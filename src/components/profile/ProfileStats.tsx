'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Profile Stats Component (Premium Glassmorphism)
// Glassmorphism stat cards with icons, gradients, and animated counters.
// ──────────────────────────────────────────────────────────────────────────────

import { BookOpen, FileText, Eye, CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ProfileStatsProps {
  stats: {
    published_curriculums: number;
    published_resources: number;
    total_views: number;
  };
  memberSince: string;
}

const statConfig = [
  {
    label: 'Curriculums',
    valueKey: 'published_curriculums' as const,
    icon: BookOpen,
    gradient: 'from-violet-500/20 to-violet-500/5',
    iconColor: 'text-violet-400',
    accentBg: 'bg-violet-500/10',
    accentBorder: 'border-violet-500/20',
  },
  {
    label: 'Resources',
    valueKey: 'published_resources' as const,
    icon: FileText,
    gradient: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/20',
  },
  {
    label: 'Total Views',
    valueKey: 'total_views' as const,
    isFormatted: true,
    icon: Eye,
    gradient: 'from-sky-500/20 to-sky-500/5',
    iconColor: 'text-sky-400',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/20',
  },
  {
    label: 'Member Since',
    valueKey: 'memberSince' as const,
    isDate: true,
    icon: CalendarDays,
    gradient: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/20',
  },
];

export default function ProfileStats({ stats, memberSince }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((config) => {
        const Icon = config.icon;
        let displayValue: string;
        if (config.isDate) {
          displayValue = formatDate(memberSince);
        } else if (config.isFormatted) {
          const raw = stats[config.valueKey as keyof typeof stats];
          displayValue = typeof raw === 'number' ? raw.toLocaleString() : '0';
        } else {
          const raw = stats[config.valueKey as keyof typeof stats];
          displayValue = String(raw ?? '0');
        }

        return (
          <div
            key={config.label}
            className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            {/* Content */}
            <div className="relative z-10">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${config.accentBg} border ${config.accentBorder} mb-3`}>
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                {displayValue}
              </p>
              <p className="text-xs text-foreground-muted mt-1">{config.label}</p>
            </div>

            {/* Subtle accent line at bottom */}
            <div className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-10 ${config.iconColor}`} />
          </div>
        );
      })}
    </div>
  );
}
