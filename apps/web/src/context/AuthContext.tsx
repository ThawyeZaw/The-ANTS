'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Auth Context (Multi-Role Support & Profile Management)
// ──────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AuthUser, Profile, UserRole, type OnboardingCurriculumSelection } from '@/types';
import { authClient } from '@/lib/auth-client';
import { actionUpdateProfile } from '@/actions/profile';

const AUTH_CACHE_KEY = 'the_ants_auth_user';
const ACTIVE_ROLE_CACHE_KEY = 'the_ants_active_role';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

function normalizeRole(role: string): UserRole {
  if (role === 'teacher') return 'tutor';
  if (role === 'main_contributor') return 'admin';
  return (role as UserRole) || 'student';
}

function normalizeRoles(roles: any, fallbackRole?: string): UserRole[] {
  let list: string[] = [];
  if (Array.isArray(roles) && roles.length > 0) {
    list = roles;
  } else if (fallbackRole) {
    list = [fallbackRole];
  } else {
    list = ['student'];
  }
  const normalized = list.map(normalizeRole);
  return Array.from(new Set(normalized));
}

function mapProfile(row: Record<string, unknown>): Profile {
  const roles = normalizeRoles(row.roles, row.role as string);
  const primaryRole = normalizeRole((row.role as string) || 'student');

  return {
    id: (row.id as string) ?? '',
    email: (row.email as string) ?? '',
    name: (row.name as string) ?? '',
    username: (row.username as string) ?? '',
    avatar: (row.avatar_url as string) ?? (row.avatar as string) ?? (row.image as string) ?? '',
    role: primaryRole,
    roles,
    activeRole: 'student',
    bio: (row.bio as string) ?? undefined,
    title: (row.title as string) ?? undefined,
    socialLinks: (row.social_links as Profile['socialLinks']) ?? undefined,
    isPublic: (row.is_public as boolean) ?? true,
    pinnedItemId: (row.pinned_item_id as string) ?? undefined,
    sectionVisibility: (row.section_visibility as Profile['sectionVisibility']) ?? undefined,
    sectionOrder: (row.section_order as Profile['sectionOrder']) ?? undefined,
    spacing: (row.spacing as Profile['spacing']) ?? undefined,
    width: (row.width as Profile['width']) ?? undefined,
    sectionLayout: (row.section_layout as Profile['sectionLayout']) ?? undefined,
    showClubMemberships: (row.show_club_memberships as boolean) ?? undefined,
    showClubProjects: (row.show_club_projects as boolean) ?? undefined,
    showClubActivity: (row.show_club_activity as boolean) ?? undefined,
    theme: (row.theme as Profile['theme']) ?? undefined,
    projects: (row.projects as Profile['projects']) ?? undefined,
    activities: (row.activities as Profile['activities']) ?? undefined,
    achievements: (row.achievements as Profile['achievements']) ?? undefined,
    academicGrades: (row.academic_grades as Profile['academicGrades']) ?? undefined,
    testimonials: (row.testimonials as Profile['testimonials']) ?? undefined,
    certifications: (row.certifications as Profile['certifications']) ?? undefined,
    certificationIds: (row.certification_ids as string[] | null) ?? undefined,
    telegramChatId: (row.telegram_chat_id as string) ?? null,
    telegramHandle: (row.telegram_handle as string) ?? undefined,
    hourlyRate: (row.hourly_rate as string) ?? undefined,
    teachingCurriculums: (row.teaching_curriculums as string[]) ?? undefined,
    teachingSubjects: (row.teaching_subjects as string[]) ?? undefined,
    notificationPreferences: (row.notification_preferences as Profile['notificationPreferences']) ?? null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    // Onboarding fields
    onboardingCompleted: (row.onboarding_completed as boolean) ?? true,
    preferredName: (row.preferred_name as string) ?? undefined,
    timezone: (row.timezone as string) ?? undefined,
    institutionName: (row.institution_name as string) ?? undefined,
    onboardingData: (row.onboarding_data as OnboardingCurriculumSelection[]) ?? [],
  };
}

