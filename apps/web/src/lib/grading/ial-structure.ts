export type SubjectType = 'fixed_linear' | 'modular_sciences' | 'modular_maths_suite';

export interface UnitDefinition {
  unitCode: string;
  unitTitle: string;
  stage: 'AS' | 'A2';
  umsWeight: number;
  directPrerequisites?: string[];
  /** Catalog subject row id (maths suite seed JSON). */
  subjectId?: string;
}

export type ElectiveStrategy =
  | 'NONE'
  | 'CHOOSE_N_FROM_SET'
  | 'EXACT_COMBINATION_PAIRS'
  | 'AT_LEAST_ONE_OF';

export interface ElectiveRules {
  pickCount: number;
  strategy: ElectiveStrategy;
  allowedUnitPool?: string[];
  validCombinationSets?: string[][];
  atLeastOneOf?: string[];
}

export interface QualificationProfile {
  cashInCode: string;
  qualificationTitle: string;
  level: 'AS' | 'A_LEVEL';
  totalUnitsRequired: number;
  mandatoryUnits: string[];
  forbiddenUnits?: string[];
  electiveRules: ElectiveRules;
}

export interface EdexcelIALQualificationSpecification {
  subjectCode: string;
  subjectTitle: string;
  subjectType: SubjectType;
  availableUnits: UnitDefinition[];
  qualifications: QualificationProfile[];
}
