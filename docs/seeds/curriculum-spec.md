# The ANTS — Curriculum & Lesson Tracker SQL Seed Specification

> **Target Database:** Cloudflare D1 (SQLite)
> **Purpose:** Seed curriculum boards, subjects, and syllabus topics for the Lesson Tracker feature.
> **Tables involved:** `curriculums`, `subjects`, `topics`

---

## 1. Database Schema Reference

All IDs are fixed slug-style text IDs (not UUIDs) for determinism and human-readability in seed files.
Timestamps are integer milliseconds: `strftime('%s', 'now') * 1000`.

### 1.1 `curriculums` Table

Defines the top-level qualification boards (4 supported boards).

```sql
CREATE TABLE curriculums (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,  -- e.g., 'CAIE_IGCSE', 'EDEXCEL_IAL'
  description TEXT,
  icon_url   TEXT,
  created_at INTEGER
);
```

### 1.2 `subjects` Table

Individual syllabus subjects under each curriculum.

```sql
CREATE TABLE subjects (
  id            TEXT PRIMARY KEY,
  curriculum_id TEXT NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,        -- e.g., 'Mathematics', 'Physics', 'Chemistry'
  code          TEXT NOT NULL,        -- Official syllabus code: '0580', '9709', '4MA1', 'WMA11'
  description   TEXT,
  icon_url      TEXT,
  color_code    TEXT,                 -- Hex color for UI (e.g., '#3b82f6')
  created_at    INTEGER
);
```

### 1.3 `topics` Table

Syllabus chapters/topics for each subject. This is the primary data the Lesson Tracker displays.

```sql
CREATE TABLE topics (
  id               TEXT PRIMARY KEY,
  subject_id       TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,         -- Chapter/topic name from official syllabus
  description      TEXT,                  -- Brief description of what the topic covers
  order_index      INTEGER DEFAULT 0,     -- Order within the subject (1, 2, 3...)
  subtopics_count  INTEGER DEFAULT 0,     -- Number of sub-sections (for display progress)
  difficulty_level TEXT,                  -- 'easy' | 'medium' | 'hard'
  estimated_hours  INTEGER,               -- Estimated study time in hours
  created_at       INTEGER,
  updated_at       INTEGER
);
```

---

## 2. ID Conventions

Use short deterministic slug IDs so seeds are idempotent (`INSERT OR IGNORE`):

| Table      | Format                                              | Example                               |
|------------|-----------------------------------------------------|---------------------------------------|
| curriculum | `curr-[board]-[level]`                              | `curr-caie-igcse`                     |
| subject    | `subj-[board]-[level]-[short-name]`                 | `subj-caie-igcse-maths`               |
| topic      | `topic-[short-subject-slug]-[zero-padded-2-digits]` | `topic-caie-igcse-maths-01`           |

---

## 3. Seeded Curriculums (Fixed — Do Not Change IDs)

These four are already seeded in `0001_exam_data_seed.sql`. Use the exact IDs below when inserting subjects and topics:

```sql
-- Already seeded — reference only (do NOT re-insert)
-- 'curr-caie-igcse'    → Cambridge IGCSE (CAIE_IGCSE)
-- 'curr-caie-alevel'   → Cambridge International A Level (CAIE_ALEVEL)
-- 'curr-edexcel-igcse' → Pearson Edexcel IGCSE (EDEXCEL_IGCSE)
-- 'curr-edexcel-ial'   → Pearson Edexcel IAL (EDEXCEL_IAL)
```

---

## 4. Seeded Subjects (Fixed — Do Not Change IDs)

These subjects are already seeded in `0001_exam_data_seed.sql`. Reference their IDs when inserting topics:

| Subject ID                | Curriculum          | Name                   | Code  | Color     |
|---------------------------|---------------------|------------------------|-------|-----------|
| `subj-caie-igcse-maths`   | CAIE IGCSE          | Mathematics            | 0580  | `#3b82f6` |
| `subj-caie-igcse-phys`    | CAIE IGCSE          | Physics                | 0625  | `#8b5cf6` |
| `subj-caie-igcse-chem`    | CAIE IGCSE          | Chemistry              | 0620  | `#ec4899` |
| `subj-caie-igcse-bio`     | CAIE IGCSE          | Biology                | 0610  | `#10b981` |
| `subj-caie-igcse-cs`      | CAIE IGCSE          | Computer Science       | 0478  | `#f59e0b` |
| `subj-caie-al-maths`      | CAIE A Level        | Mathematics            | 9709  | `#3b82f6` |
| `subj-caie-al-phys`       | CAIE A Level        | Physics                | 9702  | `#8b5cf6` |
| `subj-caie-al-chem`       | CAIE A Level        | Chemistry              | 9701  | `#ec4899` |
| `subj-edx-igcse-maths-a`  | Edexcel IGCSE       | Mathematics A          | 4MA1  | `#3b82f6` |
| `subj-edx-igcse-phys`     | Edexcel IGCSE       | Physics                | 4PH1  | `#8b5cf6` |
| `subj-edx-ial-pure1`      | Edexcel IAL         | Pure Mathematics 1     | WMA11 | `#3b82f6` |
| `subj-edx-ial-pure2`      | Edexcel IAL         | Pure Mathematics 2     | WMA12 | `#2563eb` |
| `subj-edx-ial-pure3`      | Edexcel IAL         | Pure Mathematics 3     | WMA13 | `#1d4ed8` |
| `subj-edx-ial-phys1`      | Edexcel IAL         | Physics Unit 1         | WPH11 | `#8b5cf6` |

