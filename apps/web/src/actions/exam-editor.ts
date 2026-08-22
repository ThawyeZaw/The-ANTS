'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Exam Editor Server Actions (Supabase)
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';

export async function submitExamData(payload: any, contributorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('editor_submissions').insert({
    contributor_id: contributorId,
    submission_type: 'exam_data',
    status: 'pending_review',
    submitted_at: new Date().toISOString(),
    ...(payload ? { submitted_data: payload } : {}),
  } as any);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function submitExamCalculatorPreset(payload: any, contributorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('editor_submissions').insert({
    contributor_id: contributorId,
    submission_type: 'exam_calculator_preset',
    status: 'pending_review',
    submitted_at: new Date().toISOString(),
    ...(payload ? { submitted_data: payload } : {}),
  } as any);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function submitExamCountdownProposal(payload: any, contributorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('editor_submissions').insert({
    contributor_id: contributorId,
    submission_type: 'exam_countdown_proposal',
    status: 'pending_review',
    submitted_at: new Date().toISOString(),
    ...(payload ? { submitted_data: payload } : {}),
  } as any);
  return error ? { success: false, error: error.message } : { success: true };
}
