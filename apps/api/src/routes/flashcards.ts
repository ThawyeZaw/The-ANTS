import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, or, desc } from 'drizzle-orm';
import { createDb, decks, cards, cardReviews } from '@the-ants/db';

export function createFlashcardRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Get user decks (or public library decks)
  // RLS replacement: decks_owner_all & decks_public_read
  router.get('/decks', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');
    const isPublicOnly = c.req.query('isPublic') === 'true';

    let condition = eq(decks.is_public, true);
    if (userId && !isPublicOnly) {
      condition = or(eq(decks.owner_id, userId), eq(decks.is_public, true)) as any;
    } else if (userId && c.req.query('mineOnly') === 'true') {
      condition = eq(decks.owner_id, userId);
    }

    const result = await db.query.decks.findMany({
      where: condition,
      orderBy: [desc(decks.created_at)],
    });

    return c.json({ success: true, decks: result });
  });

  // 2. Get single deck with cards
  router.get('/decks/:id', async (c) => {
    const db = getDb();
    const deckId = c.req.param('id');
    const userId = c.req.query('userId');

    const deck = await db.query.decks.findFirst({
      where: eq(decks.id, deckId),
      with: {
        cards: {
          orderBy: (cards, { asc }) => [asc(cards.order_index)],
        },
      },
    });

    if (!deck) {
      return c.json({ error: 'Deck not found' }, 404);
    }

    if (!deck.is_public && deck.owner_id !== userId) {
      return c.json({ error: 'Unauthorized to view this private deck' }, 403);
    }

    return c.json({ success: true, deck });
  });

  // 3. Create deck
  router.post('/decks', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const CreateDeckSchema = z.object({
      ownerId: z.string().uuid(),
      name: z.string().min(1),
      description: z.string().optional(),
      isPublic: z.boolean().optional().default(false),
      tags: z.array(z.string()).optional().default([]),
      subjectId: z.string().uuid().optional(),
      topicId: z.string().uuid().optional(),
      examBoard: z.string().optional(),
      examSeries: z.string().optional(),
      examPaper: z.string().optional(),
      syllabusCode: z.string().optional(),
    });

    const parsed = CreateDeckSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const {
      ownerId,
      name,
      description,
      isPublic,
      tags,
      subjectId,
      topicId,
      examBoard,
      examSeries,
      examPaper,
      syllabusCode,
    } = parsed.data;

    const [newDeck] = await db
      .insert(decks)
      .values({
        owner_id: ownerId,
        name,
        description,
        is_public: isPublic,
        tags,
        subject_id: subjectId,
        topic_id: topicId,
        exam_board: examBoard,
        exam_series: examSeries,
        exam_paper: examPaper,
        syllabus_code: syllabusCode,
      })
      .returning();

    return c.json({ success: true, deck: newDeck }, 201);
  });

  // 4. Update deck
  router.put('/decks/:id', async (c) => {
    const db = getDb();
    const deckId = c.req.param('id');
    const body = await c.req.json();

    const UpdateDeckSchema = z.object({
      userId: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      examBoard: z.string().optional(),
      examSeries: z.string().optional(),
      examPaper: z.string().optional(),
      syllabusCode: z.string().optional(),
    });

    const parsed = UpdateDeckSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, name, description, isPublic, tags, examBoard, examSeries, examPaper, syllabusCode } = parsed.data;

    const existing = await db.query.decks.findFirst({
      where: and(eq(decks.id, deckId), eq(decks.owner_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Deck not found or unauthorized' }, 404);
    }

    const [updated] = await db
      .update(decks)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { is_public: isPublic }),
        ...(tags && { tags }),
        ...(examBoard !== undefined && { exam_board: examBoard }),
        ...(examSeries !== undefined && { exam_series: examSeries }),
        ...(examPaper !== undefined && { exam_paper: examPaper }),
        ...(syllabusCode !== undefined && { syllabus_code: syllabusCode }),
        updated_at: new Date(),
      })
      .where(eq(decks.id, deckId))
      .returning();

    return c.json({ success: true, deck: updated });
  });

  // 5. Delete deck
  router.delete('/decks/:id', async (c) => {
    const db = getDb();
    const deckId = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const existing = await db.query.decks.findFirst({
      where: and(eq(decks.id, deckId), eq(decks.owner_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Deck not found or unauthorized' }, 404);
    }

    await db.delete(decks).where(eq(decks.id, deckId));

    return c.json({ success: true, deckId });
  });

  // 6. Submit SRS Review
  // RLS replacement: card_reviews_owner_all
  router.post('/review', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const ReviewSchema = z.object({
      userId: z.string().uuid(),
      cardId: z.string().uuid(),
      rating: z.number().min(1).max(4),
      state: z.enum(['new', 'learning', 'review', 'relearning']),
      easeFactor: z.number().default(2.5),
      intervalDays: z.number().default(1),
      dueDate: z.string(),
      lapses: z.number().default(0),
      reviewDurationMs: z.number().optional(),
    });

    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const {
      userId,
      cardId,
      rating,
      state,
      easeFactor,
      intervalDays,
      dueDate,
      lapses,
      reviewDurationMs,
    } = parsed.data;

    const [review] = await db
      .insert(cardReviews)
      .values({
        card_id: cardId,
        user_id: userId,
        rating,
        state,
        ease_factor: easeFactor,
        interval_days: intervalDays,
        due_date: new Date(dueDate),
        lapses,
        review_duration_ms: reviewDurationMs,
        reviewed_at: new Date(),
      })
      .returning();

    return c.json({ success: true, review });
  });

  return router;
}
