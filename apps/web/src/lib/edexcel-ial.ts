// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Edexcel IAL Subject Grouping Utility
// ──────────────────────────────────────────────────────────────────────────────

export interface BaseSubject {
  id: string;
  title?: string;
  name?: string;
  code?: string;
  curriculum_id?: string;
  color_code?: string | null;
  description?: string | null;
  topicCount?: number;
  completedTopics?: number;
  paperCount?: number;
  completedPapers?: number;
  isEnrolled?: boolean;
  subject_type?: string | null;
  qualification_data?: any;
  [key: string]: any;
}

export interface GroupedSubject<T extends BaseSubject> {
  /** A virtual parent ID (e.g., 'subj-edx-ial-phys-group') or the original ID */
  id: string;
  /** The grouped parent title (e.g., 'Physics', 'Mathematics') or the original title */
  title: string;
  /** Standard syllabus code or range (e.g., 'WAC11–WAC12', 'WBI11–WBI16', 'XMA01 / YMA01') */
  code: string;
  /** True if this is a virtual group wrapper */
  isVirtual: boolean;
  /** The actual underlying subjects (papers/units) */
  units: T[];
  /** Optional curriculum ID */
  curriculum_id?: string;
  /** True for subjects with optional units (like Mathematics and Further Mathematics) */
  hasOptionalUnits: boolean;
  /** Target subject ID to open on navigation (e.g. 'subj-edx-ial-maths-suite' or unit 1) */
  primarySubjectId: string;
  /** Aesthetic theme color for the subject */
  color_code: string;
  /** Description */
  description?: string | null;
  /** Aggregated topic count */
  topicCount: number;
  /** Aggregated completed topics count */
  completedTopics: number;
  /** Aggregated past paper count */
  paperCount: number;
  /** Aggregated completed past papers count */
  completedPapers: number;
  /** True if enrolled in this subject (any or all required units) */
  isEnrolled: boolean;
  /** Number of enrolled units in this subject */
  enrolledUnitsCount: number;
  /** Optional qualification data (from maths suite parent) */
  qualification_data?: any;
}

const EDEXCEL_IAL_PREFIX = 'subj-edx-ial-';

/**
 * Maps subject IDs to their parent subject group.
 * Matches the prefixes used in target-catalog.md
 */
const IAL_GROUP_MAP: Record<string, string> = {
  pure:  'Mathematics',
  mech:  'Mathematics', // Mechanics: mech1 → Math, mech2/3 → Further Math
  stat:  'Mathematics', // Statistics: stat1 → Math, stat2/3 → Further Math
  dec:   'Mathematics', // Decision Mathematics → Math group
  fmath: 'Further Mathematics',
  phys:  'Physics',
  chem:  'Chemistry',
  bio:   'Biology',
  it:    'Information Technology',
  cs:    'Computer Science',
  econ:  'Economics',
  biz:   'Business',
  acc:   'Accounting',
  eng:   'English Language',
  lit:   'English Literature',
  psych: 'Psychology',
};

const IAL_SUBJECT_META: Record<string, { code: string; color: string; hasOptional: boolean; order: number }> = {
  'Mathematics':            { code: 'XMA01 / YMA01', color: '#f59e0b', hasOptional: true,  order: 1 },
  'Further Mathematics':    { code: 'XFM01 / YFM01', color: '#8b5cf6', hasOptional: true,  order: 2 },
  'Physics':                { code: 'WPH11–WPH16',   color: '#3b82f6', hasOptional: false, order: 3 },
  'Chemistry':              { code: 'WCH11–WCH16',   color: '#06b6d4', hasOptional: false, order: 4 },
  'Biology':                { code: 'WBI11–WBI16',   color: '#10b981', hasOptional: false, order: 5 },
  'Information Technology': { code: 'WIT11–WIT14',   color: '#0ea5e9', hasOptional: false, order: 6 },
  'Computer Science':       { code: 'WCP01–WCP04',   color: '#6366f1', hasOptional: false, order: 7 },
  'Economics':              { code: 'WEC11–WEC14',   color: '#14b8a6', hasOptional: false, order: 8 },
  'Business':               { code: 'WBS11–WBS14',   color: '#f97316', hasOptional: false, order: 9 },
  'Accounting':             { code: 'WAC11–WAC12',   color: '#eab308', hasOptional: false, order: 10 },
  'English Language':       { code: 'WEN01–WEN04',   color: '#ec4899', hasOptional: false, order: 11 },
  'English Literature':     { code: 'WET01–WET04',   color: '#d946ef', hasOptional: false, order: 12 },
  'Psychology':             { code: 'WPS01–WPS04',   color: '#a855f7', hasOptional: false, order: 13 },
};

/**
 * Subject IDs that represent suite-parent rows (not individual units).
 */
const SUITE_PARENT_IDS = new Set([
  'subj-edx-ial-maths-suite',
]);

/**
 * Given a raw list of subjects (e.g. from the catalog), this groups
 * Edexcel IAL units into virtual parent subjects. Non-IAL subjects
 * remain ungrouped (isVirtual = false, units = [self]).
 */
