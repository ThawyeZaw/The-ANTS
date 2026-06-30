'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile Stats Component
// Clean inline stats display — no card containers, just flowing data.
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
    },
    {
      label: 'Published Resources',
      value: stats.published_resources,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-emerald-500',
    },
    {
      label: 'Total Views',
      value: stats.total_views.toLocaleString(),
      icon: <Eye className="h-5 w-5" />,
      color: 'text-sky-500',
    },
    {
      label: 'Member Since',
      value: formatDate(memberSince),
      icon: <CalendarDays className="h-5 w-5" />,
      color: 'text-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-y border-white/5 py-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col items-center text-center px-4 py-2"
        >
          <div className={`${card.color} mb-2`}>
            {card.icon}
          </div>
          <p className="text-xl font-bold text-foreground">{card.value}</p>
          <p className="text-xs text-foreground-muted mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
