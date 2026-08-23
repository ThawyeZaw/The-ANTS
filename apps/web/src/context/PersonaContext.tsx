'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Persona Context (Multi-Role & Active Persona Management)
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
  role: UserRole;
  activeRole: UserRole;
  roles: UserRole[];
  isStudent: boolean;
  isTutor: boolean;
  isTeacher: boolean; // Alias for backward compatibility
  isContributor: boolean;
  isAdmin: boolean;
  isMainContributor: boolean; // Alias for backward compatibility
  hasRole: (role: UserRole) => boolean;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_PERSONA_VALUE: PersonaContextValue = {
  role: 'student',
  activeRole: 'student',
  roles: ['student'],
  isStudent: true,
  isTutor: false,
  isTeacher: false,
  isContributor: false,
  isAdmin: false,
  isMainContributor: false,
  hasRole: (r: UserRole) => r === 'student',
  switchRole: () => {},
};

const PersonaContext = createContext<PersonaContextValue>(DEFAULT_PERSONA_VALUE);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const { activeRole, roles, hasRole, switchRole } = useAuthContext();

  const value = useMemo<PersonaContextValue>(() => {
    const isTutor = hasRole('tutor') || hasRole('teacher');
    const isAdmin = hasRole('admin') || hasRole('main_contributor');

    return {
      role: activeRole,
      activeRole,
      roles,
      isStudent: hasRole('student'),
      isTutor,
      isTeacher: isTutor,
      isContributor: hasRole('contributor'),
      isAdmin,
      isMainContributor: isAdmin,
      hasRole,
      switchRole,
    };
  }, [activeRole, roles, hasRole, switchRole]);

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersonaContext(): PersonaContextValue {
  const context = useContext(PersonaContext);
  return context || DEFAULT_PERSONA_VALUE;
}
