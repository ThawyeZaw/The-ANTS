'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  Check,
  Copy,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Info,
  PenLine,
  Brain,
  Globe,
  Lock,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { generateQuizPrompt, parseQuizAIResponse } from '@/lib/quiz-ai';
import { actionCreateQuiz as createQuiz } from '@/actions/quizzes';
import type { QuizStandaloneQuestion, QuizQuestionType, QuizStandaloneUser } from '@/types/quiz';

// ── Types ────────────────────────────────────────────────────────────────────

export interface QuizCreatorProps {
  curriculumIds?: string[];
  onCreated?: (quiz: QuizStandaloneUser) => void;
  onCancel: () => void;
}

type CreatorMode = 'choose' | 'manual' | 'ai';
type AIStep = 'configure' | 'prompt' | 'import';

// ── Manual Question Editor ───────────────────────────────────────────────────

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  question: Partial<QuizStandaloneQuestion> & { id: string };
  index: number;
  total: number;
  onChange: (q: Partial<QuizStandaloneQuestion> & { id: string }) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--foreground-muted)]">Q{index + 1}</span>
          <select
            value={question.type || 'multiple_choice'}
            onChange={(e) => onChange({ ...question, type: e.target.value as QuizQuestionType })}
            className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-2 py-1 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
          </select>
          <input
            type="number"
            min={1}
            max={10}
            value={question.points || 1}
            onChange={(e) => onChange({ ...question, points: parseInt(e.target.value) || 1 })}
            className="w-12 rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-1.5 py-1 text-xs text-center text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            title="Points"
          />
          <span className="text-xs text-[var(--foreground-muted)]">pt{question.points !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button onClick={onMoveUp} className="rounded p-1 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground-secondary)]" title="Move up">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} className="rounded p-1 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground-secondary)]" title="Move down">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onRemove} className="rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--error)]" title="Remove question">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <textarea
        value={question.question_text || ''}
        onChange={(e) => onChange({ ...question, question_text: e.target.value })}
        placeholder="Enter the question..."
        rows={2}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] mb-3"
      />

      {question.type === 'multiple_choice' && (
        <div className="space-y-2 mb-3">
          <p className="text-xs font-medium text-[var(--foreground-muted)]">Options</p>
          {(question.options || ['', '', '', '']).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--background-card)] text-[10px] font-bold text-[var(--foreground-muted)]">
                {String.fromCharCode(65 + oi)}
              </span>
              <input
                value={opt}
                onChange={(e) => {
                  const newOpts = [...(question.options || ['', '', '', ''])];
                  newOpts[oi] = e.target.value;
                  onChange({ ...question, options: newOpts });
                }}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-2.5 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className="flex gap-3 mb-3">
          {['true', 'false'].map((val) => (
            <label
              key={val}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                question.correct_answer === val
                  ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/30'
              )}
            >
              <input
                type="radio"
                name={`tf-${question.id}`}
                value={val}
                checked={question.correct_answer === val}
                onChange={(e) => onChange({ ...question, correct_answer: e.target.value })}
                className="hidden"
              />
              {val.charAt(0).toUpperCase() + val.slice(1)}
            </label>
          ))}
        </div>
      )}

      {question.type === 'multiple_choice' && (
        <div>
          <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5">Correct Answer</p>
          <select
            value={question.correct_answer || ''}
            onChange={(e) => onChange({ ...question, correct_answer: e.target.value })}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">Select correct answer...</option>
            {(question.options || []).filter(Boolean).map((opt, oi) => (
              <option key={oi} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}

      {question.type === 'short_answer' && (
        <div>
          <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5">Model Answer</p>
          <textarea
            value={question.correct_answer || ''}
            onChange={(e) => onChange({ ...question, correct_answer: e.target.value })}
            placeholder="Model answer for grading reference..."
            rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

// ── Manual Creation Form ─────────────────────────────────────────────────────

function ManualCreateForm({
  onSave,
  onCancel,
}: {
  onSave: (data: { questions: Partial<QuizStandaloneQuestion>[] }) => void;
  onCancel: () => void;
}) {
  const [questions, setQuestions] = useState<Array<Partial<QuizStandaloneQuestion> & { id: string }>>([
    { id: `mq-${Date.now()}-0`, type: 'multiple_choice', question_text: '', options: ['', '', '', ''], correct_answer: '', points: 1, order: 1 },
  ]);

  function addQuestion() {
    const idx = questions.length;
    setQuestions([
      ...questions,
      { id: `mq-${Date.now()}-${idx}`, type: 'multiple_choice', question_text: '', options: ['', '', '', ''], correct_answer: '', points: 1, order: idx + 1 },
    ]);
  }

  function updateQuestion(index: number, updated: Partial<QuizStandaloneQuestion> & { id: string }) {
    setQuestions(questions.map((q, i) => (i === index ? updated : q)));
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setQuestions(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Build Quiz Manually</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => onSave({ questions })}
            disabled={!questions.some((q) => q.question_text?.trim())}
          >
            Continue
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            onChange={(updated) => updateQuestion(i, updated)}
            onRemove={() => removeQuestion(i)}
            onMoveUp={i > 0 ? () => moveQuestion(i, -1) : undefined}
            onMoveDown={i < questions.length - 1 ? () => moveQuestion(i, 1) : undefined}
          />
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] py-3 text-sm text-[var(--foreground-muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        <Plus className="h-4 w-4" />
        Add Question
      </button>
    </div>
  );
}

// ── AI Wizard ─────────────────────────────────────────────────────────────────

function AIWizard({
  curriculumIds,
  onImportQuestions,
  onCancel,
}: {
  curriculumIds?: string[];
  onImportQuestions: (questions: QuizStandaloneQuestion[]) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<AIStep>('configure');

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [examBoard, setExamBoard] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [configError, setConfigError] = useState('');

  const [prompt, setPrompt] = useState('');

  const [copied, setCopied] = useState(false);

  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState('');

  function handleConfigure(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) { setConfigError('Subject is required.'); return; }
    if (!topic.trim()) { setConfigError('Topic is required.'); return; }
    setConfigError('');

    const generated = generateQuizPrompt({
      subject: subject.trim(),
      topic: topic.trim(),
      questionCount,
      examBoard: examBoard || undefined,
      difficulty: difficulty || undefined,
      additionalNotes: additionalNotes || undefined,
    });
    setPrompt(generated);
    setStep('prompt');
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  function handleImport() {
    if (!pasteText.trim()) {
      setParseError('Paste the AI response above.');
      return;
    }
    const parsed = parseQuizAIResponse(pasteText, `aiq-${Date.now()}`) as QuizStandaloneQuestion[];
    if (parsed.length === 0) {
      setParseError('Could not parse any questions. Check the format and try again.');
      return;
    }
    setParseError('');
    onImportQuestions(parsed);
  }

  const STEPS: { key: AIStep; label: string }[] = [
    { key: 'configure', label: 'Configure' },
    { key: 'prompt', label: 'Get Prompt' },
    { key: 'import', label: 'Import' },
  ];
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
              i < stepIndex
                ? 'bg-[var(--success)] text-white'
                : i === stepIndex
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border)]'
            )}>
              {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs font-medium hidden sm:block',
              i === stepIndex ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'
            )}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-px w-6 sm:w-10 transition-all',
                i < stepIndex ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
              )} />
            )}
          </div>
        ))}
      </div>

      {step === 'configure' && (
        <form onSubmit={handleConfigure} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Configure AI Quiz Generation</h3>
          </div>


          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Subject *</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Exam Board</label>
              <input
                value={examBoard}
                onChange={(e) => setExamBoard(e.target.value)}
                placeholder="e.g. CAIE"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Topic *</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Forces and Motion"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Questions</label>
              <input
                type="number"
                min={3}
                max={30}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="">Mixed</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">
              Additional Notes <span className="text-[var(--foreground-muted)]">(optional)</span>
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Focus on practical applications, include diagrams..."
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {configError && <p className="text-xs text-[var(--error)]">{configError}</p>}

          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button type="submit" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Generate Prompt
            </Button>
          </div>
        </form>
      )}

      {step === 'prompt' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary-light)] p-4">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--primary)]" />
            <div className="text-sm text-[var(--primary)]">
              <p className="font-semibold mb-1">How to use this prompt</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs leading-relaxed opacity-80">
                <li>Copy the prompt below</li>
                <li>Paste it into Gemini, ChatGPT, or any AI assistant</li>
                <li>Copy the AI&apos;s response and paste it in the next step</li>
              </ol>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">Generated Prompt</span>
              <Badge variant="default">{questionCount} questions</Badge>
            </div>
            <button
              onClick={handleCopyPrompt}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                copied
                  ? 'bg-[var(--success)] text-white'
                  : 'bg-[var(--primary)] text-white hover:opacity-90'
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] font-mono">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-[var(--foreground-secondary)] max-h-72 overflow-y-auto">
              {prompt}
            </pre>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep('configure')}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Button>
            <Button size="sm" onClick={() => setStep('import')} iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Next: Import
            </Button>
          </div>
        </div>
      )}

      {step === 'import' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Paste AI Response</h3>
          </div>

          <textarea
            value={pasteText}
            onChange={(e) => { setPasteText(e.target.value); setParseError(''); }}
            placeholder="Paste the AI's raw response here..."
            rows={12}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none font-mono"
          />

          {parseError && (
            <p className="text-xs text-[var(--error)] flex items-center gap-1">
              <Info className="h-3 w-3" /> {parseError}
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep('prompt')}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Button>
            <Button size="sm" onClick={handleImport} icon={<Sparkles className="h-3.5 w-3.5" />}>
              Parse & Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Preview (after import) ────────────────────────────────────────────────

function AIPreview({
  questions,
  onSave,
  onBack,
}: {
  questions: QuizStandaloneQuestion[];
  onSave: (questions: QuizStandaloneQuestion[]) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {questions.length} Questions Parsed
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
          <Button size="sm" onClick={() => onSave(questions)}>Use These Questions</Button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default">{q.type === 'multiple_choice' ? 'MC' : q.type === 'true_false' ? 'T/F' : 'SA'}</Badge>
              <span className="text-xs text-[var(--foreground-muted)]">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
              <span className="text-xs text-[var(--foreground-muted)]">#{i + 1}</span>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)]">{q.question_text}</p>
            {q.options && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {q.options.map((opt, oi) => (
                  <span
                    key={oi}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs',
                      opt === q.correct_answer
                        ? 'bg-[var(--success-light)] text-[var(--success)] font-medium'
                        : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                    )}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-[var(--success)]">
              Answer: {q.correct_answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Details Form (after questions are ready) ─────────────────────────────────

function DetailsForm({
  onSave,
  onCancel,
}: {
  onSave: (details: {
    title: string;
    description: string;
    time_limit_minutes: number | null;
    is_public: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || '',
      time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
      is_public: isPublic,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Quiz Details</h3>

      <div>
        <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapter 3: Forces Quiz"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what this quiz covers..."
          rows={2}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Time Limit (minutes)</label>
        <input
          type="number"
          min={0}
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          placeholder="No limit"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      {/* Privacy toggle */}
      <div>
        <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-2">Visibility</label>
        <div className="flex gap-3">
          <label
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors flex-1',
              isPublic
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/30'
            )}
          >
            <input
              type="radio"
              name="visibility"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              className="hidden"
            />
            <Globe className="h-4 w-4" />
            <div>
              <span className="font-medium">Public</span>
              <p className="text-[10px] opacity-70">Anyone with the link can take this quiz</p>
            </div>
          </label>

          <label
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors flex-1',
              !isPublic
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/30'
            )}
          >
            <input
              type="radio"
              name="visibility"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              className="hidden"
            />
            <Lock className="h-4 w-4" />
            <div>
              <span className="font-medium">Private</span>
              <p className="text-[10px] opacity-70">Only you can access this quiz</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">Create Quiz</Button>
      </div>
    </form>
  );
}

// ── AI Preview Placeholder ───────────────────────────────────────────────────

function AIPreviewPlaceholder({
  curriculumIds,
  onImportQuestions,
  onBack,
  onCancel,
}: {
  curriculumIds?: string[];
  onImportQuestions: (questions: QuizStandaloneQuestion[]) => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const [importedQuestions, setImportedQuestions] = useState<QuizStandaloneQuestion[] | null>(null);

  if (importedQuestions) {
    return (
      <AIPreview
        questions={importedQuestions}
        onSave={(questions) => onImportQuestions(questions)}
        onBack={() => setImportedQuestions(null)}
      />
    );
  }

  return (
    <AIWizard
      curriculumIds={curriculumIds}
      onImportQuestions={(questions) => setImportedQuestions(questions)}
      onCancel={onCancel}
    />
  );
}

// ── Main QuizCreator Component ───────────────────────────────────────────────

export default function QuizCreator({
  curriculumIds,
  onCreated,
  onCancel,
}: QuizCreatorProps) {
  const [mode, setMode] = useState<CreatorMode>('choose');
  const [pendingQuestions, setPendingQuestions] = useState<QuizStandaloneQuestion[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  function handleManualComplete(data: { questions: Partial<QuizStandaloneQuestion>[] }) {
    const cleaned: QuizStandaloneQuestion[] = data.questions
      .filter((q) => q.question_text?.trim())
      .map((q, i) => ({
        id: `mq-${Date.now()}-${i}`,
        type: q.type || 'multiple_choice',
        question_text: q.question_text || '',
        options: q.type === 'multiple_choice' ? (q.options || ['', '', '', '']).filter(Boolean) : null,
        correct_answer: q.correct_answer || '',
        points: q.points || 1,
        order: i + 1,
      }));
    if (cleaned.length === 0) return;
    setPendingQuestions(cleaned);
  }

  function handleAIComplete(questions: QuizStandaloneQuestion[]) {
    setPendingQuestions(questions.map((q, i) => ({ ...q, order: i + 1 })));
  }

  async function handleDetailsSubmit(details: {
    title: string;
    description: string;
    time_limit_minutes: number | null;
    is_public: boolean;
  }) {
    if (!pendingQuestions || !details.title.trim()) return;

    setCreating(true);
    setCreateError('');

    try {
      const result = await createQuiz({
        title: details.title,
        description: details.description || undefined,
        time_limit_minutes: details.time_limit_minutes ?? undefined,
        is_public: details.is_public,
        questions: pendingQuestions,
      });
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to create quiz');
      }
      onCreated?.(result.data);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create quiz. Please try again.');
      setCreating(false);
    }
  }

  // Step: Details form
  if (pendingQuestions) {
    return (
      <div className="space-y-4">
        <DetailsForm
          onSave={handleDetailsSubmit}
          onCancel={() => setPendingQuestions(null)}
        />
        {createError && (
          <p className="text-xs text-[var(--error)]">{createError}</p>
        )}
        {creating && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--foreground-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating quiz...
          </div>
        )}
      </div>
    );
  }

  if (mode === 'ai') {
    return (
      <AIPreviewPlaceholder
        curriculumIds={curriculumIds}
        onImportQuestions={handleAIComplete}
        onBack={() => setMode('choose')}
        onCancel={onCancel}
      />
    );
  }

  if (mode === 'choose') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Create New Quiz</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setMode('manual')}
            className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-5 text-left transition-all hover:border-[var(--primary)] hover:-translate-y-0.5"
          >
            <PenLine className="mb-3 h-8 w-8 text-[var(--primary)]" />
            <h4 className="font-semibold text-[var(--foreground)]">Build Manually</h4>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Add questions one by one — multiple choice, true/false, and short answer.
            </p>
          </button>

          <button
            onClick={() => setMode('ai')}
            className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-5 text-left transition-all hover:border-[var(--primary)] hover:-translate-y-0.5"
          >
            <Sparkles className="mb-3 h-8 w-8 text-[var(--primary)]" />
            <h4 className="font-semibold text-[var(--foreground)]">Generate with AI</h4>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Describe your topic and get a full quiz generated by AI via Gemini or ChatGPT.
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'manual') {
    return <ManualCreateForm onSave={handleManualComplete} onCancel={() => setMode('choose')} />;
  }

  return null;
}
