# Seed playbook — add catalog data

Use this file when adding **subjects**, **topics** (lesson / topic tracker), **past papers**, or **grade-calculator** thresholds. Do **not** invent official marks. Prefer new numbered SQL under `packages/db/seeds/` over editing app code.

**Which syllabi we support:** [`target-catalog.md`](./target-catalog.md)  
Schemas / chatbot prompts: [`curriculum-spec.md`](./curriculum-spec.md) · [`exam-data-spec.md`](./exam-data-spec.md)

---

## Paste this into the other IDE

```text
You are adding seed data only for The ANTS (HONC monorepo).

Read first:
1. docs/seeds/target-catalog.md  — official subject list + reserved IDs (in-db vs reserved)
2. docs/seeds/README.md
3. docs/seeds/curriculum-spec.md and docs/seeds/exam-data-spec.md

Rules:
- Data only: packages/db/seeds/ 0007+. Do not rewrite 0001–0006. Do not rename in-db subject ids.
- Use reserved ids from target-catalog.md exactly. INSERT OR IGNORE.
- Never invent grade thresholds — official PDFs only.
- Four boards only. IAL cash-in codes (XMA01/YMA01…) are NOT subjects; enroll units (WMA11…).
- Further Maths IAL reuses subj-edx-ial-mech2 (WME02) and subj-edx-ial-stat2 (WST02). Do not duplicate.
- Leave out-of-target 4EA1 (subj-edx-igcse-eng-a) unused.
- Topic tracker = subjects + topics. Past papers = past_papers. Calculator = papers + paper_grade_boundaries (+ optional subject_grade_boundaries).
- Append new files to SEED_ORDER in packages/db/seeds/_validate_all_seeds.py and run that script.
- Apply --local before --remote. Watch D1 free-tier read quota.

Work order in target-catalog.md. Output SQL files, not app refactors.
```

---

## What each table feeds

| UI | Route | Required rows |
|---|---|---|
| Curriculum hub / enroll | `/curriculum` | `curriculums`, `subjects` |
| Topic / lesson tracker | `/curriculum/[id]/[subjectId]` | `topics` (progress is per-user, do not seed) |
| Past paper tracker | `/past-papers` | `past_papers` (`subject_id` **must** match). Boundaries optional but needed for inline grade |
| Grade calculator | `/calculator` | `past_papers` + `paper_grade_boundaries` for that `subject_id`. Overall grade uses `subject_grade_boundaries` if present |
| Exam countdown catalog | `/countdown` | `exams` (upcoming dates). Separate from past papers |

User tables (`user_enrollments`, `topic_progress`, `user_past_paper_records`, `exam_countdowns`) are **not** seed data.

---

## Databases and apply commands

| Target | Name | When |
|---|---|---|
| Production / default `npm run dev:api` | `the-ants-db` | After local validate |
| Shared preview | `the-ants-db-dev` | Optional |
| Isolated local | `--local` | Always first |

```bash
# Syntax-check against a throwaway SQLite clone (update SEED_ORDER first)
python packages/db/seeds/_validate_all_seeds.py

# Local D1 (safe)
npx wrangler d1 execute the-ants-db --local -c apps/api/wrangler.jsonc --file=packages/db/seeds/0007_YOUR_FILE.sql

# Production D1 (quota-sensitive — prefer off-peak / after midnight UTC)
npx wrangler d1 execute the-ants-db --remote -c apps/api/wrangler.jsonc --file=packages/db/seeds/0007_YOUR_FILE.sql

# Shared preview DB
npx wrangler d1 execute the-ants-db-dev --remote -c apps/api/wrangler.shared.jsonc --file=packages/db/seeds/0007_YOUR_FILE.sql
```

Seeds are **not** Drizzle migrations. Do not put catalog INSERTs in `packages/db/drizzle-d1/`.

---

## File numbering (do not reuse)

| File | Status | Contents |
|---|---|---|
| `0001_exam_data_seed.sql` | Done | 4 boards + original subjects + leftover sample papers |
| `0002_topics_CAIE_IGCSE_subjects.sql` | Done | Extra CAIE IGCSE subjects + **all CAIE IGCSE topics** |
| `0003_cleanup_sample_data.sql` | Done | Deletes a few 0001 sample papers/boundaries |
| `0004_caie_igcse_grade_thresholds.sql` | Done | CAIE IGCSE papers + **per-paper** boundaries (12 syllabi) |
| `0005_subjects_countdown_boards.sql` | Done | Extra CAIE A Level + Edexcel catalog subjects |
| `0006_exams_w26_countdown.sql` | Done | Oct/Nov 2026 official dates |
| `0022_edexcel_igcse_grade_thresholds.sql` | Done | Edexcel IGCSE papers + 9–1 boundaries |
| `0023_caie_alevel_grade_thresholds.sql` | Stub | No A Level GB PDFs in `pdfs/CIE` yet — re-run `_gen_caie_alevel_thresholds.py` |
| `0024_edexcel_ial_grade_thresholds.sql` | Done | IAL unit papers + UMS (`_gen_edexcel_ial_thresholds.py`) |
| `0025_caie_igcse_subject_composites.sql` | Done | CAIE IGCSE option/composite tables |
| `0026_exams_series_paper_validation.sql` | Done | 9626 Zone 4 Nov 2026 papers |

Suggested names (target list: [`target-catalog.md`](./target-catalog.md)):

