'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — DeckEditView Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, Sparkles,
  BookOpen, Globe, Lock, Save,
} from 'lucide-react';
import { getCardsByDeck, updateCard, deleteCard, updateDeck } from '@/lib/mock/database';
import type { Deck, FlashCard } from '@/types';
import CardCreatorManual from './CardCreatorManual';
import CardCreatorAI from './CardCreatorAI';

type SubView = 'list' | 'add-manual' | 'add-ai';

interface DeckEditViewProps {
  deck: Deck;
  userId: string;
  onBack: () => void;
  onDeckUpdated: (deck: Deck) => void;
}

export default function DeckEditView({ deck, userId, onBack, onDeckUpdated }: DeckEditViewProps) {
  const [cards, setCards] = useState<FlashCard[]>(getCardsByDeck(deck.id));
  const [subView, setSubView] = useState<SubView>('list');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  // Inline deck name editing
  const [editingDeckName, setEditingDeckName] = useState(false);
  const [deckNameValue, setDeckNameValue] = useState(deck.name);

  function startEditCard(card: FlashCard) {
    setEditingCardId(card.id);
    setEditFront(card.front_text);
    setEditBack(card.back_text);
  }

  function saveCardEdit(cardId: string) {
    const result = updateCard(cardId, { front_text: editFront.trim(), back_text: editBack.trim() });
    if (result.success) {
      setCards(prev => prev.map(c => c.id === cardId ? result.card : c));
    }
    setEditingCardId(null);
  }

  function handleDeleteCard(cardId: string) {
    const result = deleteCard(cardId);
    if (result.success) {
      setCards(prev => prev.filter(c => c.id !== cardId));
    }
  }

  function saveDeckName() {
    if (deckNameValue.trim()) {
      updateDeck(deck.id, { name: deckNameValue.trim() });
      onDeckUpdated({ ...deck, name: deckNameValue.trim() });
    }
    setEditingDeckName(false);
  }

  function handleCardsAdded(newCards: FlashCard[]) {
    setCards(getCardsByDeck(deck.id));
    setSubView('list');
  }

  if (subView === 'add-manual') {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <button id="back-to-list-from-manual" onClick={() => setSubView('list')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-[var(--foreground)]">Add Cards Manually</h2>
        </div>
        <CardCreatorManual
          deckId={deck.id}
          existingCards={cards}
          onSaved={handleCardsAdded}
          onCancel={() => setSubView('list')}
        />
      </div>
    );
  }

  if (subView === 'add-ai') {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <button id="back-to-list-from-ai" onClick={() => setSubView('list')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-[var(--foreground)]">Add Cards with AI</h2>
        </div>
        <CardCreatorAI
          deckId={deck.id}
          deckName={deck.name}
          onSaved={handleCardsAdded}
          onCancel={() => setSubView('list')}
        />
      </div>
    );
  }

  // ── Card list view ──
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-[var(--border)] p-4 sm:p-5">
        <button id="edit-view-back-btn" onClick={onBack}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          {editingDeckName ? (
            <div className="flex items-center gap-2">
              <input
                id="edit-deck-name-input"
                value={deckNameValue}
                onChange={e => setDeckNameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveDeckName(); if (e.key === 'Escape') setEditingDeckName(false); }}
                className="flex-1 rounded-lg border border-[var(--primary)] bg-[var(--background-secondary)] px-3 py-1.5 text-base font-bold text-[var(--foreground)] focus:outline-none"
                autoFocus
              />
              <button id="save-deck-name-btn" onClick={saveDeckName}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
                <Check size={14} />
              </button>
              <button id="cancel-deck-name-edit" onClick={() => setEditingDeckName(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--foreground)] truncate">{deck.name}</h2>
              <button id="edit-deck-name-btn" onClick={() => setEditingDeckName(true)}
                className="flex h-6 w-6 items-center justify-center rounded text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors">
                <Pencil size={12} />
              </button>
            </div>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1">
              <BookOpen size={11} /> {cards.length} card{cards.length !== 1 ? 's' : ''}
            </span>
            {deck.category && (
              <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[var(--primary)] font-medium">
                {deck.category}
              </span>
            )}
            <span className="flex items-center gap-1">
              {deck.is_public ? <><Globe size={11} /> Public</> : <><Lock size={11} /> Private</>}
            </span>
          </div>
        </div>
      </div>

      {/* Add cards buttons */}
      <div className="flex gap-2 p-4 border-b border-[var(--border)]">
        <button
          id="add-cards-manual-btn"
          onClick={() => setSubView('add-manual')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
        >
          <Plus size={14} /> Add Manually
        </button>
        <button
          id="add-cards-ai-btn"
          onClick={() => setSubView('add-ai')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--primary-light)] px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
        >
          <Sparkles size={14} /> Add with AI
        </button>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="text-4xl">🃏</div>
            <p className="text-sm text-[var(--foreground-muted)]">No cards yet. Add some above!</p>
          </div>
        ) : (
          cards.map((card, index) => (
            <div
              key={card.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 transition-all hover:border-[var(--border-hover)]"
            >
              {editingCardId === card.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Front</label>
                    <textarea
                      id={`edit-card-front-${index}`}
                      value={editFront}
                      onChange={e => setEditFront(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Back</label>
                    <textarea
                      id={`edit-card-back-${index}`}
                      value={editBack}
                      onChange={e => setEditBack(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button id={`save-card-edit-${index}`} onClick={() => saveCardEdit(card.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--primary-hover)]">
                      <Save size={12} /> Save
                    </button>
                    <button id={`cancel-card-edit-${index}`} onClick={() => setEditingCardId(null)}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)]">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-0.5">Front</p>
                    <p className="text-sm text-[var(--foreground)] break-words">{card.front_text}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-0.5">Back</p>
                    <p className="text-sm text-[var(--foreground-secondary)] break-words">{card.back_text}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button id={`edit-card-btn-${index}`} onClick={() => startEditCard(card)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button id={`delete-card-btn-${index}`} onClick={() => handleDeleteCard(card.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-red-50 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
