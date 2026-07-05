const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.md');
let content = fs.readFileSync(schemaPath, 'utf8');

const oldSection = `## Table \`timetable_events\`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| \`id\` | \`uuid\` | Primary |
| \`user_id\` | \`uuid\` |  |
| \`title\` | \`text\` |  |
| \`event_type\` | \`text\` |  Nullable |
| \`start_time\` | \`timestamp\` |  Nullable |
| \`end_time\` | \`timestamp\` |  Nullable |
| \`all_day\` | \`bool\` |  Nullable |
| \`is_recurring\` | \`bool\` |  Nullable |
| \`recurrence_pattern\` | \`jsonb\` |  Nullable |
| \`color_code\` | \`text\` |  Nullable |
| \`metadata\` | \`jsonb\` |  Nullable |
| \`created_at\` | \`timestamp\` |  Nullable |`;

const newSection = `## Table \`timetable_events\`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| \`id\` | \`uuid\` | Primary |
| \`user_id\` | \`uuid\` | FK → profiles.id |
| \`title\` | \`text\` | |
| \`description\` | \`text\` | Nullable |
| \`event_type\` | \`text\` | Nullable |
| \`subject\` | \`text\` | Nullable |
| \`location\` | \`text\` | Nullable |
| \`start_time\` | \`timestamp\` | Nullable |
| \`end_time\` | \`timestamp\` | Nullable |
| \`all_day\` | \`bool\` | Default: false |
| \`is_recurring\` | \`bool\` | Default: false |
| \`recurrence_rule\` | \`jsonb\` | Nullable |
| \`color_code\` | \`text\` | Nullable |
| \`is_todo\` | \`bool\` | Default: false |
| \`is_completed\` | \`bool\` | Default: false |
| \`completed_at\` | \`timestamp\` | Nullable |
| \`event_source\` | \`text\` | Default: 'user' |
| \`source_id\` | \`text\` | Nullable |
| \`metadata\` | \`jsonb\` | Nullable |
| \`created_at\` | \`timestamp\` | Nullable |

> **\`event_type\` values:** \`"study"\` | \`"class"\` | \`"school"\` | \`"gym"\` | \`"exam"\` | \`"break"\` | \`"deadline"\` | \`"club_event"\`

> **\`event_source\` values:** \`"user"\` (default, user-created) | \`"exam_countdown"\` (sourced from exam_countdowns) | \`"assignment"\` (sourced from assignments) | \`"club_event"\` (sourced from club_events) | \`"club_milestone"\` (sourced from club_milestones). Events with a non-\`"user"\` source are **read-only** on the timetable — they cannot be moved or deleted via the timetable UI.

> **\`recurrence_rule\` JSONB structure:** \`{ frequency: ("daily" | "weekly" | "monthly" | "custom"), interval: number, days_of_week?: number[] (0=Sun…6=Sat, for weekly), end_date?: string | null }\`. Example — every Monday: \`{ frequency: "weekly", interval: 1, days_of_week: [1] }\`. Every 2 weeks: \`{ frequency: "custom", interval: 14 }\`.

> **Integration note:** External events from \`exam_countdowns\`, \`assignments\`, \`club_events\`, and \`club_milestones\` are **not stored** in \`timetable_events\`. They are computed at query time by \`getIntegratedTimetableEvents()\` in the database facade and merged into the calendar view as virtual read-only events. This avoids duplication and ensures changes to the source entity are immediately reflected in the timetable.`;

// Normalize line endings for comparison
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = oldSection.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedOld)) {
  const patched = normalizedContent.replace(normalizedOld, newSection);
  fs.writeFileSync(schemaPath, patched.replace(/\n/g, '\r\n'), 'utf8');
  console.log('SUCCESS: schema.md patched successfully');
} else {
  console.log('WARNING: Could not find exact match. Trying fuzzy match...');
  // Try to find the section by key markers
  const startMarker = '## Table `timetable_events`';
  const endMarker = '\r\n---\r\n\r\n## Table `pomodoro_sessions`';
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start !== -1 && end !== -1) {
    const patched = content.slice(0, start) + newSection + '\r\n\r\n---\r\n\r\n## Table `pomodoro_sessions`' + content.slice(end + endMarker.length);
    fs.writeFileSync(schemaPath, patched, 'utf8');
    console.log('SUCCESS: schema.md patched via fuzzy match');
  } else {
    console.log('FAILED: Could not patch schema.md. Start:', start, 'End:', end);
  }
}
