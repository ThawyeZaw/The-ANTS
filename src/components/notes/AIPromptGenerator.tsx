/* eslint-disable react/no-unescaped-entities */
'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — AIPromptGenerator
// Guided wizard that generates a structured AI prompt based on contributor input,
// then parses the AI response into JSON blocks.
// Supports two modes:
//   - generate: Create new note content from a topic
//   - convert:  Convert existing note text into block format
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Sparkles, Copy, CheckCheck, ChevronRight, X, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIPromptContext, NoteStyle, NoteBlock, PromptType } from '@/types';
import { mockCurriculums, mockSubjects } from '@/lib/mock/database';

interface AIPromptGeneratorProps {
  onImportBlocks: (blocks: NoteBlock[]) => void;
  onClose: () => void;
}

type Step = 'context' | 'prompt' | 'response' | 'preview';

function genId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Complete format markers specification (shared by both prompts) ────────────

const FORMAT_MARKERS = `FORMAT YOUR RESPONSE as plain text using the following markers — do NOT use HTML or complex formatting:

- Use "# Heading" for main headings
- Use "## Subheading" for subheadings  
- Use "### Minor heading" for minor headings
- Use "$$...$$" (on its own line) for display LaTeX equations
- Use "\`\`\`language\\n...code...\\n\`\`\`" for code blocks
- Use "\`\`\`mermaid\\n...diagram...\\n\`\`\`" for Mermaid flowcharts, sequence diagrams, class diagrams, entity-relationship diagrams, state diagrams, and graphs
- Use "\`\`\`animation\\n...JavaScript canvas code...\\n\`\`\`" for interactive educational animations (see Animation Guide below)
- Use "| col1 | col2 |" for table rows (first row = headers, second row can be separator like |---|---|)
- Use "---" on its own line for a horizontal divider
- Use "<svg>...</svg>" for vector graphics
- Use "![Alt](URL)" (on its own line) for images
- Use "[Label](URL)" (on its own line) for external resource links
- For regular paragraphs, just write the text with **bold** and *italic* markers where useful. You can freely use quotes (", ') and special characters.

ANIMATION GUIDE (for \`\`\`animation blocks):
JavaScript code inside \`\`\`animation blocks should:
- Assume a <canvas> element with id="canvas" at 320x200 resolution (already created)
- Use standard Canvas 2D API only (ctx.fillRect, ctx.arc, ctx.beginPath, ctx.fillStyle, ctx.strokeStyle, etc.)
- Use requestAnimationFrame for animation loops
- Not access the DOM directly (document, window are restricted)
- Be self-contained — define all variables and functions inside the script
- Include comments explaining the physics or concept being shown
- Aim for a short looping visual (5-10 seconds)`;

// ── Build the AI prompt for generating NEW content from a topic ───────────────

function buildGeneratePrompt(ctx: AIPromptContext): string {
  const styleInstruction =
    ctx.style === 'concise' ? 'Keep the content extremely concise, using bullet points and brief summaries.' :
    ctx.style === 'detailed' ? 'Provide a highly detailed explanation, covering nuances, edge cases, and in-depth analysis.' :
    ctx.style === 'eli5' ? 'Explain the concepts as simply as possible, like you are talking to a 5-year-old. Use easy-to-understand analogies.' :
    'Use an academic tone, focusing on formal definitions, rigorous explanations, and precise terminology.';

  return `You are an expert educational content writer for ${ctx.curriculum} (${ctx.examBoard}) students.

Write a comprehensive study note on the following topic:

**Curriculum:** ${ctx.curriculum} — ${ctx.examBoard}
**Subject:** ${ctx.subject}
**Topic:** ${ctx.topic}${ctx.syllabusPoint ? `\n**Syllabus Point:** ${ctx.syllabusPoint}` : ''}
**Style Preference:** ${ctx.style}
${ctx.additionalContext ? `**Additional context:** ${ctx.additionalContext}` : ''}

**Instruction on Style:**
${styleInstruction}

${FORMAT_MARKERS}

Write 600–1000 words of rich content. Include:
1. A clear introduction paragraph
2. Key concepts with LaTeX equations where appropriate
3. At least one table if the topic benefits from comparison
4. Practical examples or exam tips
5. If the topic involves a process, flow, or relationship, include a Mermaid diagram (\`\`\`mermaid)
6. If an interactive visual would enhance understanding, include an animation (\`\`\`animation)
7. A summary or conclusion

Begin your response now:`;
}

