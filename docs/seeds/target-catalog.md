# Target subject catalog (do not insert yet)

Official list of syllabi The ANTS will support. **No rows in this file have been applied.** Use reserved IDs as written — do not invent new slugs for the same code.

Playbook (apply commands, schemas): [`README.md`](./README.md)

**Status**
- `in-db` — `subjects` row exists (do not re-insert; do not rename the id)
- `reserved` — not in seeds yet; use this id when you write `0007+`
- `out-of-target` — leftover in D1 from earlier seeds; leave it, do not build topics/papers for it

Coverage of topics / papers is separate (see README). This file is **which subjects exist in the product**.

IAL **cash-in** codes (`XMA01` / `YMA01`, …) are **not** `subjects` rows. Students enroll in **units** (`WMA11`, …). Put cash-in codes in the unit `description` if useful.

---

## CAIE IGCSE — `curr-caie-igcse`

All **in-db**. Topics + per-paper calculator data already seeded (`0002`, `0004`).

| Status | id | code | name |
|---|---|---|---|
| in-db | `subj-caie-igcse-maths` | 0580 | Mathematics |
| in-db | `subj-caie-igcse-addmaths` | 0606 | Additional Mathematics |
| in-db | `subj-caie-igcse-phys` | 0625 | Physics |
| in-db | `subj-caie-igcse-chem` | 0620 | Chemistry |
| in-db | `subj-caie-igcse-bio` | 0610 | Biology |
| in-db | `subj-caie-igcse-cs` | 0478 | Computer Science |
| in-db | `subj-caie-igcse-ict` | 0417 | Information and Communication Technology |
| in-db | `subj-caie-igcse-eng-first` | 0500 | First Language English |
| in-db | `subj-caie-igcse-esl` | 0510 | English as a Second Language (Speaking Endorsement) |
| in-db | `subj-caie-igcse-econ` | 0455 | Economics |
| in-db | `subj-caie-igcse-biz` | 0450 | Business Studies |
| in-db | `subj-caie-igcse-acc` | 0452 | Accounting |

---

## Edexcel IGCSE — `curr-edexcel-igcse`

Grades **9–1**. `ums_*` = NULL.

| Status | id | code | name |
|---|---|---|---|
| in-db | `subj-edx-igcse-maths-a` | 4MA1 | Mathematics A |
| reserved | `subj-edx-igcse-maths-b` | 4MB1 | Mathematics B |
| in-db | `subj-edx-igcse-fmaths` | 4PM1 | Further Pure Mathematics |
| in-db | `subj-edx-igcse-phys` | 4PH1 | Physics |
| in-db | `subj-edx-igcse-chem` | 4CH1 | Chemistry |
| in-db | `subj-edx-igcse-bio` | 4BI1 | Biology |
| reserved | `subj-edx-igcse-human-bio` | 4HB1 | Human Biology |
| reserved | `subj-edx-igcse-cs` | 4CP0 | Computer Science |
| in-db | `subj-edx-igcse-ict` | 4IT1 | Information and Communication Technology |
| reserved | `subj-edx-igcse-eng-b` | 4EB1 | English Language B |
| reserved | `subj-edx-igcse-esl` | 4ES1 | English as a Second Language |
| in-db | `subj-edx-igcse-econ` | 4EC1 | Economics |
| in-db | `subj-edx-igcse-biz` | 4BS1 | Business |
| in-db | `subj-edx-igcse-acc` | 4AC1 | Accounting |
| out-of-target | `subj-edx-igcse-eng-a` | 4EA1 | English Language A (not on the support list) |

---

## CAIE International AS & A Level — `curr-caie-alevel`

| Status | id | code | name |
|---|---|---|---|
| in-db | `subj-caie-al-maths` | 9709 | Mathematics |
| reserved | `subj-caie-al-fmaths` | 9231 | Further Mathematics |
| in-db | `subj-caie-al-phys` | 9702 | Physics |
| in-db | `subj-caie-al-chem` | 9701 | Chemistry |
| in-db | `subj-caie-al-bio` | 9700 | Biology |
| in-db | `subj-caie-al-cs` | 9618 | Computer Science |
| reserved | `subj-caie-al-it` | 9626 | Information Technology |
| in-db | `subj-caie-al-econ` | 9708 | Economics |
| reserved | `subj-caie-al-biz` | 9609 | Business |
| reserved | `subj-caie-al-acc` | 9706 | Accounting |
| reserved | `subj-caie-al-eng-lang` | 9093 | English Language |
| reserved | `subj-caie-al-lit` | 9695 | Literature in English |

