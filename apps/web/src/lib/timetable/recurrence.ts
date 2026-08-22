import type { TimetableEvent, RecurrenceRule } from '@/types/timetable';

/**
 * Expands a recurring event into concrete instances within [rangeStart, rangeEnd].
 * Returns an array of concrete TimetableEvent objects with unique ids (suffixed by date).
 * If non-recurring or outside the date range, returns [] so past/future events don't bleed.
 */
export function expandRecurringEvents(
  event: TimetableEvent,
  rangeStart: Date,
  rangeEnd: Date
): TimetableEvent[] {
  // If not recurring, return event ONLY if its start_time/end_time falls in [rangeStart, rangeEnd]
  if (!event.is_recurring || !event.recurrence_rule) {
    const anchorStr = event.start_time || event.end_time;
    if (!anchorStr && !event.all_day) return [];
    if (!anchorStr && event.all_day) return [event];

    const d = new Date(anchorStr!);
    if (d >= rangeStart && d <= rangeEnd) {
      return [event];
    }
    return [];
  }

  const rule = event.recurrence_rule;
  const originalStart = event.start_time ? new Date(event.start_time) : null;
  const originalEnd = event.end_time ? new Date(event.end_time) : null;
  if (!originalStart && !event.all_day) return [];

  const duration = originalStart && originalEnd
    ? originalEnd.getTime() - originalStart.getTime()
    : 0;

  const ruleEnd = rule.end_date ? new Date(rule.end_date) : null;
  const effectiveEnd = ruleEnd && ruleEnd < rangeEnd ? ruleEnd : rangeEnd;

  // Start evaluating from rangeStart (00:00:00 local time)
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
  const rangeEndClean = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate(), 23, 59, 59, 999);

  const results: TimetableEvent[] = [];
  let iterations = 0;

  // Determine target days of week for weekly events
  const origDay = originalStart ? originalStart.getDay() : 1;
  let targetDaysOfWeek: number[];

  if (rule.frequency === 'weekly') {
    if (rule.days_of_week && rule.days_of_week.length > 0) {
      // If single day specified and mismatches original start day, auto-heal to original start day
      if (rule.days_of_week.length === 1 && originalStart && rule.days_of_week[0] !== origDay) {
        targetDaysOfWeek = [origDay];
      } else {
        targetDaysOfWeek = rule.days_of_week;
      }
    } else {
      targetDaysOfWeek = [origDay];
    }
  } else {
    targetDaysOfWeek = [origDay];
  }

  while (cursor <= rangeEndClean && iterations < 500) {
    iterations++;

    // Do not generate instances BEFORE originalStart date
    if (originalStart) {
      const origDateNoTime = new Date(originalStart.getFullYear(), originalStart.getMonth(), originalStart.getDate());
      if (cursor < origDateNoTime) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    }

    let matches = false;
    const dayOfWeek = cursor.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

    switch (rule.frequency) {
      case 'daily': {
        const interval = rule.interval || 1;
        if (originalStart) {
          const origDate = new Date(originalStart.getFullYear(), originalStart.getMonth(), originalStart.getDate());
          const diffDays = Math.round((cursor.getTime() - origDate.getTime()) / (86400 * 1000));
          if (diffDays >= 0 && diffDays % interval === 0) {
            matches = true;
          }
        } else {
          matches = true;
        }
        break;
      }

      case 'weekly': {
        if (targetDaysOfWeek.includes(dayOfWeek)) {
          const interval = rule.interval || 1;
          if (interval === 1 || !originalStart) {
            matches = true;
          } else {
            const origWeekStart = getMonday(originalStart);
            const curWeekStart = getMonday(cursor);
            const diffWeeks = Math.round((curWeekStart.getTime() - origWeekStart.getTime()) / (7 * 86400 * 1000));
            if (diffWeeks >= 0 && diffWeeks % interval === 0) {
              matches = true;
            }
          }
        }
        break;
      }

      case 'monthly': {
        const interval = rule.interval || 1;
        if (originalStart) {
          if (cursor.getDate() === originalStart.getDate()) {
            const diffMonths = (cursor.getFullYear() - originalStart.getFullYear()) * 12 + (cursor.getMonth() - originalStart.getMonth());
            if (diffMonths >= 0 && diffMonths % interval === 0) {
              matches = true;
            }
          }
        }
        break;
      }

      case 'custom': {
        const interval = rule.interval || 1;
        if (originalStart) {
          const origDate = new Date(originalStart.getFullYear(), originalStart.getMonth(), originalStart.getDate());
          const diffDays = Math.round((cursor.getTime() - origDate.getTime()) / (86400 * 1000));
          if (diffDays >= 0 && diffDays % interval === 0) {
            matches = true;
          }
        }
        break;
      }
    }

    if (matches && cursor <= rangeEndClean) {
      const instanceStart = new Date(cursor);
      if (originalStart) {
        instanceStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), 0);
      }
      const instanceEnd = duration > 0 ? new Date(instanceStart.getTime() + duration) : null;

      const dateStr = formatDateISO(instanceStart);
      const isOriginalDate = originalStart && formatDateISO(originalStart) === dateStr;
      const instanceId = isOriginalDate ? event.id : `${event.id}::${dateStr}`;

      results.push({
        ...event,
        id: instanceId,
        start_time: event.start_time ? instanceStart.toISOString() : null,
        end_time: event.end_time && instanceEnd ? instanceEnd.toISOString() : null,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
