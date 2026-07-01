'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Flashcard Deck Detail Route
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getDeck } from '@/lib/mock/database';
import type { Deck } from '@/types';
import StudySession from '@/components/flashcards/StudySession';
import DeckEditView from '@/components/flashcards/DeckEditView';
import RelatedContent from '@/components/ui/RelatedContent';
import { ArrowLeft, Layers } from 'lucide-react';

export default function DeckPage() {
  const params = useParams<{ deckId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const deckId = params.deckId;
  const mode = searchParams.get('mode') === 'edit' ? 'edit' : 'study';

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deckId) {
      const found = getDeck(deckId);
      setDeck(found || null);
      setLoading(false);
    }
  }, [deckId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 animate-pulse-soft">
        <div className="text-4xl">🃏</div>
        <p className="text-sm text-[var(--foreground-muted)]">Loading deck...</p>
      </div>
    );
  }

  if (!user) return null;

  if (!deck) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <Layers size={28} />
        </div>
        <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">Deck not found</h3>
        <p className="mb-6 max-w-sm text-sm text-[var(--foreground-secondary)]">
          The flashcard deck you are trying to access does not exist or has been deleted.
        </p>
        <button
          onClick={() => router.push('/flashcards')}
          className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Decks
        </button>
      </div>
    );
  }

  const handleBack = () => {
    router.push('/flashcards');
  };

  const handleDeckUpdated = (updated: Deck) => {
    setDeck(updated);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-md)] overflow-hidden">
        {mode === 'edit' ? (
          <DeckEditView
            deck={deck}
            userId={user.profile.id}
            onBack={handleBack}
            onDeckUpdated={handleDeckUpdated}
          />
        ) : (
          <StudySession
            deckId={deck.id}
            deckName={deck.name}
            userId={user.profile.id}
            onBack={handleBack}
          />
        )}
      </div>

      <RelatedContent
        curriculumId={deck.curriculum_id}
        subjectId={deck.subject_id}
        excludeDeckId={deck.id}
      />
    </div>
  );
}
