-- 0029_caie_alevel_component_routes.sql
-- Myanmar default component routes for CAIE AS & A Level (Phase 2)

-- Sciences: practical Paper 3 (33) vs Paper 4 (34) — Myanmar schools typically sit 33
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9702-as-33', 'subj-caie-al-phys', NULL, 'AS', '9702-as-33', 'AS P12 P22 P33', '["12","22","33"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9702-as-34', 'subj-caie-al-phys', NULL, 'AS', '9702-as-34', 'AS P12 P22 P34', '["12","22","34"]', NULL, NULL, 0, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9702-al-33', 'subj-caie-al-phys', NULL, 'A Level', '9702-al-33', 'A Level P12 P22 P33 P42 P52', '["12","22","33","42","52"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9702-al-34', 'subj-caie-al-phys', NULL, 'A Level', '9702-al-34', 'A Level P12 P22 P34 P42 P52', '["12","22","34","42","52"]', NULL, NULL, 0, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9701-as-33', 'subj-caie-al-chem', NULL, 'AS', '9701-as-33', 'AS P12 P22 P33', '["12","22","33"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9701-as-34', 'subj-caie-al-chem', NULL, 'AS', '9701-as-34', 'AS P12 P22 P34', '["12","22","34"]', NULL, NULL, 0, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9701-al-33', 'subj-caie-al-chem', NULL, 'A Level', '9701-al-33', 'A Level P12 P22 P33 P42 P52', '["12","22","33","42","52"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9701-al-34', 'subj-caie-al-chem', NULL, 'A Level', '9701-al-34', 'A Level P12 P22 P34 P42 P52', '["12","22","34","42","52"]', NULL, NULL, 0, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9700-as-33', 'subj-caie-al-bio', NULL, 'AS', '9700-as-33', 'AS P12 P22 P33', '["12","22","33"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9700-as-34', 'subj-caie-al-bio', NULL, 'AS', '9700-as-34', 'AS P12 P22 P34', '["12","22","34"]', NULL, NULL, 0, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9700-al-33', 'subj-caie-al-bio', NULL, 'A Level', '9700-al-33', 'A Level P12 P22 P33 P42 P52', '["12","22","33","42","52"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9700-al-34', 'subj-caie-al-bio', NULL, 'A Level', '9700-al-34', 'A Level P12 P22 P34 P42 P52', '["12","22","34","42","52"]', NULL, NULL, 0, strftime('%s', 'now') * 1000);

-- Computer Science
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9618-as', 'subj-caie-al-cs', NULL, 'AS', '9618-as', 'AS P12 P22', '["12","22"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9618-al', 'subj-caie-al-cs', NULL, 'A Level', '9618-al', 'A Level P12 P22 P32 P42', '["12","22","32","42"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);

-- Further Mathematics
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9231-as', 'subj-caie-al-fmaths', NULL, 'AS', '9231-as', 'AS P12 P22', '["12","22"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9231-al', 'subj-caie-al-fmaths', NULL, 'A Level', '9231-al', 'A Level P12 P22 P32 P42', '["12","22","32","42"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);

-- Information Technology (Myanmar Oct/Nov paper numbering)
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9626-as', 'subj-caie-al-it', NULL, 'AS', '9626-as', 'AS P12 P02', '["12","02"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9626-al', 'subj-caie-al-it', NULL, 'A Level', '9626-al', 'A Level P12 P02 P32 P04', '["12","02","32","04"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);

-- Standard four-paper A Level subjects
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9708-as', 'subj-caie-al-econ', NULL, 'AS', '9708-as', 'AS P12 P22', '["12","22"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9708-al', 'subj-caie-al-econ', NULL, 'A Level', '9708-al', 'A Level P12 P22 P32 P42', '["12","22","32","42"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9609-as', 'subj-caie-al-biz', NULL, 'AS', '9609-as', 'AS P12 P22', '["12","22"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9609-al', 'subj-caie-al-biz', NULL, 'A Level', '9609-al', 'A Level P12 P22 P32 P42', '["12","22","32","42"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9706-as', 'subj-caie-al-acc', NULL, 'AS', '9706-as', 'AS P12 P22', '["12","22"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9706-al', 'subj-caie-al-acc', NULL, 'A Level', '9706-al', 'A Level P12 P22 P32 P42', '["12","22","32","42"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9093-as', 'subj-caie-al-eng-lang', NULL, 'AS', '9093-as', 'AS P12 P22', '["12","22"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9093-al', 'subj-caie-al-eng-lang', NULL, 'A Level', '9093-al', 'A Level P12 P22 P32 P42', '["12","22","32","42"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);

INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9695-as', 'subj-caie-al-lit', NULL, 'AS', '9695-as', 'AS P12 P22', '["12","22"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
INSERT OR IGNORE INTO subject_component_routes (id, subject_id, cash_in_code, award_level, route_key, label, required_paper_ids, required_unit_codes, optional_groups, is_myanmar_default, created_at)
VALUES ('route-9695-al', 'subj-caie-al-lit', NULL, 'A Level', '9695-al', 'A Level P12 P22 P32 P42', '["12","22","32","42"]', NULL, NULL, 1, strftime('%s', 'now') * 1000);
