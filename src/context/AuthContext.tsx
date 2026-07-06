'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Auth Context (Supabase)
// Manages auth state via Supabase onAuthStateChange.
// Replaces the previous mock/localStorage implementation.
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
import { createClient } from '@/lib/supabase/client';
import type { TablesUpdate } from '@/types/supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map a Supabase profiles table row (snake_case) to the app Profile type (camelCase). */
function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: (row.email as string) ?? '',
    name: (row.name as string) ?? '',
    username: (row.username as string) ?? '',
    avatar: (row.avatar_url as string) ?? '',
    role: (row.role as UserRole) ?? 'student',
    bio: (row.bio as string) ?? undefined,
    title: (row.title as string) ?? undefined,
    socialLinks: (row.social_links as Profile['socialLinks']) ?? undefined,
    isPublic: (row.is_public as boolean) ?? true,
    pinnedItemId: (row.pinned_item_id as string) ?? undefined,
    sectionVisibility: (row.section_visibility as Profile['sectionVisibility']) ?? undefined,
    projects: (row.projects as Profile['projects']) ?? undefined,
    activities: (row.activities as Profile['activities']) ?? undefined,
    achievements: (row.achievements as Profile['achievements']) ?? undefined,
    certificationIds: (row.certification_ids as string[] | null) ?? undefined,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    // Onboarding fields
    onboardingCompleted: (row.onboarding_completed as boolean) ?? false,
    preferredName: (row.preferred_name as string) ?? undefined,
    timezone: (row.timezone as string) ?? undefined,
    institutionName: (row.institution_name as string) ?? undefined,
    onboardingData: (row.onboarding_data as OnboardingCurriculumSelection[]) ?? [],
  };
}

// ── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<Profile, 'name' | 'bio' | 'title' | 'socialLinks' | 'avatar' | 'isPublic' | 'projects' | 'activities' | 'achievements' | 'pinnedItemId' | 'sectionVisibility'>>
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Listen for auth state changes → fetch profile
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileRow) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            profile: mapProfile(profileRow),
          });
        }
        setIsLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    },
    [supabase]
  );

  // ── Signup (all new users default to 'student'; higher roles require approval) ──
  const signup = useCallback(
    async (email: string, password: string, name: string, _role: UserRole) => {
      // All signups default to 'student'. Role upgrades handled via role_upgrade_requests.
      const username = email.split('@')[0];

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, username },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // onAuthStateChange will pick up the session and fetch the profile
      return { success: true };
    },
    [supabase]
  );

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  // ── Update Profile ─────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (
      data: Partial<Pick<Profile, 'name' | 'bio' | 'title' | 'socialLinks' | 'avatar' | 'isPublic' | 'projects' | 'activities' | 'achievements' | 'pinnedItemId' | 'sectionVisibility'>>
    ) => {
      if (!user) return { success: false, error: 'Not authenticated.' };

      // Map camelCase to DB snake_case columns
      const updates: TablesUpdate<'profiles'> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.bio !== undefined) updates.bio = data.bio;
      if (data.title !== undefined) updates.title = data.title;
      if (data.socialLinks !== undefined) updates.social_links = data.socialLinks as unknown as TablesUpdate<'profiles'>['social_links'];
      if (data.avatar !== undefined) updates.avatar_url = data.avatar;
      if (data.isPublic !== undefined) updates.is_public = data.isPublic;
      if (data.projects !== undefined) updates.projects = data.projects as unknown as TablesUpdate<'profiles'>['projects'];
      if (data.activities !== undefined) updates.activities = data.activities as unknown as TablesUpdate<'profiles'>['activities'];
      if (data.achievements !== undefined) updates.achievements = data.achievements as unknown as TablesUpdate<'profiles'>['achievements'];
      if (data.pinnedItemId !== undefined) updates.pinned_item_id = data.pinnedItemId;
      if (data.sectionVisibility !== undefined) updates.section_visibility = data.sectionVisibility as unknown as TablesUpdate<'profiles'>['section_visibility'];

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refetch profile to sync state
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileRow) {
        setUser({ ...user, profile: mapProfile(profileRow) });
      }

      return { success: true };
    },
    [user, supabase]
  );

  // ── Request Role Upgrade ───────────────────────────────────────────────
  const updateRole = useCallback(
    async (newRole: UserRole) => {
      if (!user) return { success: false, error: 'Not authenticated.' };

      const { error } = await supabase
        .from('role_upgrade_requests')
        .insert({
          user_id: user.id,
          current_role: user.profile.role,
          requested_role: newRole,
          status: 'pending',
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    [user, supabase]
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

      // Mark onboarding complete on profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) return { success: false, error: profileError.message };

      // Save extended data to student_profiles
      const { error: studentError } = await supabase
        .from('student_profiles')
        .upsert({
          id: user.id,
          preferred_name: data.preferredName ?? null,
          timezone: data.timezone ?? null,
          institution_name: data.institutionName ?? null,
          onboarding_data: (data.onboardingData ?? []) as unknown as never,
        });

      if (studentError) return { success: false, error: studentError.message };

      // Refetch profile to sync state
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileRow) {
        setUser({ ...user, profile: mapProfile(profileRow) });
      }

      return { success: true };
    },
    [user, supabase]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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
