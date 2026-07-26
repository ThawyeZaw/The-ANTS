'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — TelegramConnect
// Lets users link their Telegram account and choose which notifications to receive.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Send, Check, ExternalLink, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationSection {
  enabled: boolean;
  reminders: number[];
}

export interface NotificationPreferences {
  timetable?: NotificationSection;
  assignments?: NotificationSection;
  exams?: NotificationSection;
  quizzes?: NotificationSection;
}

interface TelegramConnectProps {
  telegramChatId: string | null;
  username: string | null;
  notificationPreferences?: NotificationPreferences | null;
  onUpdatePreferences?: (prefs: NotificationPreferences) => void;
}

// ── Reminder options ──────────────────────────────────────────────────────────

const REMINDER_OPTIONS = [
  { value: 15, label: '15 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
  { value: 4320, label: '3 days before' },
  { value: 10080, label: '1 week before' },
  { value: 43200, label: '1 month before' },
];

const NOTIFICATION_TYPES = [
  {
    key: 'timetable' as const,
    label: 'Timetable Events',
    description: 'Your scheduled classes and study sessions',
    availableReminders: [15, 60],
  },
  {
    key: 'assignments' as const,
    label: 'Assignments',
    description: 'Classroom assignment due dates',
    availableReminders: [60, 1440, 4320, 10080],
  },
  {
    key: 'exams' as const,
    label: 'Exam Countdowns',
    description: 'Upcoming exam dates',
    availableReminders: [1440, 10080, 43200],
  },
  {
    key: 'quizzes' as const,
    label: 'Quizzes',
    description: 'Classroom quiz due dates',
    availableReminders: [60, 1440],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TelegramConnect({
  telegramChatId,
  username,
  notificationPreferences,
  onUpdatePreferences,
}: TelegramConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TheANTS_bot';
  const isConnected = !!telegramChatId;

  const deepLink = username
    ? `https://t.me/${botUsername}?start=${encodeURIComponent(username)}`
    : `https://t.me/${botUsername}`;

  const handleConnect = () => {
    setIsConnecting(true);
    window.open(deepLink, '_blank', 'noopener,noreferrer');
    setTimeout(() => setIsConnecting(false), 2000);
  };

  const toggleNotification = (key: keyof NotificationPreferences) => {
    if (!onUpdatePreferences) return;
    const current = notificationPreferences?.[key];
    const updated: NotificationPreferences = {
      ...notificationPreferences,
      [key]: {
        enabled: !(current?.enabled ?? false),
        reminders: current?.reminders ?? [],
      },
    };
    onUpdatePreferences(updated);
  };

  const toggleReminder = (key: keyof NotificationPreferences, minutes: number) => {
    if (!onUpdatePreferences) return;
    const current = notificationPreferences?.[key];
    const reminders = current?.reminders ?? [];
    const updated: NotificationPreferences = {
      ...notificationPreferences,
      [key]: {
        enabled: current?.enabled ?? false,
        reminders: reminders.includes(minutes)
          ? reminders.filter((r) => r !== minutes)
          : [...reminders, minutes].sort((a, b) => a - b),
      },
    };
    onUpdatePreferences(updated);
  };

  return (
    <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#0088cc]/10 text-[#0088cc]">
          <Send className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Telegram Alerts</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Receive notifications directly in Telegram
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        {/* Status indicator */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-foreground-muted'
            )}
          />
          <span className="text-sm text-foreground-secondary">
            {isConnected
              ? 'Connected — receiving alerts in Telegram.'
              : 'Not connected — link your Telegram to get started.'}
          </span>
        </div>

        {/* Action button */}
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Your Telegram account is linked.
              </span>
            </div>

            {/* Notification Preferences Toggle */}
            <button
              onClick={() => setShowPrefs(!showPrefs)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background-secondary hover:bg-background-hover transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-foreground-secondary" />
                <span className="text-sm font-medium text-foreground">Notification Preferences</span>
              </div>
              <span className="text-xs text-foreground-muted">
                {showPrefs ? 'Hide' : 'Configure'}
              </span>
            </button>

            {/* Preferences Panel */}
            {showPrefs && (
              <div className="space-y-4 pt-2">
                {NOTIFICATION_TYPES.map((nt) => {
                  const section = notificationPreferences?.[nt.key];
                  const isEnabled = section?.enabled ?? false;
                  const selectedReminders = section?.reminders ?? [];

                  return (
                    <div
                      key={nt.key}
                      className="p-4 rounded-xl border border-border bg-background-secondary/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{nt.label}</p>
                          <p className="text-xs text-foreground-muted">{nt.description}</p>
                        </div>
                        <button
                          onClick={() => toggleNotification(nt.key)}
                          className={cn(
                            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                            isEnabled
                              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                              : 'bg-background-secondary text-foreground-muted border border-border'
                          )}
                        >
                          {isEnabled ? (
                            <>
                              <Bell className="h-3 w-3" /> On
                            </>
                          ) : (
                            <>
                              <BellOff className="h-3 w-3" /> Off
                            </>
                          )}
                        </button>
                      </div>

                      {isEnabled && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {REMINDER_OPTIONS.filter((ro) =>
                            nt.availableReminders.includes(ro.value)
                          ).map((ro) => (
                            <button
                              key={ro.value}
                              onClick={() => toggleReminder(nt.key, ro.value)}
                              className={cn(
                                'px-2 py-1 rounded-md text-xs transition-colors cursor-pointer',
                                selectedReminders.includes(ro.value)
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'bg-background-secondary text-foreground-muted border border-border hover:border-border-hover'
                              )}
                            >
                              {ro.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-foreground-muted">
              To unlink, send <code className="px-1 py-0.5 rounded bg-background-secondary text-xs">/stop</code> to the bot.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {!username && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  Set a username in your profile first before linking Telegram.
                </span>
              </div>
            )}
            <button
              onClick={handleConnect}
              disabled={!username || isConnecting}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm',
                username
                  ? 'bg-[#0088cc] text-white hover:bg-[#0077b5] cursor-pointer'
                  : 'bg-background-secondary text-foreground-muted cursor-not-allowed'
              )}
            >
              <ExternalLink className="h-4 w-4" />
              {isConnecting ? 'Opening Telegram...' : 'Connect Telegram Alerts'}
            </button>
            <p className="text-xs text-foreground-muted">
              Clicking the button will open Telegram. Send the pre-filled{' '}
              <code className="px-1 py-0.5 rounded bg-background-secondary text-xs">/start</code> command
              to the bot to complete linking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
