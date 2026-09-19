// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Edexcel IAL Subject Grouping Utility
// ──────────────────────────────────────────────────────────────────────────────

export interface BaseSubject {
  id: string;
  title: string;
  curriculum_id?: string;
  [key: string]: any;
}

export interface GroupedSubject<T extends BaseSubject> {
  /** A virtual parent ID (e.g., 'subj-edx-ial-phys-group') or the original ID */
  id: string;
  /** The grouped parent title (e.g., 'Physics') or the original title */
  title: string;
  /** True if this is a virtual group wrapper */
  isVirtual: boolean;
  /** The actual underlying subjects (papers/units) */
  units: T[];
  /** Optional curriculum ID */
  curriculum_id?: string;
}

const EDEXCEL_IAL_PREFIX = 'subj-edx-ial-';

/**
 * Maps subject IDs to their parent subject group.
 * Matches the prefixes used in target-catalog.md
 */
const IAL_GROUP_MAP: Record<string, string> = {
  pure: 'Mathematics',
  mech: 'Mathematics', // Mechanics also belongs to Math/Further Math, we'll group it under Mathematics by default
  stat: 'Mathematics',
  fmath: 'Further Mathematics',
  dec: 'Mathematics', // Decision Math
  phys: 'Physics',
  chem: 'Chemistry',
  bio: 'Biology',
  it: 'Information Technology',
  cs: 'Computer Science',
  econ: 'Economics',
  biz: 'Business',
  acc: 'Accounting',
  eng: 'English Language',
  lit: 'English Literature',
};

/**
 * Given a raw list of subjects (e.g. from the catalog), this groups
 * Edexcel IAL units into virtual parent subjects. Non-IAL subjects
 * remain ungrouped (isVirtual = false, units = [self]).
 */
export function groupEdexcelIalSubjects<T extends BaseSubject>(subjects: T[]): GroupedSubject<T>[] {
  const result: GroupedSubject<T>[] = [];
  const ialGroups = new Map<string, GroupedSubject<T>>();

  for (const subject of subjects) {
    if (!subject.id.startsWith(EDEXCEL_IAL_PREFIX)) {
      // Non-IAL subject, keep as is
      result.push({
        id: subject.id,
        title: subject.title,
        isVirtual: false,
        units: [subject],
        curriculum_id: subject.curriculum_id,
      });
      continue;
    }

    // It's an Edexcel IAL subject. Extract the prefix.
    // e.g. subj-edx-ial-phys1 -> phys
    const suffix = subject.id.replace(EDEXCEL_IAL_PREFIX, '');
    const prefixMatch = suffix.match(/^[a-z]+/); // matches 'phys' from 'phys1'

    if (!prefixMatch) {
      // Fallback
      result.push({
        id: subject.id,
        title: subject.title,
        isVirtual: false,
        units: [subject],
        curriculum_id: subject.curriculum_id,
      });
      continue;
    }

    const prefix = prefixMatch[0];
    const parentTitle = IAL_GROUP_MAP[prefix] || 'Other Edexcel IAL';
    const groupId = `${EDEXCEL_IAL_PREFIX}${prefix}-group`;

    // Specifically handle Further Mathematics overlap for mech/stat?
    // In target-catalog.md, WME01/WST01 are Math. WME02/WST02 are Further Math.
    // mech1 -> Math, mech2 -> Further Math.
    let finalParentTitle = parentTitle;
    let finalGroupId = groupId;

    if (prefix === 'mech' || prefix === 'stat') {
      const num = suffix.replace(prefix, ''); // '1' or '2'
      if (num === '2') {
        finalParentTitle = 'Further Mathematics';
        finalGroupId = `${EDEXCEL_IAL_PREFIX}fmath-group`;
      } else {
        finalParentTitle = 'Mathematics';
        finalGroupId = `${EDEXCEL_IAL_PREFIX}math-group`;
      }
    } else if (prefix === 'pure') {
      finalParentTitle = 'Mathematics';
      finalGroupId = `${EDEXCEL_IAL_PREFIX}math-group`;
    }

    let group = ialGroups.get(finalGroupId);
    if (!group) {
      group = {
        id: finalGroupId,
        title: finalParentTitle,
        isVirtual: true,
        units: [],
        curriculum_id: subject.curriculum_id,
      };
      ialGroups.set(finalGroupId, group);
      result.push(group); // Push the group wrapper in order of first appearance
    }

    group.units.push(subject);
  }

  // Sort units within each virtual group (e.g., phys1, phys2, phys3...)
  for (const group of ialGroups.values()) {
    group.units.sort((a, b) => a.id.localeCompare(b.id));
  }

  return result;
}
