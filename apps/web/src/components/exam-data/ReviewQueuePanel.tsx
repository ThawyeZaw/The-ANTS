'use client';

import React, { useMemo } from 'react';
import { ShieldCheck, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { usePendingExamSubmissions } from '@/hooks/useExamReview';

export default function ReviewQueuePanel() {
  const { submissions, approve, reject } = usePendingExamSubmissions();

  const counts = useMemo(() => ({
    pending: submissions.filter((item) => item.status === 'pending_review').length,
    approved: submissions.filter((item) => item.status === 'approved').length,
    rejected: submissions.filter((item) => item.status === 'rejected').length,
  }), [submissions]);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            <ShieldCheck className="h-4 w-4" />
            Review Queue
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Main contributor review board</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Approve or reject exam calculator and countdown submissions before they go live.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/70 p-3">
          <p className="text-sm text-[var(--foreground-secondary)]">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{counts.pending}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/70 p-3">
          <p className="text-sm text-[var(--foreground-secondary)]">Approved</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{counts.approved}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/70 p-3">
          <p className="text-sm text-[var(--foreground-secondary)]">Rejected</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{counts.rejected}</p>
        </div>
      </div>

      <div className="space-y-3">
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/60 p-6 text-sm text-[var(--foreground-secondary)]">
            No exam submissions are waiting for review right now.
          </div>
        ) : submissions.map((submission) => (
          <div key={submission.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{submission.title}</p>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {submission.type === 'calculator' ? 'Grade calculator preset' : 'Countdown proposal'} • {submission.contributorName}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background-secondary)]/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--foreground-secondary)]">
                <Clock3 className="h-3.5 w-3.5" />
                {submission.status === 'pending_review' ? 'Pending' : submission.status === 'approved' ? 'Approved' : 'Rejected'}
              </div>
            </div>

            <div className="mt-3 text-sm text-[var(--foreground-secondary)]">
              {submission.summary}
            </div>

            {submission.status === 'pending_review' ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => approve(submission.id, 'user-main-contributor-001')}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject(submission.id, 'user-main-contributor-001', 'Needs review before publication.')}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
