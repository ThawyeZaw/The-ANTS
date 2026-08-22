'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Persona Context
// Manages the active user role (persona) for role-gated feature access.
// ──────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { UserRole } from '@/types';
import { useAuthContext } from './AuthContext';

interface PersonaContextValue {
  role: UserRole | null;
  isStudent: boolean;
  isTeacher: boolean;
  isContributor: boolean;
  isMainContributor: boolean;
}

const PersonaContext = createContext<PersonaContextValue | undefined>(undefined);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();

  const value = useMemo<PersonaContextValue>(() => {
    const role = user?.profile?.role ?? null;
    return {
      role,
      isStudent: role === 'student',
      isTeacher: role === 'teacher',
      isContributor: role === 'contributor',
      isMainContributor: role === 'main_contributor',
    };
  }, [user]);

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersonaContext(): PersonaContextValue {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersonaContext must be used within a PersonaProvider');
  }
  return context;
}
