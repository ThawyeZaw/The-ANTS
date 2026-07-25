'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — EnrollmentSwitcher
// Compact dropdown to switch between enrolled curricula/subjects.
// Links back to Course Manager for managing enrollments.
// Follows NavBar dropdown mechanics: click to open, outside-click close,
// animate-slide-down. Reuses design-system token colors.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, GraduationCap, BookOpen, ExternalLink } from 'lucide-react';
import { useLessonContext } from '@/context/LessonContext';
import { cn } from '@/lib/utils';

// ── Main Component ────────────────────────────────────────────────────────────

export default function EnrollmentSwitcher() {
  const {
    enrolledCurriculums,
    activeCurriculumId,
    setActiveCurriculumId,
  } = useLessonContext();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const activeCurriculum = enrolledCurriculums.find((c) => c.id === activeCurriculumId) ?? null;

  if (enrolledCurriculums.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        id="enrollment-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--border-hover)] transition-all duration-150 cursor-pointer focus-ring"
      >
        <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
        <span className="max-w-48 truncate">
          {activeCurriculum?.title ?? 'Select curriculum'}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-[var(--foreground-muted)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Enrolled curricula"
          className="absolute top-full left-0 mt-2 z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--background-card)] shadow-lg overflow-hidden animate-slide-down"
        >
          <div className="py-1 max-h-64 overflow-y-auto">
            {enrolledCurriculums.map((c) => {
              const isActive = c.id === activeCurriculumId;
              return (
                <button
                  key={c.id}
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => {
                    setActiveCurriculumId(c.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-100 cursor-pointer focus-ring',
                    isActive
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] font-semibold'
                      : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'
                  )}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{c.title}</span>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[var(--border)] px-4 py-2.5">
            <Link
              href="/courses"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150"
            >
              <ExternalLink className="h-3 w-3" />
              Manage enrollments
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
