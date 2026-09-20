-- 0031_edexcel_ial_maths_suite.sql
-- Seeds the Edexcel IAL Mathematics Suite as a `modular_maths_suite` parent subject.
--
-- Design notes:
--   • This ONE row represents the entire modular suite.  The UI reads its
--     `qualification_data` JSON to render the EdexcelSuiteSelectors component.
--   • Individual unit subjects (subj-edx-ial-pure1, subj-edx-ial-mech1 …) keep
--     their own rows -- they own the actual topics and past_papers foreign-keys.
--   • `unitCode` values deliberately match `subjects.code` (WMA11, WME01 …) so
--     topic name prefixes and past_papers.paper_number patterns work without a
--     separate mapping table.
--   • Each availableUnit carries `subjectId` so the frontend can resolve topic /
--     past-paper queries without extra round-trips.

INSERT OR IGNORE INTO subjects (
  id, curriculum_id, name, code, description, color_code,
  subject_type, qualification_data, created_at
) VALUES (
  'subj-edx-ial-maths-suite',
  'curr-edexcel-ial',
  'Mathematics Suite',
  'WMA11-SET',
  'Pearson Edexcel IAL Mathematics Suite — Pure + Applied modular units (XMA01 / YMA01 / XFM01 / YFM01)',
  '#3b82f6',
  'modular_maths_suite',
  '{"subjectCode":"WMA11-SET","subjectTitle":"Mathematics Suite","subjectType":"modular_maths_suite","availableUnits":[{"unitCode":"WMA11","unitTitle":"Pure Mathematics 1","stage":"AS","umsWeight":100,"subjectId":"subj-edx-ial-pure1","directPrerequisites":[]},{"unitCode":"WMA12","unitTitle":"Pure Mathematics 2","stage":"AS","umsWeight":100,"subjectId":"subj-edx-ial-pure2","directPrerequisites":["WMA11"]},{"unitCode":"WMA13","unitTitle":"Pure Mathematics 3","stage":"A2","umsWeight":100,"subjectId":"subj-edx-ial-pure3","directPrerequisites":["WMA12"]},{"unitCode":"WMA14","unitTitle":"Pure Mathematics 4","stage":"A2","umsWeight":100,"subjectId":"subj-edx-ial-pure4","directPrerequisites":["WMA13"]},{"unitCode":"WFM01","unitTitle":"Further Pure Mathematics 1","stage":"AS","umsWeight":100,"subjectId":"subj-edx-ial-fmath1","directPrerequisites":[]},{"unitCode":"WFM02","unitTitle":"Further Pure Mathematics 2","stage":"A2","umsWeight":100,"subjectId":"subj-edx-ial-fmath2","directPrerequisites":["WFM01"]},{"unitCode":"WFM03","unitTitle":"Further Pure Mathematics 3","stage":"A2","umsWeight":100,"subjectId":"subj-edx-ial-fmath3","directPrerequisites":["WFM01"]},{"unitCode":"WME01","unitTitle":"Mechanics 1","stage":"AS","umsWeight":100,"subjectId":"subj-edx-ial-mech1","directPrerequisites":[]},{"unitCode":"WME02","unitTitle":"Mechanics 2","stage":"A2","umsWeight":100,"subjectId":"subj-edx-ial-mech2","directPrerequisites":["WME01"]},{"unitCode":"WME03","unitTitle":"Mechanics 3","stage":"A2","umsWeight":100,"subjectId":"subj-edx-ial-mech3","directPrerequisites":["WME02"]},{"unitCode":"WST01","unitTitle":"Statistics 1","stage":"AS","umsWeight":100,"subjectId":"subj-edx-ial-stat1","directPrerequisites":[]},{"unitCode":"WST02","unitTitle":"Statistics 2","stage":"A2","umsWeight":100,"subjectId":"subj-edx-ial-stat2","directPrerequisites":["WST01"]},{"unitCode":"WST03","unitTitle":"Statistics 3","stage":"A2","umsWeight":100,"subjectId":"subj-edx-ial-stat3","directPrerequisites":["WST02"]},{"unitCode":"WDM11","unitTitle":"Decision Mathematics 1","stage":"AS","umsWeight":100,"subjectId":"subj-edx-ial-dec1","directPrerequisites":[]}],"qualifications":[{"cashInCode":"XMA01","qualificationTitle":"International AS Mathematics","level":"AS","totalUnitsRequired":3,"mandatoryUnits":["WMA11","WMA12"],"forbiddenUnits":["WMA13","WMA14","WFM01","WFM02","WFM03"],"electiveRules":{"pickCount":1,"strategy":"CHOOSE_N_FROM_SET","allowedUnitPool":["WME01","WST01","WDM11"]}},{"cashInCode":"YMA01","qualificationTitle":"International Advanced Level Mathematics","level":"A_LEVEL","totalUnitsRequired":6,"mandatoryUnits":["WMA11","WMA12","WMA13","WMA14"],"forbiddenUnits":["WFM01","WFM02","WFM03"],"electiveRules":{"pickCount":2,"strategy":"EXACT_COMBINATION_PAIRS","validCombinationSets":[["WME01","WME02"],["WST01","WST02"],["WME01","WST01"],["WME01","WDM11"],["WST01","WDM11"]]}},{"cashInCode":"XFM01","qualificationTitle":"International AS Further Mathematics","level":"AS","totalUnitsRequired":3,"mandatoryUnits":["WFM01"],"forbiddenUnits":["WMA11","WMA12","WMA13","WMA14"],"electiveRules":{"pickCount":2,"strategy":"CHOOSE_N_FROM_SET","allowedUnitPool":["WFM02","WFM03","WME01","WME02","WME03","WST01","WST02","WST03","WDM11"]}},{"cashInCode":"YFM01","qualificationTitle":"International Advanced Level Further Mathematics","level":"A_LEVEL","totalUnitsRequired":6,"mandatoryUnits":["WFM01"],"forbiddenUnits":["WMA11","WMA12","WMA13","WMA14"],"electiveRules":{"pickCount":5,"strategy":"AT_LEAST_ONE_OF","atLeastOneOf":["WFM02","WFM03"],"allowedUnitPool":["WFM02","WFM03","WME01","WME02","WME03","WST01","WST02","WST03","WDM11"]}}]}',
  strftime('%s', 'now') * 1000
);
