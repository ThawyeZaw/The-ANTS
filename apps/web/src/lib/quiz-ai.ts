// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Quiz AI Prompt Generator & Response Parser
// Generates a structured prompt for AI quiz generation and parses the
// raw AI response into QuizQuestion[] objects.
// ──────────────────────────────────────────────────────────────────────────────

import type { QuizQuestion, QuizQuestionType } from '@/types';

// ── Prompt Generation ────────────────────────────────────────────────────────

interface GenerateQuizPromptParams {
  subject: string;
  topic: string;
  questionCount: number;
  examBoard?: string;
  difficulty?: string;
  additionalNotes?: string;
}

export function generateQuizPrompt(params: GenerateQuizPromptParams): string {
  const { subject, topic, questionCount, examBoard, difficulty, additionalNotes } = params;
  const boardStr = examBoard ? ` for ${examBoard}` : '';
  const diffStr = difficulty ? ` The difficulty level should be ${difficulty}.` : '';
  const notesStr = additionalNotes ? ` Additional context: ${additionalNotes}` : '';

  return `Generate exactly ${questionCount} assessment questions for "${topic}" in ${subject}${boardStr}.${diffStr}${notesStr}

FORMAT YOUR RESPONSE using this exact structure — one question per Q: block, no extra commentary before or after:

Q: [question text]
T: [type: multiple_choice, true_false, or short_answer]
O: [option1] | [option2] | [option3] | [option4]   ← only for multiple_choice questions
A: [correct answer or model answer]
P: [points: 1-5, where harder questions get higher points]

---NEXT QUESTION---

Q: [question text]
T: true_false
A: [true or false]
P: 1

---NEXT QUESTION---

Q: [question text]
T: short_answer
A: [model answer in 1-3 sentences]
P: 3

RULES:
- Distribute question types: roughly 50% multiple_choice, 30% true_false, 20% short_answer
- For multiple_choice, always provide exactly 4 options separated by " | "
- Multiple choice options MUST include the correct answer as one of the options
- The correct answer (A:) for multiple_choice must match one of the options EXACTLY
- True/false answers must be exactly "true" or "false" (lowercase)
- Short answer questions should test deeper understanding (explain, describe, analyze)
- Assign points based on difficulty: easy=1, medium=2, hard=3+, short_answer default 3
- Questions should progress from easier to more challenging
- Avoid yes/no based true_false — use factual statements instead
- Write in plain English — do NOT use markdown formatting`;
}

// ── Response Parsing ─────────────────────────────────────────────────────────

/**
 * Parses raw AI response into QuizQuestion[].
 * Expected format:
 *   Q: question text
 *   T: multiple_choice|true_false|short_answer
 *   O: opt1 | opt2 | opt3 | opt4   (MC only)
 *   A: answer
 *   P: points
 *   ---NEXT QUESTION---
 */
export function parseQuizAIResponse(
  text: string,
  baseId: string = 'ai'
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const normalized = text.replace(/\r\n/g, '\n').trim();

  // Split by question separator or Q: at line start
  const blocks = normalized
    .split(/---NEXT QUESTION---|(?=^Q:)/m)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    const qMatch = block.match(/^Q:\s*(.+)$/m);
    const tMatch = block.match(/^T:\s*(.+)$/m);
    const oMatch = block.match(/^O:\s*(.+)$/m);
    const aMatch = block.match(/^A:\s*(.+)$/m);
    const pMatch = block.match(/^P:\s*(\d+)/m);

    if (!qMatch || !tMatch) continue;

    const questionText = qMatch[1].trim();
    const rawType = tMatch[1].trim().toLowerCase();
    const correctAnswer = aMatch?.[1]?.trim() || '';
    const points = pMatch ? parseInt(pMatch[1], 10) || 1 : 1;

    // Normalize type
    let type: QuizQuestionType;
    if (rawType === 'true_false' || rawType === 'true/false' || rawType === 'true or false') {
      type = 'true_false';
    } else if (rawType === 'short_answer' || rawType === 'short answer') {
      type = 'short_answer';
    } else {
      type = 'multiple_choice';
    }

    // Parse options for multiple_choice
    let options: string[] | null = null;
    if (type === 'multiple_choice') {
      if (oMatch) {
        options = oMatch[1].split('|').map((o) => o.trim()).filter((o) => o.length > 0);
      } else if (rawType.includes('|')) {
        // Fallback: type line may contain options like "multiple_choice Newton | Joule | Watt | Pascal"
        const parts = rawType.split('|').map((p) => p.trim());
        const actualType = parts[0].split(/\s+/)[0];
        if (['multiple_choice', 'mc'].includes(actualType)) {
          type = 'multiple_choice';
          options = parts.slice(1);
          if (options.length === 0) options = null;
        }
      }
    }

    questions.push({
      id: `${baseId}-${i}`,
      type,
      question_text: questionText,
      options: options && options.length >= 2 ? options : null,
      correct_answer: correctAnswer,
      points: Math.min(Math.max(points, 1), 10),
      order: i + 1,
    });
  }

  return questions;
}
