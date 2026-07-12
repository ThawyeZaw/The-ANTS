'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Profile Activity Component
// Flowing timeline — no card containers, just a connected stream.
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
  return (
    <section>
      {/* Header — just text, no card */}
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
        <div className="w-1 h-6 rounded-full bg-purple-500" />
        <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-foreground-muted text-center py-8">
          No recent activity to show.
        </p>
      ) : (
        /* Timeline — connected flow */
        <div className="pl-5">
          {activities.map((activity, index) => {
            const icon = ACTIVITY_ICONS[activity.activity_type] || <Zap className="h-4 w-4" />;
            const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'text-foreground-muted bg-background-secondary';
            const isLast = index === activities.length - 1;

            return (
              <div key={activity.id} className="flex gap-4 group">
                {/* Timeline dot + continuing line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`p-2 rounded-full ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
                    {icon}
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 bg-border min-h-[24px]" />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLast ? 'pb-0' : ''} min-w-0`}>
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
      )}
    </section>
  );
}
