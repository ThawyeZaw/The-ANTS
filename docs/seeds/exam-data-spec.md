# The ANTS — Exam Data & Past Paper SQL Seed Specification

> **Start here for coverage + apply commands:** [`README.md`](./README.md)
>
> **Target Database:** Cloudflare D1 (SQLite)  
> **Supported Exam Boards & Curriculums:**
> 1. **CAIE IGCSE** (Cambridge Assessment International Education)
> 2. **CAIE A Levels** (Cambridge International AS & A Level)
> 3. **Edexcel Pearson IGCSE** (Pearson Edexcel International GCSE)
> 4. **Edexcel International Advanced Levels (IAL)** (Pearson Edexcel Modular A Level)

---

## 1. Database Schema Reference

All IDs are standard text UUIDs (`crypto.randomUUID()` in JS or fixed UUIDs / deterministic slugs in seed SQL). Timestamps are integer milliseconds (`timestamp_ms` unix epoch, e.g., `1716336000000` or `strftime('%s', 'now') * 1000`).

### 1.1 `curriculums` Table
Defines the top-level qualification boards.
```sql
CREATE TABLE curriculums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at INTEGER
);
```

### 1.2 `subjects` Table
Defines subjects offered under each curriculum.
```sql
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- Official syllabus code (e.g., '0580', '9709', '4MA1', 'WMA11')
  description TEXT,
  icon_url TEXT,
  color_code TEXT,    -- Hex color (e.g., '#3b82f6')
  created_at INTEGER
);
```

### 1.3 `past_papers` Table
Catalog of official past exam papers.
```sql
CREATE TABLE past_papers (
  id TEXT PRIMARY KEY,
  exam_board TEXT NOT NULL,       -- 'CAIE' | 'Edexcel'
  qualification TEXT NOT NULL,    -- 'IGCSE' | 'IAL' | 'A Level'
  subject TEXT NOT NULL,          -- Subject name, e.g., 'Mathematics'
  syllabus_code TEXT NOT NULL,    -- e.g., '0580'
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  curriculum_id TEXT REFERENCES curriculums(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,          -- e.g., 2023
  series TEXT NOT NULL,           -- 'May/June' | 'Oct/Nov' | 'Jan' | 'Feb/March'
  paper_number TEXT NOT NULL,     -- e.g., '1', '2', '3', '4'
  variant TEXT,                   -- e.g., '1', '2', '3' for CAIE zone variants, or NULL for Edexcel
  title TEXT,                     -- e.g., 'Paper 2 (Extended)' or 'Unit 1: Pure Mathematics 1'
  total_marks INTEGER,            -- Maximum raw marks on this paper, e.g., 75, 80, 100
  duration_minutes INTEGER,       -- Exam length in minutes, e.g., 90, 120
  created_at INTEGER
);
```

### 1.4 `paper_grade_boundaries` Table
Structured grade thresholds for each past paper or composite series.
- **For CAIE & Edexcel IGCSE**: Uses `min_mark` and `max_mark` (raw marks). `ums_min`/`ums_max` are `NULL`.
- **For Edexcel IAL**: Uses `min_mark` (raw threshold) AND `ums_min` / `ums_max` (uniform mark scale).
```sql
CREATE TABLE paper_grade_boundaries (
  id TEXT PRIMARY KEY,
  past_paper_id TEXT NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,            -- 'A*', 'A', 'B', 'C', 'D', 'E', 'U'
  min_mark INTEGER NOT NULL,      -- Minimum raw score to achieve this grade
  max_mark INTEGER,               -- Maximum raw score for this grade band
  ums_min INTEGER,                -- Minimum UMS for this grade (Edexcel IAL only)
  ums_max INTEGER,                -- Maximum UMS for this grade (Edexcel IAL only)
  created_at INTEGER
);
```