None of these have topic or calculator seeds yet (except leftover sample 9709 papers from `0001`).

---

## Pearson Edexcel IAL — `curr-edexcel-ial`

Enroll **units**. Countdown mode is per-paper. Fill UMS on boundaries.

`WME02` / `WST02` already exist (Mechanics M2 / Statistics S2). Further Mathematics **reuses** those ids — do not create a second subject for the same unit code.

| Award | AS cash-in | A Level cash-in | Units (enroll these) |
|---|---|---|---|
| Mathematics | XMA01 | YMA01 | WMA11 P1, WMA12 P2, WMA13 P3, WMA14 P4, WME01 M1, WST01 S1 — **all in-db** |
| Further Mathematics | XFM01 | YFM01 | WFM01–WFM03 **reserved**; WME02 + WST02 **in-db**; WDM11 D1 **reserved** |
| Physics | XPH11 | YPH11 | WPH11–WPH16 — **in-db** |
| Chemistry | XCH11 | YCH11 | WCH11–WCH16 — **in-db** |
| Biology | XBI11 | YBI11 | WBI11–WBI16 — **in-db** |
| Information Technology | XIT11 | YIT11 | WIT11–WIT14 — **reserved** |
| Computer Science | XCP01 | YCP01 | WCP01–WCP04 — **reserved** |
| Economics | XEC11 | YEC11 | WEC11–WEC14 — **in-db** |
| Business | XBS11 | YBS11 | WBS11–WBS14 — **in-db** |
| Accounting | XAC11 | YAC11 | WAC11–WAC12 — **in-db** |
| English Language | XEN01 | YEN01 | WEN01–WEN04 — **reserved** |
| English Literature | XET01 | YET01 | WET01–WET04 — **reserved** |

### IAL unit ids

| Status | id | code | name | cash-in note |
|---|---|---|---|---|
| in-db | `subj-edx-ial-pure1` | WMA11 | Pure Mathematics 1 | XMA01 / YMA01 |
| in-db | `subj-edx-ial-pure2` | WMA12 | Pure Mathematics 2 | XMA01 / YMA01 |
| in-db | `subj-edx-ial-pure3` | WMA13 | Pure Mathematics 3 | YMA01 |
| in-db | `subj-edx-ial-pure4` | WMA14 | Pure Mathematics 4 | YMA01 |
| in-db | `subj-edx-ial-mech1` | WME01 | Mechanics M1 | XMA01 / YMA01 |
| in-db | `subj-edx-ial-stat1` | WST01 | Statistics S1 | XMA01 / YMA01 |
| reserved | `subj-edx-ial-fmath1` | WFM01 | Further Pure F1 | XFM01 / YFM01 |
| reserved | `subj-edx-ial-fmath2` | WFM02 | Further Pure F2 | YFM01 |
| reserved | `subj-edx-ial-fmath3` | WFM03 | Further Pure F3 | YFM01 |
| in-db | `subj-edx-ial-mech2` | WME02 | Mechanics M2 | YFM01 (also further maths) |
| in-db | `subj-edx-ial-stat2` | WST02 | Statistics S2 | YFM01 (also further maths) |
| reserved | `subj-edx-ial-dec1` | WDM11 | Decision Mathematics D1 | YFM01 |
| in-db | `subj-edx-ial-phys1` … `phys6` | WPH11–16 | Physics U1–U6 | XPH11 / YPH11 |
| in-db | `subj-edx-ial-chem1` … `chem6` | WCH11–16 | Chemistry U1–U6 | XCH11 / YCH11 |
| in-db | `subj-edx-ial-bio1` … `bio6` | WBI11–16 | Biology U1–U6 | XBI11 / YBI11 |
| reserved | `subj-edx-ial-it1` … `it4` | WIT11–14 | IT U1–U4 | XIT11 / YIT11 |
| reserved | `subj-edx-ial-cs1` … `cs4` | WCP01–04 | Computer Science U1–U4 | XCP01 / YCP01 |
| in-db | `subj-edx-ial-econ1` … `econ4` | WEC11–14 | Economics U1–U4 | XEC11 / YEC11 |
| in-db | `subj-edx-ial-biz1` … `biz4` | WBS11–14 | Business U1–U4 | XBS11 / YBS11 |
| in-db | `subj-edx-ial-acc1` `acc2` | WAC11–12 | Accounting U1–U2 | XAC11 / YAC11 |
| reserved | `subj-edx-ial-eng1` … `eng4` | WEN01–04 | English Language U1–U4 | XEN01 / YEN01 |
| reserved | `subj-edx-ial-lit1` … `lit4` | WET01–04 | English Literature U1–U4 | XET01 / YET01 |

