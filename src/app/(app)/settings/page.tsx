'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Settings Page
// Lets users edit their profile, change their role, and manage notifications.
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { User, UserCog, Bell, Globe } from 'lucide-react';
import Link from 'next/link';
import RoleUpgradeForm from '@/components/settings/RoleUpgradeForm';
import TelegramConnect, { type NotificationPreferences } from '@/components/settings/TelegramConnect';
import TimezoneSelector from '@/components/settings/TimezoneSelector';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
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
    <div className="bg-background-card border border-border rounded-2xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-3 rounded-t-2xl">
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

// ── Main Settings Page ────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <BackButton href="/dashboard" label="Back to Dashboard" />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-foreground-muted mt-1">
          Personalise your experience. Most changes save instantly; timezone changes require clicking <strong>Save</strong>.
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

      {/* Telegram Notifications Section */}
      <SettingsPageInner />

      {/* Role Management Section */}
      <SettingsSection
        title="Role Management"
        description="Switch your role to access different features"
        icon={<UserCog className="h-4 w-4" />}
      >
        <RoleUpgradeForm />
      </SettingsSection>
    </div>
  );
}

// ── Inner component that uses auth/profile hooks ──────────────────────────────

function SettingsPageInner() {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile;

  const handleUpdatePreferences = async (prefs: NotificationPreferences) => {
    if (!user) return;
    await updateProfile({ notificationPreferences: prefs });
  };

  const handleTimezoneChange = async (tz: string) => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('profiles').update({ timezone: tz } as any).eq('id', user.id);
    await updateProfile({});
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Notifications"
        description="Manage your notification preferences"
        icon={<Bell className="h-4 w-4" />}
      >
        <TelegramConnect
          telegramChatId={profile?.telegramChatId ?? null}
          username={profile?.username ?? null}
          notificationPreferences={profile?.notificationPreferences ?? null}
          onUpdatePreferences={handleUpdatePreferences}
        />
      </SettingsSection>

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
