'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — BlockPreview
// Renders a single NoteBlock. Used in both the viewer and the editor preview pane.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { NoteBlock } from '@/types';
import AnimationBlockComponent from './AnimationBlock';
import { useKaTeXStyles } from '@/hooks/useKaTeXStyles';

interface BlockPreviewProps {
  block: NoteBlock;
}

// ── Inline text renderer (supports **bold**, *italic*, [link](url)) ──────────

function InlineText({ text }: { text: string }) {
  // Parse inline markdown: **bold**, *italic*, [label](url)
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;

  const patterns = [
    { re: /\*\*([\s\S]+?)\*\*/,  render: (m: string) => <strong key={key++} className="font-semibold">{m}</strong> },
    { re: /\*([\s\S]+?)\*/,      render: (m: string) => <em key={key++} className="italic">{m}</em> },
    { re: /\[(.+?)\]\((.+?)\)/, render: (_m: string, label: string, href: string) => (
      <a key={key++} href={href} target="_blank" rel="noopener noreferrer"
        className="text-primary underline hover:text-primary/80 transition-colors">
        {label}
      </a>
    )},
  ];

  while (rest.length > 0) {
    let earliest: { index: number; length: number; node: React.ReactNode } | null = null;

    for (const { re, render } of patterns) {
      const match = re.exec(rest);
      if (match && (earliest === null || match.index < earliest.index)) {
        const [full, g1, g2] = match;
        earliest = {
          index: match.index,
          length: full.length,
          node: render(g1, g1, g2 ?? ''),
        };
      }
    }

    if (!earliest) {
      parts.push(<span key={key++}>{rest}</span>);
      break;
    }

    if (earliest.index > 0) {
      parts.push(<span key={key++}>{rest.slice(0, earliest.index)}</span>);
    }
    parts.push(earliest.node);
    rest = rest.slice(earliest.index + earliest.length);
  }

  return <>{parts}</>;
}

// ── LaTeX renderer ────────────────────────────────────────────────────────────

function LatexRenderer({ expression, display }: { expression: string; display: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Dynamically import katex to avoid SSR issues
    import('katex').then(({ default: katex }) => {
      if (!ref.current) return;
      try {
        katex.render(expression, ref.current, {
          displayMode: display,
          throwOnError: false,
          errorColor: '#ef4444',
        });
      } catch {
        if (ref.current) ref.current.textContent = expression;
      }
    }).catch(() => {
      if (ref.current) ref.current.textContent = expression;
    });
  }, [expression, display]);

  return (
    <div
      ref={ref}
      className={display
        ? 'my-4 flex justify-center overflow-x-auto text-foreground py-2'
        : 'inline-block text-foreground'
      }
    />
  );
}

// ── SVG renderer ──────────────────────────────────────────────────────────────

function SvgRenderer({ markup, caption }: { markup: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !markup) return;

    import('dompurify').then(({ default: DOMPurify }) => {
      const clean = DOMPurify.sanitize(markup, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });
      if (ref.current) ref.current.innerHTML = clean;
    }).catch(() => {
      // If DOMPurify not available, show nothing
      if (ref.current) ref.current.innerHTML = '';
    });
  }, [markup]);

  return (
    <div className="my-4 flex flex-col items-center gap-2">
      <div
        ref={ref}
        className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-background-secondary p-4 flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
      />
      {caption && <p className="text-xs text-foreground-muted italic text-center">{caption}</p>}
    </div>
  );
}

// ── Mermaid renderer ──────────────────────────────────────────────────────────

let mermaidIdCounter = 0;

