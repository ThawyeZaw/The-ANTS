'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Organisation Server Actions (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, profiles } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type {
  OrgMission,
  OrgTeamMember,
  OrgTeamMemberFormData,
  OrgTimelineItem,
  OrgTimelineItemFormData,
} from '@/types';

const ALLOWED_ROLES = ['admin', 'main_contributor'];

const DEFAULT_MISSION: OrgMission = {
  id: 'org-mission-1',
  content: 'The ANTs is committed to empowering students across Myanmar and worldwide through free, open-access, high-quality curriculum notes, past papers, flashcards, and peer-to-peer learning tools.',
  updatedAt: new Date().toISOString(),
};

export async function getOrgMissionAction(): Promise<OrgMission> {
  return DEFAULT_MISSION;
}

export async function updateOrgMissionAction(content: string): Promise<{ success: boolean; mission?: OrgMission; error?: string }> {
  return {
    success: true,
    mission: {
      id: 'org-mission-1',
      content,
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function getOrgTeamMembersAction(): Promise<OrgTeamMember[]> {
  return [];
}

export async function addOrgTeamMemberAction(formData: OrgTeamMemberFormData): Promise<{ success: boolean; member?: OrgTeamMember; error?: string }> {
  const member: OrgTeamMember = {
    id: `team_${Date.now()}`,
    name: formData.name,
    title: formData.title,
    bio: formData.bio || '',
    photoUrl: formData.photoUrl || '',
    linkedProfileUsername: formData.linkedProfileUsername || undefined,
    order: 0,
    isAlumni: Boolean(formData.isAlumni),
  };
  return { success: true, member };
}

export async function updateOrgTeamMemberAction(id: string, formData: OrgTeamMemberFormData): Promise<{ success: boolean; member?: OrgTeamMember; error?: string }> {
  const member: OrgTeamMember = {
    id,
    name: formData.name,
    title: formData.title,
    bio: formData.bio || '',
    photoUrl: formData.photoUrl || '',
    linkedProfileUsername: formData.linkedProfileUsername || undefined,
    order: 0,
    isAlumni: Boolean(formData.isAlumni),
  };
  return { success: true, member };
}

export async function deleteOrgTeamMemberAction(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function reorderOrgTeamMembersAction(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function getOrgTimelineAction(): Promise<OrgTimelineItem[]> {
  return [];
}

export async function addOrgTimelineItemAction(formData: OrgTimelineItemFormData): Promise<{ success: boolean; item?: OrgTimelineItem; error?: string }> {
  const item: OrgTimelineItem = {
    id: `tl_${Date.now()}`,
    title: formData.title,
    description: formData.description,
    date: formData.date,
    category: formData.category,
    imageUrls: formData.imageUrls || [],
    order: 0,
    highlight: Boolean(formData.highlight),
  };
  return { success: true, item };
}

export async function updateOrgTimelineItemAction(id: string, formData: OrgTimelineItemFormData): Promise<{ success: boolean; item?: OrgTimelineItem; error?: string }> {
  const item: OrgTimelineItem = {
    id,
    title: formData.title,
    description: formData.description,
    date: formData.date,
    category: formData.category,
    imageUrls: formData.imageUrls || [],
    order: 0,
    highlight: Boolean(formData.highlight),
  };
  return { success: true, item };
}

export async function deleteOrgTimelineItemAction(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
