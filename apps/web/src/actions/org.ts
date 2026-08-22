'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Organisation Server Actions (Supabase)
// Connects Mission, Team Members, and Timeline/Activities to Supabase DB/Storage.
// Checks main_contributor/admin roles for write operations.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type {
  OrgMission,
  OrgTeamMember,
  OrgTeamMemberFormData,
  OrgTimelineItem,
  OrgTimelineItemFormData,
} from '@/types';

const ALLOWED_ROLES = ['main_contributor'];

/** Check if the current logged-in user is authorized to manage organisation data */
async function checkAuthPermission(): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { authorized: false, error: 'User is not authenticated.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile as any)?.role || 'student';
    if (!ALLOWED_ROLES.includes(role)) {
      return { authorized: false, error: 'Only main contributors are authorized to perform this action.' };
    }

    return { authorized: true, userId: user.id };
  } catch (err) {
    return { authorized: false, error: 'Failed to verify authorization.' };
  }
}

// ── 1. Organisation Mission Actions ──────────────────────────────────────────

const DEFAULT_MISSION: OrgMission = {
  id: 'org-mission-1',
  content: 'The ANTs is committed to empowering students across Myanmar and worldwide through free, open-access, high-quality curriculum notes, past papers, flashcards, and peer-to-peer learning tools.',
  updatedAt: new Date().toISOString(),
};

export async function getOrgMissionAction(): Promise<OrgMission> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('org_mission' as any)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return DEFAULT_MISSION;
    }

    const row = data as any;
    return {
      id: row.id,
      content: row.content,
      updatedAt: row.updated_at,
    };
  } catch {
    return DEFAULT_MISSION;
  }
}

export async function updateOrgMissionAction(content: string): Promise<{ success: boolean; mission?: OrgMission; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();
    const updatedAt = new Date().toISOString();

    // Check if a mission record already exists
    const { data: existing } = await supabase
      .from('org_mission' as any)
      .select('id')
      .limit(1)
      .single();

    let resultData: any;
    if (existing && (existing as any).id) {
      const { data, error } = await supabase
        .from('org_mission' as any)
        .update({
          content,
          updated_at: updatedAt,
          updated_by: auth.userId,
        })
        .eq('id', (existing as any).id)
        .select()
        .single();

      if (error) throw error;
      resultData = data;
    } else {
      const { data, error } = await supabase
        .from('org_mission' as any)
        .insert({
          content,
          updated_at: updatedAt,
          updated_by: auth.userId,
        })
        .select()
        .single();

      if (error) throw error;
      resultData = data;
    }

    return {
      success: true,
      mission: {
        id: resultData.id,
        content: resultData.content,
        updatedAt: resultData.updated_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update organization mission.' };
  }
}

// ── 2. Organisation Team Members Actions ─────────────────────────────────────

export async function getOrgTeamMembersAction(): Promise<OrgTeamMember[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('org_team_members' as any)
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return (data as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      bio: row.bio || '',
      photoUrl: row.photo_url || '',
      linkedProfileUsername: row.linked_profile_username || undefined,
      order: row.display_order ?? 0,
      isAlumni: Boolean(row.is_alumni),
    }));
  } catch {
    return [];
  }
}

