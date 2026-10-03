const WEB_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://the-ants.org';

const SNOOZE_MINUTES = 15;

export function timetableReminderKeyboard(sourceId: string) {
  return {
    inline_keyboard: [
      [
        { text: 'Open timetable', url: `${WEB_ORIGIN}/timetable` },
        {
          text: `Snooze ${SNOOZE_MINUTES}m`,
          callback_data: `snooze:timetable:${sourceId.slice(0, 36)}`,
        },
      ],
    ],
  };
}

export function examReminderKeyboard(sourceId: string) {
  return {
    inline_keyboard: [
      [
        { text: 'Open countdowns', url: `${WEB_ORIGIN}/countdown` },
        {
          text: `Snooze ${SNOOZE_MINUTES}m`,
          callback_data: `snooze:exam:${sourceId.slice(0, 36)}`,
        },
      ],
    ],
  };
}

export { SNOOZE_MINUTES as TELEGRAM_REMINDER_SNOOZE_MINUTES };
