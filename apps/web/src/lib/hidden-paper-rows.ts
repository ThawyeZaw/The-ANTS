/** Client-side hidden past-paper grid rows (per workspace subject id). */

const PREFIX = 'ants-hidden-paper-rows:';

export function hiddenRowsStorageKey(workspaceSubjectId: string): string {
  return `${PREFIX}${workspaceSubjectId || 'none'}`;
}

export function loadHiddenRowKeys(workspaceSubjectId: string): Set<string> {
  if (typeof window === 'undefined' || !workspaceSubjectId) return new Set();
  try {
    const raw = window.localStorage.getItem(hiddenRowsStorageKey(workspaceSubjectId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((k): k is string => typeof k === 'string'));
  } catch {
    return new Set();
  }
}

export function saveHiddenRowKeys(workspaceSubjectId: string, keys: Set<string>): void {
  if (typeof window === 'undefined' || !workspaceSubjectId) return;
  try {
    window.localStorage.setItem(
      hiddenRowsStorageKey(workspaceSubjectId),
      JSON.stringify([...keys])
    );
  } catch {
    // ignore quota / private mode
  }
}

export function paperRowHideKey(row: {
  rowKey?: string;
  paperNumber: string;
  variant: string | null;
}): string {
  return row.rowKey || `${row.paperNumber}-${row.variant ?? ''}`;
}