---

## 5. Sample Topic Seed (CAIE IGCSE Mathematics 0580)

This demonstrates the format. Generate equivalent blocks for every subject using the AI prompt in Section 6.

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Topics: CAIE IGCSE Mathematics (0580)
-- Source: Cambridge IGCSE Mathematics (0580) Syllabus 2023–2025
-- ─────────────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO topics (id, subject_id, name, description, order_index, subtopics_count, difficulty_level, estimated_hours, created_at, updated_at) VALUES
('topic-caie-igcse-maths-01', 'subj-caie-igcse-maths', 'Number',
  'Integers, fractions, decimals, powers, roots, standard form, ratio, proportion, percentages.',
  1, 12, 'medium', 8, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-02', 'subj-caie-igcse-maths', 'Algebra and Graphs',
  'Equations, inequalities, sequences, functions, quadratics, simultaneous equations, graphical methods.',
  2, 15, 'hard', 12, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-03', 'subj-caie-igcse-maths', 'Coordinate Geometry',
  'Straight line graphs, gradient, midpoint, distance, equations of lines.',
  3, 6, 'medium', 5, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-04', 'subj-caie-igcse-maths', 'Geometry',
  'Angles, triangles, polygons, circles, constructions, loci, similarity and congruence.',
  4, 10, 'medium', 8, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-05', 'subj-caie-igcse-maths', 'Mensuration',
  'Perimeter, area, and volume of 2D and 3D shapes including cylinders, cones, spheres.',
  5, 8, 'medium', 6, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-06', 'subj-caie-igcse-maths', 'Trigonometry',
  'Right-angled triangles, sine rule, cosine rule, bearings, 3D trigonometry.',
  6, 7, 'hard', 7, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-07', 'subj-caie-igcse-maths', 'Matrices and Transformations',
  'Matrix operations, determinants, inverse matrices, 2D geometric transformations.',
  7, 8, 'hard', 6, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-08', 'subj-caie-igcse-maths', 'Probability',
  'Basic probability, combined events, tree diagrams, conditional probability.',
  8, 6, 'medium', 5, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-09', 'subj-caie-igcse-maths', 'Statistics',
  'Data collection, frequency tables, averages, range, cumulative frequency, histograms, scatter diagrams.',
  9, 9, 'medium', 7, strftime('%s','now')*1000, strftime('%s','now')*1000),

('topic-caie-igcse-maths-10', 'subj-caie-igcse-maths', 'Vectors',
  'Vector notation, addition, subtraction, scalar multiplication, column vectors, magnitude.',
  10, 5, 'hard', 4, strftime('%s','now')*1000, strftime('%s','now')*1000);
```

---

## 6. Copy-Paste Prompt Template for External AI Chatbots

Copy the prompt below into **Claude / ChatGPT / Gemini**, replacing the bracketed fields with the subject you want:

```text
I need a SQL seed script for Cloudflare D1 (SQLite) for curriculum topics used in a lesson tracker app.

Here is the exact schema:

Table: topics
Columns: (id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, order_index INTEGER, subtopics_count INTEGER, difficulty_level TEXT, estimated_hours INTEGER, created_at INTEGER, updated_at INTEGER)

Rules:
- id format: 'topic-[short-subject-slug]-[zero-padded-2-digit-order]'
  Examples: 'topic-caie-igcse-phys-01', 'topic-caie-al-maths-03', 'topic-edx-ial-pure1-02'
- difficulty_level: must be exactly one of 'easy', 'medium', or 'hard'
- estimated_hours: realistic total study hours for this topic (range: 2–15)
- subtopics_count: number of sub-sections / bullet points within this chapter from the official syllabus
- created_at and updated_at: use strftime('%s', 'now') * 1000
- Use INSERT OR IGNORE statements only

Subject to generate topics for:
  Name: [e.g., CAIE IGCSE Physics]
  subject_id: [e.g., 'subj-caie-igcse-phys']
  Syllabus code: [e.g., 0625]
  Board: [e.g., Cambridge Assessment International Education (CAIE)]

Source: Official [BOARD] [SUBJECT NAME] ([SYLLABUS CODE]) Syllabus (most recent available version).