### 1.5 `exams` & `exam_countdowns` Table (Official Exam Sessions)
For upcoming official exam dates displayed on user countdown cards.
```sql
CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  curriculum_id TEXT REFERENCES curriculums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,            -- e.g., 'CAIE IGCSE Mathematics Paper 2 (Extended)'
  exam_board TEXT,                -- 'CAIE' | 'Edexcel'
  qualification_type TEXT,        -- 'IGCSE' | 'IAL' | 'A Level'
  syllabus_code TEXT,             -- '0580'
  season TEXT,                    -- 'May/June'
  series TEXT,                    -- '2026'
  paper_number TEXT,              -- '2'
  exam_date INTEGER,              -- Epoch ms of scheduled exam
  duration_minutes INTEGER,       -- 90
  total_marks INTEGER,            -- 70
  created_at INTEGER
);
```

### 1.6 `subject_grade_boundaries` Table (syllabus composite)
Cambridge publishes **overall** subject thresholds (sum of components) separately from per-paper rows. The grade calculator uses these for predicted overall grade. If no rows exist for a series, the UI falls back to percentage bands and labels the result as an estimate.

```sql
CREATE TABLE subject_grade_boundaries (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,           -- e.g. 2023
  series TEXT NOT NULL,            -- 'May/June' | 'Oct/Nov' | 'Feb/March'
  variant TEXT,                    -- '1' | '2' | '3' or NULL
  tier TEXT,                       -- 'core' | 'extended' | NULL
  grade TEXT NOT NULL,             -- 'A*', 'A', …
  min_mark INTEGER NOT NULL,       -- minimum TOTAL raw mark across components
  max_mark INTEGER,
  created_at INTEGER
);
```

---

## 2. Seed Data Template (Example SQL)

The following SQL can be executed directly against Cloudflare D1 via `wrangler d1 execute the-ants-db --command="..."` or via a `.sql` migration file.

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Curriculums Seed
-- ─────────────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO curriculums (id, name, code, description, created_at) VALUES
('curr-caie-igcse', 'Cambridge IGCSE', 'CAIE_IGCSE', 'Cambridge Assessment International Education IGCSE', strftime('%s', 'now') * 1000),
('curr-caie-alevel', 'Cambridge International A Level', 'CAIE_ALEVEL', 'Cambridge International AS & A Levels', strftime('%s', 'now') * 1000),
('curr-edexcel-igcse', 'Pearson Edexcel IGCSE', 'EDEXCEL_IGCSE', 'Pearson Edexcel International GCSE (9-1)', strftime('%s', 'now') * 1000),
('curr-edexcel-ial', 'Pearson Edexcel IAL', 'EDEXCEL_IAL', 'Pearson Edexcel International Advanced Levels (Modular)', strftime('%s', 'now') * 1000);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Core Subjects Seed
-- ─────────────────────────────────────────────────────────────────────────────
-- CAIE IGCSE
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-caie-igcse-maths', 'curr-caie-igcse', 'Mathematics', '0580', 'Cambridge IGCSE Mathematics without coursework', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-caie-igcse-phys', 'curr-caie-igcse', 'Physics', '0625', 'Cambridge IGCSE Physics', '#8b5cf6', strftime('%s', 'now') * 1000),
('subj-caie-igcse-chem', 'curr-caie-igcse', 'Chemistry', '0620', 'Cambridge IGCSE Chemistry', '#ec4899', strftime('%s', 'now') * 1000),
('subj-caie-igcse-bio', 'curr-caie-igcse', 'Biology', '0610', 'Cambridge IGCSE Biology', '#10b981', strftime('%s', 'now') * 1000),
('subj-caie-igcse-cs', 'curr-caie-igcse', 'Computer Science', '0478', 'Cambridge IGCSE Computer Science', '#f59e0b', strftime('%s', 'now') * 1000);

-- CAIE A Levels
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-caie-al-maths', 'curr-caie-alevel', 'Mathematics', '9709', 'Cambridge International AS & A Level Mathematics', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-caie-al-phys', 'curr-caie-alevel', 'Physics', '9702', 'Cambridge International AS & A Level Physics', '#8b5cf6', strftime('%s', 'now') * 1000),
('subj-caie-al-chem', 'curr-caie-alevel', 'Chemistry', '9701', 'Cambridge International AS & A Level Chemistry', '#ec4899', strftime('%s', 'now') * 1000);

