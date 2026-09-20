'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableOption {
  value: string;
  label: string;
  hint?: string;
  group?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q) ||
        o.group?.toLowerCase().includes(q)
    );
  }, [options, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchableOption[]>();
    for (const opt of filtered) {
      const key = opt.group || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(opt);
    }
    return [...map.entries()];
  }, [filtered]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-3 rounded-2xl border bg-background-secondary py-3 px-4 text-left transition-colors',
          open ? 'border-primary' : 'border-border hover:border-primary/40',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block text-xs font-bold text-foreground truncate">{selected.label}</span>
              {selected.hint && (
                <span className="block text-[11px] font-mono text-foreground-muted truncate">{selected.hint}</span>
              )}
            </>
          ) : (
            <span className="text-xs font-bold text-foreground-muted">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-foreground-muted shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-border bg-background-card shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlight((i) => Math.min(filtered.length - 1, i + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlight((i) => Math.max(0, i - 1));
                } else if (e.key === 'Enter' && filtered[highlight]) {
                  e.preventDefault();
                  pick(filtered[highlight].value);
                } else if (e.key === 'Escape') {
                  setOpen(false);
                  setQuery('');
                }
              }}
              placeholder="Search…"
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none py-1"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-foreground-muted">No matches for “{query}”.</p>
            )}
            {grouped.map(([group, items]) => (
              <div key={group || 'ungrouped'}>
                {group && (
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    {group}
                  </p>
                )}
                {items.map((opt) => {
                  const idx = filtered.indexOf(opt);
                  const active = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseEnter={() => setHighlight(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(opt.value);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                        idx === highlight && 'bg-primary/10',
                        active && 'text-primary'
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-foreground truncate">{opt.label}</span>
                        {opt.hint && (
                          <span className="block text-[11px] font-mono text-foreground-muted truncate">{opt.hint}</span>
                        )}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