Exact reserved unit ids:

```
subj-edx-ial-it1 WIT11 · it2 WIT12 · it3 WIT13 · it4 WIT14
subj-edx-ial-cs1 WCP01 · cs2 WCP02 · cs3 WCP03 · cs4 WCP04
subj-edx-ial-eng1 WEN01 · eng2 WEN02 · eng3 WEN03 · eng4 WEN04
subj-edx-ial-lit1 WET01 · lit2 WET02 · lit3 WET03 · lit4 WET04
```

---

## Reserved `subjects` INSERT (copy when you are ready to seed)

Do **not** run this until the other IDE session is writing `0007+`. Colors match the playbook palette.

```sql
-- Edexcel IGCSE (missing)
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-edx-igcse-maths-b', 'curr-edexcel-igcse', 'Mathematics B', '4MB1', 'Pearson Edexcel International GCSE Mathematics B', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-edx-igcse-human-bio', 'curr-edexcel-igcse', 'Human Biology', '4HB1', 'Pearson Edexcel International GCSE Human Biology', '#10b981', strftime('%s', 'now') * 1000),
('subj-edx-igcse-cs', 'curr-edexcel-igcse', 'Computer Science', '4CP0', 'Pearson Edexcel International GCSE Computer Science', '#f59e0b', strftime('%s', 'now') * 1000),
('subj-edx-igcse-eng-b', 'curr-edexcel-igcse', 'English Language B', '4EB1', 'Pearson Edexcel International GCSE English Language B', '#f97316', strftime('%s', 'now') * 1000),
('subj-edx-igcse-esl', 'curr-edexcel-igcse', 'English as a Second Language', '4ES1', 'Pearson Edexcel International GCSE English as a Second Language', '#f97316', strftime('%s', 'now') * 1000);

-- CAIE A Level (missing)
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-caie-al-fmaths', 'curr-caie-alevel', 'Further Mathematics', '9231', 'Cambridge International AS & A Level Further Mathematics', '#2563eb', strftime('%s', 'now') * 1000),
('subj-caie-al-it', 'curr-caie-alevel', 'Information Technology', '9626', 'Cambridge International AS & A Level Information Technology', '#f59e0b', strftime('%s', 'now') * 1000),
('subj-caie-al-biz', 'curr-caie-alevel', 'Business', '9609', 'Cambridge International AS & A Level Business', '#6366f1', strftime('%s', 'now') * 1000),
('subj-caie-al-acc', 'curr-caie-alevel', 'Accounting', '9706', 'Cambridge International AS & A Level Accounting', '#eab308', strftime('%s', 'now') * 1000),
('subj-caie-al-eng-lang', 'curr-caie-alevel', 'English Language', '9093', 'Cambridge International AS & A Level English Language', '#f97316', strftime('%s', 'now') * 1000),
('subj-caie-al-lit', 'curr-caie-alevel', 'Literature in English', '9695', 'Cambridge International AS & A Level Literature in English', '#ef4444', strftime('%s', 'now') * 1000);

-- Edexcel IAL units (missing)
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-edx-ial-fmath1', 'curr-edexcel-ial', 'Further Pure F1', 'WFM01', 'Pearson Edexcel IAL Further Pure Mathematics F1 (XFM01/YFM01)', '#1e3a8a', strftime('%s', 'now') * 1000),
('subj-edx-ial-fmath2', 'curr-edexcel-ial', 'Further Pure F2', 'WFM02', 'Pearson Edexcel IAL Further Pure Mathematics F2 (YFM01)', '#1e3a8a', strftime('%s', 'now') * 1000),
('subj-edx-ial-fmath3', 'curr-edexcel-ial', 'Further Pure F3', 'WFM03', 'Pearson Edexcel IAL Further Pure Mathematics F3 (YFM01)', '#1e3a8a', strftime('%s', 'now') * 1000),
('subj-edx-ial-dec1', 'curr-edexcel-ial', 'Decision Mathematics D1', 'WDM11', 'Pearson Edexcel IAL Decision Mathematics D1 (YFM01)', '#0ea5e9', strftime('%s', 'now') * 1000),
('subj-edx-ial-it1', 'curr-edexcel-ial', 'IT Unit 1', 'WIT11', 'Pearson Edexcel IAL Information Technology Unit 1 (XIT11/YIT11)', '#f59e0b', strftime('%s', 'now') * 1000),
('subj-edx-ial-it2', 'curr-edexcel-ial', 'IT Unit 2', 'WIT12', 'Pearson Edexcel IAL Information Technology Unit 2 (XIT11/YIT11)', '#d97706', strftime('%s', 'now') * 1000),
('subj-edx-ial-it3', 'curr-edexcel-ial', 'IT Unit 3', 'WIT13', 'Pearson Edexcel IAL Information Technology Unit 3 (YIT11)', '#b45309', strftime('%s', 'now') * 1000),
('subj-edx-ial-it4', 'curr-edexcel-ial', 'IT Unit 4', 'WIT14', 'Pearson Edexcel IAL Information Technology Unit 4 (YIT11)', '#92400e', strftime('%s', 'now') * 1000),
('subj-edx-ial-cs1', 'curr-edexcel-ial', 'Computer Science Unit 1', 'WCP01', 'Pearson Edexcel IAL Computer Science Unit 1 (XCP01/YCP01)', '#f59e0b', strftime('%s', 'now') * 1000),
('subj-edx-ial-cs2', 'curr-edexcel-ial', 'Computer Science Unit 2', 'WCP02', 'Pearson Edexcel IAL Computer Science Unit 2 (XCP01/YCP01)', '#d97706', strftime('%s', 'now') * 1000),
('subj-edx-ial-cs3', 'curr-edexcel-ial', 'Computer Science Unit 3', 'WCP03', 'Pearson Edexcel IAL Computer Science Unit 3 (YCP01)', '#b45309', strftime('%s', 'now') * 1000),
('subj-edx-ial-cs4', 'curr-edexcel-ial', 'Computer Science Unit 4', 'WCP04', 'Pearson Edexcel IAL Computer Science Unit 4 (YCP01)', '#92400e', strftime('%s', 'now') * 1000),
('subj-edx-ial-eng1', 'curr-edexcel-ial', 'English Language Unit 1', 'WEN01', 'Pearson Edexcel IAL English Language Unit 1 (XEN01/YEN01)', '#f97316', strftime('%s', 'now') * 1000),
('subj-edx-ial-eng2', 'curr-edexcel-ial', 'English Language Unit 2', 'WEN02', 'Pearson Edexcel IAL English Language Unit 2 (XEN01/YEN01)', '#ea580c', strftime('%s', 'now') * 1000),
('subj-edx-ial-eng3', 'curr-edexcel-ial', 'English Language Unit 3', 'WEN03', 'Pearson Edexcel IAL English Language Unit 3 (YEN01)', '#c2410c', strftime('%s', 'now') * 1000),
('subj-edx-ial-eng4', 'curr-edexcel-ial', 'English Language Unit 4', 'WEN04', 'Pearson Edexcel IAL English Language Unit 4 (YEN01)', '#9a3412', strftime('%s', 'now') * 1000),
('subj-edx-ial-lit1', 'curr-edexcel-ial', 'English Literature Unit 1', 'WET01', 'Pearson Edexcel IAL English Literature Unit 1 (XET01/YET01)', '#ef4444', strftime('%s', 'now') * 1000),
('subj-edx-ial-lit2', 'curr-edexcel-ial', 'English Literature Unit 2', 'WET02', 'Pearson Edexcel IAL English Literature Unit 2 (XET01/YET01)', '#dc2626', strftime('%s', 'now') * 1000),
('subj-edx-ial-lit3', 'curr-edexcel-ial', 'English Literature Unit 3', 'WET03', 'Pearson Edexcel IAL English Literature Unit 3 (YET01)', '#b91c1c', strftime('%s', 'now') * 1000),
('subj-edx-ial-lit4', 'curr-edexcel-ial', 'English Literature Unit 4', 'WET04', 'Pearson Edexcel IAL English Literature Unit 4 (YET01)', '#991b1b', strftime('%s', 'now') * 1000);
```

