'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ExamReviewSubmission {
  id: string;
  title: string;
  type: 'calculator' | 'countdown' | 'exam';
  contributorName: string;
  summary: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

export function usePendingExamSubmissions() {
  const [submissions, setSubmissions] = useState<ExamReviewSubmission[]>([]);
  const supabase = createClient();
  if (!supabase) return;

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('editor_submissions')
      .select('*, profiles!editor_submissions_contributor_id_fkey(name)')
      .eq('status', 'pending_review');

    if (data) {
      const mapped: ExamReviewSubmission[] = data.map((item: any) => ({
        id: item.id,
        title: item.submitted_data?.title ?? '',
        type: item.submitted_data?.type ?? item.submission_type ?? 'exam',
        contributorName: item.profiles?.name ?? 'Unknown',
        summary: item.submitted_data?.summary ?? '',
        status: item.status,
      }));
      setSubmissions(mapped);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const approve = useCallback(async (submissionId: string, reviewerId: string) => {
    const { error } = await supabase
      .from('editor_submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewer_id: reviewerId,
      })
      .eq('id', submissionId);

    if (!error) {
      await refresh();
    }

    return { success: !error };
  }, [refresh, supabase]);

  const reject = useCallback(async (submissionId: string, reviewerId: string, feedback: string) => {
    const { error } = await supabase
      .from('editor_submissions')
      .update({
        status: 'revision_requested',
        reviewed_at: new Date().toISOString(),
        reviewer_id: reviewerId,
        feedback,
      })
      .eq('id', submissionId);

    if (!error) {
      await refresh();
    }

    return { success: !error };
  }, [refresh, supabase]);

  return { submissions, approve, reject, refresh };
}
