'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — DeckLibrary Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Search, Plus, Layers, BookOpen, Brain, Globe, Sparkles } from 'lucide-react';
import type { Deck } from '@/types';
import { getDecksByUser, getPublicDecks, cloneDeck, deleteDeck } from '@/lib/mock/database';
import DeckCard from './DeckCard';
import CreateDeckModal from './CreateDeckModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookMarked } from 'lucide-react';

interface DeckLibraryProps {
  userId: string;
}

export default function DeckLibrary({ userId }: DeckLibraryProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Helper to fetch and deduplicate decks
  const getUniqueDecks = () => {
    return getDecksByUser(userId);
  };

  const [decks, setDecks] = useState<Deck[]>(getUniqueDecks);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Refresh local list from DB
  const refreshDecks = () => {
    setDecks(getUniqueDecks());
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter logic
  const displayedDecks = decks;
  const filteredDecks = displayedDecks.filter(deck => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      deck.name.toLowerCase().includes(query) ||
      (deck.category && deck.category.toLowerCase().includes(query)) ||
      (deck.description && deck.description.toLowerCase().includes(query))
    );
  });

  const handleStudy = (deckId: string) => {
    router.push(`/flashcards/${deckId}?mode=study`);
  };

  const handleEdit = (deckId: string) => {
    router.push(`/flashcards/${deckId}?mode=edit`);
  };

  const handleClone = (deckId: string) => {
    const res = cloneDeck(deckId, userId);
    if (res.success) {
      showToast('Deck cloned successfully to your collection!', 'success');
      refreshDecks();
    } else {
      showToast(res.error || 'Failed to clone deck.', 'error');
    }
  };

  const handleDelete = (deckId: string) => {
    if (confirm('Are you sure you want to delete this deck? All review progress and cards in it will be lost.')) {
      const res = deleteDeck(deckId);
      if (res.success) {
        showToast('Deck deleted successfully.', 'success');
        refreshDecks();
      } else {
        showToast(res.error || 'Failed to delete deck.', 'error');
      }
    }
  };

  const handleDeckCreated = (newDeck: Deck) => {
    setIsCreateModalOpen(false);
    showToast(`Deck "${newDeck.name}" created successfully!`, 'success');
    refreshDecks();
    // Redirect to edit mode so they can add cards immediately
    router.push(`/flashcards/${newDeck.id}?mode=edit`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-300 animate-slide-in-right ${toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
            }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-cyan-500/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
              <Sparkles size={12} className="animate-pulse" /> Spaced Repetition (SM-2)
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              Flashcard Decks
            </h1>
            <p className="max-w-xl text-sm md:text-base text-[var(--foreground-secondary)]">
              Retain knowledge twice as fast with AI-assisted cards and optimized spaced repetition review sessions.
            </p>
          </div>
          <div>
            <button
              id="create-deck-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)]"
            >
              <Plus size={16} /> Create New Deck
            </button>
          </div>
        </div>
        {/* Background glow styling decor */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
        <Link
          href="/library/flashcards"
          className="flex items-center gap-2 rounded-xl bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-600 dark:text-violet-400 transition-all hover:bg-violet-500/20 self-start sm:self-center"
        >
          <BookMarked className="h-4 w-4" aria-hidden="true" />
          Browse Flashcards
        </Link>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
          <input
            id="deck-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search decks or categories..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-10 pr-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Deck Grid */}
      {filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              userId={userId}
              isOwned={deck.owner_id === userId}
              onStudy={handleStudy}
              onEdit={handleEdit}
              onClone={handleClone}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
            <Layers size={28} />
          </div>
          <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">No decks found</h3>
          <p className="mb-6 max-w-sm text-sm text-[var(--foreground-secondary)]">
            {searchQuery
              ? `No decks matching "${searchQuery}". Try another search query.`
              : "You haven't created or added any flashcard decks yet."}
          </p>
          {!searchQuery && (
            <button
              id="create-deck-empty-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-hover)]"
            >
              <Plus size={16} /> Create Your First Deck
            </button>
          )}
        </div>
      )}

      {/* Create Deck Modal */}
      {isCreateModalOpen && (
        <CreateDeckModal
          userId={userId}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleDeckCreated}
        />
      )}
    </div>
  );
}
