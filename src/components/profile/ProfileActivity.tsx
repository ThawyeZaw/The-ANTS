'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile Activity Component
// Timeline-style recent activity feed for the public profile page.
// ──────────────────────────────────────────────────────────────────────────────

import {
  FileText,
  CheckCircle2,
  BookOpen,
  Clock,
  Zap,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface ProfileActivityProps {
  activities: ActivityItem[];
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  resource_published: <FileText className="h-4 w-4" />,
  submission_approved: <CheckCircle2 className="h-4 w-4" />,
  curriculum_created: <BookOpen className="h-4 w-4" />,
  pomodoro_completed: <Zap className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  resource_published: 'text-violet-500 bg-violet-500/10',
  submission_approved: 'text-emerald-500 bg-emerald-500/10',
  curriculum_created: 'text-sky-500 bg-sky-500/10',
  pomodoro_completed: 'text-amber-500 bg-amber-500/10',
};

export default function ProfileActivity({ activities }: ProfileActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-background-card border border-border rounded-2xl p-8 text-center">
        <Clock className="h-8 w-8 text-foreground-muted mx-auto mb-3" />
        <p className="text-sm text-foreground-muted">No recent activity to show.</p>
      </div>
    );
  }

  return (
    <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Recent Activity</h2>
        <p className="text-xs text-foreground-muted mt-0.5">Latest contributions and milestones</p>
      </div>

      {/* Timeline */}
      <div className="px-6 py-4">
        <div className="space-y-0">
          {activities.map((activity, index) => {
            const icon = ACTIVITY_ICONS[activity.activity_type] || <Zap className="h-4 w-4" />;
            const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'text-foreground-muted bg-background-secondary';
            const isLast = index === activities.length - 1;

            return (
              <div key={activity.id} className="flex gap-3 group">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`p-2 rounded-lg ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
                    {icon}
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 bg-border min-h-[24px]" />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                  <p className="text-sm text-foreground font-medium">
                    {activity.description}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
