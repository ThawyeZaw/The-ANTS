'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Organisation Server Actions (Neon Drizzle DB)
// Persisted in `org_mission` / `org_team_members` / `org_timeline_items`.
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, orgMission, orgTeamMembers, orgTimelineItems } from '@/lib/db';
import { asc, eq } from 'drizzle-orm';
import type {
  OrgMission,
  OrgTeamMember,
  OrgTeamMemberFormData,
  OrgTimelineItem,
  OrgTimelineItemFormData,
} from '@/types';

const MISSION_ID = 'org-mission';

const DEFAULT_MISSION: OrgMission = {
  id: 'org-mission-1',
  content: 'The ANTs is committed to empowering students across Myanmar and worldwide through free, open-access, high-quality curriculum resources, past papers, and peer-to-peer learning tools.',
  updatedAt: new Date().toISOString(),
};

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

// ── Mission ──────────────────────────────────────────────────────────────────

export async function getOrgMissionAction(): Promise<OrgMission> {
  try {
    const db = getDb();
    const [row] = await db.select().from(orgMission).where(eq(orgMission.id, MISSION_ID));
    if (row) {
      return { id: 'org-mission-1', content: row.content, updatedAt: toIso(row.updated_at) };
    }
  } catch {
    // Fall through to default when the table is unavailable
  }
  return DEFAULT_MISSION;
}

export async function updateOrgMissionAction(
  content: string
): Promise<{ success: boolean; mission?: OrgMission; error?: string }> {
  try {
    const db = getDb();
    const [row] = await db
      .insert(orgMission)
      .values({ id: MISSION_ID, content })
      .onConflictDoUpdate({
        target: orgMission.id,
        set: { content, updated_at: new Date() },
      })
      .returning();

    return {
      success: true,
      mission: { id: 'org-mission-1', content: row.content, updatedAt: toIso(row.updated_at) },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update mission' };
  }
}

// ── Team Members ─────────────────────────────────────────────────────────────

function shapeTeamMember(row: typeof orgTeamMembers.$inferSelect): OrgTeamMember {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    bio: row.bio ?? '',
    photoUrl: row.photo_url ?? '',
    linkedProfileUsername: row.linked_profile_username ?? undefined,
    order: row.order_index,
    isAlumni: row.is_alumni,
  };
}

export async function getOrgTeamMembersAction(): Promise<OrgTeamMember[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(orgTeamMembers)
      .orderBy(asc(orgTeamMembers.order_index), asc(orgTeamMembers.created_at));
    return rows.map(shapeTeamMember);
  } catch {
    return [];
  }
}

export async function addOrgTeamMemberAction(
  formData: OrgTeamMemberFormData
): Promise<{ success: boolean; member?: OrgTeamMember; error?: string }> {
  try {
    const db = getDb();
    const existing = await db.select({ id: orgTeamMembers.id }).from(orgTeamMembers);
    const nextOrder = existing.length;

    const [row] = await db
      .insert(orgTeamMembers)
      .values({
        name: formData.name,
        title: formData.title,
        bio: formData.bio || null,
        photo_url: formData.photoUrl || null,
        linked_profile_username: formData.linkedProfileUsername || null,
        is_alumni: Boolean(formData.isAlumni),
        order_index: nextOrder,
      })
      .returning();

    return { success: true, member: shapeTeamMember(row) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to add team member' };
  }
}

export async function updateOrgTeamMemberAction(
  id: string,
  formData: OrgTeamMemberFormData
): Promise<{ success: boolean; member?: OrgTeamMember; error?: string }> {
  try {
    const db = getDb();
    const [row] = await db
      .update(orgTeamMembers)
      .set({
        name: formData.name,
        title: formData.title,
        bio: formData.bio || null,
        photo_url: formData.photoUrl || null,
        linked_profile_username: formData.linkedProfileUsername || null,
        is_alumni: Boolean(formData.isAlumni),
      })
      .where(eq(orgTeamMembers.id, id as any))
      .returning();

    if (!row) return { success: false, error: 'Team member not found' };
    return { success: true, member: shapeTeamMember(row) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update team member' };
  }
}

export async function deleteOrgTeamMemberAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await db.delete(orgTeamMembers).where(eq(orgTeamMembers.id, id as any));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete team member' };
  }
}

export async function reorderOrgTeamMembersAction(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(orgTeamMembers)
          .set({ order_index: index })
          .where(eq(orgTeamMembers.id, id as any))
      )
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reorder team members' };
  }
}

// ── Timeline Items ───────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['workshop', 'competition', 'camp', 'community', 'other', 'milestone'] as const;

type TimelineCategory = OrgTimelineItem['category'];

function normalizeCategory(category: string | null | undefined): TimelineCategory {
  if (!category) return undefined;
  return (VALID_CATEGORIES as readonly string[]).includes(category)
    ? (category as TimelineCategory)
    : 'other';
}

function shapeTimelineItem(row: typeof orgTimelineItems.$inferSelect): OrgTimelineItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    date: row.date_label,
    category: normalizeCategory(row.category),
    imageUrls: row.image_urls ?? [],
    location: row.location ?? undefined,
    order: row.order_index,
    showOnTimeline: row.show_on_timeline,
    createdAt: toIso(row.created_at),
  };
}

export async function getOrgTimelineAction(): Promise<OrgTimelineItem[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(orgTimelineItems)
      .orderBy(asc(orgTimelineItems.order_index), asc(orgTimelineItems.created_at));
    return rows.map(shapeTimelineItem);
  } catch {
    return [];
  }
}

export const getOrgTimelineItemsAction = getOrgTimelineAction;

export async function addOrgTimelineItemAction(
  formData: OrgTimelineItemFormData
): Promise<{ success: boolean; item?: OrgTimelineItem; error?: string }> {
  try {
    const db = getDb();
    const existing = await db.select({ id: orgTimelineItems.id }).from(orgTimelineItems);

    const [row] = await db
      .insert(orgTimelineItems)
      .values({
        title: formData.title,
        description: formData.description || null,
        date_label: formData.date,
        category: formData.category ?? null,
        image_urls: formData.imageUrls || [],
        location: formData.location || null,
        show_on_timeline: formData.showOnTimeline ?? true,
        order_index: existing.length,
      })
      .returning();

    return { success: true, item: shapeTimelineItem(row) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to add timeline item' };
  }
}

export async function updateOrgTimelineItemAction(
  id: string,
  formData: OrgTimelineItemFormData
): Promise<{ success: boolean; item?: OrgTimelineItem; error?: string }> {
  try {
    const db = getDb();
    const [row] = await db
      .update(orgTimelineItems)
      .set({
        title: formData.title,
        description: formData.description || null,
        date_label: formData.date,
        category: formData.category ?? null,
        image_urls: formData.imageUrls || [],
        location: formData.location || null,
        show_on_timeline: formData.showOnTimeline ?? true,
      })
      .where(eq(orgTimelineItems.id, id as any))
      .returning();

    if (!row) return { success: false, error: 'Timeline item not found' };
    return { success: true, item: shapeTimelineItem(row) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update timeline item' };
  }
}

export async function deleteOrgTimelineItemAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    await db.delete(orgTimelineItems).where(eq(orgTimelineItems.id, id as any));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete timeline item' };
  }
}
