'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — TelegramConnect
// Lets users link their Telegram account and choose which notifications to receive.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Send, Check, ExternalLink, Bell, BellOff, Copy, CheckCheck, MessageSquareCheck, RefreshCw } from 'lucide-react';
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
  { value: 0, label: 'On time' },
  { value: 10, label: '10 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
  { value: 4320, label: '3 days before' },
  { value: 10080, label: '1 week before' },
];

const NOTIFICATION_TYPES = [
  {
    key: 'timetable' as const,
    label: 'Timetable Events',
    description: 'Your scheduled classes and study sessions',
    availableReminders: [0, 10, 30, 60, 1440, 4320, 10080],
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
    availableReminders: [1440, 4320, 10080],
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
  const [copied, setCopied] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TheANTS_bot';
  const isConnected = !!telegramChatId;

  const startCommand = `/start ${username ?? 'your_username'}`;

  const deepLink = username
    ? `https://t.me/${botUsername}?start=${encodeURIComponent(username)}`
    : `https://t.me/${botUsername}`;

  const handleConnect = () => {
    setIsConnecting(true);
    window.open(deepLink, '_blank', 'noopener,noreferrer');
    setTimeout(() => setIsConnecting(false), 2000);
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(startCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = startCommand;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestNotification = async () => {
    if (!telegramChatId) return;
    setTestState('sending');
    setTestError(null);
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: telegramChatId }),
      });
      const data = await res.json();
      if (data.success) {
        setTestState('sent');
        setTimeout(() => setTestState('idle'), 3000);
      } else {
        setTestState('error');
        setTestError(data.error || 'Unknown error');
        setTimeout(() => setTestState('idle'), 5000);
      }
    } catch (err) {
      setTestState('error');
      setTestError(String(err));
      setTimeout(() => setTestState('idle'), 5000);
    }
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
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-border shadow-sm hover:shadow-md hover:border-border-hover transition-all cursor-pointer"
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
                            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm cursor-pointer',
                            isEnabled
                              ? 'bg-gradient-to-r from-green-500/15 to-emerald-500/10 text-green-600 border border-green-500/20 hover:shadow-md'
                              : 'bg-gradient-to-r from-primary/5 to-blue-500/5 text-foreground-secondary border border-border hover:shadow hover:border-border-hover'
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
                                'px-2 py-1 rounded-md text-xs transition-all shadow-sm cursor-pointer',
                                selectedReminders.includes(ro.value)
                                  ? 'bg-gradient-to-r from-primary/15 to-primary/10 text-primary border border-primary/20 hover:shadow-md'
                                  : 'bg-gradient-to-r from-primary/5 to-blue-500/5 text-foreground-secondary border border-border hover:shadow hover:border-border-hover'
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

            {/* Test Notification Button */}
            <button
              onClick={handleTestNotification}
              disabled={testState === 'sending'}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all shadow-sm cursor-pointer',
                testState === 'sent'
                  ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-600 shadow-green-500/5'
                  : testState === 'error'
                    ? 'bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/20 text-red-600'
                    : 'bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/15 hover:shadow-md hover:border-primary/25 text-primary'
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquareCheck className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {testState === 'sending'
                    ? 'Sending...'
                    : testState === 'sent'
                      ? 'Test sent! Check Telegram.'
                      : testState === 'error'
                        ? 'Test failed — see below'
                        : 'Send Test Notification'}
                </span>
              </div>
            </button>

            {testState === 'error' && testError && (
              <p className="text-xs text-red-500 px-1">{testError}</p>
            )}

            <p className="text-xs text-foreground-muted">
              To unlink, send <code className="px-1 py-0.5 rounded bg-background-secondary text-xs">/stop</code> to the bot.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {!username ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  Set a username in your profile first before linking Telegram.
                </span>
              </div>
            ) : (
              <>
                {/* Step-by-step setup card */}
                <div className="p-4 rounded-xl bg-background-secondary border border-border space-y-4">
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2">
                      How to link
                    </p>
                    <ol className="space-y-2 text-sm text-foreground-secondary">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                          1
                        </span>
                        <span>
                          Open{' '}
                          <a
                            href={`https://t.me/${botUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            @{botUsername}
                          </a>{' '}
                          on Telegram
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                          2
                        </span>
                        <span>
                          Send this command to the bot:
                        </span>
                      </li>
                    </ol>
                  </div>

                  {/* Copyable command */}
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2.5 rounded-lg bg-background text-sm font-mono text-foreground border border-border select-all">
                      {startCommand}
                    </code>
                    <button
                      onClick={handleCopyCommand}
                      className="flex-shrink-0 p-2.5 rounded-lg bg-[#0088cc] text-white hover:bg-[#0077b5] transition-colors cursor-pointer shadow-sm"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCheck className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Your username display */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border">
                    <span className="text-xs text-foreground-muted">Your username:</span>
                    <code className="text-sm font-mono font-medium text-foreground">@{username}</code>
                  </div>

                  <p className="text-xs text-foreground-muted">
                    After sending the command, the bot will reply with a confirmation. Come back here — the status indicator should turn green.
                  </p>
                </div>

                {/* One-click button */}
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-[#0088cc] to-[#0099e6] text-white hover:from-[#0077b5] hover:to-[#0088cc] cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  {isConnecting ? 'Opening Telegram...' : 'Open @' + botUsername + ' on Telegram'}
                </button>

                <button
                  onClick={() => window.open(deepLink, '_blank', 'noopener,noreferrer')}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs text-foreground-muted hover:text-foreground-secondary transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  One-click link (opens bot with /start prefilled)
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