- `0007_subjects_target_gaps.sql` — reserved subject INSERTs only
- `0008_topics_caie_alevel.sql`
- `0009_topics_edexcel_igcse.sql`
- `0010_topics_edexcel_ial.sql`
- `0023_caie_alevel_grade_thresholds.sql` — A Level GB PDFs when available
- `0024_edexcel_ial_grade_thresholds.sql` — IAL UMS from Pearson PDFs
- `0025_caie_igcse_subject_composites.sql` — IGCSE option composites
- `0026_exams_series_paper_validation.sql` — 0417/9626 series papers

After adding a file, append it to `SEED_ORDER` in `packages/db/seeds/_validate_all_seeds.py`.

---

## Conventions (must match app filters)

| Field | Allowed values |
|---|---|
| `curriculums.code` | `CAIE_IGCSE` · `CAIE_ALEVEL` · `EDEXCEL_IGCSE` · `EDEXCEL_IAL` |
| `past_papers.exam_board` | `CAIE` · `Edexcel` |
| `past_papers.qualification` | `IGCSE` · `A Level` · `IAL` |
| `series` (papers / composites) | `May/June` · `Oct/Nov` · `Feb/March` · `Jan` |
| `paper_number` | Component only: `'1'`, `'2'`, `'4'` — **not** `'12'` |
| `variant` | CAIE zone `'1'`/`'2'`/`'3'`; Edexcel usually `NULL` |
| `tier` (composites / enroll) | `core` · `extended` · `NULL` |
| `difficulty_level` | `easy` · `medium` · `hard` |
| timestamps | `strftime('%s', 'now') * 1000` |

IDs:

| Row | Format | Example |
|---|---|---|
| curriculum | `curr-[board]-[level]` | `curr-caie-igcse` |
| subject | `subj-[board]-[level]-[short]` | `subj-caie-igcse-maths` |
| topic | `topic-[same-short]-[01]` | `topic-caie-igcse-maths-01` |
| past paper | `pp-{code}-{s\|w\|m}{yy}-qp-{paper}{variant}` | `pp-0580-s23-qp-22` |
| paper boundary | `gb-{code}-{s\|w\|m}{yy}-{paper}{variant}-{grade}` | `gb-0580-s23-22-Astar` (`A*` → `Astar`) |
| composite | `sgb-{code}-{s\|w\|m}{yy}-{tier}-{variant}-{grade}` | `sgb-0580-s23-extended-2-A` |

`subject_id` / `curriculum_id` on papers **must** match an existing subject. Calculator and tracker filter by those FKs, not by the denormalized `subject` name.

---

## Catalog

**Canonical list + reserved IDs:** [`target-catalog.md`](./target-catalog.md)

Boards: `curr-caie-igcse` · `curr-caie-alevel` · `curr-edexcel-igcse` · `curr-edexcel-ial`

Quick coverage:

| Board | Subjects | Topics | Calculator papers |
|---|---|---|---|
| CAIE IGCSE (12 target) | all in-db | yes (`0002`) | yes (`0004`) |
| Edexcel IGCSE (14 target) | 9 in-db, 5 reserved | none | none |
| CAIE A Level (12 target) | 6 in-db, 6 reserved | none | leftover 9709 samples only |
| Edexcel IAL (units) | most science/math/econ/biz/acc in-db; FM extras + IT/CS/English reserved | none | none |

Core/Extended plugin codes: **0580, 0610, 0620, 0625**. Edexcel IGCSE is 9–1. IAL fills UMS.

---

## Recipes

### A. New subject on an existing board

```sql
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-caie-igcse-hist', 'curr-caie-igcse', 'History', '0470',
 'Cambridge IGCSE History', '#ef4444', strftime('%s', 'now') * 1000);
```

Then topics (and later papers). Colors: maths `#3b82f6`, physics `#8b5cf6`, chemistry `#ec4899`, biology `#10b981`, CS/ICT `#f59e0b`, English `#f97316`, economics `#14b8a6`, business `#6366f1`, accounting `#eab308`, history `#ef4444`.

If the syllabus is Core/Extended, add its paper numbers to `TIERED_SYLLABI` in `apps/web/src/lib/grading/caie-igcse.ts` — that is the one justified app edit.

### B. Topics (topic tracker)

Use the prompt in [`curriculum-spec.md`](./curriculum-spec.md) §6 with the official syllabus PDF. One file per board or per subject is fine.

### C. Past papers + calculator (official thresholds only)

Use the prompt in [`exam-data-spec.md`](./exam-data-spec.md) §3 and attach the PDF.

- CAIE / Edexcel IGCSE: `ums_min` / `ums_max` = `NULL`
- Edexcel IAL: fill UMS
- Combination / overall tables → `subject_grade_boundaries` (still empty in prod seeds)
- Generator for CAIE IGCSE PDFs: `packages/db/seeds/_gen_grade_thresholds.py` (point `PDFS` + `SUBJECTS` at new files)

### D. Upcoming exam dates

Follow `0006_exams_w26_countdown.sql`. `exam_date` is epoch **milliseconds**. `season` = `May/June` or `Oct/Nov`; `series` in 0006 is a short code like `w26` (countdown display joins season + series).

---

## Do not

- Do not add IELTS / OSSD / GED / a fifth `curriculums` row without a new plugin in `apps/web/src/lib/grading/`.
- Do not seed user progress, enrollments, or countdowns.
- Do not `SELECT *` huge tables to “check” remote D1 while free-tier quota is tight; use `COUNT(*)` / `LIMIT`.
- Do not change existing subject IDs — enrollments and papers already point at them.
- Do not put markdown fences in committed `.sql` files.

---

## After applying

1. `python packages/db/seeds/_validate_all_seeds.py`
2. Restart or wait ~60s (API catalog cache).
3. In the app: enroll the subject → `/curriculum/...` topics → `/past-papers?subject=` grid → `/calculator?subject=` series list.
