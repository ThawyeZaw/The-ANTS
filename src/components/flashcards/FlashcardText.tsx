'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useKaTeXStyles } from '@/hooks/useKaTeXStyles';

interface FlashcardTextProps {
  text: string;
  className?: string;
}

type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'math'; content: string; display: boolean };

function parseFlashcardText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    const math = raw.slice(raw.startsWith('$$') ? 2 : 1, raw.endsWith('$$') ? -2 : -1);
    segments.push({ type: 'math', content: math.trim(), display: raw.startsWith('$$') });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (segments.length === 1 && segments[0].type === 'text') {
    const plain = segments[0].content;
    const likelyMath = /\\frac|\\sqrt|\\sum|\\int|\\pi|\^|_|\bfrac\b|\btheta\b|\bbeta\b/.test(plain);
    const hasSuperscript = /[²³⁴⁵⁶⁷⁸⁹]/.test(plain);

    if (likelyMath || hasSuperscript) {
      return [{ type: 'math', content: plain.trim(), display: false }];
    }
  }

  return segments;
}

function LatexSegment({ expression, display }: { expression: string; display: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    import('katex').then(({ default: katex }) => {
      if (!ref.current) return;
      try {
        katex.render(expression, ref.current, {
          displayMode: display,
          throwOnError: false,
          errorColor: '#ef4444',
        });
      } catch {
        ref.current.textContent = expression;
      }
    }).catch(() => {
      if (ref.current) ref.current.textContent = expression;
    });
  }, [expression, display]);

  return (
    <div
      ref={ref}
      className={display ? 'my-3 overflow-x-auto text-foreground' : 'inline-block text-foreground'}
    />
  );
}

export default function FlashcardText({ text, className }: FlashcardTextProps) {
  useKaTeXStyles();
  const segments = useMemo(() => parseFlashcardText(text), [text]);

  return (
    <div className={`text-base ${className ?? ''}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {segment.content}
            </span>
          );
        }

        return (
          <LatexSegment
            key={index}
            expression={segment.content}
            display={segment.display}
          />
        );
      })}
    </div>
  );
}
