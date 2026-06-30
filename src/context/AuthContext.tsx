'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Auth Context
// Mock authentication state management with localStorage persistence.
// Will be replaced with Supabase Auth when transitioning to production.
// ──────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AuthUser, Profile, UserRole } from '@/types';
import { mockLogin, mockSignup, isSignupError, mockUpdateProfile, mockUpdateRole } from '@/lib/mock/database';

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
  logout: () => void;
  updateProfile: (
    data: Partial<Pick<Profile, 'name' | 'bio' | 'title' | 'socialLinks' | 'avatar' | 'isPublic' | 'projects' | 'activities' | 'achievements' | 'academicGrades' | 'pinnedItemId' | 'sectionVisibility' | 'sectionOrder' | 'theme' | 'spacing' | 'width' | 'sectionLayout'>>
  ) => Promise<{ success: boolean; error?: string }>;
  updateRole: (newRole: UserRole) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_KEY = 'ants-auth-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = mockLogin(email, password);
      if (!result) {
        return { success: false, error: 'Invalid email or password.' };
      }

      setUser(result);
      localStorage.setItem(SESSION_KEY, JSON.stringify(result));
      return { success: true };
    },
    []
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      _role: UserRole
    ): Promise<{ success: boolean; error?: string }> => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // All signups default to 'student' role; other roles require MC approval
      const result = mockSignup(email, password, name);
      if (isSignupError(result)) {
        return { success: false, error: result.error };
      }

      setUser(result);
      localStorage.setItem(SESSION_KEY, JSON.stringify(result));
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const updateProfile = useCallback(
    async (
      data: Partial<Pick<Profile, 'name' | 'bio' | 'title' | 'socialLinks' | 'avatar' | 'isPublic' | 'projects' | 'activities' | 'achievements' | 'academicGrades' | 'pinnedItemId' | 'sectionVisibility' | 'sectionOrder' | 'theme' | 'spacing' | 'width' | 'sectionLayout'>>
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Not authenticated.' };

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const result = mockUpdateProfile(user.id, data);
      if (!result.success) return { success: false, error: result.error };

      const updatedUser: AuthUser = {
        ...user,
        profile: result.profile,
      };
      setUser(updatedUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      return { success: true };
    },
    [user]
  );

  const updateUserRole = useCallback(
    async (newRole: UserRole): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Not authenticated.' };

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const result = mockUpdateRole(user.id, newRole);
      if (!result.success) return { success: false, error: result.error };

      const updatedUser: AuthUser = {
        ...user,
        profile: result.profile,
      };
      setUser(updatedUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
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
        login,
        signup,
        logout,
        updateProfile,
        updateRole: updateUserRole,
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
