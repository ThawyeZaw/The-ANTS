// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Shared Timezone Constants
// ──────────────────────────────────────────────────────────────────────────────

export interface TimezoneEntry {
  value: string;
  label: string;
  offset: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatOffset(tz: string): string {
  try {
    const offsetMinutes = new Date()
      .toLocaleDateString('en-US', { timeZone: tz, timeZoneName: 'shortOffset' } as Intl.DateTimeFormatOptions)
      .split(', ')[1];
    if (offsetMinutes) return `(GMT${offsetMinutes})`;
  } catch {
    // fall through
  }
  return '';
}

function makeLabel(tz: string): string {
  const city = tz.replace(/_/g, ' ').split('/').pop() ?? tz;
  const offset = formatOffset(tz);
  return `${city} — ${tz} ${offset}`.trim();
}

// ── Timezone List ─────────────────────────────────────────────────────────────

export const TIMEZONES: TimezoneEntry[] = [
  { value: 'Asia/Yangon', label: 'Yangon — Asia/Yangon (GMT+6:30)', offset: 'GMT+6:30' },
  { value: 'Asia/Bangkok', label: 'Bangkok — Asia/Bangkok (GMT+7)', offset: 'GMT+7' },
  { value: 'Asia/Singapore', label: 'Singapore — Asia/Singapore (GMT+8)', offset: 'GMT+8' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur — Asia/Kuala_Lumpur (GMT+8)', offset: 'GMT+8' },
  { value: 'Asia/Jakarta', label: 'Jakarta — Asia/Jakarta (GMT+7)', offset: 'GMT+7' },
  { value: 'Asia/Manila', label: 'Manila — Asia/Manila (GMT+8)', offset: 'GMT+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong — Asia/Hong_Kong (GMT+8)', offset: 'GMT+8' },
  { value: 'Asia/Shanghai', label: 'Shanghai — Asia/Shanghai (GMT+8)', offset: 'GMT+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo — Asia/Tokyo (GMT+9)', offset: 'GMT+9' },
  { value: 'Asia/Seoul', label: 'Seoul — Asia/Seoul (GMT+9)', offset: 'GMT+9' },
  { value: 'Asia/Kolkata', label: 'Kolkata — Asia/Kolkata (GMT+5:30)', offset: 'GMT+5:30' },
  { value: 'Asia/Dubai', label: 'Dubai — Asia/Dubai (GMT+4)', offset: 'GMT+4' },
  { value: 'Asia/Riyadh', label: 'Riyadh — Asia/Riyadh (GMT+3)', offset: 'GMT+3' },
  { value: 'Europe/London', label: 'London — Europe/London (GMT+0)', offset: 'GMT+0' },
  { value: 'Europe/Paris', label: 'Paris — Europe/Paris (GMT+1)', offset: 'GMT+1' },
  { value: 'Europe/Berlin', label: 'Berlin — Europe/Berlin (GMT+1)', offset: 'GMT+1' },
  { value: 'America/New_York', label: 'New York — America/New_York (GMT-5)', offset: 'GMT-5' },
  { value: 'America/Chicago', label: 'Chicago — America/Chicago (GMT-6)', offset: 'GMT-6' },
  { value: 'America/Denver', label: 'Denver — America/Denver (GMT-7)', offset: 'GMT-7' },
  { value: 'America/Los_Angeles', label: 'Los Angeles — America/Los_Angeles (GMT-8)', offset: 'GMT-8' },
  { value: 'America/Toronto', label: 'Toronto — America/Toronto (GMT-5)', offset: 'GMT-5' },
  { value: 'Pacific/Auckland', label: 'Auckland — Pacific/Auckland (GMT+12)', offset: 'GMT+12' },
  { value: 'Australia/Sydney', label: 'Sydney — Australia/Sydney (GMT+10)', offset: 'GMT+10' },
  { value: 'Africa/Cairo', label: 'Cairo — Africa/Cairo (GMT+2)', offset: 'GMT+2' },
  { value: 'Africa/Lagos', label: 'Lagos — Africa/Lagos (GMT+1)', offset: 'GMT+1' },
  { value: 'UTC', label: 'UTC (GMT+0)', offset: 'GMT+0' },
];

// ── Default ───────────────────────────────────────────────────────────────────

export const DEFAULT_TIMEZONE = 'Asia/Yangon';

// ── Lookup ────────────────────────────────────────────────────────────────────

export function getTimezoneLabel(tz: string): string {
  return TIMEZONES.find((t) => t.value === tz)?.label ?? tz;
}

export function detectBrowserTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && TIMEZONES.some((t) => t.value === detected)) return detected;
  } catch {
    // ignore
  }
  return DEFAULT_TIMEZONE;
}
