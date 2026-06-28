'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — BlockEditor
// Block-by-block editing panel with add, reorder, delete, duplicate controls.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  GripVertical, ChevronUp, ChevronDown, Trash2, Copy,
  Plus, Type, AlignLeft, Sigma, Code2, Link2, Image, Table2, Minus, Clapperboard, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteBlock, NoteBlock as NoteBlockType, AnimationTemplate } from '@/types';
import { ANIMATION_TEMPLATES } from './AnimationBlock';

interface BlockEditorProps {
  blocks: NoteBlock[];
  onUpdateBlock: (blockId: string, updates: Partial<NoteBlockType>) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDuplicateBlock: (blockId: string) => void;
  onAddBlock: (type: NoteBlock['type']) => void;
}

const ADD_BLOCK_OPTIONS: { type: NoteBlock['type']; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'heading',   label: 'Heading',    icon: <Type className="h-4 w-4" />,        color: 'text-blue-500 bg-blue-500/10' },
  { type: 'paragraph', label: 'Paragraph',  icon: <AlignLeft className="h-4 w-4" />,   color: 'text-slate-500 bg-slate-500/10' },
  { type: 'latex',     label: 'LaTeX',      icon: <Sigma className="h-4 w-4" />,       color: 'text-violet-500 bg-violet-500/10' },
  { type: 'code',      label: 'Code',       icon: <Code2 className="h-4 w-4" />,       color: 'text-emerald-500 bg-emerald-500/10' },
  { type: 'link',      label: 'Link',       icon: <Link2 className="h-4 w-4" />,       color: 'text-sky-500 bg-sky-500/10' },
  { type: 'image',     label: 'Image',      icon: <Image className="h-4 w-4" />,       color: 'text-pink-500 bg-pink-500/10' },
  { type: 'table',     label: 'Table',      icon: <Table2 className="h-4 w-4" />,      color: 'text-amber-500 bg-amber-500/10' },
  { type: 'animation', label: 'Animation',  icon: <Clapperboard className="h-4 w-4" />,color: 'text-purple-500 bg-purple-500/10' },
  { type: 'svg',       label: 'SVG',        icon: <PenLine className="h-4 w-4" />,     color: 'text-teal-500 bg-teal-500/10' },
  { type: 'divider',   label: 'Divider',    icon: <Minus className="h-4 w-4" />,       color: 'text-foreground-muted bg-background-secondary' },
];

// ── Individual block editors ───────────────────────────────────────────────────

function HeadingEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'heading' }>; onChange: (updates: Partial<typeof block>) => void }) {
  return (
    <div className="flex gap-2">
      <select value={block.level} onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
        className="w-16 px-2 py-1.5 rounded-lg bg-background-secondary border border-border text-xs text-foreground cursor-pointer">
        <option value={1}>H1</option>
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </select>
      <input type="text" value={block.text} placeholder="Heading text…"
        onChange={(e) => onChange({ text: e.target.value })}
        className="flex-1 px-3 py-1.5 rounded-lg bg-background-secondary border border-border text-sm text-foreground font-semibold focus:outline-none focus:border-primary/60 transition-all"
      />
    </div>
  );
}

function ParagraphEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'paragraph' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <textarea value={block.text} rows={3} placeholder="Paragraph text… (supports **bold**, *italic*, [link](url))"
      onChange={(e) => onChange({ text: e.target.value })}
      className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all resize-y"
    />
  );
}

function LatexEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'latex' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-foreground-muted">Display mode</span>
        <button
          onClick={() => onChange({ display: !block.display })}
          className={cn('relative w-9 h-5 rounded-full transition-colors cursor-pointer', block.display ? 'bg-primary' : 'bg-border')}
        >
          <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', block.display ? 'translate-x-4' : 'translate-x-0.5')} />
        </button>
      </div>
      <textarea value={block.expression} rows={2} placeholder="LaTeX expression, e.g. E = mc^2 or \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
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
        <input type="text" value={block.language} placeholder="Language (e.g. python)"
          onChange={(e) => onChange({ language: e.target.value })}
          className="w-28 px-3 py-1.5 rounded-lg bg-background-secondary border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary/60"
        />
        <input type="text" value={block.caption ?? ''} placeholder="Caption (optional)"
          onChange={(e) => onChange({ caption: e.target.value })}
          className="flex-1 px-3 py-1.5 rounded-lg bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary/60"
        />
      </div>
      <textarea value={block.code} rows={5} placeholder="Code goes here…"
        onChange={(e) => onChange({ code: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/60 transition-all resize-y"
      />
    </div>
  );
}

function LinkEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'link' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <input type="text" value={block.label} placeholder="Link label"
        onChange={(e) => onChange({ label: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm focus:outline-none focus:border-primary/60 transition-all"
      />
      <input type="url" value={block.url} placeholder="https://…"
        onChange={(e) => onChange({ url: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm font-mono focus:outline-none focus:border-primary/60 transition-all"
      />
      <input type="text" value={block.description ?? ''} placeholder="Description (optional)"
        onChange={(e) => onChange({ description: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground-muted focus:outline-none focus:border-primary/60 transition-all"
      />
    </div>
  );
}

function ImageEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'image' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <input type="url" value={block.url} placeholder="Image URL (https://…)"
        onChange={(e) => onChange({ url: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm font-mono focus:outline-none focus:border-primary/60"
      />
      <div className="flex gap-2">
        <input type="text" value={block.alt ?? ''} placeholder="Alt text"
          onChange={(e) => onChange({ alt: e.target.value })}
          className="flex-1 px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm focus:outline-none focus:border-primary/60"
        />
        <input type="text" value={block.caption ?? ''} placeholder="Caption (optional)"
          onChange={(e) => onChange({ caption: e.target.value })}
          className="flex-1 px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm focus:outline-none focus:border-primary/60"
        />
      </div>
    </div>
  );
}

function TableEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'table' }>; onChange: (u: Partial<typeof block>) => void }) {
  const rows = block.rows;
  const updateCell = (ri: number, ci: number, val: string) => {
    const newRows = rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? val : c) : r);
    onChange({ rows: newRows });
  };
  const addRow = () => onChange({ rows: [...rows, new Array(rows[0]?.length ?? 2).fill('')] });
  const addCol = () => onChange({ rows: rows.map((r) => [...r, '']) });
  const removeRow = (ri: number) => onChange({ rows: rows.filter((_, i) => i !== ri) });

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          {rows.map((row, ri) => (
            <tr key={ri} className="group">
              {row.map((cell, ci) => (
                <td key={ci} className="p-1">
                  <input type="text" value={cell}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                    className={cn(
                      'w-24 px-2 py-1 rounded border text-foreground bg-background-secondary focus:outline-none focus:border-primary/60 transition-all',
                      ri === 0 ? 'font-semibold border-primary/30' : 'border-border'
                    )}
                  />
                </td>
              ))}
              <td className="p-1">
                <button onClick={() => removeRow(ri)} className="p-1 text-foreground-muted hover:text-error opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Trash2 className="h-3 w-3" />
                </button>
              </td>
            </tr>
          ))}
        </table>
      </div>
      <div className="flex gap-2">
        <button onClick={addRow} className="text-xs px-2 py-1 rounded bg-background-secondary border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer">+ Row</button>
        <button onClick={addCol} className="text-xs px-2 py-1 rounded bg-background-secondary border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer">+ Column</button>
      </div>
    </div>
  );
}

function AnimationEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'animation' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <select value={block.template}
        onChange={(e) => onChange({ template: e.target.value as AnimationTemplate })}
        className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer">
        {(Object.entries(ANIMATION_TEMPLATES) as [AnimationTemplate, { label: string; subject: string }][]).map(([key, info]) => (
          <option key={key} value={key}>{info.subject} — {info.label}</option>
        ))}
      </select>
      <input type="text" value={block.caption ?? ''} placeholder="Caption (optional)"
        onChange={(e) => onChange({ caption: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm focus:outline-none focus:border-primary/60"
      />
    </div>
  );
}

function SvgEditor({ block, onChange }: { block: Extract<NoteBlock, { type: 'svg' }>; onChange: (u: Partial<typeof block>) => void }) {
  return (
    <div className="space-y-2">
      <textarea value={block.markup} rows={5} placeholder="Paste SVG markup here (<svg>…</svg>)"
        onChange={(e) => onChange({ markup: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500/60 resize-y"
      />
      <input type="text" value={block.caption ?? ''} placeholder="Caption (optional)"
        onChange={(e) => onChange({ caption: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm focus:outline-none focus:border-primary/60"
      />
    </div>
  );
}

// ── Block wrapper (with controls) ─────────────────────────────────────────────

function BlockWrapper({
  block, index, total,
  onUpdate, onDelete, onMove, onDuplicate,
}: {
  block: NoteBlock; index: number; total: number;
  onUpdate: (u: Partial<NoteBlock>) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const blockOption = ADD_BLOCK_OPTIONS.find((o) => o.type === block.type);

  const renderEditor = () => {
    switch (block.type) {
      case 'heading':   return <HeadingEditor   block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'heading'}>>) => void} />;
      case 'paragraph': return <ParagraphEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'paragraph'}>>) => void} />;
      case 'latex':     return <LatexEditor     block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'latex'}>>) => void} />;
      case 'code':      return <CodeEditor      block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'code'}>>) => void} />;
      case 'link':      return <LinkEditor      block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'link'}>>) => void} />;
      case 'image':     return <ImageEditor     block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'image'}>>) => void} />;
      case 'table':     return <TableEditor     block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'table'}>>) => void} />;
      case 'animation': return <AnimationEditor block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'animation'}>>) => void} />;
      case 'svg':       return <SvgEditor       block={block} onChange={onUpdate as (u: Partial<Extract<NoteBlock, {type:'svg'}>>) => void} />;
      case 'divider':   return <div className="text-xs text-foreground-muted text-center py-2">— Divider —</div>;
      default:          return null;
    }
  };

  return (
    <div className={cn(
      'group border border-border rounded-xl bg-background-card transition-all duration-200',
      'hover:border-border-hover hover:shadow-sm'
    )}>
      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        <GripVertical className="h-4 w-4 text-foreground-muted opacity-40 shrink-0 cursor-grab" />

        {/* Type badge */}
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1', blockOption?.color)}>
          {blockOption?.icon}
          {blockOption?.label ?? block.type}
        </span>

        <span className="text-xs text-foreground-muted ml-1">#{index + 1}</span>

        <div className="flex-1" />

        {/* Controls */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onMove('up')} disabled={index === 0}
            className="p-1 rounded hover:bg-background-secondary text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onMove('down')} disabled={index === total - 1}
            className="p-1 rounded hover:bg-background-secondary text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDuplicate}
            className="p-1 rounded hover:bg-background-secondary text-foreground-muted hover:text-foreground transition-colors cursor-pointer">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-1 rounded hover:bg-error/10 text-foreground-muted hover:text-error transition-colors cursor-pointer">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-background-secondary text-foreground-muted transition-colors cursor-pointer">
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !expanded && '-rotate-90')} />
          </button>
        </div>
      </div>

      {/* Block content */}
      {expanded && (
        <div className="p-3">
          {renderEditor()}
        </div>
      )}
    </div>
  );
}

