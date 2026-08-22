'use client';

import { useState, useEffect } from 'react';
import { Globe, Check, ChevronDown, Loader2, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMEZONES, getTimezoneLabel } from '@/constants/timezones';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => Promise<void>;
}

export default function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync draft when saved value changes from outside
  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const hasChanges = draftValue !== value;

  const handleSelect = (tz: string) => {
    setDraftValue(tz);
    setIsOpen(false);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await onChange(draftValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftValue(value);
  };

  const currentLabel = getTimezoneLabel(draftValue);

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Your Timezone</p>
          <p className="text-xs text-foreground-muted mt-0.5">
            Notifications will be scheduled according to your local time.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {saving && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          {saved && <Check className="h-4 w-4 text-success" />}
        </div>
      </div>

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-200 cursor-pointer',
            isOpen
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : hasChanges
                ? 'border-amber-400/60 bg-amber-500/5 hover:border-amber-400'
                : 'border-border bg-background-secondary hover:border-border-hover'
          )}
        >
          <Globe className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            hasChanges ? 'text-amber-500' : 'text-foreground-muted'
          )} />
          <span className="flex-1 text-foreground">{currentLabel}</span>
          {hasChanges && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Unsaved
            </span>
          )}
          <ChevronDown className={cn(
            'h-4 w-4 text-foreground-muted transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        </button>

        {/* Dropdown list */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-background-card shadow-xl animate-fade-in">
              {TIMEZONES.map((tz) => (
                <button
                  key={tz.value}
                  onClick={() => handleSelect(tz.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-150 cursor-pointer',
                    tz.value === draftValue
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-background-secondary'
                  )}
                >
                  <span className="flex-1">{tz.label}</span>
                  {tz.value === draftValue && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Save / Cancel buttons */}
      {hasChanges && (
        <div className="flex items-center gap-2 animate-fade-in">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer',
              saving
                ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-md active:scale-[0.98]'
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Save Timezone
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-foreground-secondary border border-border hover:bg-background-secondary hover:text-foreground transition-all cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      )}

      {/* Live clock preview */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Clock className="h-3 w-3" />
        <span>
          Current local time:{' '}
          {new Date().toLocaleTimeString('en-US', {
            timeZone: draftValue,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
