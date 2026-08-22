'use client';

import { Users, Star, FolderGit2, Calendar, MessageSquare } from 'lucide-react';

interface MemberProgress {
  userId: string;
  contributionCount: number;
  projectCount: number;
  eventCount: number;
  milestoneCount: number;
}

interface MemberProgressPanelProps {
  progress: MemberProgress[];
  getProfile: (userId: string) => { name: string; avatar: string; username: string; role: string } | undefined;
}

export default function MemberProgressPanel({ progress, getProfile }: MemberProgressPanelProps) {
  if (progress.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background-card p-8 text-center">
        <Users className="mx-auto h-8 w-8 text-foreground-muted" />
        <p className="mt-3 font-semibold text-foreground">No activity yet</p>
        <p className="text-sm text-foreground-muted">Member contributions will appear here once activity starts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {progress
        .sort((a, b) => b.contributionCount - a.contributionCount)
        .map((member) => {
          const profile = getProfile(member.userId);
          return (
            <div
              key={member.userId}
              className="flex items-center justify-between rounded-lg border border-border bg-background-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {profile?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {profile?.name || 'Unknown Member'}
                  </p>
                  <p className="text-xs text-foreground-muted">@{profile?.username || 'unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-foreground-muted" title="Projects">
                  <FolderGit2 className="h-3.5 w-3.5" />
                  <span>{member.projectCount}</span>
                </div>
                <div className="flex items-center gap-1 text-foreground-muted" title="Events">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{member.eventCount}</span>
                </div>
                <div className="flex items-center gap-1 text-foreground-muted" title="Milestones">
                  <Star className="h-3.5 w-3.5" />
                  <span>{member.milestoneCount}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-foreground" title="Total">
                  <Users className="h-3.5 w-3.5" />
                  <span>{member.contributionCount}</span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