// ── Main BlockEditor ──────────────────────────────────────────────────────────

export default function BlockEditor({
  blocks, onUpdateBlock, onDeleteBlock, onMoveBlock, onDuplicateBlock, onAddBlock,
}: BlockEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Block list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {blocks.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="text-4xl">✍️</div>
            <p className="text-sm font-medium text-foreground">No blocks yet</p>
            <p className="text-xs text-foreground-muted">Add your first block below or use the AI generator.</p>
          </div>
        )}
        {blocks.map((block, i) => (
          <BlockWrapper
            key={block.id}
            block={block}
            index={i}
            total={blocks.length}
            onUpdate={(u) => onUpdateBlock(block.id, u)}
            onDelete={() => onDeleteBlock(block.id)}
            onMove={(dir) => onMoveBlock(block.id, dir)}
            onDuplicate={() => onDuplicateBlock(block.id)}
          />
        ))}
      </div>

      {/* Add block menu */}
      <div className="relative border-t border-border pt-3">
        <button
          id="block-editor-add"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-border text-foreground-muted hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Block
        </button>

        {showAddMenu && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-background-card border border-border rounded-xl shadow-xl p-3 grid grid-cols-2 gap-1.5 z-20 animate-slide-down">
            {ADD_BLOCK_OPTIONS.map(({ type, label, icon, color }) => (
              <button
                key={type}
                id={`add-block-${type}`}
                onClick={() => { onAddBlock(type); setShowAddMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background-secondary text-sm text-foreground transition-colors cursor-pointer text-left"
              >
                <span className={cn('p-1 rounded', color)}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
