'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Flashcards Library Shell Page
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useAuth } from '@/hooks/useAuth';
import DeckLibrary from '@/components/flashcards/DeckLibrary';

export default function FlashcardsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <DeckLibrary userId={user.profile.id} />
    </div>
  );
}
