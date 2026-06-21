'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile Stats Component
// Glassmorphism stat cards for contributor profiles.
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

export default function ProfileStats({ stats, memberSince }: ProfileStatsProps) {
  const cards = [
    {
      label: 'Published Curriculums',
      value: stats.published_curriculums,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Published Resources',
      value: stats.published_resources,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Views',
      value: stats.total_views.toLocaleString(),
      icon: <Eye className="h-5 w-5" />,
      color: 'text-sky-500',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Member Since',
      value: formatDate(memberSince),
      icon: <CalendarDays className="h-5 w-5" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-background-card border border-border rounded-xl p-4 hover:shadow-md hover:border-border-hover transition-all duration-200"
        >
          <div className={`${card.bg} ${card.color} p-2 rounded-lg w-fit mb-3`}>
            {card.icon}
          </div>
          <p className="text-lg font-bold text-foreground">{card.value}</p>
          <p className="text-xs text-foreground-muted mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
