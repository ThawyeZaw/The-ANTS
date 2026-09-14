import type { QualificationKey } from '@/types';
import type { QualificationPlugin } from './types';
import { caieIgcsePlugin } from './caie-igcse';
import { caieAlevelPlugin } from './caie-alevel';
import { edexcelIgcsePlugin } from './edexcel-igcse';
import { edexcelIalPlugin } from './edexcel-ial';
import { caieIgcsePlugin as _caie } from './caie-igcse';

export type { QualificationPlugin, GradeBoundary, PaperComponent, SubjectTier, CountdownMode } from './types';
export { getGradeColor, uniqueVariants, caiePaperBase, lookupGrade, computeUms, percentageOf } from './shared';
export { syllabusHasTiers, examPaperMatchesTier } from './caie-igcse';
export {
  parseSessionLabel,
  examMatchesSession,
  placeholderDateForSession,
  DEFAULT_EXAM_SESSION,
  EXAM_SESSION_OPTIONS,
  sessionCodeToLabel,
} from './series';

const PLUGINS: Record<QualificationKey, QualificationPlugin> = {
  CAIE_IGCSE: caieIgcsePlugin,
  CAIE_AL: caieAlevelPlugin,
  Edexcel_IGCSE: edexcelIgcsePlugin,
  Edexcel_IAL: edexcelIalPlugin,
  IELTS: caieIgcsePlugin,
  OSSD: caieIgcsePlugin,
  GED: caieIgcsePlugin,
};

const CURRICULUM_CODE_TO_KEY: Record<string, QualificationKey> = {
  CAIE_IGCSE: 'CAIE_IGCSE',
  CAIE_ALEVEL: 'CAIE_AL',
  CAIE_AL: 'CAIE_AL',
  EDEXCEL_IGCSE: 'Edexcel_IGCSE',
  EDEXCEL_IAL: 'Edexcel_IAL',
};

export function qualificationKeyFromCurriculumCode(code: string | null | undefined): QualificationKey {
  if (!code) return 'CAIE_IGCSE';
  return CURRICULUM_CODE_TO_KEY[code] ?? (code as QualificationKey);
}

export function getPlugin(key: QualificationKey): QualificationPlugin {
  return PLUGINS[key] ?? caieIgcsePlugin;
}

export function getPluginForCurriculumCode(code: string | null | undefined): QualificationPlugin {
  return getPlugin(qualificationKeyFromCurriculumCode(code));
}

/** Resolve plugin from past-paper board + qualification columns. */
export function getPluginForPaper(opts: {
  examBoard?: string | null;
  qualification?: string | null;
  curriculumCode?: string | null;
}): QualificationPlugin {
  if (opts.curriculumCode) return getPluginForCurriculumCode(opts.curriculumCode);
  const board = (opts.examBoard ?? '').toLowerCase();
  const qual = (opts.qualification ?? '').toLowerCase();
  if (board.includes('edexcel') && (qual.includes('ial') || qual === 'a level' && board.includes('edexcel'))) {
    if (qual.includes('ial')) return edexcelIalPlugin;
    return edexcelIgcsePlugin;
  }
  if (qual.includes('ial')) return edexcelIalPlugin;
  if (qual === 'a level' || qual.includes('as')) return caieAlevelPlugin;
  if (board.includes('edexcel')) return edexcelIgcsePlugin;
  return _caie;
}
