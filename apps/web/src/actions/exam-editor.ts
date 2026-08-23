'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Exam Editor Server Actions (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, editorSubmissions } from '@/lib/db';

export async function submitExamData(payload: any, contributorId: string) {
  try {
    const db = getDb();
    await db.insert(editorSubmissions).values({
      contributor_id: contributorId as any,
      submission_type: 'exam_data',
      status: 'pending_review',
      submitted_data: payload ?? {},
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit exam data' };
  }
}

export async function submitExamCalculatorPreset(payload: any, contributorId: string) {
  try {
    const db = getDb();
    await db.insert(editorSubmissions).values({
      contributor_id: contributorId as any,
      submission_type: 'exam_calculator_preset',
      status: 'pending_review',
      submitted_data: payload ?? {},
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit exam calculator preset' };
  }
}

export async function submitExamCountdownProposal(payload: any, contributorId: string) {
  try {
    const db = getDb();
    await db.insert(editorSubmissions).values({
      contributor_id: contributorId as any,
      submission_type: 'exam_countdown_proposal',
      status: 'pending_review',
      submitted_data: payload ?? {},
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit exam countdown proposal' };
  }
}
