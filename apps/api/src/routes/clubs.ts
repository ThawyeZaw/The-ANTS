import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, or, desc } from 'drizzle-orm';
import {
  createDb,
  clubs,
  clubMembers,
  clubMessages,
  clubAnnouncements,
  clubEvents,
  clubMilestones,
  clubProjects,
  clubLinks,
  clubJoinRequests,
} from '@the-ants/db';

export function createClubRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. List public clubs or user clubs
  // RLS replacement: clubs_public_read & club_members_select
  router.get('/', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');
    const mineOnly = c.req.query('mineOnly') === 'true';

    if (userId && mineOnly) {
      const memberships = await db.query.clubMembers.findMany({
        where: eq(clubMembers.user_id, userId),
        with: { club: true },
      });
      return c.json({ success: true, clubs: memberships.map((m) => m.club) });
    }

    const publicClubs = await db.query.clubs.findMany({
      where: eq(clubs.is_public, true),
      orderBy: [desc(clubs.created_at)],
    });

    return c.json({ success: true, clubs: publicClubs });
  });

  // 2. Get single club by slug or ID
  router.get('/:idOrSlug', async (c) => {
    const db = getDb();
    const param = c.req.param('idOrSlug');

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

    const club = await db.query.clubs.findFirst({
      where: isUuid ? eq(clubs.id, param) : eq(clubs.slug, param),
      with: {
        owner: true,
        members: {
          with: { user: true },
        },
        announcements: {
          orderBy: [desc(clubAnnouncements.created_at)],
        },
        events: {
          orderBy: [desc(clubEvents.start_time)],
        },
        milestones: true,
        projects: true,
        links: true,
      },
    });

    if (!club) {
      return c.json({ error: 'Club not found' }, 404);
    }

    return c.json({ success: true, club });
  });

  // 3. Create club
  // RLS replacement: clubs_owner_insert (requires contributor or main_contributor role)
  router.post('/', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const CreateClubSchema = z.object({
      ownerId: z.string().uuid(),
      name: z.string().min(2),
      slug: z.string().min(2).max(50),
      description: z.string().optional(),
      iconUrl: z.string().optional(),
      bannerUrl: z.string().optional(),
      isPublic: z.boolean().optional().default(true),
      joinMode: z.enum(['open', 'request', 'invite_only', 'closed']).optional().default('open'),
      enabledFeatures: z.record(z.string(), z.boolean()).optional(),
    });

    const parsed = CreateClubSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { ownerId, name, slug, description, iconUrl, bannerUrl, isPublic, joinMode, enabledFeatures } =
      parsed.data;

    // Check slug uniqueness
    const existingSlug = await db.query.clubs.findFirst({
      where: eq(clubs.slug, slug.toLowerCase()),
    });

    if (existingSlug) {
      return c.json({ error: 'A club with this URL slug already exists' }, 400);
    }

    const [newClub] = await db
      .insert(clubs)
      .values({
        owner_id: ownerId,
        name,
        slug: slug.toLowerCase(),
        description,
        icon_url: iconUrl,
        banner_url: bannerUrl,
        is_public: isPublic,
        join_mode: joinMode,
        enabled_features: enabledFeatures as any,
      })
      .returning();

    // Auto-add owner as member with owner role
    await db.insert(clubMembers).values({
      club_id: newClub.id,
      user_id: ownerId,
      role: 'owner',
    });

    return c.json({ success: true, club: newClub }, 201);
  });

  // 4. Join club
  // RLS replacement: club_members_insert & club_join_requests_insert
  router.post('/:id/join', async (c) => {
    const db = getDb();
    const clubId = c.req.param('id');
    const body = await c.req.json();

    const JoinSchema = z.object({
      userId: z.string().uuid(),
      message: z.string().optional(),
    });

    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, message } = parsed.data;

    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, clubId),
    });

    if (!club) {
      return c.json({ error: 'Club not found' }, 404);
    }

    // Check existing membership
    const existingMember = await db.query.clubMembers.findFirst({
      where: and(eq(clubMembers.club_id, clubId), eq(clubMembers.user_id, userId)),
    });

    if (existingMember) {
      return c.json({ error: 'You are already a member of this club' }, 400);
    }

    if (club.join_mode === 'closed') {
      return c.json({ error: 'This club is currently closed to new members' }, 403);
    }

    if (club.join_mode === 'request') {
      const [request] = await db
        .insert(clubJoinRequests)
        .values({
          club_id: clubId,
          user_id: userId,
          message,
          status: 'pending',
        })
        .returning();

      return c.json({ success: true, requested: true, request });
    }

    // Open join
    const [membership] = await db
      .insert(clubMembers)
      .values({
        club_id: clubId,
        user_id: userId,
        role: 'member',
      })
      .returning();

    return c.json({ success: true, membership });
  });

  // 5. Get club messages
  // RLS replacement: club_messages_member_select
  router.get('/:id/messages', async (c) => {
    const db = getDb();
    const clubId = c.req.param('id');
    const userId = c.req.query('userId');

    // Verify membership
    if (userId) {
      const isMember = await db.query.clubMembers.findFirst({
        where: and(eq(clubMembers.club_id, clubId), eq(clubMembers.user_id, userId)),
      });
      if (!isMember) {
        return c.json({ error: 'Unauthorized to view messages of this club' }, 403);
      }
    }

    const messages = await db.query.clubMessages.findMany({
      where: eq(clubMessages.club_id, clubId),
      orderBy: [desc(clubMessages.created_at)],
      limit: 100,
    });

    return c.json({ success: true, messages: messages.reverse() });
  });

  // 6. Post club message
  // RLS replacement: club_messages_member_insert
  router.post('/:id/messages', async (c) => {
    const db = getDb();
    const clubId = c.req.param('id');
    const body = await c.req.json();

    const MessageSchema = z.object({
      userId: z.string().uuid(),
      content: z.string().min(1),
      attachmentUrls: z.array(z.string().url()).optional(),
      parentId: z.string().uuid().optional(),
    });

    const parsed = MessageSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, content, attachmentUrls, parentId } = parsed.data;

    // Verify membership
    const membership = await db.query.clubMembers.findFirst({
      where: and(eq(clubMembers.club_id, clubId), eq(clubMembers.user_id, userId)),
    });

    if (!membership) {
      return c.json({ error: 'Unauthorized: Only club members can post messages' }, 403);
    }

    const [newMsg] = await db
      .insert(clubMessages)
      .values({
        club_id: clubId,
        user_id: userId,
        content,
        attachment_urls: attachmentUrls || [],
        parent_id: parentId,
      })
      .returning();

    return c.json({ success: true, message: newMsg }, 201);
  });

  return router;
}