export function groupEdexcelIalSubjects<T extends BaseSubject>(subjects: T[]): GroupedSubject<T>[] {
  const result: GroupedSubject<T>[] = [];
  const ialGroups = new Map<string, GroupedSubject<T>>();
  let mathsSuiteParent: T | null = null;

  // 1. Separate suite parent from unit subjects
  for (const subject of subjects) {
    if (SUITE_PARENT_IDS.has(subject.id)) {
      mathsSuiteParent = subject;
      continue;
    }

    if (!subject.id.startsWith(EDEXCEL_IAL_PREFIX)) {
      // Non-IAL subject (e.g., CAIE IGCSE, CAIE A Level, Edexcel IGCSE)
      const title = subject.name || subject.title || 'Subject';
      result.push({
        id: subject.id,
        title,
        code: subject.code || '',
        isVirtual: false,
        units: [subject],
        curriculum_id: subject.curriculum_id,
        hasOptionalUnits: false,
        primarySubjectId: subject.id,
        color_code: subject.color_code ?? '#6366f1',
        description: subject.description,
        topicCount: subject.topicCount ?? 0,
        completedTopics: subject.completedTopics ?? 0,
        paperCount: subject.paperCount ?? 0,
        completedPapers: subject.completedPapers ?? 0,
        isEnrolled: Boolean(subject.isEnrolled),
        enrolledUnitsCount: subject.isEnrolled ? 1 : 0,
        qualification_data: subject.qualification_data,
      });
      continue;
    }

    // It's an Edexcel IAL unit subject. Extract prefix.
    const suffix = subject.id.replace(EDEXCEL_IAL_PREFIX, '');
    const prefixMatch = suffix.match(/^[a-z]+/);

    if (!prefixMatch) {
      const title = subject.name || subject.title || 'Subject';
      result.push({
        id: subject.id,
        title,
        code: subject.code || '',
        isVirtual: false,
        units: [subject],
        curriculum_id: subject.curriculum_id,
        hasOptionalUnits: false,
        primarySubjectId: subject.id,
        color_code: subject.color_code ?? '#6366f1',
        description: subject.description,
        topicCount: subject.topicCount ?? 0,
        completedTopics: subject.completedTopics ?? 0,
        paperCount: subject.paperCount ?? 0,
        completedPapers: subject.completedPapers ?? 0,
        isEnrolled: Boolean(subject.isEnrolled),
        enrolledUnitsCount: subject.isEnrolled ? 1 : 0,
        qualification_data: subject.qualification_data,
      });
      continue;
    }

    const prefix = prefixMatch[0];
    const parentTitle = IAL_GROUP_MAP[prefix] || 'Other Edexcel IAL';
    const groupId = `${EDEXCEL_IAL_PREFIX}${prefix}-group`;

    let finalParentTitle = parentTitle;
    let finalGroupId = groupId;

    if (prefix === 'mech' || prefix === 'stat') {
      const num = suffix.replace(prefix, '');
      if (num === '1') {
        finalParentTitle = 'Mathematics';
        finalGroupId = `${EDEXCEL_IAL_PREFIX}math-group`;
      } else {
        // mech2/3, stat2/3 → Further Mathematics
        finalParentTitle = 'Further Mathematics';
        finalGroupId = `${EDEXCEL_IAL_PREFIX}fmath-group`;
      }
    } else if (prefix === 'pure' || prefix === 'dec') {
      finalParentTitle = 'Mathematics';
      finalGroupId = `${EDEXCEL_IAL_PREFIX}math-group`;
    }

    let group = ialGroups.get(finalGroupId);
    if (!group) {
      const meta = IAL_SUBJECT_META[finalParentTitle];
      group = {
        id: finalGroupId,
        title: finalParentTitle,
        code: meta?.code ?? '',
        isVirtual: true,
        units: [],
        curriculum_id: subject.curriculum_id,
        hasOptionalUnits: Boolean(meta?.hasOptional),
        primarySubjectId: subject.id,
        color_code: meta?.color ?? subject.color_code ?? '#f59e0b',
        description: subject.description,
        topicCount: 0,
        completedTopics: 0,
        paperCount: 0,
        completedPapers: 0,
        isEnrolled: false,
        enrolledUnitsCount: 0,
        qualification_data: null,
      };
      ialGroups.set(finalGroupId, group);
    }

    group.units.push(subject);
  }

  // 2. Attach maths suite parent metadata and aggregate metrics
  for (const group of ialGroups.values()) {
    // Sort units within group naturally
    group.units.sort((a, b) => (a.code || a.id).localeCompare(b.code || b.id, undefined, { numeric: true }));

    const meta = IAL_SUBJECT_META[group.title];
    if (meta) {
      group.code = meta.code;
      group.color_code = meta.color;
      group.hasOptionalUnits = meta.hasOptional;
    }

    // If this is the Mathematics group and we have the mathsSuiteParent row, merge its rich metadata
    if (group.title === 'Mathematics' && mathsSuiteParent) {
      group.qualification_data = mathsSuiteParent.qualification_data;
      group.primarySubjectId = mathsSuiteParent.id;
      if (mathsSuiteParent.description) {
        group.description = mathsSuiteParent.description;
      }
    } else if (group.units.length > 0) {
      group.primarySubjectId = group.units[0].id;
    }

    // Aggregate progress & enrollments across units
    let topics = 0;
    let compTopics = 0;
    let papers = 0;
    let compPapers = 0;
    let enrolledUnits = 0;

    for (const u of group.units) {
      topics += u.topicCount || 0;
      compTopics += u.completedTopics || 0;
      papers += u.paperCount || 0;
      compPapers += u.completedPapers || 0;
      if (u.isEnrolled) enrolledUnits += 1;
    }

    group.topicCount = topics;
    group.completedTopics = compTopics;
    group.paperCount = papers;
    group.completedPapers = compPapers;
    group.enrolledUnitsCount = enrolledUnits;
    group.isEnrolled = enrolledUnits > 0;
  }

  // 3. Sort IAL groups in canonical syllabus order
  const sortedIalGroups = Array.from(ialGroups.values()).sort((a, b) => {
    const orderA = IAL_SUBJECT_META[a.title]?.order ?? 99;
    const orderB = IAL_SUBJECT_META[b.title]?.order ?? 99;
    return orderA - orderB;
  });

  return [...result, ...sortedIalGroups];
}

