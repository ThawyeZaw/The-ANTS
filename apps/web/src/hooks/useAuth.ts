'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useAuth Hook
// Thin wrapper around AuthContext for clean imports.
// Usage: const { user, login, logout, isAuthenticated } = useAuth();
// ──────────────────────────────────────────────────────────────────────────────

import { useAuthContext } from '@/context/AuthContext';

export function useAuth() {
  return useAuthContext();
}
