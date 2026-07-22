// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Subject → Exam Board Mapping
// Pure utility. Builds a mapping from subject IDs to the exam boards that
// offer each subject. Derived entirely from existing curricula + subjects data.
// No backend/DB changes needed.
// ──────────────────────────────────────────────────────────────────────────────

import type { CurriculumSummary, SubjectSummary } from '@/hooks/useCourseManager';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SubjectBoardEntry {
  id: string;
  title: string;
  examBoards: string[];       // sorted alphabetically, unique
  examBoardSet: Set<string>;  // for fast lookups
}

export interface BoardMatchResult {
  board: string;
  matchCount: number;
  totalSelected: number;
}

export interface FindBoardsResult {
  boards: BoardMatchResult[]; // sorted by matchCount desc, then alphabetically
  errors: string[];
}

export interface ValidationResult {
  valid: string[];
  invalid: string[];
}

// ── Build mapping ────────────────────────────────────────────────────────────

/**
 * Build a Map<subjectId, SubjectBoardEntry> from curricula and their subjects.
 * Uses the existing getSubjectsForCurriculum() callback to access subjects
 * without modifying any hook internals.
 */
export function buildSubjectBoardMap(
  curriculums: CurriculumSummary[],
  getSubjects: (curriculumId: string) => SubjectSummary[],
): Map<string, SubjectBoardEntry> {
  const map = new Map<string, SubjectBoardEntry>();

  for (const curriculum of curriculums) {
    const board = curriculum.exam_board;
    if (!board) continue;

    const subjects = getSubjects(curriculum.id);
    for (const subject of subjects) {
      const existing = map.get(subject.id);
      if (existing) {
        existing.examBoardSet.add(board);
      } else {
        map.set(subject.id, {
          id: subject.id,
          title: subject.title,
          examBoardSet: new Set([board]),
          examBoards: [], // will be sorted below
        });
      }
    }
  }

  // Sort examBoards arrays
  for (const entry of map.values()) {
    entry.examBoards = Array.from(entry.examBoardSet).sort();
  }

  return map;
}

// ── Validate subject IDs ─────────────────────────────────────────────────────

/**
 * Check which subject IDs exist in the mapping and which don't.
 * Returns { valid: string[], invalid: string[] }
 */
export function validateSubjectIds(
  ids: string[],
  map: Map<string, SubjectBoardEntry>,
): ValidationResult {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of ids) {
    if (map.has(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}

// ── Find boards for subjects ─────────────────────────────────────────────────

/**
 * Find all exam boards that support the given subject IDs.
 * Only boards that support ALL selected subjects are returned (intersection).
 * Results sorted by matchCount descending, then alphabetically by board name.
 * If any selected IDs are not in the map, they are returned in `errors`.
 */
export function findBoardsForSubjects(
  selectedIds: string[],
  map: Map<string, SubjectBoardEntry>,
): FindBoardsResult {
  const errors: string[] = [];
  const boardCounts = new Map<string, number>();
  const totalSelected = selectedIds.length;

  // Validate first — collect invalid IDs
  const invalidIds = selectedIds.filter(id => !map.has(id));
  if (invalidIds.length > 0) {
    // Still compute what we can from valid IDs
    const validIds = selectedIds.filter(id => map.has(id));
    for (const id of validIds) {
      const entry = map.get(id)!;
      for (const board of entry.examBoardSet) {
        boardCounts.set(board, (boardCounts.get(board) ?? 0) + 1);
      }
    }
    errors.push(...invalidIds);
  } else {
    // All valid — compute normally
    for (const id of selectedIds) {
      const entry = map.get(id)!;
      for (const board of entry.examBoardSet) {
        boardCounts.set(board, (boardCounts.get(board) ?? 0) + 1);
      }
    }
  }

  // Only include boards that support ALL selected (valid) subjects
  const validCount = selectedIds.length - errors.length;
  const boards: BoardMatchResult[] = [];

  for (const [board, count] of boardCounts) {
    if (count >= validCount) {
      boards.push({ board, matchCount: count, totalSelected });
    }
  }

  // Sort: highest matchCount first, then alphabetically
  boards.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return a.board.localeCompare(b.board);
  });

  return { boards, errors };
}
