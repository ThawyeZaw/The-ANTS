'use client';

import BackButton from '@/components/ui/BackButton';
import { useState, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Search,
  X,
  ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getOrgActivities } from '@/lib/mock/database';
import type { OrgTimelineItem } from '@/types';
import { cn } from '@/lib/utils';

// ── Category Config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'all', label: 'All Events' },
  { key: 'workshop', label: 'Workshops' },
  { key: 'competition', label: 'Competitions' },
  { key: 'camp', label: 'Camps' },
  { key: 'community', label: 'Community' },
  { key: 'other', label: 'Other' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

const CATEGORY_COLORS: Record<string, string> = {
  workshop: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  competition: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  camp: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  community: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  other: 'bg-foreground-muted/15 text-foreground-muted border-foreground-muted/25',
};

const ACTIVE_COLORS: Record<string, string> = {
  all: 'bg-primary/15 text-primary border-primary/25',
  workshop: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  competition: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  camp: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  community: 'bg-violet-500/20 text-violet-400 border-violet-500/40',
  other: 'bg-foreground-muted/20 text-foreground-muted border-foreground-muted/40',
};

export default function OrgActivitiesPage() {
  const router = useRouter();
  const items = getOrgActivities();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  const filtered = useMemo(() => {
    return items.filter((a) => {
      const matchesCat = activeCategory === 'all' || a.category === activeCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.location && a.location.toLowerCase().includes(q))
      );
    });
  }, [items, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <BackButton href="/dashboard" label="Back" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              <span className="font-brand">The ANTs</span> Activities
            </h1>
            <p className="text-sm text-foreground-secondary mt-1">
              Browse past events, workshops, competitions, and community activities.
            </p>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-background-card border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border',
                  activeCategory === cat.key
                    ? ACTIVE_COLORS[cat.key]
                    : 'text-foreground-muted border-border hover:border-foreground-muted/30'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
            <p className="text-sm text-foreground-muted">No activities found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group bg-background-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-40 bg-background-secondary flex items-center justify-center">
                  {item.imageUrls.length > 0 ? (
                    <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-foreground-muted/30" />
                  )}
                </div>
                <div className="p-5">
                  {item.category && (
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border mb-3', CATEGORY_COLORS[item.category] || '')}>
                      {item.category}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed line-clamp-3 mb-4">
                    {item.description}
                  </p>
                  <div className="flex flex-col gap-1.5 text-xs text-foreground-muted">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {item.date}
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
