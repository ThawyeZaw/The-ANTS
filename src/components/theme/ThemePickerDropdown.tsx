'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Theme Picker Dropdown Component
// Allows guests and logged-in users to toggle Light/Dark mode AND choose
// their primary color accent preset directly from the header or navbar.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check } from 'lucide-react';
import { useTheme, COLOR_PRESETS, type ThemeColor } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemePickerDropdownProps {
  /** Optional variant for navbar styles */
  variant?: 'app' | 'landing';
  className?: string;
}

export default function ThemePickerDropdown({
  variant = 'app',
  className,
}: ThemePickerDropdownProps) {
  const { theme, setTheme, themeColor, setThemeColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activePreset = COLOR_PRESETS[themeColor];

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Customize theme and colors"
        aria-expanded={isOpen}
        style={
          variant === 'landing'
            ? {
                background: 'none',
                border: '1px solid var(--hp-border-strong)',
                borderRadius: 999,
                padding: '7px 12px',
                color: 'var(--hp-ink)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }
            : undefined
        }
        className={
          variant === 'app'
            ? cn(
                'flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer border',
                isOpen
                  ? 'bg-primary/10 border-primary/40 text-primary shadow-xs'
                  : 'border-border text-foreground-secondary hover:text-foreground hover:bg-background-secondary hover:border-border-hover'
              )
            : undefined
        }
      >
        {/* Mode Icon */}
        <span className="flex items-center justify-center">
          {theme === 'dark' ? (
            <Sun className={variant === 'landing' ? 'h-4 w-4 text-amber-400' : 'h-4 w-4 text-amber-400'} />
          ) : (
            <Moon className={variant === 'landing' ? 'h-4 w-4 text-indigo-500' : 'h-4 w-4 text-indigo-500'} />
          )}
        </span>

        {/* Color Accent Indicator Dot */}
        <span
          className={cn('w-3 h-3 rounded-full bg-linear-to-br shadow-xs', activePreset?.gradient)}
          title={`Active accent: ${activePreset?.label}`}
        />

        {/* Label (hidden on small app screens) */}
        <span className={cn('hidden sm:inline-block font-medium text-xs', variant === 'landing' ? 'text-current' : '')}>
          {activePreset?.label}
        </span>
      </button>

      {/* ── Popover Dropdown Menu ── */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-72 z-50 rounded-2xl p-4 shadow-2xl border transition-all duration-200 animate-slide-down',
            'bg-background-card/95 backdrop-blur-xl border-border text-foreground'
          )}
          style={{
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold tracking-wide">Theme & Appearance</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Live
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="mb-4">
            <label className="text-xs font-medium text-foreground-muted block mb-2">
              Appearance Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-background-secondary rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer',
                  theme === 'light'
                    ? 'bg-background-card text-foreground shadow-xs border border-border'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer',
                  theme === 'dark'
                    ? 'bg-background-card text-foreground shadow-xs border border-border'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                Dark
              </button>
            </div>
          </div>

          {/* Color Accent Presets */}
          <div>
            <label className="text-xs font-medium text-foreground-muted block mb-2">
              Accent Color Palette
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(COLOR_PRESETS) as [ThemeColor, typeof COLOR_PRESETS[ThemeColor]][]).map(([key, preset]) => {
                const isSelected = themeColor === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setThemeColor(key)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer text-left',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                        : 'border-border text-foreground-secondary hover:border-border-hover hover:bg-background-secondary hover:text-foreground'
                    )}
                  >
                    <span className={cn('w-4 h-4 rounded-full bg-linear-to-br shrink-0 shadow-xs', preset.gradient)}>
                      {isSelected && (
                        <span className="flex items-center justify-center h-full text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                    </span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
            <span>Saved automatically</span>
            <span className="capitalize text-primary font-medium">{themeColor} active</span>
          </div>
        </div>
      )}
    </div>
  );
}
