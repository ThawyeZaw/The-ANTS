'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Notes Server Actions
// Thin wrappers around mock database operations for client components to call.
// In production, these will call Supabase directly.
// ──────────────────────────────────────────────────────────────────────────────

import {
  saveNote as dbSaveNote,
  unsaveNote as dbUnsaveNote,
  submitNoteForReview,
  approveNote as dbApproveNote,
  rejectNote as dbRejectNote,
} from '@/lib/mock/database';

/** Save a note to a user's dashboard library */
export async function actionSaveNote(userId: string, noteId: string) {
  return dbSaveNote(userId, noteId);
}

/** Remove a note from a user's saved list */
export async function actionUnsaveNote(userId: string, noteId: string) {
  return dbUnsaveNote(userId, noteId);
}

/** Submit a note for main-contributor review */
export async function actionSubmitNoteForReview(noteId: string, contributorId: string) {
  return submitNoteForReview(noteId, contributorId);
}

/** Approve a note (main contributor only) */
export async function actionApproveNote(noteId: string, reviewerId: string) {
  return dbApproveNote(noteId, reviewerId);
}

/** Reject a note with feedback (main contributor only) */
export async function actionRejectNote(noteId: string, reviewerId: string, feedback: string) {
  return dbRejectNote(noteId, reviewerId, feedback);
}
