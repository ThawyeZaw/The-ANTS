/** Syllabus learning objective — stored in topics.subtopics JSON. */
export type SubtopicEntry = {
  code: string;
  title: string;
};

/** Parse one subtopic from DB JSON (legacy string or { code, title }). */
export function parseSubtopicRaw(raw: unknown): SubtopicEntry | null {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^([CE]?\d+\.\d+|\d+\.\d+|[A-Z]\d+)\s+(.+)$/i);
    if (match) return { code: match[1], title: match[2].trim() };
    return { code: '', title: trimmed };
  }
  if (raw && typeof raw === 'object') {
    const o = raw as { code?: string; title?: string };
    const title = (o.title ?? '').trim();
    if (!title && !o.code) return null;
    return { code: (o.code ?? '').trim(), title: title || (o.code ?? '') };
  }
  return null;
}

/** Parse topics.subtopics JSON column. */
export function parseSubtopicsJson(json: string | null | undefined): SubtopicEntry[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseSubtopicRaw).filter((s): s is SubtopicEntry => s !== null);
  } catch {
    return [];
  }
}

/** Stable key for progress tracking — prefer syllabus code when present. */
export function subtopicKey(entry: SubtopicEntry): string {
  return entry.code || entry.title;
}

/** Legacy combined label (pre–Phase 5 string format). */
export function subtopicLegacyLabel(entry: SubtopicEntry): string {
  return entry.code ? `${entry.code} ${entry.title}`.trim() : entry.title;
}

/** Whether a stored completed_subtopics value marks this objective done. */
export function isSubtopicCompleted(entry: SubtopicEntry, completed: string[]): boolean {
  const key = subtopicKey(entry);
  const legacy = subtopicLegacyLabel(entry);
  if (completed.includes(key) || completed.includes(legacy)) return true;
  if (entry.code) {
    return completed.some(
      (c) => c === entry.code || c.startsWith(`${entry.code} `) || c.startsWith(`${entry.code}\t`)
    );
  }
  return false;
}

/** Normalize completed list to keys when reading (optional UI helper). */
export function normalizeCompletedKeys(
  entries: SubtopicEntry[],
  completed: string[]
): string[] {
  const keys = new Set<string>();
  for (const entry of entries) {
    if (isSubtopicCompleted(entry, completed)) keys.add(subtopicKey(entry));
  }
  return [...keys];
}

/** Search filter — matches code (E1.1) or title. */
export function subtopicMatchesSearch(entry: SubtopicEntry, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (entry.code.toLowerCase().includes(q)) return true;
  if (entry.title.toLowerCase().includes(q)) return true;
  return subtopicLegacyLabel(entry).toLowerCase().includes(q);
}
