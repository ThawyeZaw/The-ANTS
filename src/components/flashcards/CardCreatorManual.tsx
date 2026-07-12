'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CardCreatorManual Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { createCard } from '@/lib/mock/database';
import type { FlashCard } from '@/types';

interface CardEntry {
  id: string;
  front: string;
  back: string;
}

interface CardCreatorManualProps {
  deckId: string;
  existingCards?: FlashCard[];
  onSaved: (cards: FlashCard[]) => void;
  onCancel: () => void;
}

export default function CardCreatorManual({
  deckId,
  existingCards = [],
  onSaved,
  onCancel,
}: CardCreatorManualProps) {
  const [cards, setCards] = useState<CardEntry[]>([
    { id: `new-${Date.now()}`, front: '', back: '' },
  ]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function updateCard(id: string, field: 'front' | 'back', value: string) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  function addCard() {
    const newCard = { id: `new-${Date.now()}`, front: '', back: '' };
    setCards(prev => [...prev, newCard]);
    setCurrentIdx(cards.length);
  }

  function removeCard(id: string) {
    if (cards.length === 1) {
      setCards([{ id: `new-${Date.now()}`, front: '', back: '' }]);
      return;
    }
    const newCards = cards.filter(c => c.id !== id);
    setCards(newCards);
    setCurrentIdx(prev => Math.min(prev, newCards.length - 1));
  }

  function handleSave() {
    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
      setError('Please fill in at least one card (both front and back).');
      return;
    }
    const created = validCards.map(c =>
      createCard({ deck_id: deckId, front_text: c.front.trim(), back_text: c.back.trim() })
    );
    setSaved(true);
    setTimeout(() => onSaved([...existingCards, ...created]), 600);
  }

  const current = cards[currentIdx];
  const validCount = cards.filter(c => c.front.trim() && c.back.trim()).length;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Card {currentIdx + 1} of {cards.length}
          </span>
          <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
            {validCount} ready to save
          </span>
        </div>
        {/* Dots navigation */}
        <div className="flex items-center gap-1.5">
          {cards.map((_, i) => {
            const isValid = cards[i].front.trim() && cards[i].back.trim();
            return (
              <button
                key={i}
                id={`card-dot-${i}`}
                onClick={() => setCurrentIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentIdx
                    ? 'w-6 bg-[var(--primary)]'
                    : isValid
                    ? 'w-2 bg-green-400'
                    : 'w-2 bg-[var(--border-hover)]'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Card editor */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-[var(--shadow-md)]">
        {/* Front */}
        <div className="border-b border-[var(--border)] p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              Front
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">Question / Term</span>
          </div>
          <textarea
            id={`card-front-${currentIdx}`}
            value={current?.front ?? ''}
            onChange={e => updateCard(current.id, 'front', e.target.value)}
            placeholder="Enter the question or term..."
            rows={3}
            className="w-full resize-none bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none leading-relaxed"
          />
        </div>

        {/* Divider with flip icon */}
        <div className="flex items-center justify-center border-b border-[var(--border)] bg-[var(--background-secondary)] py-2">
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
            <div className="h-px w-12 bg-[var(--border)]" />
            <span className="rounded-full bg-[var(--background-card)] border border-[var(--border)] px-2 py-0.5">↕ Flip</span>
            <div className="h-px w-12 bg-[var(--border)]" />
          </div>
        </div>

        {/* Back */}
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Back
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">Answer / Definition</span>
          </div>
          <textarea
            id={`card-back-${currentIdx}`}
            value={current?.back ?? ''}
            onChange={e => updateCard(current.id, 'back', e.target.value)}
            placeholder="Enter the answer or definition..."
            rows={3}
            className="w-full resize-none bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none leading-relaxed"
          />
        </div>
      </div>

      {/* Card navigation */}
      <div className="flex items-center gap-2">
        <button
          id="prev-card-btn"
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          id="next-card-btn"
          onClick={() => setCurrentIdx(prev => Math.min(cards.length - 1, prev + 1))}
          disabled={currentIdx === cards.length - 1}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
        <button
          id="add-card-btn"
          onClick={addCard}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] py-2 text-sm text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
        >
          <Plus size={14} /> Add Card
        </button>
        <button
          id={`delete-card-btn-${currentIdx}`}
          onClick={() => removeCard(current.id)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground-muted)] hover:border-red-400 hover:text-red-400 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Card list mini-preview */}
      {cards.length > 1 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-3">
          <p className="mb-2 text-xs font-semibold text-[var(--foreground-muted)]">All Cards</p>
          <div className="max-h-32 space-y-1.5 overflow-y-auto">
            {cards.map((card, i) => (
              <button
                key={card.id}
                id={`card-list-item-${i}`}
                onClick={() => setCurrentIdx(i)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition-all ${
                  i === currentIdx
                    ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'hover:bg-[var(--background-card)] text-[var(--foreground-secondary)]'
                }`}
              >
                <span className="w-4 shrink-0 font-bold">{i + 1}.</span>
                <span className="flex-1 truncate">
                  {card.front || <span className="italic opacity-50">Empty front</span>}
                </span>
                {card.front.trim() && card.back.trim() && (
                  <Check size={11} className="shrink-0 text-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500 border border-red-100">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          id="manual-creator-cancel"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] transition-colors"
        >
          Cancel
        </button>
        <button
          id="save-cards-btn"
          onClick={handleSave}
          disabled={saved}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all ${
            saved
              ? 'bg-green-500'
              : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
          }`}
        >
          {saved ? <><Check size={15} /> Saved!</> : `Save ${validCount} Card${validCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