function MermaidRenderer({ code, caption }: { code: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      const id = `mermaid-svg-${++mermaidIdCounter}`;
      mermaid.render(id, code).then(({ svg }: { svg: string }) => {
        if (isMounted) {
          setSvgCode(svg);
        }
      }).catch((err: unknown) => {
        console.error('Mermaid rendering failed', err);
      });
    }).catch((err: unknown) => {
      console.error('Failed to load Mermaid', err);
    });
    return () => { isMounted = false; };
  }, [code]);

  return (
    <div className="my-4 flex flex-col items-center gap-2">
      {svgCode ? (
        <div
          ref={ref}
          className="w-full max-w-full overflow-hidden rounded-xl border border-border bg-background-secondary p-4 flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svgCode }}
        />
      ) : (
        <div
          ref={ref}
          className="w-full max-w-full overflow-hidden rounded-xl border border-border bg-background-secondary p-4 flex justify-center items-center"
        >
          <span className="text-xs text-foreground-muted">Rendering flowchart...</span>
        </div>
      )}
      {caption && <p className="text-xs text-foreground-muted italic text-center">{caption}</p>}
    </div>
  );
}

// ── Table renderer ────────────────────────────────────────────────────────────

function TableRenderer({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null;
  const [headers, ...body] = rows;

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-background-secondary">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border text-xs uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0 hover:bg-background-secondary/50 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-foreground-secondary">
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main BlockPreview ─────────────────────────────────────────────────────────

export default function BlockPreview({ block }: BlockPreviewProps) {
  useKaTeXStyles();
  switch (block.type) {
    case 'heading': {
      const Tag = (`h${block.level}`) as 'h1' | 'h2' | 'h3';
      const classes = {
        1: 'text-2xl font-bold text-foreground mt-6 mb-3',
        2: 'text-xl font-semibold text-foreground mt-5 mb-2',
        3: 'text-lg font-semibold text-foreground-secondary mt-4 mb-2',
      }[block.level];
      return <Tag className={classes}><InlineText text={block.text} /></Tag>;
    }

    case 'paragraph':
      return (
        <p className="text-base text-foreground-secondary leading-relaxed my-3">
          {block.text.split('\n').map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              <InlineText text={line} />
            </span>
          ))}
        </p>
      );

    case 'latex':
      return <LatexRenderer expression={block.expression} display={block.display} />;

    case 'svg':
      return <SvgRenderer markup={block.markup} caption={block.caption} />;

    case 'animation':
      return <AnimationBlockComponent template={block.template} config={block.config} script={block.script} caption={block.caption} />;

    case 'image':
      return (
        <div className="my-4 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt ?? 'Note image'}
            className="max-w-full max-h-80 rounded-xl border border-border object-contain"
          />
          {block.caption && <p className="text-xs text-foreground-muted italic">{block.caption}</p>}
        </div>
      );

    case 'link':
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-3 flex items-start gap-3 p-3 rounded-xl border border-border bg-background-secondary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
        >
          <div className="mt-0.5 text-primary shrink-0">
            <ExternalLink className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground group-hover:text-primary transition-colors text-base">{block.label}</p>
            {block.description && <p className="text-xs text-foreground-muted mt-0.5 truncate">{block.description}</p>}
            <p className="text-xs text-primary/60 mt-0.5 truncate">{block.url}</p>
          </div>
        </a>
      );

    case 'code':
      if (block.language === 'mermaid') {
        return <MermaidRenderer code={block.code} caption={block.caption} />;
      }
      return (
        <div className="my-4">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-xl border border-slate-700">
            <span className="text-xs font-mono text-slate-400">{block.language}</span>
            {block.caption && <span className="text-xs text-slate-500">{block.caption}</span>}
          </div>
          <pre className="bg-slate-900 rounded-b-xl p-4 overflow-x-auto border border-slate-700 border-t-0">
            <code className="text-sm font-mono text-slate-200 whitespace-pre">{block.code}</code>
          </pre>
        </div>
      );

    case 'table':
      return <TableRenderer rows={block.rows} />;

    case 'divider':
      return (
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <div className="h-1.5 w-1.5 rounded-full bg-border" />
          <div className="flex-1 h-px bg-border" />
        </div>
      );

    default:
      return null;
  }
}
