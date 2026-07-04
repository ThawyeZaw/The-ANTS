'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — FlashcardsLibraryBrowser
// Browse approved flashcard decks, filtered by enrolled courses (smart mode).
// Contributors can submit their decks. All users can add to their workspace.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Layers, Globe, Sparkles,
  Plus, BookMarked, SquareStack, Check, Send,
  Tag, Brain, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import {
  getLibraryDecks, getDecksByEnrolledCourses, cloneDeck, submitToLibrary,
  getDecksByUser
} from '@/lib/mock/database';
import { QUALIFICATION_REGISTRY } from '@/constants/qualifications';
import { cn } from '@/lib/utils';
import type { Deck } from '@/types';

// ── Board tag badge ───────────────────────────────────────────────────────────

function BoardBadge({ board, code }: { board?: string | null; code?: string | null }) {
  if (!board && !code) return null;

  const qualEntries = Object.values(QUALIFICATION_REGISTRY);
  const match = qualEntries.find(q => q.boardCode === board);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {board && (
        <span className={cn(
          'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
          match ? match.colorClass : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'
        )}>
          {board}
        </span>
      )}
      {code && (
        <span className="text-[10px] font-mono bg-[var(--background-secondary)] text-[var(--foreground-muted)] px-2 py-0.5 rounded-md border border-[var(--border)]">
          {code}
        </span>
      )}
    </div>
  );
}

// ── Library Deck Card ─────────────────────────────────────────────────────────

interface LibraryDeckCardProps {
  deck: Deck;
  isOwned: boolean;
  onAddToWorkspace: (id: string) => void;
  onStudy: (id: string) => void;
  isAdding: boolean;
}

function LibraryDeckCard({ deck, isOwned, onAddToWorkspace, onStudy, isAdding }: LibraryDeckCardProps) {
  const examBoard = (deck as Record<string, unknown>).exam_board as string | null;
  const syllabusCode = (deck as Record<string, unknown>).syllabus_code as string | null;

  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl border bg-[var(--background-card)] p-5 transition-all duration-300',
      'hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 hover:border-[var(--primary)]/30',
      isOwned ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5' : 'border-[var(--border)]'
    )}>
      {isOwned && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
          <Check size={10} />
          In My Decks
        </div>
      )}

      {/* Board tags */}
      <div className="mb-3">
        <BoardBadge board={examBoard} code={syllabusCode} />
      </div>

      {/* Deck name */}
      <h3 className="text-base font-bold text-[var(--foreground)] mb-1 leading-tight line-clamp-2">
        {deck.name}
      </h3>

      {/* Category + description */}
      {deck.category && (
        <div className="flex items-center gap-1 mb-2">
          <Tag size={11} className="text-[var(--foreground-muted)]" />
          <span className="text-xs text-[var(--foreground-muted)]">{deck.category}</span>
        </div>
      )}
      {deck.description && (
        <p className="text-xs text-[var(--foreground-secondary)] mb-4 line-clamp-2">{deck.description}</p>
      )}

      <div className="mt-auto flex gap-2 pt-3 border-t border-[var(--border)]/50">
        <button
          onClick={() => onStudy(deck.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all cursor-pointer"
        >
          <Brain size={13} />
          Study
        </button>
        <button
          id={`add-deck-${deck.id}`}
          onClick={() => onAddToWorkspace(deck.id)}
          disabled={isOwned || isAdding}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all',
            isOwned
              ? 'bg-[var(--primary)]/10 text-[var(--primary)] cursor-default'
              : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)] cursor-pointer'
          )}
        >
          {isOwned ? (
            <><Check size={13} /> Added</>
          ) : isAdding ? (
            <span className="animate-pulse">Adding…</span>
          ) : (
            <><Plus size={13} /> Add to My Decks</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FlashcardsLibraryBrowser() {
  const { user } = useAuth();
  const { role } = useRole();
  const router = useRouter();

  const [smartFilter, setSmartFilter] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Get library decks (smart or all)
  const libraryDecks = useMemo(() => {
    if (!user) return getLibraryDecks();
    return smartFilter
      ? getDecksByEnrolledCourses(user.id)
      : getLibraryDecks();
  }, [user, smartFilter]);

  // User's owned deck IDs
  const ownedDeckIds = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(getDecksByUser(user.id).map(d => d.id));
  }, [user]);

  // Filter
  const filteredDecks = useMemo(() => {
    let list = libraryDecks;

    if (selectedBoard !== 'all') {
      list = list.filter(d => (d as Record<string, unknown>).exam_board === selectedBoard);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        ((d as Record<string, unknown>).exam_board as string | null)?.toLowerCase().includes(q) ||
        ((d as Record<string, unknown>).syllabus_code as string | null)?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [libraryDecks, selectedBoard, searchQuery]);

  // Unique boards in library
  const allBoards = useMemo(() => {
    const boards = getLibraryDecks()
      .map(d => (d as Record<string, unknown>).exam_board as string | null)
      .filter(Boolean) as string[];
    return [...new Set(boards)];
  }, []);

  const handleAddToWorkspace = (deckId: string) => {
    if (!user) return;
    setAddingId(deckId);
    const res = cloneDeck(deckId, user.id);
    setTimeout(() => {
      if (res.success) {
        showToast('Deck added to My Workspace!', 'success');
      } else {
        showToast(res.error || 'Failed to add deck.', 'error');
      }
      setAddingId(null);
    }, 400);
  };

  const handleStudy = (deckId: string) => {
    router.push(`/flashcards/${deckId}?mode=study`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg animate-slide-in-right',
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          {toast.message}
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-cyan-500/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
              <BookMarked size={12} /> Board-tagged · Contributor-approved
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              Flashcards Library
            </h1>
            <p className="max-w-xl text-sm md:text-base text-[var(--foreground-secondary)]">
              Browse decks tagged by exam board and syllabus code. Add any deck to your workspace instantly — your SRS progress starts fresh.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {(role === 'contributor' || role === 'main_contributor') && (
              <button
                onClick={() => router.push('/flashcards')}
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)] transition-all cursor-pointer"
              >
                <Send size={14} />
                Submit a Deck
              </button>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            id="smart-filter-decks"
            onClick={() => setSmartFilter(!smartFilter)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer shrink-0',
              smartFilter
                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
                : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            {smartFilter ? <Sparkles size={14} /> : <Globe size={14} />}
            {smartFilter ? 'For My Courses' : 'Browse All'}
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
            <input
              id="flashcards-library-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, board, syllabus code…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-[var(--foreground-muted)]" />
          <select
            id="board-filter-decks"
            value={selectedBoard}
            onChange={e => setSelectedBoard(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Boards</option>
            {allBoards.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span className="text-xs text-[var(--foreground-muted)] ml-1">
            {filteredDecks.length} deck{filteredDecks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      {filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDecks.map(deck => (
            <LibraryDeckCard
              key={deck.id}
              deck={deck}
              isOwned={ownedDeckIds.has(deck.id)}
              onAddToWorkspace={handleAddToWorkspace}
              onStudy={handleStudy}
              isAdding={addingId === deck.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
            <SquareStack size={28} />
          </div>
          <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">No decks found</h3>
          <p className="mb-6 max-w-sm text-sm text-[var(--foreground-secondary)]">
            {smartFilter
              ? 'No library decks match your enrolled boards. Try "Browse All" to see all available decks.'
              : 'No decks match your current search. Try adjusting the filters.'}
          </p>
          <button
            onClick={() => { setSmartFilter(false); setSelectedBoard('all'); setSearchQuery(''); }}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
          >
            Browse All Decks
          </button>
        </div>
      )}
    </div>
  );
}
