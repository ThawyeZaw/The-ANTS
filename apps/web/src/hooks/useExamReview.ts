'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useExamReview Hook (Hono API / Neon Backend)
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

export interface ExamReviewSubmission {
  id: string;
  title: string;
  type: 'calculator' | 'countdown' | 'exam';
  contributorName: string;
  summary: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

export function usePendingExamSubmissions(userId?: string) {
  const [submissions, setSubmissions] = useState<ExamReviewSubmission[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/editor/review-queue?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.queue) {
          const mapped: ExamReviewSubmission[] = json.queue.map((item: any) => ({
            id: item.id,
            title: item.submitted_data?.title ?? '',
            type: item.submitted_data?.type ?? item.submission_type ?? 'exam',
            contributorName: 'Contributor',
            summary: item.submitted_data?.summary ?? '',
            status: item.status,
          }));
          setSubmissions(mapped);
        }
      }
    } catch (err) {
      console.error('Error fetching pending submissions:', err);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const approve = useCallback(
    async (submissionId: string, reviewerId: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/editor/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewerId,
            queueId: submissionId,
            action: 'approve',
          }),
        });
        if (res.ok) {
          await refresh();
          return { success: true };
        }
      } catch (err) {
        console.error('Error approving submission:', err);
      }
      return { success: false };
    },
    [refresh]
  );

  const reject = useCallback(
    async (submissionId: string, reviewerId: string, feedback: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/editor/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewerId,
            queueId: submissionId,
            action: 'reject',
            feedback: { comment: feedback },
          }),
        });
        if (res.ok) {
          await refresh();
          return { success: true };
        }
      } catch (err) {
        console.error('Error rejecting submission:', err);
      }
      return { success: false };
    },
    [refresh]
  );

  return { submissions, approve, reject, refresh };
}
