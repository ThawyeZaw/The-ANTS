'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — BlockCard
// Individual block wrapper with hover-reveal chrome (Notion-style).
// Contains the block type icon, drag handle, and action controls that appear on hover.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  GripVertical, ChevronUp, ChevronDown, Trash2, Copy,
  ChevronDown as ChevronCollapse,
  Type, AlignLeft, Sigma, Code2, Link2, Image, Table2, Minus, Clapperboard, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteBlock, AnimationTemplate } from '@/types';
import { ANIMATION_TEMPLATES } from './AnimationBlock';

// ── Re-export the add block options for BlockEditor ───────────────────────────

export const ADD_BLOCK_OPTIONS: {
  type: NoteBlock['type'];
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { type: 'heading', label: 'Heading', icon: <Type className="h-4 w-4" />, color: 'text-blue-500 bg-blue-500/10' },
  { type: 'paragraph', label: 'Paragraph', icon: <AlignLeft className="h-4 w-4" />, color: 'text-slate-500 bg-slate-500/10' },
  { type: 'latex', label: 'LaTeX', icon: <Sigma className="h-4 w-4" />, color: 'text-violet-500 bg-violet-500/10' },
  { type: 'code', label: 'Code', icon: <Code2 className="h-4 w-4" />, color: 'text-emerald-500 bg-emerald-500/10' },
  { type: 'link', label: 'Link', icon: <Link2 className="h-4 w-4" />, color: 'text-sky-500 bg-sky-500/10' },
  { type: 'image', label: 'Image', icon: <Image className="h-4 w-4" />, color: 'text-pink-500 bg-pink-500/10' },
  { type: 'table', label: 'Table', icon: <Table2 className="h-4 w-4" />, color: 'text-amber-500 bg-amber-500/10' },
  { type: 'animation', label: 'Animation', icon: <Clapperboard className="h-4 w-4" />, color: 'text-purple-500 bg-purple-500/10' },
  { type: 'svg', label: 'SVG', icon: <PenLine className="h-4 w-4" />, color: 'text-teal-500 bg-teal-500/10' },
  { type: 'divider', label: 'Divider', icon: <Minus className="h-4 w-4" />, color: 'text-[var(--foreground-muted)] bg-[var(--background-secondary)]' },
];

// ── Individual block editors ───────────────────────────────────────────────────

function HeadingEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'heading' }>; onChange: (updates: Partial<typeof block>) => void }) {
  return (
    <div className="flex gap-2">
      <select
        value={block.level}
        onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
        className="w-16 px-2 py-1.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] cursor-pointer focus-ring"
        aria-label="Heading level"
      >
        <option value={1}>H1</option>
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </select>
      <input
        type="text"
        value={block.text}
        placeholder="Heading text..."
        onChange={(e) => onChange({ text: e.target.value })}
        className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] font-semibold focus:outline-none focus:border-[var(--primary)]/60 transition-all"
      />
    </div>
  );
}

function ParagraphEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'paragraph' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <textarea
      value={block.text}
      rows={3}
      placeholder="Paragraph text... (supports **bold**, *italic*, [link](url))"
      onChange={(e) => onChange({ text: e.target.value })}
      className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-all resize-y"
    />
  );
}

function LatexEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'latex' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--foreground-muted)]">Display mode</span>
        <button
          onClick={() => onChange({ display: !block.display })}
          className={cn(
            'relative w-9 h-5 rounded-full transition-colors cursor-pointer focus-ring',
            block.display ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
          )}
          role="switch"
          aria-checked={block.display}
          aria-label="Toggle display mode"
        >
          <div
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
              block.display ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>
      <textarea
        value={block.expression}
        rows={2}
        placeholder="LaTeX expression, e.g. E = mc^2 or \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
        onChange={(e) => onChange({ expression: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 font-mono focus:outline-none focus:border-violet-500/60 transition-all resize-none"
      />
    </div>
  );
}

function CodeEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'code' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={block.language}
          placeholder="Language (e.g. python)"
          onChange={(e) => onChange({ language: e.target.value })}
          className="w-28 px-3 py-1.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60"
        />
        <input
          type="text"
          value={block.caption ?? ''}
          placeholder="Caption (optional)"
          onChange={(e) => onChange({ caption: e.target.value })}
          className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60"
        />
      </div>
      <textarea
        value={block.code}
        rows={5}
        placeholder="Code goes here..."
        onChange={(e) => onChange({ code: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/60 transition-all resize-y"
      />
    </div>
  );
}

function LinkEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'link' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={block.label}
        placeholder="Link label"
        onChange={(e) => onChange({ label: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]/60 transition-all"
      />
      <input
        type="url"
        value={block.url}
        placeholder="https://..."
        onChange={(e) => onChange({ url: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)]/60 transition-all"
      />
      <input
        type="text"
        value={block.description ?? ''}
        placeholder="Description (optional)"
        onChange={(e) => onChange({ description: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)]/60 transition-all"
      />
    </div>
  );
}

function ImageEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'image' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <input
        type="url"
        value={block.url}
        placeholder="Image URL (https://...)"
        onChange={(e) => onChange({ url: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)]/60"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={block.alt ?? ''}
          placeholder="Alt text"
          onChange={(e) => onChange({ alt: e.target.value })}
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]/60"
        />
        <input
          type="text"
          value={block.caption ?? ''}
          placeholder="Caption (optional)"
          onChange={(e) => onChange({ caption: e.target.value })}
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]/60"
        />
      </div>
    </div>
  );
}

function TableEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'table' }>; onChange: (u: Partial<typeof block>) => void }) {
  const rows = block.rows;
  const updateCell = (ri: number, ci: number, val: string) => {
    const newRows = rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? val : c)) : r));
    onChange({ rows: newRows });
  };
  const addRow = () => onChange({ rows: [...rows, new Array(rows[0]?.length ?? 2).fill('')] });
  const addCol = () => onChange({ rows: rows.map((r) => [...r, '']) });
  const removeRow = (ri: number) => onChange({ rows: rows.filter((_, i) => i !== ri) });

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="group">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-1">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className={cn(
                        'w-24 px-2 py-1 rounded border text-[var(--foreground)] bg-[var(--background-secondary)] focus:outline-none focus:border-[var(--primary)]/60 transition-all',
                        ri === 0 ? 'font-semibold border-[var(--primary)]/30' : 'border-[var(--border)]'
                      )}
                    />
                  </td>
                ))}
                <td className="p-1">
                  <button
                    onClick={() => removeRow(ri)}
                    className="p-1 text-[var(--foreground-muted)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer focus-ring"
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button
          onClick={addRow}
          className="text-xs px-2 py-1 rounded bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer focus-ring"
        >
          + Row
        </button>
        <button
          onClick={addCol}
          className="text-xs px-2 py-1 rounded bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer focus-ring"
        >
          + Column
        </button>
      </div>
    </div>
  );
}

function AnimationEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'animation' }>; onChange: (u: Partial<typeof block>) => void }) {
  const [mode, setMode] = useState<'template' | 'script'>(block.script ? 'script' : 'template');

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('template')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer focus-ring border',
            mode === 'template'
              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
              : 'border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
          )}
        >
          Template
        </button>
        <button
          onClick={() => {
            setMode('script');
            onChange({ template: undefined });
          }}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer focus-ring border',
            mode === 'script'
              ? 'border-purple-500 bg-purple-500/10 text-purple-500'
              : 'border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
          )}
        >
          Custom Script
        </button>
      </div>

      {mode === 'template' ? (
        <>
          <select
            value={block.template ?? 'pendulum'}
            onChange={(e) => onChange({ template: e.target.value as AnimationTemplate })}
            className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 cursor-pointer"
          >
            {(Object.entries(ANIMATION_TEMPLATES) as [AnimationTemplate, { label: string; subject: string }][]).map(
              ([key, info]) => (
                <option key={key} value={key}>
                  {info.subject} — {info.label}
                </option>
              )
            )}
          </select>
          <input
            type="text"
            value={block.caption ?? ''}
            placeholder="Caption (optional)"
            onChange={(e) => onChange({ caption: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]/60"
          />
        </>
      ) : (
        <>
          <textarea
            value={block.script ?? ''}
            rows={6}
            placeholder={`// Paste or write JavaScript canvas animation code here\n// Available: canvas, ctx, width, height variables\n// Use requestAnimationFrame for animation loops`}
            onChange={(e) => onChange({ script: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500/60 resize-y"
          />
          <input
            type="text"
            value={block.caption ?? ''}
            placeholder="Caption (optional)"
            onChange={(e) => onChange({ caption: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]/60"
          />
        </>
      )}
    </div>
  );
}

function SvgEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'svg' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <textarea
        value={block.markup}
        rows={5}
        placeholder="Paste SVG markup here (<svg>...</svg>)"
        onChange={(e) => onChange({ markup: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500/60 resize-y"
      />
      <input
        type="text"
        value={block.caption ?? ''}
        placeholder="Caption (optional)"
        onChange={(e) => onChange({ caption: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]/60"
      />
    </div>
  );
}

// ── Main BlockCard ─────────────────────────────────────────────────────────────

interface BlockCardProps {
  block: NoteBlock;
  index: number;
  total: number;
  onUpdate: (u: Partial<NoteBlock>) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onDuplicate: () => void;
}

export default function BlockCard({
  block, index, total, onUpdate, onDelete, onMove, onDuplicate,
}: BlockCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);

  const blockOption = ADD_BLOCK_OPTIONS.find((o) => o.type === block.type);

  const renderEditor = () => {
    switch (block.type) {
      case 'heading':
        return <HeadingEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'heading' }>>) => void} />;
      case 'paragraph':
        return <ParagraphEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'paragraph' }>>) => void} />;
      case 'latex':
        return <LatexEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'latex' }>>) => void} />;
      case 'code':
        return <CodeEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'code' }>>) => void} />;
      case 'link':
        return <LinkEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'link' }>>) => void} />;
      case 'image':
        return <ImageEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'image' }>>) => void} />;
      case 'table':
        return <TableEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'table' }>>) => void} />;
      case 'animation':
        return <AnimationEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'animation' }>>) => void} />;
      case 'svg':
        return <SvgEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, { type: 'svg' }>>) => void} />;
      case 'divider':
        return <div className="text-xs text-[var(--foreground-muted)] text-center py-2">— Divider —</div>;
      default:
        return null;
    }
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left gutter: drag handle + type indicator (visible on hover) */}
      <div
        className={cn(
          'absolute left-0 top-0 -ml-10 flex items-center gap-0.5 pt-3 transition-opacity duration-200',
          hovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Drag handle */}
        <button
          className="p-1 rounded text-[var(--foreground-muted)] opacity-50 cursor-grab hover:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Type icon (subtle) */}
        <span className={cn('p-1 rounded text-xs', blockOption?.color)}>
          {blockOption?.icon}
        </span>
      </div>

      {/* Main card */}
      <div
        className={cn(
          'rounded-2xl transition-all duration-200',
          hovered ? 'bg-[var(--background-card)] shadow-sm' : 'bg-transparent'
        )}
      >
        {/* Body: editor content */}
        {expanded ? (
          <div className="px-4 py-3">{renderEditor()}</div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="w-full px-4 py-2 text-left text-sm text-[var(--foreground-muted)] italic hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {block.type === 'heading' && 'text' in block ? block.text || 'Untitled heading' :
             block.type === 'paragraph' && 'text' in block ? block.text?.slice(0, 60) || 'Empty paragraph' :
             `${blockOption?.label ?? block.type} block`}
          </button>
        )}

        {/* Hover toolbar (floating, right side) */}
        <div
          className={cn(
            'absolute right-2 top-2 flex items-center gap-0.5 bg-[var(--background-card)] border border-[var(--border)] rounded-xl shadow-md px-1 py-0.5 transition-all duration-200',
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
          )}
        >
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors cursor-pointer focus-ring"
            aria-label="Move block up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === total - 1}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors cursor-pointer focus-ring"
            aria-label="Move block down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer focus-ring"
            aria-label="Duplicate block"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] transition-colors cursor-pointer focus-ring"
            aria-label={expanded ? 'Collapse block' : 'Expand block'}
          >
            <ChevronCollapse className={cn('h-3.5 w-3.5 transition-transform', !expanded && '-rotate-90')} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-lg hover:bg-red-500/10 text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors cursor-pointer focus-ring"
            aria-label="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
