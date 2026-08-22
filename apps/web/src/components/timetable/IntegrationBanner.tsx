'use client';

import React from 'react';
import { FileText, AlertCircle, Users, Clock } from 'lucide-react';

interface IntegrationBannerProps {
  examCount: number;
  assignmentCount: number;
  clubEventCount: number;
  milestoneCount: number;
}

export default function IntegrationBanner({
  examCount,
  assignmentCount,
  clubEventCount,
  milestoneCount,
}: IntegrationBannerProps) {
  const total = examCount + assignmentCount + clubEventCount + milestoneCount;
  if (total === 0) return null;

  const items = [
    examCount > 0 && { icon: FileText, count: examCount, label: examCount === 1 ? 'exam' : 'exams', color: '#ef4444' },
    assignmentCount > 0 && { icon: Clock, count: assignmentCount, label: assignmentCount === 1 ? 'assignment deadline' : 'assignment deadlines', color: '#f59e0b' },
    clubEventCount > 0 && { icon: Users, count: clubEventCount, label: clubEventCount === 1 ? 'club event' : 'club events', color: '#ec4899' },
    milestoneCount > 0 && { icon: AlertCircle, count: milestoneCount, label: milestoneCount === 1 ? 'milestone' : 'milestones', color: '#f59e0b' },
  ].filter(Boolean) as { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>, count: number, label: string, color: string }[];

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
        borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
      }}
    >
      <div
        className="flex items-center gap-1 shrink-0 font-medium"
        style={{ color: 'var(--primary)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Connected
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map(({ icon: Icon, count, label, color }) => (
          <div key={label} className="flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
            <Icon size={11} style={{ color }} />
            <span>
              <span className="font-medium" style={{ color }}>{count}</span>
              {' '}
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="ml-auto text-foreground-muted text-[10px] shrink-0 hidden sm:block">from your features</p>
    </div>
  );
}
