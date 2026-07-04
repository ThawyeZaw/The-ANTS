'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Clock3, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getExamSubmissionsByContributor } from '@/lib/mock/database';

export default function MySubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ReturnType<typeof getExamSubmissionsByContributor>>([]);

  const refresh = useCallback(() => {
    if (!user) return;
    setSubmissions(getExamSubmissionsByContributor(user.id));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Clock3 className="h-4 w-4 text-amber-500" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  if (!user) return null;
  if (submissions.length === 0) return null;

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            <Eye className="h-4 w-4" />
            My Submissions
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Track your proposals</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            View the status of your submitted calculator presets and countdown proposals, including reviewer feedback.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {submissions.map((submission) => (
          <div key={submission.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{submission.title}</p>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {submission.type === 'calculator' ? 'Grade calculator preset' : 'Countdown proposal'} — {submission.summary}
                </p>
              </div>
              <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${statusColor(submission.status)}`}>
                {statusIcon(submission.status)}
                {statusLabel(submission.status)}
              </div>
            </div>

            {submission.status === 'rejected' && submission.feedback ? (
              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-[var(--primary)]">
                <span className="font-semibold">Reviewer feedback:</span> {submission.feedback}
              </div>
            ) : null}

            {submission.status === 'approved' ? (
              <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-sm text-[var(--accent)]">
                Your submission has been approved and is now live.
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
