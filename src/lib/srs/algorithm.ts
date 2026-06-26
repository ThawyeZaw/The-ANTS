// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — SM-2 Spaced Repetition Algorithm
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────
//
// Implements the classic SuperMemo SM-2 algorithm.
// Reference: https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge
//
// Rating → Quality score mapping:
//   again  → 1  (complete blackout / forgot entirely)
//   hard   → 2  (incorrect, but remembered on hint)
//   good   → 3  (correct with some difficulty)
//   easy   → 4  (correct and effortless)
//
// ──────────────────────────────────────────────────────────────────────────────

import type { SRSRating, ParsedAICard } from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_INTERVAL = 1; // days

/** Quality score mapping for SM-2 */
const QUALITY_MAP: Record<SRSRating, number> = {
  again: 1,
  good: 3,
  easy: 4,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SRSResult {
  newInterval: number;       // days until next review
  newEaseFactor: number;     // updated ease factor (≥ 1.3)
  nextReviewDate: Date;      // absolute date of next review
}

export interface NewCardDefaults {
  interval_days: number;
  ease_factor: number;
}

// ── SM-2 Core ────────────────────────────────────────────────────────────────

/**
 * Compute the next SRS state after a user rates a card.
 *
 * @param rating         - The user's rating for this review
 * @param currentInterval - Current interval in days (use 1 for new cards)
 * @param currentEaseFactor - Current ease factor (use 2.5 for new cards)
 * @returns SRSResult with new interval, ease factor, and next review date
 */
export function computeNextReview(
  rating: SRSRating,
  currentInterval: number,
  currentEaseFactor: number
): SRSResult {
  const quality = QUALITY_MAP[rating];
  let newInterval: number;
  let newEaseFactor: number;

  if (quality < 2) {
    // Again (1): full reset — start over from day 1
    newInterval = MIN_INTERVAL;
    newEaseFactor = Math.max(MIN_EASE_FACTOR, currentEaseFactor - 0.2);
  } else if (quality === 3) {
    // Good (3): standard SM-2 interval progression
    if (currentInterval === 1) {
      newInterval = 3; // first successful review → 3 days
    } else if (currentInterval <= 3) {
      newInterval = 7; // second successful review → 7 days
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor);
    }
    newEaseFactor = currentEaseFactor; // no change
  } else {
    // Easy (4): boosted interval, increase ease factor
    if (currentInterval === 1) {
      newInterval = 4;
    } else if (currentInterval <= 4) {
      newInterval = 10;
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor * 1.3);
    }
    newEaseFactor = Math.min(3.0, currentEaseFactor + 0.15);
  }

  // Cap interval at 365 days (1 year maximum)
  newInterval = Math.min(365, newInterval);

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  // Reset to start of day for consistent scheduling
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    newInterval,
    newEaseFactor: parseFloat(newEaseFactor.toFixed(2)),
    nextReviewDate,
  };
}

/**
 * Returns the default SRS values for a brand new card (never reviewed).
 */
export function getNewCardDefaults(): NewCardDefaults {
  return {
    interval_days: 1,
    ease_factor: DEFAULT_EASE_FACTOR,
  };
}

/**
 * Format next review date as a human-readable relative string.
 * Examples: "Tomorrow", "In 3 days", "In 2 weeks", "In 1 month"
 */
export function formatNextReview(nextReviewDate: string | Date): string {
  const date = typeof nextReviewDate === 'string' ? new Date(nextReviewDate) : nextReviewDate;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Due now';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 14) return 'In 1 week';
  if (diffDays < 30) return `In ${Math.round(diffDays / 7)} weeks`;
  if (diffDays < 60) return 'In 1 month';
  return `In ${Math.round(diffDays / 30)} months`;
}

// ── AI Output Parser ─────────────────────────────────────────────────────────

/**
 * Parse raw AI-generated text into an array of ParsedAICard objects.
 *
 * Supported formats (in order of priority):
 *
 * 1. Q: / A: label pairs (single or multi-line)
 *    Q: What is osmosis?
 *    A: Movement of water through a semipermeable membrane.
 *
 * 2. Numbered list with Front/Back labels
 *    1. Front: What is osmosis?
 *       Back: Movement of water...
 *
 * 3. Pipe-separated format (for compact prompts)
 *    What is osmosis? | Movement of water through a semipermeable membrane.
 *
 * 4. JSON array format
 *    [{"front": "Q...", "back": "A..."}, ...]
 */
