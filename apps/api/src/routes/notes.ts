import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import {
  createDb,
  notes,
  userNotes,
  userSavedNotes,
} from '@the-ants/db';

export function createNoteRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Get public notes library
  // RLS replacement: notes_public_read (visibility = public and status = published)
  router.get('/library', async (c) => {
    const db = getDb();
    const subjectId = c.req.query('subjectId');
    const topicId = c.req.query('topicId');

    let conditions: any[] = [eq(notes.visibility, 'public'), eq(notes.status, 'published')];
    if (subjectId) conditions.push(eq(notes.subject_id, subjectId));
    if (topicId) conditions.push(eq(notes.topic_id, topicId));

    const libraryNotes = await db.query.notes.findMany({
      where: and(...conditions),
      orderBy: [desc(notes.created_at)],
      with: {
        contributor: true,
        subject: true,
        topic: true,
      },
    });

    return c.json({ success: true, notes: libraryNotes });
  });

  // 2. Get user private notes (personal user_notes)
  // RLS replacement: user_notes_owner_all
  router.get('/user-notes', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');
    const topicId = c.req.query('topicId');
    const subjectId = c.req.query('subjectId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    let conditions: any[] = [eq(userNotes.user_id, userId)];
    if (topicId) conditions.push(eq(userNotes.topic_id, topicId));
    if (subjectId) conditions.push(eq(userNotes.subject_id, subjectId));

    const personalNotes = await db.query.userNotes.findMany({
      where: and(...conditions),
      orderBy: [desc(userNotes.updated_at)],
    });

    return c.json({ success: true, notes: personalNotes });
  });

  // 3. Create personal note
  router.post('/user-notes', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const CreateNoteSchema = z.object({
      userId: z.string().uuid(),
      title: z.string().min(1).default('Untitled Note'),
      content: z.string().optional(),
      blocks: z.array(z.any()).optional().default([]),
      tags: z.array(z.string()).optional().default([]),
      color: z.string().optional(),
      isPinned: z.boolean().optional().default(false),
      topicId: z.string().uuid().optional(),
      subjectId: z.string().uuid().optional(),
      curriculumId: z.string().uuid().optional(),
    });

    const parsed = CreateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const {
      userId,
      title,
      content,
      blocks,
      tags,
      color,
      isPinned,
      topicId,
      subjectId,
      curriculumId,
    } = parsed.data;

    const [newNote] = await db
      .insert(userNotes)
      .values({
        user_id: userId,
        title,
        content,
        blocks,
        tags,
        color,
        is_pinned: isPinned,
        topic_id: topicId,
        subject_id: subjectId,
        curriculum_id: curriculumId,
      })
      .returning();

    return c.json({ success: true, note: newNote }, 201);
  });

  // 4. Update personal note
  router.put('/user-notes/:id', async (c) => {
    const db = getDb();
    const noteId = c.req.param('id');
    const body = await c.req.json();

    const UpdateNoteSchema = z.object({
      userId: z.string().uuid(),
      title: z.string().optional(),
      content: z.string().optional(),
      blocks: z.array(z.any()).optional(),
      tags: z.array(z.string()).optional(),
      color: z.string().optional(),
      isPinned: z.boolean().optional(),
      topicId: z.string().uuid().optional(),
      subjectId: z.string().uuid().optional(),
    });

    const parsed = UpdateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, title, content, blocks, tags, color, isPinned, topicId, subjectId } = parsed.data;

    const existing = await db.query.userNotes.findFirst({
      where: and(eq(userNotes.id, noteId), eq(userNotes.user_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Note not found or unauthorized' }, 404);
    }

    const [updated] = await db
      .update(userNotes)
      .set({
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(blocks && { blocks }),
        ...(tags && { tags }),
        ...(color !== undefined && { color }),
        ...(isPinned !== undefined && { is_pinned: isPinned }),
        ...(topicId !== undefined && { topic_id: topicId }),
        ...(subjectId !== undefined && { subject_id: subjectId }),
        updated_at: new Date(),
      })
      .where(eq(userNotes.id, noteId))
      .returning();

    return c.json({ success: true, note: updated });
  });

  // 5. Delete personal note
  router.delete('/user-notes/:id', async (c) => {
    const db = getDb();
    const noteId = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const existing = await db.query.userNotes.findFirst({
      where: and(eq(userNotes.id, noteId), eq(userNotes.user_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Note not found or unauthorized' }, 404);
    }

    await db.delete(userNotes).where(eq(userNotes.id, noteId));

    return c.json({ success: true, noteId });
  });

  return router;
}
