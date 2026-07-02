'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Flashcards Library Shell Page
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import DeckLibrary from '@/components/flashcards/DeckLibrary';

export default function FlashcardsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back" />
      <DeckLibrary userId={user.profile.id} />
    </div>
  );
}
