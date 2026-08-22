'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — BlockEditor
// Block-by-block editing panel with add, reorder, delete, duplicate controls.
// Refactored: uses BlockCard for individual blocks, hover-reveal block chrome,
// and a refined add-block menu with soft shadow + rounded corners.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteBlock, NoteBlock as NoteBlockType } from '@/types';
import BlockCard, { ADD_BLOCK_OPTIONS } from './BlockCard';

interface BlockEditorProps {
  blocks: NoteBlock[];
  onUpdateBlock: (blockId: string, updates: Partial<NoteBlockType>) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDuplicateBlock: (blockId: string) => void;
  onAddBlock: (type: NoteBlock['type']) => void;
}

export default function BlockEditor({
  blocks, onUpdateBlock, onDeleteBlock, onMoveBlock, onDuplicateBlock, onAddBlock,
}: BlockEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Block list */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {blocks.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="text-4xl opacity-40" aria-hidden="true">&#9997;</div>
            <p className="text-sm font-medium text-[var(--foreground)]">No blocks yet</p>
            <p className="text-xs text-[var(--foreground-muted)] max-w-xs">
              Add your first block below to start building your note, or use the AI generator for a quick start.
            </p>
          </div>
        )}
        {blocks.map((block, i) => (
          <BlockCard
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
      <div className="relative border-t border-[var(--border)] pt-3">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 transition-all text-sm font-medium cursor-pointer focus-ring"
          aria-expanded={showAddMenu}
          aria-haspopup="true"
        >
          <Plus className="h-4 w-4" />
          Add Block
        </button>

        {showAddMenu && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-[var(--background-card)] border border-[var(--border)] rounded-2xl shadow-lg p-3 grid grid-cols-2 gap-1.5 z-20 animate-slide-down">
            {ADD_BLOCK_OPTIONS.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => {
                  onAddBlock(type);
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] text-sm text-[var(--foreground)] transition-colors cursor-pointer focus-ring text-left"
              >
                <span className={cn('p-1 rounded-lg', color)}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
