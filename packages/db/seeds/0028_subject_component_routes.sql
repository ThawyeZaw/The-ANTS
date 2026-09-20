-- 0028_subject_component_routes.sql
-- Valid component routes for Myanmar students (CAIE IGCSE + Edexcel IAL)
-- CAIE A Level routes deferred — see 0029_caie_alevel_component_routes.sql (Phase 2, skipped)

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-0580-ext-v2', 'subj-caie-igcse-maths', NULL, NULL, '0580-ext-v2', 'Extended Zone 4 (P22 + P42)', '["22","42"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-xma01-m1', NULL, 'XMA01', 'AS', 'xma01-m1', 'AS P1 P2 M1', NULL, '["WMA11","WMA12","WME01"]', NULL, 1, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-xma01-s1', NULL, 'XMA01', 'AS', 'xma01-s1', 'AS P1 P2 S1', NULL, '["WMA11","WMA12","WST01"]', NULL, 0, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-yma01-m1s1', NULL, 'YMA01', 'A Level', 'yma01-m1s1', 'A Level P1-P4 M1 S1', NULL, '["WMA11","WMA12","WMA13","WMA14","WME01","WST01"]', NULL, 1, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-yma01-m1m2', NULL, 'YMA01', 'A Level', 'yma01-m1m2', 'A Level P1-P4 M1 M2', NULL, '["WMA11","WMA12","WMA13","WMA14","WME01","WME02"]', NULL, 0, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-yma01-s1s2', NULL, 'YMA01', 'A Level', 'yma01-s1s2', 'A Level P1-P4 S1 S2', NULL, '["WMA11","WMA12","WMA13","WMA14","WST01","WST02"]', NULL, 0, strftime('%s', 'now') * 1000);
