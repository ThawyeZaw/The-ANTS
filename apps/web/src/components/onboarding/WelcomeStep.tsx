'use client';

import { useState } from 'react';
import { Hand, Globe, User, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Input from '@/components/ui/Input';
import { TIMEZONES } from '@/constants/timezones';
import { FeatureGrid } from './FeatureGrid';

interface WelcomeStepProps {
  preferredName: string;
  onPreferredNameChange: (value: string) => void;
  timezone: string;
  onTimezoneChange: (value: string) => void;
  firstName?: string;
}

export function WelcomeStep({
  preferredName,
  onPreferredNameChange,
  timezone,
  onTimezoneChange,
  firstName,
}: WelcomeStepProps) {
  const [tzOpen, setTzOpen] = useState(false);
  const [tzSearch, setTzSearch] = useState('');

  const filteredTimezones = TIMEZONES.filter((tz) =>
    tz.value.toLowerCase().includes(tzSearch.toLowerCase()) ||
    tz.label.toLowerCase().includes(tzSearch.toLowerCase())
  );

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:mb-4 sm:h-14 sm:w-14">
          <Hand className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
          Hi {firstName ?? 'there'}, welcome to{' '}
          <span className="font-brand">The ANTs</span>
        </h1>
        <p className="text-sm text-foreground-muted sm:text-base">
          Built for Myanmar students sitting Cambridge and Edexcel exams. Set up your
          study plan — every step is optional.
        </p>
      </div>

      {/* Profile fields first so name + Continue stay above the fold */}
      <div className="space-y-4 rounded-2xl border border-border bg-background-card p-4 shadow-sm sm:space-y-5 sm:p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <User className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your profile</p>
            <p className="text-xs text-foreground-muted">Optional — you can change this later</p>
          </div>
        </div>

        <Input
          label="Preferred name (optional)"
          type="text"
          placeholder="What should we call you?"
          value={preferredName}
          onChange={(e) => onPreferredNameChange(e.target.value)}
          icon={<User className="h-4 w-4" />}
          id="onboarding-preferred-name"
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="onboarding-timezone">
            Timezone <span className="font-normal text-foreground-muted">(optional)</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTzOpen(!tzOpen)}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-background-secondary px-4 py-2.5 text-sm transition-all',
                'hover:border-border-hover focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
              id="onboarding-timezone"
            >
              <span className="flex items-center gap-2 text-foreground">
                <Globe className="h-4 w-4 text-foreground-muted" />
                {timezone
                  ? (TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone)
                  : (
                    <span className="text-foreground-muted">Select timezone</span>
                  )}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-foreground-muted transition-transform',
                  tzOpen && 'rotate-180'
                )}
              />
            </button>

            {tzOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-background-card shadow-lg">
                <div className="border-b border-border p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                    <input
                      type="text"
                      placeholder="Search timezone…"
                      value={tzSearch}
                      onChange={(e) => setTzSearch(e.target.value)}
                      className="w-full rounded-lg border-none bg-background-secondary py-1.5 pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-foreground-muted"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredTimezones.map((tz) => (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => {
                        onTimezoneChange(tz.value);
                        setTzOpen(false);
                        setTzSearch('');
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm transition-colors hover:bg-background-secondary',
                        timezone === tz.value
                          ? 'font-medium text-primary'
                          : 'text-foreground'
                      )}
                    >
                      {tz.label}
                    </button>
                  ))}
                  {filteredTimezones.length === 0 && (
                    <p className="py-4 text-center text-sm text-foreground-muted">No results</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-foreground-muted">
            Exam times display in Myanmar time (MMT). Your timezone is used for Telegram reminders.
          </p>
        </div>
      </div>

      <FeatureGrid />
    </div>
  );
}