// ── Build the AI prompt for CONVERTING existing note text ─────────────────────

function buildConvertPrompt(ctx: AIPromptContext): string {
  const styleInstruction =
    ctx.style === 'concise' ? 'Keep the content extremely concise, using bullet points and brief summaries.' :
    ctx.style === 'detailed' ? 'Provide a highly detailed explanation, covering nuances, edge cases, and in-depth analysis.' :
    ctx.style === 'eli5' ? 'Explain the concepts as simply as possible, like you are talking to a 5-year-old. Use easy-to-understand analogies.' :
    'Use an academic tone, focusing on formal definitions, rigorous explanations, and precise terminology.';

  return `You are an expert educational content writer for ${ctx.curriculum} (${ctx.examBoard}) students.

Convert the following existing note into our structured block format. Preserve ALL content faithfully — do NOT add or remove information. Just restructure it using the markers described below.

**Curriculum:** ${ctx.curriculum} — ${ctx.examBoard}
**Subject:** ${ctx.subject}
**Topic:** ${ctx.topic}${ctx.syllabusPoint ? `\n**Syllabus Point:** ${ctx.syllabusPoint}` : ''}
**Style Preference:** ${ctx.style}
${ctx.additionalContext ? `**Additional context:** ${ctx.additionalContext}` : ''}

**Instruction on Style:**
${styleInstruction}

**Conversion Rules (MUST FOLLOW):**
- Preserve ALL existing content, text, equations, and data exactly as written
- If the existing note has LaTeX (e.g., $E=mc^2$ or $$...$$), preserve it using our $$...$$ marker
- If the existing note describes a flowchart, diagram, or process, represent it as a Mermaid diagram (\`\`\`mermaid)
- If the existing note covers a dynamic/physical concept (pendulum, wave, particle motion, oscillation, etc.), include an animation (\`\`\`animation)
- If the existing note has hyperlinks, preserve them as [Label](URL)
- If the existing note has tables, preserve them with the | row | format
- Preserve all headings, paragraphs, bold/italic text, and lists

${FORMAT_MARKERS}

Here is the existing note to convert:

--- BEGIN NOTE ---
${ctx.userNoteContent || ''}
--- END NOTE ---

Convert this note now following all rules above:`;
}

// ── Mermaid diagram keywords (used for fallback detection) ────────────────────

const MERMAID_KEYWORDS = [
  'flowchart', 'graph', 'sequenceDiagram', 'classDiagram',
  'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'gantt',
  'pie', 'gitGraph', 'mindmap', 'timeline', 'block', 'packet',
];

function isMermaidStart(line: string): boolean {
  const trimmed = line.trim();
  return MERMAID_KEYWORDS.some((kw) => trimmed.startsWith(kw));
}

// ── Parse AI response into NoteBlocks ─────────────────────────────────────────