function createDefaultProfile(userId: string, email: string, name?: string): Profile {
  return {
    id: userId,
    email: email,
    name: name || email.split('@')[0],
    username: (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    avatar: '',
    role: 'student',
    roles: ['student'],
    activeRole: 'student',
    isPublic: true,
    showClubMemberships: true,
    showClubProjects: true,
    showClubActivity: true,
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
  };
}

// ── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  roles: UserRole[];
  switchRole: (newRole: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
    role?: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (
    data: Partial<
      Pick<
        Profile,
        | 'name'
        | 'username'
        | 'bio'
        | 'title'
        | 'socialLinks'
        | 'avatar'
        | 'isPublic'
        | 'projects'
        | 'activities'
        | 'achievements'
        | 'academicGrades'
        | 'pinnedItemId'
        | 'sectionVisibility'
        | 'sectionOrder'
        | 'spacing'
        | 'width'
        | 'sectionLayout'
        | 'showClubMemberships'
        | 'showClubProjects'
        | 'showClubActivity'
        | 'theme'
        | 'notificationPreferences'
        | 'telegramHandle'
        | 'telegramChatId'
        | 'hourlyRate'
        | 'teachingCurriculums'
        | 'teachingSubjects'
        | 'timezone'
        | 'preferredName'
        | 'institutionName'
      >
    >
  ) => Promise<{ success: boolean; error?: string }>;
  updateRole: (newRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (data: {
    preferredName?: string;
    timezone?: string;
    institutionName?: string;
    onboardingData?: OnboardingCurriculumSelection[];
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(AUTH_CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(ACTIVE_ROLE_CACHE_KEY);
      if (cached) return normalizeRole(cached);
    }
    return 'student';
  });

  const [isLoading, setIsLoading] = useState(true);

  const roles: UserRole[] = user?.profile.roles && user.profile.roles.length > 0 ? (user.profile.roles as UserRole[]) : ['student'];

  const switchRole = useCallback(
    (newRole: UserRole) => {
      const norm = normalizeRole(newRole);
      setActiveRole(norm);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_ROLE_CACHE_KEY, norm);
      }
      if (user) {
        setUser({
          ...user,
          profile: {
            ...user.profile,
            activeRole: norm,
          },
        });
      }
    },
    [user]
  );

  const hasRole = useCallback(
    (role: UserRole) => {
      const norm = normalizeRole(role);
      return roles.includes(norm) || (norm === 'tutor' && roles.includes('teacher')) || (norm === 'admin' && roles.includes('main_contributor'));
    },
    [roles]
  );

  // Sync profile helper
  const syncProfile = useCallback(
    async (userId: string, email: string, name?: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/me?userId=${encodeURIComponent(userId)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const profile = mapProfile(data.profile);
            const authUser: AuthUser = { id: userId, email, profile };
            setUser(authUser);
            if (typeof window !== 'undefined') {
              localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(authUser));
            }
            return authUser;
          }
        }
      } catch {}

      const defaultUser: AuthUser = {
        id: userId,
        email,
        profile: createDefaultProfile(userId, email, name),
      };
      setUser(defaultUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(defaultUser));
      }
      return defaultUser;
    },
    []
  );

  // Initial Session Check
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const sessionRes = await authClient.getSession();
        if (!isMounted) return;

        if (sessionRes?.data?.user) {
          const sessionUser = sessionRes.data.user;
          await syncProfile(sessionUser.id, sessionUser.email, sessionUser.name);
        } else {
          const cached = typeof window !== 'undefined' ? localStorage.getItem(AUTH_CACHE_KEY) : null;
          if (!cached) {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Session verification fallback:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [syncProfile]);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });

        if (error) {
          return {
            success: false,
            error: error.message || 'Invalid email or password. Please check your credentials.',
          };
        }

        if (data?.user) {
          const sessionUser = data.user;
          const authUser = await syncProfile(sessionUser.id, sessionUser.email, sessionUser.name);
          setUser(authUser);
          setActiveRole('student'); // Default landing active role
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACTIVE_ROLE_CACHE_KEY, 'student');
          }
          return { success: true };
        }

        return { success: false, error: 'Authentication succeeded but user details were missing.' };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Unable to connect to authentication server. Please try again.',
        };
      }
    },
    [syncProfile]
  );

  // ── Signup ─────────────────────────────────────────────────────────────
  const signup = useCallback(
    async (email: string, password: string, name: string, _role?: UserRole) => {
      try {
        // Enforce student default role for all new signups
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name,
        });

        if (error) {
          return {
            success: false,
            error: error.message || 'Registration failed. Please check your details and try again.',
          };
        }

        if (data?.user) {
          const sessionUser = data.user;
          const authUser = await syncProfile(sessionUser.id, sessionUser.email, sessionUser.name);
          setUser(authUser);
          setActiveRole('student');
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACTIVE_ROLE_CACHE_KEY, 'student');
          }
          return { success: true };
        }

        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Unable to connect to authentication server. Please try again.',
        };
      }
    },
    [syncProfile]
  );

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {}
    setUser(null);
    setActiveRole('student');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_CACHE_KEY);
      localStorage.removeItem(ACTIVE_ROLE_CACHE_KEY);
    }
  }, []);

  // ── Update Profile ─────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (
      data: Partial<
        Pick<
          Profile,
          | 'name'
          | 'username'
          | 'bio'
          | 'title'
          | 'socialLinks'
          | 'avatar'
          | 'isPublic'
          | 'projects'
          | 'activities'
          | 'achievements'
          | 'academicGrades'
          | 'pinnedItemId'
          | 'sectionVisibility'
          | 'sectionOrder'
          | 'spacing'
          | 'width'
          | 'sectionLayout'
          | 'showClubMemberships'
          | 'showClubProjects'
          | 'showClubActivity'
          | 'theme'
          | 'notificationPreferences'
          | 'telegramHandle'
          | 'telegramChatId'
          | 'hourlyRate'
          | 'teachingCurriculums'
          | 'teachingSubjects'
          | 'timezone'
          | 'preferredName'
          | 'institutionName'
        >
      >
    ) => {
      if (!user) return { success: false, error: 'Not authenticated.' };

      const updatedProfile: Profile = {
        ...user.profile,
        ...data,
      };

      const updatedUser: AuthUser = {
        ...user,
        profile: updatedProfile,
      };

      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(updatedUser));
      }

      try {
        await Promise.allSettled([
          actionUpdateProfile(user.id, data),
          fetch(`${API_BASE_URL}/api/profile/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              userId: user.id,
              ...data,
            }),
          }),
        ]);
      } catch (err) {
        console.warn('[updateProfile] Sync failed:', err);
      }

      return { success: true };
    },
    [user]
  );

  const updateRole = useCallback(
    async (newRole: UserRole) => {
      return { success: true };
    },
    []
  );

  // ── Complete Onboarding ───────────────────────────────────────────────
  const completeOnboarding = useCallback(
    async (data: {
      preferredName?: string;
      timezone?: string;
      institutionName?: string;
      onboardingData?: OnboardingCurriculumSelection[];
    }) => {
      if (!user) return { success: false, error: 'Not authenticated.' };

      const updatedProfile: Profile = {
        ...user.profile,
        onboardingCompleted: true,
        preferredName: data.preferredName || user.profile.preferredName,
        timezone: data.timezone || user.profile.timezone,
        institutionName: data.institutionName || user.profile.institutionName,
        onboardingData: data.onboardingData || user.profile.onboardingData,
      };

      const updatedUser: AuthUser = {
        ...user,
        profile: updatedProfile,
      };

      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(updatedUser));
      }

      try {
        await fetch(`${API_BASE_URL}/api/profile/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            timezone: data.timezone,
            onboarding_completed: true,
          }),
        });
      } catch {}

      return { success: true };
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        activeRole,
        roles,
        switchRole,
        hasRole,
        login,
        signup,
        logout,
        updateProfile,
        updateRole,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
