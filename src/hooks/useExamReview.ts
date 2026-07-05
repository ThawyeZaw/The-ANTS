'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPendingExamSubmissions, approveExamSubmission, rejectExamSubmission } from '@/lib/mock/database';

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

  const refresh = useCallback(() => {
    setSubmissions(getPendingExamSubmissions());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const approve = useCallback((submissionId: string, reviewerId: string) => {
    const result = approveExamSubmission(submissionId, reviewerId);
    if (result.success) {
      refresh();
    }
    return result;
  }, [refresh]);

  const reject = useCallback((submissionId: string, reviewerId: string, feedback: string) => {
    const result = rejectExamSubmission(submissionId, reviewerId, feedback);
    if (result.success) {
      refresh();
    }
    return result;
  }, [refresh]);

  return { submissions, approve, reject, refresh };
}
