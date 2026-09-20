# The ANTS — Data Entry & Catalog Audit Record

> **Last Updated:** September 20, 2026  
> **Database:** Cloudflare D1 (`the-ants-db`)  
> **Validation Status:** `VALIDATION OK` — all seeds idempotent (INSERT OR IGNORE / WHERE NOT LIKE guards)  
> **Branch:** `feat/dashboard-study`

---

## 1. Global Catalog Summary

| Metric | In-Database / Seeded | Target Coverage | Notes |
|---|---|---|---|
| **Curriculums** | **4** | 100% | CAIE IGCSE, CAIE A Level, Edexcel IGCSE, Edexcel IAL |
| **Subjects / Modular Units** | **102** | 100% | All target syllabi + modular IAL unit codes + `WMA11-SET` suite parent |
| **Topics (Tracker)** | **377** | 80% | CAIE IGCSE (119), Edexcel IGCSE (86), Edexcel IAL (172); math topics now prefixed |
| **Past Papers** | **1,460+** | Component-level | CAIE IGCSE complete (2022–2026); Edexcel IAL maths 2022–2026 complete |
| **Paper Grade Boundaries** | **10,575** | Component-level | CAIE IGCSE complete (2022–2026 raw thresholds) |
| **Exam Countdowns** | **127** | Oct/Nov 2026 series | Seeded across all 4 boards |

---

## 2. Status by Feature Area

### 1. Curriculum & Subjects (`curriculums`, `subjects`)
*Feeds: `/curriculum`, Subject enrollment modal, foreign keys for all study tools*

| Curriculum Board | Code | Target Subjects | In-DB Total | Status |
|---|---|---|---|---|
| **Cambridge IGCSE** | `curr-caie-igcse` | 12 subjects | 12 | **100% Complete** |
| **Pearson Edexcel IGCSE** | `curr-edexcel-igcse` | 14 subjects | 15 *(+1 legacy 4EA1)* | **100% Complete** |
| **Cambridge International A Level** | `curr-caie-alevel` | 12 subjects | 12 | **100% Complete** |
| **Pearson Edexcel IAL** | `curr-edexcel-ial` | 54 target units + 1 suite parent | 63 rows | **100% Complete** — `subj-edx-ial-maths-suite` added (`WMA11-SET`, `subject_type='modular_maths_suite'`) |

---

### 2. Topic Tracker (`topics`)
*Feeds: `/curriculum/[curriculumId]/[subjectId]` syllabus checklist & progress tracker*

| Board | Seeded Topics | Subject / Unit Coverage | Status |
|---|---|---|---|
| **Cambridge IGCSE** | **119** | 12 / 12 subjects | **100% Complete** (`0002_topics_CAIE_IGCSE_subjects.sql`) |
| **Pearson Edexcel IGCSE** | **86** | 14 / 14 subjects | **100% Complete** (`0008_topics_edexcel_igcse.sql`) |
| **Pearson Edexcel IAL** | **172** | 54 / 54 units | **100% Complete** — all 14 maths topics prefixed with unit codes (`0032`) |
| **Cambridge International A Level** | **0** | 0 / 12 subjects | Pending syllabus outline extraction |

---

### 3. Past Paper Tracker (`past_papers`)
*Feeds: `/past-papers` grid, completion status, marks logging, paper downloads*

| Board | Seeded Papers | Year Range | Details |
|---|---|---|---|
| **Cambridge IGCSE** | **1,325** | 2022–2026 | All components (P1–P6), all variants (1–3), m/s/w series (`0004`) |
| **Cambridge International A Level** | **2** | 2024 | Minimal sample papers for 9709 Mathematics |
| **Pearson Edexcel IAL Maths Suite** | **~140** | 2022–2026 | All 14 units × Jan/Jun/Oct 2022–2025 + W25/J26/S26 — `paper_number` in `WMA11/01` format (`0033`) |
| **Pearson Edexcel IAL Other** | **~130** | 2022–2026 | Biology, Chem, Physics, Business etc. (`0024`) |
| **Pearson Edexcel IGCSE** | **0** | — | Pending past paper catalog addition |

---

### 4. Grade Calculator & Thresholds (`paper_grade_boundaries`)
*Feeds: `/calculator` and inline `/past-papers` instant grade calculation*

| Board | Threshold Rows | Grading Scheme | Details |
|---|---|---|---|
| **Cambridge IGCSE** | **10,575** | `A*`–`G` / `9`–`1` | Component-level raw mark boundaries per paper & variant (`0004`) |
| **Pearson Edexcel IGCSE** | **0** | `9`–`1` | Official grade boundaries to be extracted from board tables |
| **Cambridge International A Level** | **0** | `A*`–`E` | Official grade thresholds to be extracted |
| **Pearson Edexcel IAL** | **0** | Raw + UMS | Unit-level raw marks and UMS scale conversions to be seeded |

---

### 5. Exam Countdown (`exams`)
*Feeds: `/countdown` exam timetable cards and revision countdowns*

| Board | Seeded Exams | Series Covered |
|---|---|---|
| **Cambridge IGCSE** | 39 | Oct/Nov 2026 (W26) |
| **Cambridge International A Level** | 32 | Oct/Nov 2026 (W26) |
| **Pearson Edexcel IAL** | 36 | Oct/Nov 2026 (W26) |
| **Pearson Edexcel IGCSE** | 20 | Oct/Nov 2026 (W26) |

---

## 3. Seed Files Inventory (`packages/db/seeds/`)

Execution order strictly maintained in `_validate_all_seeds.py`:

| Order | File | Description | Records Added |
|---|---|---|---|
| 1 | `0001_exam_data_seed.sql` | Base boards, initial subjects, core exam structures | Curriculums, initial subjects |
| 2 | `0002_topics_CAIE_IGCSE_subjects.sql` | Topics for 12 CAIE IGCSE subjects | 119 topics |
| 3 | `0003_cleanup_sample_data.sql` | Remove legacy test fixtures | Cleanup |
| 4 | `0005_subjects_countdown_boards.sql` | Setup countdown board links and subject metadata | Metadata updates |
| 5 | `0004_caie_igcse_grade_thresholds.sql` | CAIE IGCSE past papers & paper-level grade boundaries | 1,328 papers, 10,575 boundaries |
| 6 | `0006_exams_w26_countdown.sql` | October/November 2026 official exam countdown dates | 127 exams |
| 7 | `0007_subjects_target_gaps.sql` | Reserved subject IDs for Edexcel IGCSE, CAIE A Level & IAL | 30 subjects & modular units |
| 8 | `0008_topics_edexcel_igcse.sql` | Official topics for all 14 Edexcel IGCSE subjects | 86 topics |
| 9 | `0009_topics_edexcel_ial.sql` | Official unit topics for 54 Edexcel IAL modular units | 172 topics |
| 10 | `0031_edexcel_ial_maths_suite.sql` | **[NEW]** Mathematics Suite parent subject (`WMA11-SET`, `modular_maths_suite`) with full `qualification_data` JSON | 1 subject |
| 11 | `0032_backfill_maths_suite_topic_prefixes.sql` | **[NEW]** Prefix all 80 maths topics with unit syllabus code (e.g. `WMA11 - Algebra and functions`) | 80 topic updates |
| 12 | `0033_maths_suite_past_papers.sql` | **[NEW]** Fix `paper_number` to `WMA11/01` format; add missing Jan/Jun/Oct 2022–2025 series for all 14 units | ~140 papers |

---

## 4. Uploaded Specification PDFs Inventory (`packages/db/seeds/pdfs/`)

All 24 specification PDFs uploaded and processed for topics:

### Pearson Edexcel IGCSE (14 Syllabi)
1. `international-gcse-in-mathematics-spec-a.pdf` → Mathematics A (`4MA1`)
2. `international-gcse-in-mathematics-spec-b.pdf` → Mathematics B (`4MB1`)
3. `international-gcse-in-further-pure-mathematics-spec.pdf` → Further Pure Mathematics (`4PM1`)
4. `international-gcse-physics-2017-specification.pdf` → Physics (`4PH1`)
5. `international-gcse-chemistry-2017-specification.pdf` → Chemistry (`4CH1`)
6. `international-gcse-biology-2017-specification1.pdf` → Biology (`4BI1`)
7. `international-gcse-human-biology-2017-spec.pdf` → Human Biology (`4HB1`)
8. `international-gcse-in-Computer-Science-Specification.pdf` → Computer Science (`4CP0`)
9. `international-gcse-in-ict-spec.pdf` → Information & Communication Technology (`4IT1`)
10. `international-gcse-english-lang-b-specification.pdf` → English Language B (`4EB1`)
11. `int-gcse-english-esl.pdf` → English as a Second Language (`4ES1`)
12. `international-gcse-spec-9781446942789.pdf` → Economics (`4EC1`)
13. `9781446942765-international-gcse-business-specification.pdf` → Business (`4BS1`)
14. `ig-accountancy-spec.pdf` → Accounting (`4AC1`)

### Pearson Edexcel IAL (10 Subject Areas / Specifications)
1. `international-a-level-maths-spec.pdf` → Mathematics Suite (`WMA11`–`14`, `WFM01`–`03`, `WME01`–`03`, `WST01`–`03`, `WDM11`)
2. `9781446957783_IAL_Physics_Iss3.pdf` → Physics (`WPH11`–`WPH16`)
3. `International-A-Level-Chemistry-Spec.pdf` → Chemistry (`WCH11`–`WCH16`)
4. `International-A-Level-Biology-Spec.pdf` → Biology (`WBI11`–`WBI16`)
5. `International-A-Level-Business-Spec.pdf` → Business (`WBS11`–`WBS14`)
6. `International-A-Level-Economics-spec.pdf` → Economics (`WEC11`–`WEC14`)
7. `pearson-edexcel-ial-accounting-specification.pdf` → Accounting (`WAC11`–`WAC12`)
8. `International-AL-Information-Technology-Spec.pdf` → Information Technology (`WIT11`–`WIT14`)
9. `ial-computer-science-specification.pdf` → Computer Science (`WCP01`–`WCP04`)
10. `ial-psychology-specification.pdf` → Psychology (`WPS01`–`WPS04`)

---

## 5. Next Priorities & Data Milestones

1. **Edexcel IGCSE Past Papers (`past_papers`)**:
   - Seed past paper records (Paper 1, Paper 2, etc.) for 2022–2025 across all 14 subjects.
2. ~~**Edexcel IAL Maths Suite Past Papers**~~ ✅ Complete (`0033`) — Jan/Jun/Oct 2022–2026 for all 14 units.
3. **Grade Boundaries for Calculator (`paper_grade_boundaries`)**:
   - Extract raw mark grade boundaries for Edexcel IGCSE (Grades 9–1).
   - Extract raw marks and UMS conversions for Edexcel IAL maths units (WMA11–WMA14, WME01–WME02, WST01–WST02 priority).
4. **CAIE A-Level Topics**:
   - Extract syllabus topics for the 12 CAIE A-Level subjects into `0010_topics_caie_alevel.sql`.
5. **D1 Remote Sync** (`--remote` flag):
   - Apply `drizzle-d1/0008_maths_suite_subject_columns.sql` + seeds 0031–0033 to the remote `the-ants-db` instance after local validation.