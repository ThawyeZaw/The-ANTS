'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CardCreatorAI Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { importCardsFromParsed } from '@/lib/mock/database';
import AIPromptGenerator from './AIPromptGenerator';
import AICardParser from './AICardParser';
import type { FlashCard, ParsedAICard } from '@/types';

type Step = 'form' | 'prompt' | 'paste' | 'done';

const EXAM_BOARDS = ['CAIE', 'Edexcel / IAL', 'OSSD', 'IELTS', 'SAT', 'Duolingo', 'Other'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Mixed'];

interface CardCreatorAIProps {
  deckId: string;
  deckName: string;
  onSaved: (cards: FlashCard[]) => void;
  onCancel: () => void;
}

export default function CardCreatorAI({ deckId, deckName, onSaved, onCancel }: CardCreatorAIProps) {
  const [step, setStep] = useState<Step>('form');

  // Form state
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [examBoard, setExamBoard] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Result state
  const [savedCards, setSavedCards] = useState<FlashCard[]>([]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) { setFormError('Subject is required.'); return; }
    if (!topic.trim()) { setFormError('Topic is required.'); return; }
    setFormError('');
    setStep('prompt');
  }

  function handleCardsConfirmed(parsed: ParsedAICard[]) {
    const created = importCardsFromParsed(deckId, parsed);
    setSavedCards(created);
    setStep('done');
    setTimeout(() => onSaved(created), 1500);
  }

  const STEPS: { key: Step; label: string }[] = [
    { key: 'form',   label: 'Configure' },
    { key: 'prompt', label: 'Get Prompt' },
    { key: 'paste',  label: 'Import' },
    { key: 'done',   label: 'Done' },
  ];

  const stepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
              i < stepIndex
                ? 'bg-green-500 text-white'
                : i === stepIndex
                ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-glow)]'
                : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border)]'
            }`}>
              {i < stepIndex ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${
              i === stepIndex ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'
            }`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 sm:w-10 transition-all ${
                i < stepIndex ? 'bg-green-500' : 'bg-[var(--border)]'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Form ── */}
      {step === 'form' && (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Configure Your Flashcards</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                id="ai-subject-input"
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Physics, Biology..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
                Topic <span className="text-red-400">*</span>
              </label>
              <input
                id="ai-topic-input"
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Forces and Motion, Osmosis..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              />
            </div>
          </div>

          {/* Card count slider */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-sm font-semibold text-[var(--foreground)]">
              <span>Number of Cards</span>
              <span className="rounded-full bg-[var(--primary-light)] px-2.5 py-0.5 text-[var(--primary)] text-xs font-bold">
                {cardCount}
              </span>
            </label>
            <input
              id="card-count-slider"
              type="range"
              min={5}
              max={50}
              step={5}
              value={cardCount}
              onChange={e => setCardCount(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-xs text-[var(--foreground-muted)] mt-1">
              <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span><span>35</span><span>40</span><span>45</span><span>50</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
                Exam Board <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
              </label>
              <select
                id="ai-exam-board-select"
                value={examBoard}
                onChange={e => setExamBoard(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-all"
              >
                <option value="">Any</option>
                {EXAM_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
                Difficulty <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
              </label>
              <select
                id="ai-difficulty-select"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-all"
              >
                <option value="">Any</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
              Additional Notes <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              id="ai-notes-input"
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Focus on definitions, include chemical equations, use Paper 1 style questions..."
              rows={2}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
            />
          </div>

          {formError && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500 border border-red-100">
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button type="button" id="ai-creator-cancel" onClick={onCancel}
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] transition-colors">
              Cancel
            </button>
            <button type="submit" id="ai-form-next-btn"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all">
              Generate Prompt <ArrowRight size={14} />
            </button>
          </div>
        </form>
      )}

      {/* ── Step 2: Prompt ── */}
      {step === 'prompt' && (
        <div className="space-y-4">
          <AIPromptGenerator
            subject={subject}
            topic={topic}
            cardCount={cardCount}
            examBoard={examBoard || undefined}
            difficulty={difficulty || undefined}
            additionalNotes={additionalNotes || undefined}
          />
          <div className="flex gap-3">
            <button id="prompt-back-btn" onClick={() => setStep('form')}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <button id="prompt-next-btn" onClick={() => setStep('paste')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all">
              I have the AI's response <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Paste & Parse ── */}
      {step === 'paste' && (
        <div className="space-y-4">
          <AICardParser onCardsConfirmed={handleCardsConfirmed} />
          <button id="paste-back-btn" onClick={() => setStep('prompt')}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] transition-colors">
            <ArrowLeft size={14} /> Back to Prompt
          </button>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Check size={32} className="text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {savedCards.length} Card{savedCards.length !== 1 ? 's' : ''} Added!
            </h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Your AI-generated flashcards have been added to <span className="font-semibold text-[var(--foreground)]">{deckName}</span>
            </p>
          </div>
          <div className="animate-pulse-soft text-sm text-[var(--foreground-muted)]">
            Returning to deck editor...
          </div>
        </div>
      )}
    </div>
  );
}
