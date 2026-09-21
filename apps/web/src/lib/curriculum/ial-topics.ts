import type { EdexcelIALQualificationSpecification } from '@/lib/grading/ial-structure';

/** Strip a leading syllabus code prefix from a topic name (handles legacy double-prefix rows). */
export function stripIalTopicUnitPrefix(name: string, unitCode: string): string {
  let result = name.trim();
  const esc = unitCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefix = new RegExp(`^${esc}\\s*[-–—]\\s*`, 'i');
  while (prefix.test(result)) {
    result = result.replace(prefix, '').trim();
  }
  return result || name;
}

export function buildIalUnitMetaBySubjectId(
  catalog: { id: string; code: string | null; name: string }[],
  qualificationData?: string | Record<string, unknown> | null
): Map<string, { unitCode: string; unitTitle: string }> {
  const map = new Map<string, { unitCode: string; unitTitle: string }>();

  let spec: EdexcelIALQualificationSpecification | null = null;
  if (qualificationData) {
    try {
      const parsed =
        typeof qualificationData === 'string'
          ? JSON.parse(qualificationData)
          : qualificationData;
      spec = parsed as EdexcelIALQualificationSpecification;
    } catch {
      spec = null;
    }
  }

  if (spec?.availableUnits) {
    for (const unit of spec.availableUnits) {
      if (unit.subjectId) {
        map.set(unit.subjectId, { unitCode: unit.unitCode, unitTitle: unit.unitTitle });
      }
    }
  }

  for (const row of catalog) {
    if (!row.code || map.has(row.id)) continue;
    map.set(row.id, { unitCode: row.code, unitTitle: row.name });
  }

  return map;
}
