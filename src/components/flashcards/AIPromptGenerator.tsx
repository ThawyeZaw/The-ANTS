'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — AIPromptGenerator Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Copy, Check, Sparkles, Info } from 'lucide-react';
import { generateAIPrompt } from '@/lib/srs/algorithm';

interface AIPromptGeneratorProps {
  subject: string;
  topic: string;
  cardCount: number;
  examBoard?: string;
  difficulty?: string;
  additionalNotes?: string;
}

export default function AIPromptGenerator({
  subject,
  topic,
  cardCount,
  examBoard,
  difficulty,
  additionalNotes,
}: AIPromptGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const prompt = generateAIPrompt({ subject, topic, cardCount, examBoard, difficulty, additionalNotes });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Instruction banner */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
        <Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
        <div className="text-sm text-indigo-700 dark:text-indigo-300">
          <p className="font-semibold mb-1">How to use this prompt</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs leading-relaxed">
            <li>Copy the prompt below using the button</li>
            <li>Paste it into Gemini, ChatGPT, or any AI assistant</li>
            <li>Copy the AI&apos;s response and paste it in the next step</li>
          </ol>
        </div>
      </div>

      {/* Prompt header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">Generated Prompt</span>
          <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
            {cardCount} cards
          </span>
        </div>
        <button
          id="copy-prompt-btn"
          onClick={handleCopy}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </button>
      </div>

      {/* Prompt text box */}
      <div className="relative rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] font-mono">
        <pre
          id="generated-prompt-text"
          className="overflow-x-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-[var(--foreground-secondary)]"
        >
          {prompt}
        </pre>
      </div>

      {/* Supported AI tools */}
      <p className="text-center text-xs text-[var(--foreground-muted)]">
        Works with{' '}
        <span className="font-semibold text-[var(--foreground-secondary)]">Gemini</span>,{' '}
        <span className="font-semibold text-[var(--foreground-secondary)]">ChatGPT</span>,{' '}
        <span className="font-semibold text-[var(--foreground-secondary)]">Claude</span>, and any other AI assistant
      </p>
    </div>
  );
}
