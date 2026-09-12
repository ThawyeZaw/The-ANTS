'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Exam Editor Server Actions (D1 / Drizzle)
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, editorSubmissions } from '@/lib/db';

export async function submitExamData(payload: any, contributorId: string) {
  try {
    const db = getDb();
    await db.insert(editorSubmissions).values({
      title: payload?.subject || payload?.title || 'Exam Data Submission',
      entity_type: 'exam_data',
      submitted_by: contributorId as any,
      status: 'pending',
      data: payload ?? {},
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
      title: payload?.title || payload?.qualification || 'Exam Calculator Preset',
      entity_type: 'exam_calculator_preset',
      submitted_by: contributorId as any,
      status: 'pending',
      data: payload ?? {},
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
      title: payload?.title || payload?.subject || 'Exam Countdown Proposal',
      entity_type: 'exam_countdown_proposal',
      submitted_by: contributorId as any,
      status: 'pending',
      data: payload ?? {},
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit exam countdown proposal' };
  }
}
