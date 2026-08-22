'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Loader2, X, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_METADATA } from '@/types';
import type { Profile } from '@/types';
import { getAllUsers } from '@/actions/role-upgrade';

/** Minimal user info needed for the selected chip display */
type SelectedUserDisplay = Pick<Profile, 'id' | 'name' | 'username' | 'avatar' | 'role'>;

interface UserSearchComboboxProps {
  /** Called when a user is selected from the dropdown */
  onSelect: (user: Profile) => void;
  /** Called when the linked user is cleared */
  onClear?: () => void;
  /** Currently selected user (for pre-populating in edit mode) */
  selectedUser?: SelectedUserDisplay | null;
  placeholder?: string;
  className?: string;
  /** Label text above the search input */
  label?: string;
  /** Description text below the label */
  description?: string;
}

export default function UserSearchCombobox({
  onSelect,
  onClear,
  selectedUser,
  placeholder = 'Search user by name or email...',
  className,
  label = 'Link to Platform User',
  description = 'Search for an existing platform user to auto-fill their details.',
}: UserSearchComboboxProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all users once
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const all = await getAllUsers();
        if (!cancelled) setUsers(all);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  // Filter users by query
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return users
      .filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [users, query]);

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset highlight when list changes
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filtered.length]);

  const handleSelect = useCallback(
    (user: Profile) => {
      onSelect(user);
      setQuery('');
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setHighlightIndex(-1);
    onClear?.();
  }, [onClear]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // If a user is already selected, show the selected chip
  if (selectedUser) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <label className="block text-sm font-medium text-foreground-secondary">{label}</label>}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-background-secondary border border-border">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-background-card border border-border flex items-center justify-center shrink-0 overflow-hidden">
            {selectedUser.avatar ? (
              <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-foreground-muted" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedUser.name}</p>
            <p className="text-xs text-foreground-muted truncate">@{selectedUser.username}</p>
          </div>

          {/* Role badge */}
          <span
            className={cn(
              'shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border',
              ROLE_METADATA[selectedUser.role]?.color || 'text-foreground-muted'
            )}
            style={{
              backgroundColor: `${ROLE_METADATA[selectedUser.role]?.color?.replace('text-', '') || 'var(--foreground-muted)'}15`,
              borderColor: `${ROLE_METADATA[selectedUser.role]?.color?.replace('text-', '') || 'var(--foreground-muted)'}25`,
            }}
          >
            {ROLE_METADATA[selectedUser.role]?.displayName || selectedUser.role}
          </span>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Remove link"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-foreground-secondary">{label}</label>}
      {description && <p className="text-xs text-foreground-muted">{description}</p>}

      <div className="relative">
        {/* Search input */}
        <div className="relative">
          {loading ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => query.trim() && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors"
            placeholder={placeholder}
            disabled={loading}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setIsOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && query.trim() && (
          <div className="absolute z-[110] mt-1 w-full rounded-xl bg-background-card border border-border shadow-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <User className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
                <p className="text-sm text-foreground-muted">
                  {loading ? 'Loading users...' : 'No users found'}
                </p>
              </div>
            ) : (
              <ul className="max-h-56 overflow-y-auto py-1">
                {filtered.map((user, idx) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(user)}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer',
                        idx === highlightIndex
                          ? 'bg-primary/10'
                          : 'hover:bg-background-secondary'
                      )}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-background-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-foreground-muted" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-foreground-muted truncate">
                          @{user.username} · {user.email}
                        </p>
                      </div>

                      {/* Role badge */}
                      <span
                        className={cn(
                          'shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border',
                          ROLE_METADATA[user.role]?.color
                        )}
                        style={{
                          backgroundColor: `${ROLE_METADATA[user.role]?.color?.replace('text-', '')}15`,
                          borderColor: `${ROLE_METADATA[user.role]?.color?.replace('text-', '')}25`,
                        }}
                      >
                        {ROLE_METADATA[user.role]?.displayName || user.role}
                      </span>

                      {idx === highlightIndex && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
