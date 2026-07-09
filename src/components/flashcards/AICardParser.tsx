'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — AICardParser Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from 'lucide-react';
import { parseAIOutput } from '@/lib/srs/algorithm';
import type { ParsedAICard } from '@/types';

interface AICardParserProps {
  /** Called when the user confirms the final list of cards */
  onCardsConfirmed: (cards: ParsedAICard[]) => void;
}

export default function AICardParser({ onCardsConfirmed }: AICardParserProps) {
  const [rawText, setRawText] = useState('');
  const [parsedCards, setParsedCards] = useState<ParsedAICard[]>([]);
  const [parseError, setParseError] = useState('');
  const [hasParsed, setHasParsed] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  const handleParse = useCallback(() => {
    setParseError('');
    const cards = parseAIOutput(rawText);
    if (cards.length === 0) {
      setParseError(
        'Could not extract any flashcards from the pasted text. Make sure the AI followed the Q:/A: format, or try a different format.'
      );
      setParsedCards([]);
      setHasParsed(true);
      return;
    }
    setParsedCards(cards);
    setHasParsed(true);
  }, [rawText]);

  function handleDeleteCard(index: number) {
    setParsedCards(prev => prev.filter((_, i) => i !== index));
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditFront(parsedCards[index].front);
    setEditBack(parsedCards[index].back);
  }

  function saveEdit() {
    if (editingIndex === null) return;
    setParsedCards(prev =>
      prev.map((card, i) =>
        i === editingIndex ? { ...card, front: editFront.trim(), back: editBack.trim() } : card
      )
    );
    setEditingIndex(null);
  }

  function cancelEdit() {
    setEditingIndex(null);
  }

  function handleAddCard() {
    setParsedCards(prev => [...prev, { front: '', back: '', confirmed: true }]);
    setEditingIndex(parsedCards.length);
    setEditFront('');
    setEditBack('');
  }

  const validCards = parsedCards.filter(c => c.front.trim() && c.back.trim());

  return (
    <div className="space-y-4">
      {/* Paste area */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
          Paste AI Output Here
        </label>
        <textarea
          id="ai-paste-textarea"
          value={rawText}
          onChange={e => { setRawText(e.target.value); setHasParsed(false); }}
          placeholder={`Paste the AI's response here. Expected format:\n\nQ: What is osmosis?\nA: The movement of water molecules through a semipermeable membrane...\n\nQ: Define active transport\nA: The movement of substances against their concentration gradient...`}
          rows={8}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
        />
        <p className="mt-1.5 text-xs text-[var(--foreground-muted)]">
          Supports Q:/A:, Front:/Back:, pipe-separated, and JSON formats.
        </p>
      </div>

      {/* Parse button */}
      <button
        id="parse-ai-btn"
        onClick={handleParse}
        disabled={!rawText.trim()}
        className="w-full rounded-xl bg-[var(--primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Extract Flashcards
      </button>

      {/* Parse error */}
      {hasParsed && parseError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Parsing failed</p>
            <p className="mt-0.5 text-xs text-red-500 dark:text-red-400">{parseError}</p>
          </div>
        </div>
      )}

      {/* Parsed cards preview */}
      {hasParsed && parsedCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Preview — {parsedCards.length} card{parsedCards.length !== 1 ? 's' : ''} extracted
            </h3>
            <span className="text-xs text-[var(--foreground-muted)]">
              {validCards.length} valid
            </span>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {parsedCards.map((card, index) => (
              <div
                key={index}
                className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-3 transition-all"
              >
                {editingIndex === index ? (
                  /* Edit mode */
                  <div className="space-y-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--foreground-muted)]">FRONT</label>
                      <input
                        id={`edit-front-${index}`}
                        value={editFront}
                        onChange={e => setEditFront(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--foreground-muted)]">BACK</label>
                      <textarea
                        id={`edit-back-${index}`}
                        value={editBack}
                        onChange={e => setEditBack(e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        id={`save-edit-${index}`}
                        onClick={saveEdit}
                        className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--primary-hover)]"
                      >
                        <Check size={12} /> Save
                      </button>
                      <button
                        id={`cancel-edit-${index}`}
                        onClick={cancelEdit}
                        className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-card)]"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-0.5">FRONT</p>
                      <p className="text-sm text-[var(--foreground)] break-words">{card.front || <span className="text-red-400 italic">Empty</span>}</p>
                      <p className="mt-1.5 text-xs font-semibold text-[var(--foreground-muted)] mb-0.5">BACK</p>
                      <p className="text-sm text-[var(--foreground-secondary)] break-words">{card.back || <span className="text-red-400 italic">Empty</span>}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        id={`edit-card-${index}`}
                        onClick={() => startEdit(index)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        id={`delete-parsed-card-${index}`}
                        onClick={() => handleDeleteCard(index)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-red-50 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add manual card button */}
          <button
            id="add-parsed-card-btn"
            onClick={handleAddCard}
            className="w-full rounded-xl border border-dashed border-[var(--border)] py-2 text-sm text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
          >
            + Add another card manually
          </button>

          {/* Confirm button */}
          <button
            id="confirm-parsed-cards-btn"
            onClick={() => onCardsConfirmed(validCards)}
            disabled={validCards.length === 0}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Save {validCards.length} Card{validCards.length !== 1 ? 's' : ''} to Deck
          </button>
        </div>
      )}
    </div>
  );
}
