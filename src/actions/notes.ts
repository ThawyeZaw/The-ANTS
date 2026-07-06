'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Notes Server Actions (Supabase)
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';

/** Save a note to a user's dashboard library */
export async function actionSaveNote(userId: string, noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('user_saved_notes').upsert({
    user_id: userId,
    note_id: noteId,
    saved_at: new Date().toISOString(),
  });
  return error ? { success: false, error: error.message } : { success: true };
}

/** Remove a note from a user's saved list */
export async function actionUnsaveNote(userId: string, noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('user_saved_notes').delete()
    .eq('user_id', userId)
    .eq('note_id', noteId);
  return error ? { success: false, error: error.message } : { success: true };
}

/** Submit a note for main-contributor review */
export async function actionSubmitNoteForReview(noteId: string, contributorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('notes').update({
    status: 'pending_review',
    contributor_id: contributorId,
    submitted_at: new Date().toISOString(),
  }).eq('id', noteId);
  return error ? { success: false, error: error.message } : { success: true };
}

/** Approve a note (main contributor only) */
export async function actionApproveNote(noteId: string, reviewerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('notes').update({
    status: 'approved',
    reviewer_id: reviewerId,
  }).eq('id', noteId);
  return error ? { success: false, error: error.message } : { success: true };
}

/** Reject a note with feedback (main contributor only) */
export async function actionRejectNote(noteId: string, reviewerId: string, feedback: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('notes').update({
    status: 'rejected',
    reviewer_id: reviewerId,
    reviewer_feedback: feedback,
  }).eq('id', noteId);
  return error ? { success: false, error: error.message } : { success: true };
}