---

## Myanmar paper maps (countdown vs practice)

Source of truth: [`packages/shared-types/src/exam-papers.ts`](../../packages/shared-types/src/exam-papers.ts).

**Countdown** shows only Myanmar Zone 4 / R-papers. **Past papers + calculator** show all practice variants.

### CAIE IGCSE (Extended default; variant 2)

| Code | Countdown (v2) | Practice variants | Notes |
|---|---|---|---|
| 0580 | 22, 42 | 21–23, 41–43 | Core 12/32 hidden unless enrollment tier = core |
| 0606 | 12, 22 | 11–13, 21–23 | |
| 0625 / 0620 / 0610 | 22, 42, 62 | 21–23, 41–43, 61–63 | Paper 5 vs 6 exclusive in calculator |
| 0478 | 12, 22 | 11–13, 21–23 | |
| 0417 | **series-dependent** | 11–13, 21/22/02, 31/32/03 | May/June + Feb/March: 12, 21, 31. Oct/Nov: 12, 02, 03 |
| 0500 | 12, 22 | 11–13, 21–23, 31–33 | |
| 0510 | 12, 22 | 11–13, 21–23, 04 | Component 04 is custom countdown only |
| 0455 / 0450 / 0452 | 12, 22 | 11–13, 21–23 | |

