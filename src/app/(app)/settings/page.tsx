'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Settings Page
// Lets users edit their profile, change their role, and personalise appearance.
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { Check, Sun, Moon, Palette, User, UserCog } from 'lucide-react';
import { useTheme, COLOR_PRESETS, type ThemeColor } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import RoleUpgradeForm from '@/components/settings/RoleUpgradeForm';

// ── Section Wrapper ───────────────────────────────────────────────────────────

function SettingsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-foreground-muted mt-0.5">{description}</p>
        </div>
      </div>
      {/* Body */}
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

// ── Theme Mode Toggle ─────────────────────────────────────────────────────────

function ThemeModeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark' as const, label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3">Mode</p>
      <div className="flex gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer',
              theme === opt.value
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border text-foreground-secondary hover:border-border-hover hover:text-foreground hover:bg-background-secondary'
            )}
          >
            {opt.icon}
            {opt.label}
            {theme === opt.value && (
              <Check className="h-3.5 w-3.5 ml-0.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Color Palette Picker ──────────────────────────────────────────────────────

function ColorPalettePicker() {
  const { themeColor, setThemeColor } = useTheme();

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <p className="text-sm font-medium text-foreground mb-1">Accent Color</p>
      <p className="text-xs text-foreground-muted mb-4">
        Changes your primary buttons, links, and highlights across the whole app.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {(Object.entries(COLOR_PRESETS) as [ThemeColor, typeof COLOR_PRESETS[ThemeColor]][]).map(([key, preset]) => {
          const isSelected = themeColor === key;
          return (
            <button
              key={key}
              onClick={() => setThemeColor(key)}
              title={preset.label}
              className={cn(
                'group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md scale-105'
                  : 'border-border hover:border-border-hover hover:scale-105 hover:shadow-sm'
              )}
            >
              {/* Gradient swatch */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full bg-linear-to-br shadow-sm transition-transform duration-200',
                  preset.gradient
                )}
              />
              {/* Check overlay */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
              <span className="text-xs font-medium text-foreground-secondary group-hover:text-foreground transition-colors">
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live preview strip */}
      <div className="mt-5 p-4 rounded-xl bg-background-secondary border border-border">
        <p className="text-xs text-foreground-muted mb-3 font-medium uppercase tracking-wider">Preview</p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer">
            Primary Button
          </button>
          <button className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors cursor-pointer">
            Outline Button
          </button>
          <span className="text-sm text-primary font-medium">Link style</span>
          <div className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-full bg-linear-to-br', COLOR_PRESETS[themeColor].gradient)} />
            <span className="text-xs text-foreground-muted">{COLOR_PRESETS[themeColor].label} accent active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <BackButton href="/dashboard" label="Back" />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-foreground-muted mt-1">
          Personalise your experience. Changes save instantly.
        </p>
      </div>

      {/* Profile Section */}
      <SettingsSection
        title="Profile"
        description="Your public profile information"
        icon={<User className="h-4 w-4" />}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Manage your public profile, portfolio items, achievements, and academic grades in the dedicated profile editor.
          </p>
          <Link
            href="/settings/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
          >
            Open Profile Editor
          </Link>
        </div>
      </SettingsSection>

      {/* Role Management Section */}
      <SettingsSection
        title="Role Management"
        description="Switch your role to access different features"
        icon={<UserCog className="h-4 w-4" />}
      >
        <RoleUpgradeForm />
      </SettingsSection>

      {/* Appearance Section */}
      <SettingsSection
        title="Appearance"
        description="Customise how the app looks and feels"
        icon={<Palette className="h-4 w-4" />}
      >
        <ThemeModeToggle />
        <ColorPalettePicker />
      </SettingsSection>
    </div>
  );
}