Instructions:
1. Generate topics for ALL chapters / major sections listed in the official syllabus — do not omit any.
2. For each topic:
   - name: exact chapter/section heading as listed in the official syllabus document
   - description: 1–2 sentence plain-English summary of what this topic covers (key concepts only)
   - order_index: sequential integer starting from 1
   - subtopics_count: count of numbered/bulleted sub-points under that chapter
   - difficulty_level: your informed estimate of relative difficulty
   - estimated_hours: realistic study time estimate

Output ONLY pure executable SQL INSERT OR IGNORE statements. No markdown, no code blocks, no explanations.
```

---

## 7. Adding New Subjects to the Catalog

To seed a subject that is not yet in the database, first insert the subject row, then insert its topics.

### Step 1 — Insert Subject

```sql
-- Example: Adding CAIE IGCSE First Language English (0500)
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-caie-igcse-eng', 'curr-caie-igcse', 'First Language English', '0500',
 'Cambridge IGCSE First Language English', '#f97316', strftime('%s', 'now') * 1000);
```

### Step 2 — Generate Topics with AI

Use the prompt from Section 6 with:
- `subject_id = 'subj-caie-igcse-eng'`
- `Name: CAIE IGCSE First Language English`
- `Syllabus code: 0500`

### Step 3 — Save Output to a Seed File

Save the AI output to `packages/db/seeds/0003_topics_caie_igcse_english.sql` (or next available number).

### Step 4 — Execute Against D1

```bash
# Remote (production D1)
npx wrangler d1 execute the-ants-db --remote --file=packages/db/seeds/0003_topics_caie_igcse_english.sql

# Local development D1
npx wrangler d1 execute the-ants-db --local --file=packages/db/seeds/0003_topics_caie_igcse_english.sql
```

---

## 8. Recommended Seed File Naming Convention

Keep seed files numbered for ordered execution:

| File                                                    | Contents                                                        |
|---------------------------------------------------------|-----------------------------------------------------------------|
| `packages/db/seeds/0001_exam_data_seed.sql`             | Curriculums, subjects, past papers, grade boundaries ✅ Done    |
| `packages/db/seeds/0002_topics_caie_igcse_maths.sql`    | CAIE IGCSE Mathematics (0580) topics                           |
| `packages/db/seeds/0003_topics_caie_igcse_phys.sql`     | CAIE IGCSE Physics (0625) topics                               |
| `packages/db/seeds/0004_topics_caie_igcse_chem.sql`     | CAIE IGCSE Chemistry (0620) topics                             |
| `packages/db/seeds/0005_topics_caie_igcse_bio.sql`      | CAIE IGCSE Biology (0610) topics                               |
| `packages/db/seeds/0006_topics_caie_igcse_cs.sql`       | CAIE IGCSE Computer Science (0478) topics                      |
| `packages/db/seeds/0007_topics_caie_al_maths.sql`       | CAIE A Level Mathematics (9709) topics                         |
| `packages/db/seeds/0008_topics_caie_al_phys.sql`        | CAIE A Level Physics (9702) topics                             |
| `packages/db/seeds/0009_topics_caie_al_chem.sql`        | CAIE A Level Chemistry (9701) topics                           |
| `packages/db/seeds/0010_topics_edx_igcse_maths.sql`     | Edexcel IGCSE Mathematics A (4MA1) topics                      |
| `packages/db/seeds/0011_topics_edx_igcse_phys.sql`      | Edexcel IGCSE Physics (4PH1) topics                            |
| `packages/db/seeds/0012_topics_edx_ial_pure1.sql`       | Edexcel IAL Pure Mathematics 1 (WMA11) topics                  |
| `packages/db/seeds/0013_topics_edx_ial_pure2.sql`       | Edexcel IAL Pure Mathematics 2 (WMA12) topics                  |
| `packages/db/seeds/0014_topics_edx_ial_pure3.sql`       | Edexcel IAL Pure Mathematics 3 (WMA13) topics                  |
| `packages/db/seeds/0015_topics_edx_ial_phys1.sql`       | Edexcel IAL Physics Unit 1 (WPH11) topics                      |

---

## 9. Subject Color Palette Reference

Use these consistent hex colors per subject across all seeds to maintain visual consistency in the app:

| Subject           | Color       | Hex       |
|-------------------|-------------|-----------|
| Mathematics       | Blue        | `#3b82f6` |
| Physics           | Purple      | `#8b5cf6` |
| Chemistry         | Pink/Rose   | `#ec4899` |
| Biology           | Green       | `#10b981` |
| Computer Science  | Amber       | `#f59e0b` |
| English           | Orange      | `#f97316` |
| Economics         | Teal        | `#14b8a6` |
| History           | Red         | `#ef4444` |
| Geography         | Lime        | `#84cc16` |
| Business          | Indigo      | `#6366f1` |
| Accounting        | Yellow      | `#eab308` |
| Sociology         | Rose        | `#f43f5e` |