### CAIE A Level (award level at enrollment)

| Code | AS countdown | A Level countdown | Notes |
|---|---|---|---|
| 9709 | 12 + (42 or 52) | 12, 32, 42, 52 | Route preference is editable; calculator shows 42 and 52 as exclusive |
| 9231 | 12, 22 | 12, 22, 32, 42 | |
| 9702 / 9701 / 9700 | 12, 22, 33/34 | 12, 22, 33/34, 42, 52 | 33 vs 34 exclusive in calculator |
| 9618 | 12, 22 | 12, 22, 32, 42 | |
| 9626 | **series-dependent** | series-dependent | Oct/Nov: 12, 02 (AS) + 32, 04 (A2). May/June: 12, 21, 32, 41 |
| 9708 / 9609 / 9706 / 9093 / 9695 | 12, 22 | 12, 22, 32, 42 | |

### Edexcel IGCSE (R-papers for countdown)

| Code | Countdown | Practice |
|---|---|---|
| 4MA1 | 1HR, 2HR | F/H + R |
| 4MB1 / 4PM1 / 4HB1 | 01R, 02R | 01/02 + R |
| 4PH1 | 1PR, 2PR | 1P/2P + R |
| 4CH1 | 1CR, 2CR | 1C/2C + R |
| 4BI1 | 1BR, 2BR | 1B/2B + R |
| 4CP0 | 01, 02 | 01, 02 |
| 4IT1 / 4EC1 / 4BS1 / 4AC1 | 01R, 02R | 01/02 + R |
| 4EB1 | 01R, 02R | 01/02 + R |
| 4ES1 | 01R, 02R, 03 | 01/02/03 + R |

### Edexcel IAL

Enroll **units**. Countdown is per-unit. Grade calculator cash-in uses official summed UMS (not average). Accounting cash-in is WAC11 (AS, 300 UMS) / WAC11+WAC12 (A Level, 600 UMS) per Pearson PDFs. Psychology WPS01–04 is in the Myanmar unit set.

---

## Other-IDE work order (still do not apply in this chat)

1. `0007_subjects_target_gaps.sql` — reserved INSERTs above only.
2. Topics: CAIE A Level (in-db + new) → Edexcel IGCSE → Edexcel IAL units.
3. CAIE IGCSE: topics/papers already done; optional `subject_grade_boundaries` composites.
4. Papers + boundaries: Edexcel IGCSE → CAIE A Level → Edexcel IAL (UMS).
5. Leave `4EA1` unused. Do not delete it.
