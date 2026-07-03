'use client';

import React, { useState, useTransition } from 'react';
import { CalendarClock, Plus, Send, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { submitExamCountdownProposal } from '@/actions/exam-editor';

interface CountdownDraft {
  id: string;
  title: string;
  examDate: string;
  qualification: string;
  priority: string;
}

const createDraft = (): CountdownDraft => ({
  id: `draft-${Date.now()}`,
  title: '',
  examDate: '',
  qualification: 'IGCSE',
  priority: 'medium',
});

export default function CountdownEditor() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<CountdownDraft[]>([createDraft()]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (id: string, key: 'title' | 'examDate' | 'qualification' | 'priority', value: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value } : item));
  };

  const addItem = () => setItems((prev) => [...prev, createDraft()]);
  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    if (!user) {
      setError('Sign in to submit countdown proposals for review.');
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await submitExamCountdownProposal({
        countdowns: items
          .filter((item) => item.title.trim() && item.examDate)
          .map((item) => ({
            title: item.title.trim(),
            exam_date: item.examDate,
            qualification_group: item.qualification,
            priority_indicator: item.priority,
          })),
      }, user.id);

      if (result?.success) {
        setMessage('Countdown proposal submitted to the review queue. A main contributor will review it shortly.');
        return;
      }

      setError(result?.error || 'Unable to submit the countdown proposal.');
    });
  };

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            <CalendarClock className="h-4 w-4" />
            Countdown Editor
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Propose exam countdowns for contributor review</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            New countdown entries are queued for approval before they appear in learner dashboards.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/70 px-4 py-3">
          <p className="text-sm font-medium text-[var(--foreground)]">Add one or more countdown suggestions</p>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
          >
            <Plus className="h-4 w-4" />
            Add countdown
          </button>
        </div>

        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--foreground)]">Countdown proposal</p>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="rounded-lg border border-rose-200 p-2 text-rose-600"
                aria-label="Remove countdown"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Title
                <input
                  value={item.title}
                  onChange={(event) => updateItem(item.id, 'title', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  placeholder="Physics Finals"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Exam date
                <input
                  type="date"
                  value={item.examDate}
                  onChange={(event) => updateItem(item.id, 'examDate', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Qualification group
                <select
                  value={item.qualification}
                  onChange={(event) => updateItem(item.id, 'qualification', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  <option value="IGCSE">IGCSE</option>
                  <option value="A Level">A Level</option>
                  <option value="IELTS">IELTS</option>
                  <option value="Custom">Custom</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Priority
                <select
                  value={item.priority}
                  onChange={(event) => updateItem(item.id, 'priority', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send className="h-4 w-4" />
            {isPending ? 'Submitting...' : 'Submit for review'}
          </button>
          <span className="text-sm text-[var(--foreground-secondary)]">Each proposal stays pending until a main contributor approves it.</span>
        </div>

        {message ? (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <span>{message}</span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}
      </div>
    </section>
  );
}