export function parseAIOutput(raw: string): ParsedAICard[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // ── Try JSON format first ────────────────────────────────────────────────
  if (trimmed.startsWith('[') || trimmed.includes('"front"')) {
    try {
      // Strip markdown code fences if present
      const jsonStr = trimmed
        .replace(/^```(?:json)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        const cards: ParsedAICard[] = parsed
          .filter((item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            ('front' in item || 'question' in item || 'q' in item)
          )
          .map((item: any) => ({
            front: (item.front || item.question || item.q || '').toString().trim(),
            back: (item.back || item.answer || item.a || '').toString().trim(),
            confirmed: true,
          }))
          .filter((c: ParsedAICard) => c.front && c.back);
        if (cards.length > 0) return cards;
      }
    } catch {
      // Not valid JSON — fall through to text parsing
    }
  }

  // ── Try Q: / A: format ───────────────────────────────────────────────────
  const qaPattern = /Q:\s*([\s\S]+?)\s*\n\s*A:\s*([\s\S]+?)(?=\n\s*Q:|\n\s*\d+\.|$)/gi;
  const qaMatches = [...trimmed.matchAll(qaPattern)];
  if (qaMatches.length > 0) {
    return qaMatches
      .map(m => ({
        front: m[1].trim(),
        back: m[2].trim(),
        confirmed: true,
      }))
      .filter(c => c.front && c.back);
  }

  // ── Try numbered Front: / Back: format ───────────────────────────────────
  const frontBackPattern = /(?:\d+\.)?\s*Front:\s*([\s\S]+?)\s*\n\s*Back:\s*([\s\S]+?)(?=\n\s*(?:\d+\.)?\s*Front:|\n\s*\d+\.|$)/gi;
  const fbMatches = [...trimmed.matchAll(frontBackPattern)];
  if (fbMatches.length > 0) {
    return fbMatches
      .map(m => ({
        front: m[1].trim(),
        back: m[2].trim(),
        confirmed: true,
      }))
      .filter(c => c.front && c.back);
  }

  // ── Try pipe-separated format ─────────────────────────────────────────────
  const lines = trimmed.split('\n').filter(l => l.trim());
  const pipeCards = lines
    .map(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        // Strip leading numbers like "1. " or "- "
        const front = parts[0].replace(/^\s*[\d\-\*\•]+[\.\)]\s*/, '').trim();
        const back = parts[1].trim();
        return front && back ? { front, back, confirmed: true } : null;
      }
      return null;
    })
    .filter((c): c is ParsedAICard => c !== null);

  if (pipeCards.length > 0) return pipeCards;

  // ── Fallback: numbered list (question on one line, answer on next) ────────
  const numberedLines = lines.map(l => l.replace(/^\s*[\d]+[\.\)]\s*/, '').trim()).filter(Boolean);
  const fallbackCards: ParsedAICard[] = [];
  for (let i = 0; i + 1 < numberedLines.length; i += 2) {
    fallbackCards.push({ front: numberedLines[i], back: numberedLines[i + 1], confirmed: true });
  }
  return fallbackCards;
}

/**
 * Generate the AI prompt string for flashcard creation.
 */
export function generateAIPrompt(params: {
  subject: string;
  topic: string;
  cardCount: number;
  examBoard?: string;
  difficulty?: string;
  additionalNotes?: string;
}): string {
  const { subject, topic, cardCount, examBoard, difficulty, additionalNotes } = params;
  const boardStr = examBoard ? ` for ${examBoard}` : '';
  const diffStr = difficulty ? ` The difficulty level should be ${difficulty}.` : '';
  const notesStr = additionalNotes ? ` Additional context: ${additionalNotes}` : '';

  return `Generate exactly ${cardCount} flashcards for studying "${topic}" in ${subject}${boardStr}.${diffStr}${notesStr}

Output the flashcards in this exact format — one card per block, no extra text:

Q: [Question or term on the front of the card]
A: [Answer or definition on the back of the card]

Q: [Question or term]
A: [Answer or definition]

...and so on for all ${cardCount} cards.

Rules:
- Each question should test one specific concept
- Answers should be concise but complete (1-3 sentences max)
- Use plain text only — no markdown formatting, no bullet points inside answers
- Make questions progressively more specific
- Avoid yes/no questions — prefer "What", "How", "Why", "Define", "Explain"`;
}
