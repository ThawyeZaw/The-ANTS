'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Settings Page
// Manage profile link, Telegram notifications, and timezone.
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { User, Bell, Globe } from 'lucide-react';
import Link from 'next/link';
import TelegramConnect, { type NotificationPreferences } from '@/components/settings/TelegramConnect';
import TimezoneSelector from '@/components/settings/TimezoneSelector';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_TIMEZONE } from '@/constants/timezones';

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
    <div className="bg-background-card border border-border rounded-2xl shadow-xs">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-3 rounded-t-2xl">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-sm text-foreground">{title}</h2>
          <p className="text-xs text-foreground-muted mt-0.5">{description}</p>
        </div>
      </div>
      {/* Body */}
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <BackButton href="/dashboard" label="Back to Dashboard" />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-xs text-foreground-muted mt-1">
          Manage your account profile, Telegram notification bot, and regional preferences.
        </p>
      </div>

      {/* Profile Section */}
      <SettingsSection
        title="Profile & Teaching Schedule"
        description="Public profile, username, and weekly availability"
        icon={<User className="h-4 w-4" />}
      >
        <div className="space-y-4">
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Customize your display name, unique username handle, portfolio, achievements, and weekly teaching schedule in the unified editor.
          </p>
          <Link
            href="/settings/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
          >
            Open Profile Editor
          </Link>
        </div>
      </SettingsSection>

      {/* Telegram Notifications & Timezone Section */}
      <SettingsPageInner />
    </div>
  );
}

function SettingsPageInner() {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile;

  const handleUpdatePreferences = async (prefs: NotificationPreferences) => {
    if (!user) return;
    await updateProfile({ notificationPreferences: prefs });
  };

  const handleTimezoneChange = async (tz: string) => {
    if (!user) return;
    await updateProfile({ timezone: tz });
  };

  return (
    <div className="space-y-6">
      {/* Telegram Section */}
      <SettingsSection
        title="Telegram Notifications"
        description="Real-time alerts for study reminders and weekly timetables"
        icon={<Bell className="h-4 w-4" />}
      >
        <TelegramConnect
          telegramChatId={profile?.telegramChatId ?? null}
          username={profile?.username ?? null}
          notificationPreferences={profile?.notificationPreferences ?? null}
          onUpdatePreferences={handleUpdatePreferences}
        />
      </SettingsSection>

      {/* Timezone Section */}
      <SettingsSection
        title="Timezone"
        description="Set your local timezone for notification scheduling"
        icon={<Globe className="h-4 w-4" />}
      >
        <TimezoneSelector
          value={profile?.timezone ?? DEFAULT_TIMEZONE}
          onChange={handleTimezoneChange}
        />
      </SettingsSection>
    </div>
  );
}
