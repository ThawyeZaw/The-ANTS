'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useRole Hook
// Returns the current user's role and boolean flags for role checks.
// Usage: const { role, isStudent, isTeacher, isContributor, isMainContributor } = useRole();
// ──────────────────────────────────────────────────────────────────────────────

import { usePersonaContext } from '@/context/PersonaContext';

export function useRole() {
  return usePersonaContext();
}
