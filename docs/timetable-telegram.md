# Timetable & Telegram reminders

> Product + ops notes for the Smart Timetable and notification queue.

## Views

| View | Role |
|---|---|
| **Tasks** (`list`) | Cross-day task list (overdue / today / week / later) |
| **Week** (default) | Time-blocking grid; drag to reschedule; resize duration; click empty slot to quick-add |
| **Day** | Daily task planner (to-do + timed sections) |
| **Month** | Calendar overview |

**Today Focus** panel appears beside Week and Tasks. Exam countdowns sync into the timetable (`event_source: exam_countdown`) and can be edited or removed; toggle via ⋮ → Show exams.

## Telegram reminder pipeline

```
Create/update/move event (apps/web actions/timetable.ts)
  → actionEnqueueTimetableReminders (actions/notifications.ts)
  → notification_queue (pending, scheduled_for)
  → API Worker cron */5 * * * * (apps/api scheduled)
  → processNotificationQueue → Telegram sendMessage
```

### Reminder precedence

1. Per-event `reminder_minutes` **≥ 0** → that offset only  
2. Per-event `-1` → off for this event (clears pending queue rows)  
3. Per-event `null` / unset → Settings timetable prefs (`profiles.notification_preferences.timetable`), else **15 minutes**  
4. Settings `timetable.enabled === false` and no per-event override → no enqueue  

New events default to **15 minutes**. Existing events are **not** backfilled; re-save to schedule.

### Requirements

- User linked Telegram (`profiles.telegram_chat_id`)
- `TELEGRAM_BOT_TOKEN` on API Worker (and web if local nudge / webhook)
- Cron enabled on `the-ants-api` (`triggers.crons: ["*/5 * * * *"]`)

### Verify

1. Settings → connect bot → Send test (immediate).  
2. Timetable → create a timed event ~10–15 min ahead with reminder on.  
3. Within ~5 minutes of `scheduled_for`, expect Telegram “TIMETABLE REMINDER”.  
4. Optional: `POST https://api.the-ants.org/api/cron/process-queue` with `x-cron-secret`.

Related: [`ARCHITECTURE.md`](../../ARCHITECTURE.md) Feature Fast Lookup · [`cloudflare.md`](../migration/cloudflare.md) notification story.