export async function addOrgTeamMemberAction(formData: OrgTeamMemberFormData): Promise<{ success: boolean; member?: OrgTeamMember; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();
    
    // Get max display order
    const { data: existing } = await supabase
      .from('org_team_members' as any)
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing[0] ? (existing[0] as any).display_order + 1 : 0;

    const { data, error } = await supabase
      .from('org_team_members' as any)
      .insert({
        name: formData.name,
        title: formData.title,
        bio: formData.bio || '',
        photo_url: formData.photoUrl || '',
        linked_profile_username: formData.linkedProfileUsername || '',
        is_alumni: Boolean(formData.isAlumni),
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    const row = data as any;
    const member: OrgTeamMember = {
      id: row.id,
      name: row.name,
      title: row.title,
      bio: row.bio || '',
      photoUrl: row.photo_url || '',
      linkedProfileUsername: row.linked_profile_username || undefined,
      order: row.display_order,
      isAlumni: row.is_alumni,
    };

    return { success: true, member };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to add team member.' };
  }
}

export async function updateOrgTeamMemberAction(id: string, formData: OrgTeamMemberFormData): Promise<{ success: boolean; member?: OrgTeamMember; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('org_team_members' as any)
      .update({
        name: formData.name,
        title: formData.title,
        bio: formData.bio || '',
        photo_url: formData.photoUrl || '',
        linked_profile_username: formData.linkedProfileUsername || '',
        is_alumni: Boolean(formData.isAlumni),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const row = data as any;
    const member: OrgTeamMember = {
      id: row.id,
      name: row.name,
      title: row.title,
      bio: row.bio || '',
      photoUrl: row.photo_url || '',
      linkedProfileUsername: row.linked_profile_username || undefined,
      order: row.display_order,
      isAlumni: row.is_alumni,
    };

    return { success: true, member };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update team member.' };
  }
}

export async function deleteOrgTeamMemberAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('org_team_members' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete team member.' };
  }
}

export async function reorderOrgTeamMembersAction(memberIds: string[]): Promise<{ success: boolean; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();
    for (let index = 0; index < memberIds.length; index++) {
      await supabase
        .from('org_team_members' as any)
        .update({ display_order: index })
        .eq('id', memberIds[index]);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reorder team members.' };
  }
}

// ── 3. Organisation Timeline / Activities Actions ───────────────────────────

export async function getOrgTimelineItemsAction(): Promise<OrgTimelineItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('org_timeline_items' as any)
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    return (data as any[]).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      category: row.category,
      imageUrls: row.image_urls || [],
      location: row.location || undefined,
      showOnTimeline: Boolean(row.show_on_timeline),
      order: row.display_order ?? 0,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function addOrgTimelineItemAction(formData: OrgTimelineItemFormData): Promise<{ success: boolean; item?: OrgTimelineItem; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();
    
    // Get max display order
    const { data: existing } = await supabase
      .from('org_timeline_items' as any)
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing[0] ? (existing[0] as any).display_order + 1 : 0;

    const { data, error } = await supabase
      .from('org_timeline_items' as any)
      .insert({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        category: formData.category,
        image_urls: formData.imageUrls || [],
        location: formData.location || '',
        show_on_timeline: formData.showOnTimeline !== undefined ? formData.showOnTimeline : true,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    const row = data as any;
    const item: OrgTimelineItem = {
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      category: row.category,
      imageUrls: row.image_urls || [],
      location: row.location || undefined,
      showOnTimeline: row.show_on_timeline,
      order: row.display_order,
      createdAt: row.created_at,
    };

    return { success: true, item };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create timeline item.' };
  }
}

export async function updateOrgTimelineItemAction(id: string, formData: OrgTimelineItemFormData): Promise<{ success: boolean; item?: OrgTimelineItem; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('org_timeline_items' as any)
      .update({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        category: formData.category,
        image_urls: formData.imageUrls || [],
        location: formData.location || '',
        show_on_timeline: formData.showOnTimeline !== undefined ? formData.showOnTimeline : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const row = data as any;
    const item: OrgTimelineItem = {
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      category: row.category,
      imageUrls: row.image_urls || [],
      location: row.location || undefined,
      showOnTimeline: row.show_on_timeline,
      order: row.display_order,
      createdAt: row.created_at,
    };

    return { success: true, item };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update timeline item.' };
  }
}

export async function deleteOrgTimelineItemAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('org_timeline_items' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete timeline item.' };
  }
}

// ── 4. Supabase Storage Image Upload Action ─────────────────────────────────

export async function uploadOrgImageAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const auth = await checkAuthPermission();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No image file provided.' };
    }

    const supabase = await createClient();
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `org-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `org-media/${fileName}`;

    // Upload to 'public' bucket
    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      // Try fallback bucket 'avatars'
      const { error: fallbackError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (fallbackError) {
        throw new Error(uploadError.message || fallbackError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to upload image to Supabase Storage.' };
  }
}
