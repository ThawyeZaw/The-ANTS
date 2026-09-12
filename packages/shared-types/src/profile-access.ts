import type { UserRole } from './index';

/** Roles that may have a public profile page and appear in staff directories. */
export const PUBLIC_PROFILE_ROLES: readonly UserRole[] = [
  'tutor',
  'teacher',
  'contributor',
  'main_contributor',
  'admin',
];

export type ProfileUnavailableReason = 'not_found' | 'private' | 'student_only' | 'role_ineligible';

export function normalizeProfileRoles(
  roles: UserRole[] | string[] | null | undefined,
  fallbackRole?: string | null
): UserRole[] {
  const list =
    Array.isArray(roles) && roles.length > 0
      ? roles
      : fallbackRole
        ? [fallbackRole]
        : ['student'];
  return list as UserRole[];
}

export function canHavePublicProfile(roles: UserRole[] | string[]): boolean {
  return roles.some((r) => (PUBLIC_PROFILE_ROLES as readonly string[]).includes(r));
}

export function isStudentOnlyProfile(roles: UserRole[] | string[]): boolean {
  return !canHavePublicProfile(roles);
}

export function canViewPublicProfile(input: {
  roles: UserRole[] | string[];
  isPublic: boolean;
  profileUserId: string;
  viewerUserId?: string | null;
}): { allowed: boolean; reason?: ProfileUnavailableReason } {
  const { roles, isPublic, profileUserId, viewerUserId } = input;
  const isOwner = !!viewerUserId && viewerUserId === profileUserId;

  if (isStudentOnlyProfile(roles)) {
    return isOwner
      ? { allowed: true, reason: 'student_only' }
      : { allowed: false, reason: 'student_only' };
  }

  if (!canHavePublicProfile(roles)) {
    return isOwner ? { allowed: true } : { allowed: false, reason: 'role_ineligible' };
  }

  if (!isPublic && !isOwner) {
    return { allowed: false, reason: 'private' };
  }

  return { allowed: true };
}

export type TutorAvailabilityStatus = 'available' | 'limited' | 'unavailable';

export interface TutorAvailabilityMeta {
  status?: TutorAvailabilityStatus;
  note?: string;
}

export function parseTutorAvailability(
  slots: unknown
): TutorAvailabilityMeta {
  if (!slots || typeof slots !== 'object') return { status: 'available' };
  const record = slots as Record<string, unknown>;
  const status = record.status;
  if (status === 'available' || status === 'limited' || status === 'unavailable') {
    return {
      status,
      note: typeof record.note === 'string' ? record.note : undefined,
    };
  }
  return { status: 'available' };
}
