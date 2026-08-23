'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Notes Server Actions (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, userSavedNotes, notes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

/** Save a note to a user's dashboard library */
export async function actionSaveNote(userId: string, noteId: string) {
  try {
    const db = getDb();
    await db
      .insert(userSavedNotes)
      .values({
        user_id: userId as any,
        note_id: noteId as any,
        saved_at: new Date(),
      })
      .onConflictDoNothing();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save note' };
  }
}

/** Remove a note from a user's saved list */
export async function actionUnsaveNote(userId: string, noteId: string) {
  try {
    const db = getDb();
    await db
      .delete(userSavedNotes)
      .where(
        and(
          eq(userSavedNotes.user_id, userId as any),
          eq(userSavedNotes.note_id, noteId as any)
        )
      );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to unsave note' };
  }
}

/** Submit a note for admin review */
export async function actionSubmitNoteForReview(noteId: string, contributorId: string) {
  try {
    const db = getDb();
    await db
      .update(notes)
      .set({
        status: 'in_review',
        contributor_id: contributorId as any,
        updated_at: new Date(),
      })
      .where(eq(notes.id, noteId as any));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit note' };
  }
}

/** Approve a note (admin only) */
export async function actionApproveNote(noteId: string, reviewerId: string) {
  try {
    const db = getDb();
    await db
      .update(notes)
      .set({
        status: 'published',
        visibility: 'public',
        reviewer_id: reviewerId as any,
        updated_at: new Date(),
      })
      .where(eq(notes.id, noteId as any));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve note' };
  }
}

/** Reject a note with feedback (admin only) */
export async function actionRejectNote(noteId: string, reviewerId: string, feedback: string) {
  try {
    const db = getDb();
    await db
      .update(notes)
      .set({
        status: 'rejected',
        reviewer_id: reviewerId as any,
        reviewer_feedback: feedback,
        updated_at: new Date(),
      })
      .where(eq(notes.id, noteId as any));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reject note' };
  }
}