-- Edexcel IGCSE
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-edx-igcse-maths-a', 'curr-edexcel-igcse', 'Mathematics A', '4MA1', 'Pearson Edexcel International GCSE (9-1) Mathematics A', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-edx-igcse-phys', 'curr-edexcel-igcse', 'Physics', '4PH1', 'Pearson Edexcel International GCSE (9-1) Physics', '#8b5cf6', strftime('%s', 'now') * 1000);

-- Edexcel IAL
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-edx-ial-pure1', 'curr-edexcel-ial', 'Pure Mathematics 1', 'WMA11', 'Pearson Edexcel IAL Pure Mathematics Unit 1', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-edx-ial-pure2', 'curr-edexcel-ial', 'Pure Mathematics 2', 'WMA12', 'Pearson Edexcel IAL Pure Mathematics Unit 2', '#2563eb', strftime('%s', 'now') * 1000),
('subj-edx-ial-pure3', 'curr-edexcel-ial', 'Pure Mathematics 3', 'WMA13', 'Pearson Edexcel IAL Pure Mathematics Unit 3', '#1d4ed8', strftime('%s', 'now') * 1000),
('subj-edx-ial-phys1', 'curr-edexcel-ial', 'Physics Unit 1', 'WPH11', 'Pearson Edexcel IAL Mechanics & Materials', '#8b5cf6', strftime('%s', 'now') * 1000);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Past Papers Sample Seed
-- ─────────────────────────────────────────────────────────────────────────────

-- CAIE IGCSE Mathematics (0580) May/June 2023 Paper 2 Variant 2
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-0580-s23-qp-22', 'CAIE', 'IGCSE', 'Mathematics', '0580', 'subj-caie-igcse-maths', 'curr-caie-igcse', 2023, 'May/June', '2', '2', 'Paper 2 (Extended) Variant 2', 70, 90, strftime('%s', 'now') * 1000),
('pp-0580-s23-qp-42', 'CAIE', 'IGCSE', 'Mathematics', '0580', 'subj-caie-igcse-maths', 'curr-caie-igcse', 2023, 'May/June', '4', '2', 'Paper 4 (Extended) Variant 2', 130, 150, strftime('%s', 'now') * 1000);

-- Edexcel IAL Pure Mathematics 1 (WMA11) June 2023
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-j23-qp-01', 'Edexcel', 'IAL', 'Pure Mathematics 1', 'WMA11', 'subj-edx-ial-pure1', 'curr-edexcel-ial', 2023, 'May/June', '1', NULL, 'Unit 1: Pure Mathematics 1', 75, 90, strftime('%s', 'now') * 1000);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Grade Boundaries Sample Seed
-- ─────────────────────────────────────────────────────────────────────────────

-- Grade boundaries for CAIE IGCSE Maths 0580 May/June 2023 Paper 22 (Max 70)
INSERT OR IGNORE INTO paper_grade_boundaries (id, past_paper_id, grade, min_mark, max_mark, ums_min, ums_max, created_at) VALUES
('gb-0580-s23-22-Astar', 'pp-0580-s23-qp-22', 'A*', 56, 70, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-A',     'pp-0580-s23-qp-22', 'A',  47, 55, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-B',     'pp-0580-s23-qp-22', 'B',  38, 46, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-C',     'pp-0580-s23-qp-22', 'C',  29, 37, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-D',     'pp-0580-s23-qp-22', 'D',  21, 28, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-E',     'pp-0580-s23-qp-22', 'E',  14, 20, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-U',     'pp-0580-s23-qp-22', 'U',   0, 13, NULL, NULL, strftime('%s', 'now') * 1000);