function parseAIResponse(text: string): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip
    if (!line.trim()) { i++; continue; }

    // ── Heading (# ## ###) ──────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3;
      blocks.push({ type: 'heading', id: genId(), level, text: headingMatch[2].trim() });
      i++; continue;
    }

    // ── Display LaTeX ($$...$$) ─────────────────────────────────────────────
    if (line.trim().startsWith('$$')) {
      const expr = line.replace(/\$\$/g, '').trim();
      if (expr) {
        blocks.push({ type: 'latex', id: genId(), expression: expr, display: true });
      } else {
        i++;
        const latexLines: string[] = [];
        while (i < lines.length && !lines[i].trim().startsWith('$$')) {
          latexLines.push(lines[i]);
          i++;
        }
        if (latexLines.length > 0) {
          blocks.push({ type: 'latex', id: genId(), expression: latexLines.join('\n'), display: true });
        }
      }
      i++; continue;
    }

    // ── Code block (```lang ... ```) ─────────────────────────────────────────
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || 'text';
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const code = codeLines.join('\n');

      if (lang === 'animation') {
        // Transform animation code blocks into AnimationBlock with script
        blocks.push({
          type: 'animation',
          id: genId(),
          script: code,
          caption: undefined,
        });
      } else {
        blocks.push({ type: 'code', id: genId(), language: lang, code });
      }
      i++; continue;
    }

    // ── Fallback: bare mermaid diagram syntax (no ``` fences) ──────────────
    if (isMermaidStart(line)) {
      const mermaidLines: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        // Stop at blank lines, block delimiters, or headings
        if (l === '' || l.startsWith('```') || l.startsWith('#') || l.startsWith('$$') ||
            l.startsWith('|') || l === '---' || l.startsWith('<svg')) break;
        mermaidLines.push(lines[i]);
        i++;
      }
      if (mermaidLines.length > 0) {
        blocks.push({ type: 'code', id: genId(), language: 'mermaid', code: mermaidLines.join('\n') });
      }
      continue;
    }

    // ── Table row ───────────────────────────────────────────────────────────
    if (line.trim().startsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].split('|').map((c) => c.trim()).filter(
          (c) => c && c !== '---' && c !== ':---:' && c !== ':---' && c !== '---:'
        );
        if (row.length > 0 && !row.every((c) => /^:?-+:?$/.test(c))) {
          tableRows.push(row);
        }
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push({ type: 'table', id: genId(), rows: tableRows });
      }
      continue;
    }

    // ── Divider ─────────────────────────────────────────────────────────────
    if (line.trim() === '---') {
      blocks.push({ type: 'divider', id: genId() });
      i++; continue;
    }

    // ── Image ![Alt](URL) ───────────────────────────────────────────────────
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((https?:\/\/.+?)\)$/);
    if (imgMatch) {
      blocks.push({ type: 'image', id: genId(), alt: imgMatch[1] || undefined, url: imgMatch[2] });
      i++; continue;
    }

    // ── SVG ─────────────────────────────────────────────────────────────────
    if (line.trim().startsWith('<svg')) {
      const svgLines: string[] = [];
      while (i < lines.length) {
        svgLines.push(lines[i]);
        if (lines[i].includes('</svg>')) { i++; break; }
        i++;
      }
      if (svgLines.length > 0) {
        blocks.push({ type: 'svg', id: genId(), markup: svgLines.join('\n') });
      }
      continue;
    }

    // ── Link [Label](URL) ───────────────────────────────────────────────────
    const linkMatch = line.trim().match(/^\[(.+?)\]\((https?:\/\/.+?)\)\s*(.*)$/);
    if (linkMatch) {
      blocks.push({
        type: 'link',
        id: genId(),
        label: linkMatch[1],
        url: linkMatch[2],
        description: linkMatch[3] || undefined,
      });
      i++; continue;
    }

    // ── Paragraph (accumulate consecutive non-special lines) ──────────────
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].match(/^(#{1,3})\s/) &&
      !lines[i].trim().startsWith('$$') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('<svg') &&
      !lines[i].trim().match(/^!\[.*?\]\(.*?\)$/) &&
      !isMermaidStart(lines[i]) &&
      lines[i].trim() !== '---'
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', id: genId(), text: paraLines.join('\n') });
    }
  }

  return blocks;
}

// ── Constants for UI ──────────────────────────────────────────────────────────

const STYLES: NoteStyle[] = ['concise', 'detailed', 'eli5', 'academic'];

