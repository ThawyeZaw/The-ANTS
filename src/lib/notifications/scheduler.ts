// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — In-Process Reminder Scheduler
//
// Runs alongside the Next.js dev server. Polls the cron endpoint every 30
// seconds so timetable/assignment/exam reminders fire automatically in dev
// without needing to manually trigger the cron.
//
// Uses `globalThis` to survive Next.js dev hot reloads (singleton pattern).
// In production, Vercel Cron handles scheduling — this module is a no-op when
// CRON_SECRET is not set.
// ──────────────────────────────────────────────────────────────────────────────

const globalForScheduler = globalThis as unknown as {
  _reminderSchedulerStarted?: boolean;
  _reminderInterval?: ReturnType<typeof setInterval>;
};

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function startReminderScheduler() {
  // Guard: only start once (survives HMR in Next.js dev)
  if (globalForScheduler._reminderSchedulerStarted) return;
  globalForScheduler._reminderSchedulerStarted = true;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn(
      '[scheduler] CRON_SECRET not set — reminders will NOT fire automatically in dev.\n' +
      '  Set CRON_SECRET in .env.local to enable auto-reminders.'
    );
    return;
  }

  const port = process.env.PORT || '3005';
  const url = `http://127.0.0.1:${port}/api/cron/send-notifications?secret=${encodeURIComponent(secret)}`;

  console.log(
    `[scheduler] Auto-reminders enabled — polling every ${POLL_INTERVAL_MS / 1000}s`
  );

  const poll = async () => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.processed > 0) {
        console.log(
          `[scheduler] Fired ${data.sent} reminder(s) ` +
          `(timetable: ${data.bySource?.timetable ?? 0}, ` +
          `assignments: ${data.bySource?.assignments ?? 0}, ` +
          `exams: ${data.bySource?.exams ?? 0})`
        );
      }
    } catch {
      // Silently ignore network errors — will retry next poll
    }
  };

  // Run immediately on start, then every POLL_INTERVAL_MS
  poll();
  globalForScheduler._reminderInterval = setInterval(poll, POLL_INTERVAL_MS);
}

/**
 * Stop the scheduler (useful for tests or graceful shutdown).
 * Not normally needed — the process exit cleans up automatically.
 */
export function stopReminderScheduler() {
  if (globalForScheduler._reminderInterval) {
    clearInterval(globalForScheduler._reminderInterval);
    globalForScheduler._reminderInterval = undefined;
  }
  globalForScheduler._reminderSchedulerStarted = false;
}