-- Grade boundaries for Edexcel IAL Pure 1 (WMA11) June 2023 (Max 75 raw, Max 100 UMS)
INSERT OR IGNORE INTO paper_grade_boundaries (id, past_paper_id, grade, min_mark, max_mark, ums_min, ums_max, created_at) VALUES
('gb-wma11-j23-01-A', 'pp-wma11-j23-qp-01', 'A', 50, 75, 80, 100, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-B', 'pp-wma11-j23-qp-01', 'B', 43, 49, 70,  79, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-C', 'pp-wma11-j23-qp-01', 'C', 36, 42, 60,  69, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-D', 'pp-wma11-j23-qp-01', 'D', 29, 35, 50,  59, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-E', 'pp-wma11-j23-qp-01', 'E', 22, 28, 40,  49, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-U', 'pp-wma11-j23-qp-01', 'U',  0, 21,  0,  39, strftime('%s', 'now') * 1000);
```

---

## 3. Copy-Paste Prompt Template for External AI Chatbots

Upload the official grade-threshold PDF(s) together with this prompt. Do **not** invent composite totals if the PDF only lists per-component thresholds.

```text
I need a SQL seed script for Cloudflare D1 (SQLite) from the attached official grade threshold PDF(s).

Schemas:
- past_papers (
    id TEXT PRIMARY KEY, exam_board TEXT, qualification TEXT, subject TEXT,
    syllabus_code TEXT, subject_id TEXT, curriculum_id TEXT, year INTEGER,
    series TEXT, paper_number TEXT, variant TEXT, title TEXT,
    total_marks INTEGER, duration_minutes INTEGER, created_at INTEGER
  )
- paper_grade_boundaries (
    id TEXT PRIMARY KEY, past_paper_id TEXT, grade TEXT, min_mark INTEGER,
    max_mark INTEGER, ums_min INTEGER, ums_max INTEGER, created_at INTEGER
  )
- subject_grade_boundaries (
    id TEXT PRIMARY KEY, subject_id TEXT, year INTEGER, series TEXT,
    variant TEXT, tier TEXT, grade TEXT, min_mark INTEGER, max_mark INTEGER,
    created_at INTEGER
  )

Conventions:
1. Target curriculum: [CAIE IGCSE / CAIE A Level / Edexcel IGCSE / Edexcel IAL]
2. Map syllabus codes to existing subjects.id, e.g.:
   0580 → subj-caie-igcse-maths / curr-caie-igcse
   0620 → subj-caie-igcse-chem / curr-caie-igcse
   (use the in-repo seed list if unsure)
3. series values MUST be exactly: 'May/June' | 'Oct/Nov' | 'Feb/March' | 'Jan'
4. paper_number is the component number only ('1','2','4'), NOT '12'. variant is the zone ('1','2','3').
5. CAIE / Edexcel IGCSE: ums_min and ums_max NULL. Edexcel IAL: fill UMS columns.
6. If the PDF has an overall / combination table (e.g. Option BX, Papers 2+4), insert subject_grade_boundaries with tier 'core' or 'extended' and min_mark as the TOTAL raw threshold.
7. Deterministic IDs:
   - past paper: pp-{syllabus}-{s|w|m}{yy}-qp-{paper}{variant}  e.g. pp-0580-s23-qp-22
   - paper boundary: gb-{syllabus}-{s|w|m}{yy}-{paper}{variant}-{grade}  (A* → Astar)
   - composite: sgb-{syllabus}-{s|w|m}{yy}-{tier}-{variant}-{grade}
8. INSERT OR IGNORE only. No duplicate (syllabus, year, series, paper, variant) rows.
9. created_at: strftime('%s', 'now') * 1000
10. Output executable SQL only — no markdown fences, no commentary.
```

### Apply generated SQL

Save as `packages/db/seeds/0007_…sql` or later (**0004 is already used**). Commands: [`README.md`](./README.md).

In-repo CAIE IGCSE PDF parser: `packages/db/seeds/_gen_grade_thresholds.py` (writes `0004_…` today — point `OUT` at a new filename for extra years/codes).

`subject_grade_boundaries` (overall / combination totals) are **not** in 0004 yet. Seed those separately if the PDF has an Option / Papers 2+4 table.

### Other curriculums

Reuse this spec. Differences:
| Board | Grading plugin | Countdown mode | Notes |
|---|---|---|---|
| CAIE IGCSE | raw A*–G, Core/Extended, composite | per subject | Primary; fix calculator logic before expanding codes |
| CAIE A Level | raw A*–E | per subject | Same tables; AS vs A2 papers |
| Edexcel IGCSE | 9–1 raw | per subject | No UMS |
| Edexcel IAL | UMS + cash-in | per paper | Fill ums_min / ums_max |

Do not add new syllabus codes until Core/Extended + variant + composite logic is verified against a known series (e.g. 0580 May/June).