const PROMPT_TYPE_OPTIONS: { value: PromptType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'generate', label: 'Generate New Note', icon: <Sparkles className="h-4 w-4" />, desc: 'AI creates fresh content from a topic description' },
  { value: 'convert',  label: 'Convert Existing Note', icon: <FileText className="h-4 w-4" />, desc: 'Reformat your existing note text into blocks' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function AIPromptGenerator({ onImportBlocks, onClose }: AIPromptGeneratorProps) {
  const [step, setStep] = useState<Step>('context');
  const [copied, setCopied] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [parsedBlocks, setParsedBlocks] = useState<NoteBlock[]>([]);

  const [ctx, setCtx] = useState<AIPromptContext>({
    curriculum: '',
    examBoard: '',
    subject: '',
    topic: '',
    syllabusPoint: '',
    style: 'detailed',
    additionalContext: '',
    promptType: 'generate',
    userNoteContent: '',
  });

  const prompt = ctx.promptType === 'generate'
    ? buildGeneratePrompt(ctx)
    : buildConvertPrompt(ctx);

  const canProceed = ctx.curriculum.trim() && ctx.subject.trim() && ctx.topic.trim();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParse = () => {
    const blocks = parseAIResponse(aiResponse);
    setParsedBlocks(blocks);
    setStep('preview');
  };

  const handleImport = () => {
    onImportBlocks(parsedBlocks);
    onClose();
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'context',  label: 'Context' },
    { id: 'prompt',   label: 'Prompt' },
    { id: 'response', label: 'Paste Response' },
    { id: 'preview',  label: 'Preview' },
  ];

  const stepIdx = steps.findIndex((s) => s.id === step);

  const renderContextForm = () => {
    if (ctx.promptType === 'convert') {
      // Convert mode: show textarea for pasting existing notes + minimal metadata
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1.5 block">
              Your Existing Note Content *
            </label>
            <textarea
              value={ctx.userNoteContent}
              onChange={(e) => setCtx((p) => ({ ...p, userNoteContent: e.target.value }))}
              rows={12}
              placeholder="Paste your existing note text here. It can include LaTeX, tables, headings, bullet points — the AI will convert it into our block format."
              className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all resize-y font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Curriculum</label>
              <select
                value={ctx.curriculum}
                onChange={(e) => {
                  const curr = mockCurriculums.find((c) => c.qualification === e.target.value);
                  setCtx((p) => ({ ...p, curriculum: e.target.value, examBoard: curr?.exam_board ?? '' }));
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
              >
                <option value="">Select…</option>
                {[...new Set(mockCurriculums.map((c) => c.qualification))].map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
                <option value="Other">Other (type below)</option>
              </select>
              {ctx.curriculum === 'Other' && (
                <input type="text" placeholder="e.g. IB, AP Chemistry"
                  className="mt-2 w-full px-3 py-2 rounded-xl bg-background-secondary border border-border text-sm focus:outline-none focus:border-primary/60"
                  onChange={(e) => setCtx((p) => ({ ...p, curriculum: e.target.value }))} />
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Exam Board</label>
              <input type="text" value={ctx.examBoard} placeholder="e.g. CAIE, Edexcel"
                onChange={(e) => setCtx((p) => ({ ...p, examBoard: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Subject *</label>
            <input type="text" value={ctx.subject} placeholder="e.g. Physics, Biology, Mathematics"
              onChange={(e) => setCtx((p) => ({ ...p, subject: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Topic *</label>
            <input type="text" value={ctx.topic} placeholder="e.g. Forces and Motion, Cell Biology"
              onChange={(e) => setCtx((p) => ({ ...p, topic: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Syllabus Point (optional)</label>
            <input type="text" value={ctx.syllabusPoint} placeholder="e.g. 1.5.3 — Newton's Third Law"
              onChange={(e) => setCtx((p) => ({ ...p, syllabusPoint: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Style Preference</label>
            <div className="flex gap-2">
              {STYLES.map((s) => (
                <button key={s}
                  onClick={() => setCtx((p) => ({ ...p, style: s }))}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer',
                    ctx.style === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background-secondary text-foreground-muted hover:border-border-hover'
                  )}
                >
                  {s === 'eli5' ? 'ELI5' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Generate mode: show existing form
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground-muted">Fill in the details about this note. The more specific you are, the better the AI output.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Curriculum *</label>
            <select
              id="ai-curriculum"
              value={ctx.curriculum}
              onChange={(e) => {
                const curr = mockCurriculums.find((c) => c.qualification === e.target.value);
                setCtx((p) => ({ ...p, curriculum: e.target.value, examBoard: curr?.exam_board ?? '' }));
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
            >
              <option value="">Select…</option>
              {[...new Set(mockCurriculums.map((c) => c.qualification))].map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
              <option value="Other">Other (type below)</option>
            </select>
            {ctx.curriculum === 'Other' && (
              <input type="text" placeholder="e.g. IB, AP Chemistry"
                className="mt-2 w-full px-3 py-2 rounded-xl bg-background-secondary border border-border text-sm focus:outline-none focus:border-primary/60"
                onChange={(e) => setCtx((p) => ({ ...p, curriculum: e.target.value }))} />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Exam Board</label>
            <input type="text" value={ctx.examBoard} placeholder="e.g. CAIE, Edexcel"
              onChange={(e) => setCtx((p) => ({ ...p, examBoard: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Subject *</label>
          <input type="text" value={ctx.subject} placeholder="e.g. Physics, Biology, Mathematics"
            onChange={(e) => setCtx((p) => ({ ...p, subject: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Topic *</label>
          <input type="text" value={ctx.topic} placeholder="e.g. Forces and Motion, Cell Biology"
            onChange={(e) => setCtx((p) => ({ ...p, topic: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Syllabus Point (optional)</label>
          <input type="text" value={ctx.syllabusPoint} placeholder="e.g. 1.5.3 — Newton's Third Law"
            onChange={(e) => setCtx((p) => ({ ...p, syllabusPoint: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Style Preference</label>
          <div className="flex gap-2">
            {STYLES.map((s) => (
              <button key={s}
                onClick={() => setCtx((p) => ({ ...p, style: s }))}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer',
                  ctx.style === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background-secondary text-foreground-muted hover:border-border-hover'
                )}
              >
                {s === 'eli5' ? 'ELI5' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1 block">Additional Context (optional)</label>
          <textarea value={ctx.additionalContext}
            onChange={(e) => setCtx((p) => ({ ...p, additionalContext: e.target.value }))}
            rows={2}
            placeholder="e.g. Focus on common exam mistakes, include a worked example…"
            className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all resize-none"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-background-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-violet-500/10 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/15 text-violet-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">AI Note Generator</h2>
              <p className="text-xs text-foreground-muted">Generate or convert note content using your preferred AI tool</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-foreground transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-border overflow-x-auto">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center shrink-0">
              <div className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors',
                idx === stepIdx ? 'bg-primary text-white' :
                idx < stepIdx ? 'text-primary' : 'text-foreground-muted'
              )}>
                <span className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                  idx < stepIdx ? 'bg-primary text-white' : ''
                )}>
                  {idx < stepIdx ? '✓' : idx + 1}
                </span>
                {s.label}
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight className="h-3 w-3 text-foreground-muted mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── Step 1: Context + Prompt Type Selector ── */}
          {step === 'context' && (
            <div className="space-y-5">
              {/* Prompt type selector */}
              <div>
                <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2 block">
                  What do you want to do?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PROMPT_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCtx((p) => ({ ...p, promptType: opt.value }))}
                      className={cn(
                        'flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all cursor-pointer',
                        ctx.promptType === opt.value
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border bg-background-secondary text-foreground-muted hover:border-border-hover hover:text-foreground'
                      )}
                    >
                      <span className={cn(
                        'p-1.5 rounded-lg',
                        ctx.promptType === opt.value ? 'bg-primary/10 text-primary' : 'bg-background-card'
                      )}>
                        {opt.icon}
                      </span>
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-xs opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {renderContextForm()}
            </div>
          )}

          {/* ── Step 2: Generated Prompt ── */}
          {step === 'prompt' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                Copy this prompt, paste it into ChatGPT, Gemini, or Claude, then come back and paste the response in the next step.
              </div>
              <div className="relative">
                <pre className="bg-background-secondary border border-border rounded-xl p-4 text-xs text-foreground-secondary whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                  {prompt}
                </pre>
                <button
                  id="ai-copy-prompt"
                  onClick={handleCopy}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  {copied ? <><CheckCheck className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Paste AI Response ── */}
          {step === 'response' && (
            <div className="space-y-3">
              <p className="text-sm text-foreground-muted">Paste the AI's response below. The parser will convert it into editable blocks.</p>
              <textarea
                id="ai-response-input"
                value={aiResponse}
                onChange={(e) => setAiResponse(e.target.value)}
                rows={14}
                placeholder="Paste the AI-generated note content here…"
                className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all resize-none font-mono"
              />
              {aiResponse && (
                <p className="text-xs text-foreground-muted">
                  ~{aiResponse.split('\n').filter(Boolean).length} lines detected
                </p>
              )}
            </div>
          )}

          {/* ── Step 4: Preview parsed blocks ── */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600">
                <CheckCheck className="h-4 w-4 shrink-0" />
                Parsed {parsedBlocks.length} blocks. Click "Import to Editor" to add them to your note.
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {parsedBlocks.map((block, i) => (
                  <div key={block.id} className="flex items-start gap-3 p-3 bg-background-secondary rounded-xl border border-border text-sm">
                    <span className="text-xs text-foreground-muted font-mono mt-0.5 shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded mr-2',
                        block.type === 'latex' ? 'bg-violet-500/10 text-violet-500' :
                        block.type === 'heading' ? 'bg-primary/10 text-primary' :
                        block.type === 'code' ? 'bg-slate-700 text-slate-300' :
                        block.type === 'animation' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-background-card text-foreground-muted'
                      )}>
                        {block.type}{block.type === 'code' && 'code' in block && 'language' in block ? ` (${(block as { language: string }).language})` : ''}
                      </span>
                      <span className="text-foreground-secondary text-xs truncate">
                        {'text' in block ? (block.text as string).slice(0, 80) :
                         'expression' in block ? (block.expression as string).slice(0, 60) :
                         'label' in block ? (block.label as string) :
                         'script' in block ? '[Canvas Animation]' :
                         'code' in block ? (block.code as string).slice(0, 60) : '…'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background-secondary">
          <button
            onClick={() => {
              const prev: Record<Step, Step | null> = { context: null, prompt: 'context', response: 'prompt', preview: 'response' };
              const p = prev[step];
              if (p) setStep(p);
            }}
            disabled={step === 'context'}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Back
          </button>

          {step === 'context' && (
            <button
              id="ai-next-to-prompt"
              onClick={() => setStep('prompt')}
              disabled={
                !canProceed ||
                (ctx.promptType === 'convert' && !ctx.userNoteContent?.trim())
              }
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Generate Prompt <Sparkles className="h-4 w-4" />
            </button>
          )}
          {step === 'prompt' && (
            <button id="ai-next-to-response" onClick={() => setStep('response')}
              className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
              I've pasted into AI →
            </button>
          )}
          {step === 'response' && (
            <button id="ai-parse-response" onClick={handleParse} disabled={!aiResponse.trim()}
              className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
              Parse Response →
            </button>
          )}
          {step === 'preview' && (
            <button id="ai-import-blocks" onClick={handleImport}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 transition-all cursor-pointer">
              <CheckCheck className="h-4 w-4" />
              Import to Editor
            </button>
          )}
        </div>

      </div>
    </div>
  );
}