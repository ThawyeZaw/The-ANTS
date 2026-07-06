'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  getMainContributorDashboardStats,
  mockReviewQueue,
  getPendingUpgradeRequests,
  getProfile,
  mockReviewRoleUpgrade,
} from '@/lib/mock/database';

export default function MainContributorDashboard() {
  const { user } = useAuth();
  const { role, isMainContributor } = useRole();
  const router = useRouter();

  const [pendingUpgrades, setPendingUpgrades] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (role && !isMainContributor) {
      router.replace(`/${role === 'main_contributor' ? 'main-contributor' : role}`);
    }
  }, [role, isMainContributor, router]);

  // Load data
  const loadData = () => {
    if (!user) return;
    setPendingUpgrades(getPendingUpgradeRequests());
    setPendingReviews(mockReviewQueue.filter(q => q.status === 'pending'));
    setStats(getMainContributorDashboardStats(user.id));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!user || !isMainContributor) return null;

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "You have pending reviews waiting. Here's your gatekeeper overview.";

  const handleReviewUpgrade = (requestId: string, status: 'approved' | 'rejected') => {
    const res = mockReviewRoleUpgrade(requestId, user.id, status);
    if (res.success) {
      loadData();
    }
  };

  // Alert Banner
  const alertBanner = pendingReviews.length > 0 ? (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 shadow-sm">
      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0 self-start sm:self-auto">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-foreground">{pendingReviews.length} submissions awaiting review</p>
        <p className="text-sm text-foreground-muted">Contributor curriculum, subject, or topic submissions need your approval.</p>
      </div>
      <Link href="/main-contributor/review-queue" className="shrink-0 self-start sm:self-auto">
        <button className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer shadow-md shadow-amber-500/10">
          Review Now
        </button>
      </Link>
    </div>
  ) : null;

  const mainContent = (
    <div className="space-y-6">
      {/* Pending Submissions */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Pending Submissions
          </h2>
          <Link href="/main-contributor/review-queue" className="text-sm text-primary hover:text-primary/80 transition-colors">
            View All Queue →
          </Link>
        </div>

        {pendingReviews.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center text-foreground-muted">
            <p className="text-sm font-medium">No pending submissions in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReviews.slice(0, 3).map((item) => {
              const contributorName = getProfile(item.contributor_id)?.name || 'Contributor';
              return (
                <div key={item.id} className="p-4 bg-background-card/50 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-primary/45 transition-colors">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      {item.submission_type.toUpperCase()}
                    </span>
                    <h4 className="font-semibold text-sm text-foreground mt-2">{item.submitted_data.title || item.submitted_data.name}</h4>
                    <p className="text-xs text-foreground-muted mt-1">Submitted by: {contributorName} · {new Date(item.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <Link href="/main-contributor/review-queue" className="self-start sm:self-auto shrink-0">
                    <button className="px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer">
                      Review Submission
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Upgrade Requests */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-500" />
            Role Upgrade Requests
          </h2>
          <button onClick={loadData} className="p-1 text-foreground-muted hover:text-foreground transition-colors cursor-pointer">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {pendingUpgrades.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center text-foreground-muted">
            <p className="text-sm font-medium">No pending upgrade requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUpgrades.map((request) => {
              const userName = getProfile(request.user_id)?.name || 'User';
              return (
                <div key={request.id} className="p-4 bg-background-card/50 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{userName}</span>
                      <span className="text-xs text-foreground-muted">
                        ({request.current_role} → <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{request.requested_role}</span>)
                      </span>
                    </div>
                    {request.reason && (
                      <p className="text-xs text-foreground-muted bg-background-secondary/50 p-2.5 rounded-lg border border-border/50">
                        &quot;{request.reason}&quot;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleReviewUpgrade(request.id, 'rejected')}
                      className="p-2 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleReviewUpgrade(request.id, 'approved')}
                      className="p-2 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="Approve"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="space-y-6">
      {/* Quick Actions / Review Policy */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-foreground text-lg">
            <ShieldCheck className="h-5 w-5 text-purple-500" />
            Review Policy
          </h3>
        </div>
        <div className="text-xs text-foreground-muted leading-relaxed space-y-2">
          <p>
            As a <strong>Main Contributor</strong>, you are responsible for maintaining curriculum and notes standards:
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Ensure curriculum names, syllabus codes, and exam boards align with official documents.</li>
            <li>Verify role upgrade reasons match verified educator credentials.</li>
            <li>Provide constructive feedback for rejected submissions.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      firstName={firstName}
      welcomeSubtitle={welcomeSubtitle}
      stats={stats}
      alertBanner={alertBanner}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
    />
  );
}
