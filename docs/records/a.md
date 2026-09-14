Ran command: `python -c "
import sqlite3
from pathlib import Path

ROOT = Path('packages/db')
SEEDS = ROOT / 'seeds'
DRIZZLE = ROOT / 'drizzle-d1'

from seeds._validate_all_seeds import split_sql, SEED_ORDER

con = sqlite3.connect(':memory:')
for mig in sorted(DRIZZLE.glob('*.sql')):
    for stmt in split_sql(mig.read_text(encoding='utf-8')):
        try: con.execute(stmt)
        except Exception: pass

for name in SEED_ORDER:
    for stmt in split_sql((SEEDS / name).read_text(encoding='utf-8')):
        try: con.execute(stmt)
        except Exception: pass

print('--- SUBJECTS PER CURRICULUM ---')
for row in con.execute('SELECT c.code, COUNT(s.id) FROM curriculums c LEFT JOIN subjects s ON s.curriculum_id = c.id GROUP BY c.code'):
    print(row)

print('\n--- TOPICS PER CURRICULUM ---')
for row in con.execute('SELECT c.code, COUNT(t.id) FROM curriculums c LEFT JOIN subjects s ON s.curriculum_id = c.id LEFT JOIN topics t ON t.subject_id = s.id GROUP BY c.code'):
    print(row)

print('\n--- PAST PAPERS PER CURRICULUM ---')
for row in con.execute('SELECT c.code, COUNT(pp.id) FROM curriculums c LEFT JOIN subjects s ON s.curriculum_id = c.id LEFT JOIN past_papers pp ON pp.subject_id = s.id GROUP BY c.code'):
    print(row)

print('\n--- PAPER GRADE BOUNDARIES ---')
for row in con.execute('SELECT c.code, COUNT(b.id) FROM curriculums c LEFT JOIN subjects s ON s.curriculum_id = c.id LEFT JOIN past_papers pp ON pp.subject_id = s.id LEFT JOIN paper_grade_boundaries b ON b.past_paper_id = pp.id GROUP BY c.code'):
    print(row)

print('\n--- EXAM COUNTDOWN ---')
for row in con.execute('SELECT c.code, COUNT(e.id) FROM curriculums c LEFT JOIN subjects s ON s.curriculum_id = c.id LEFT JOIN exams e ON e.subject_id = s.id GROUP BY c.code'):
    print(row)
"`
Used tool: manage_task
Used tool: manage_task
Viewed task-22.log
Used tool: manage_task
Ran command: `where.exe py; where.exe python; where.exe node`
Ran command: `py packages/db/seeds/_validate_all_seeds.py`
Viewed 0006_exams_w26_countdown.sql:1-60
Viewed _gen_exams_w26.py:1-60
Created .gitkeep
Created 0007_subjects_target_gaps.sql
Viewed _validate_all_seeds.py:12-25
Edited _validate_all_seeds.py
Ran command: `py packages/db/seeds/_validate_all_seeds.py`
Ran command: `git status -s`

### Comprehensive Data Audit & Status Clarification

Here is the exact breakdown of data currently in the seeds versus what remains to be added across all 5 feature areas:

---

### 1. Curriculum & Subjects (`curriculums`, `subjects`)
*Feeds: `/curriculum`, Subject selection modals, FKs for all study tools*

| Curriculum Board | Target Subjects | In-DB (Before) | Missing (Reserved) | Status with `0007` |
|---|---|---|---|---|
| **CAIE IGCSE** (`curr-caie-igcse`) | 12 | 12 | 0 | **100% Complete** |
| **Edexcel IGCSE** (`curr-edexcel-igcse`) | 14 | 9 (+ 1 out-of-target `4EA1`) | 5 (`4MB1`, `4HB1`, `4CP0`, `4EB1`, `4ES1`) | **100% Complete** (`0007`) |
| **CAIE A Level** (`curr-caie-alevel`) | 12 | 6 | 6 (`9231`, `9626`, `9609`, `9706`, `9093`, `9695`) | **100% Complete** (`0007`) |
| **Edexcel IAL** (`curr-edexcel-ial`) | 44 units | 25 units | 19 units (`WFM01-03`, `WDM11`, `WIT11-14`, `WCP01-04`, `WEN01-04`, `WET01-04`) | **100% Complete** (`0007`) |

*With `0007_subjects_target_gaps.sql` created, all 94 target subjects/units now exist in the database with valid IDs.*

---

### 2. Topic Tracker (`topics`)
*Feeds: `/curriculum/[curriculumId]/[subjectId]` lesson & chapter checklist*

| Board | Status | Details |
|---|---|---|
| **CAIE IGCSE** | **100% Seeded** | 119 chapters across all 12 subjects seeded in `0002_topics_CAIE_IGCSE_subjects.sql`. |
| **Edexcel IGCSE** | **Not Added (0/14)** | All 14 subjects need syllabus chapters (Target: `0008_topics_edexcel_igcse.sql`). |
| **CAIE A Level** | **Not Added (0/12)** | All 12 subjects need syllabus chapters. |
| **Edexcel IAL** | **Not Added (0/44)** | All 44 modular units need syllabus chapters. |

---

### 3. Exam Countdown (`exams`)
*Feeds: `/countdown` exam dates and timing cards*

| Board | Status | Details |
|---|---|---|
| **CAIE IGCSE** | **Seeded for Oct/Nov 2026** | Covered in `0006_exams_w26_countdown.sql` for all 12 subjects. |
| **Edexcel IGCSE** | **Partially Seeded** | Oct/Nov 2026 dates seeded for the original 9 subjects; missing for the 5 newly added subjects. |
| **CAIE A Level** | **Partially Seeded** | Oct/Nov 2026 dates seeded for 6 subjects; missing for the 6 newly added subjects. |
| **Edexcel IAL** | **Partially Seeded** | Oct/Nov 2026 dates seeded for 25 units; missing for the 19 newly added units. |

---

### 4. Past Paper Tracker (`past_papers`)
*Feeds: `/past-papers` grid, completion tracking, paper downloads*

| Board | Status | Details |
|---|---|---|
| **CAIE IGCSE** | **100% Seeded** | 1,328 past papers (2022–2026 series, all variants & components) seeded in `0004_caie_igcse_grade_thresholds.sql`. |
| **Edexcel IGCSE** | **Not Added (0 papers)** | Needs official papers per subject (Paper 1, Paper 2, etc.). |
| **CAIE A Level** | **Not Added** | Only sample papers for 9709 Maths from early test data; 0 papers for the other 11 subjects. |
| **Edexcel IAL** | **Not Added (0 papers)** | Needs unit papers (`WMA11/01`, `WPH11/01`, etc.). |

---

### 5. Grade Boundaries for Calculator (`paper_grade_boundaries` & `subject_grade_boundaries`)
*Feeds: `/calculator` and inline `/past-papers` threshold lookups*

| Board | Status | Details |
|---|---|---|
| **CAIE IGCSE** | **Per-Paper Seeded** | 10,575 component boundaries seeded (`paper_grade_boundaries`). Syllabus-level composite totals (`subject_grade_boundaries`) remain optional fallback. |
| **Edexcel IGCSE** | **Not Added** | Needs raw mark thresholds mapped to grades **9–1** (`ums_*` = NULL). |
| **CAIE A Level** | **Not Added** | Needs raw mark thresholds mapped to grades **A*–E**. |
| **Edexcel IAL** | **Not Added** | Needs raw marks **and** UMS score scales (`ums_min`, `ums_max`) per unit. |

---

### Actions Completed Now

1. **Created PDF Directory**:
   [`packages/db/seeds/pdfs/`](file:///c:/Users/USER/Desktop/The-ANTS/packages/db/seeds/pdfs/) is set up and ready for your files.
2. **Generated Target Gaps Seed**:
   [`packages/db/seeds/0007_subjects_target_gaps.sql`](file:///c:/Users/USER/Desktop/The-ANTS/packages/db/seeds/0007_subjects_target_gaps.sql) was created with all 30 missing reserved subjects and units.
3. **Validated Integrity**:
   Appended to `SEED_ORDER` in [`packages/db/seeds/_validate_all_seeds.py`](file:///c:/Users/USER/Desktop/The-ANTS/packages/db/seeds/_validate_all_seeds.py) and executed:
   - **4** curriculums, **95** subjects, **0** orphan foreign keys.
   - Result: `VALIDATION OK`.

---

### Next Step

Please drop your Edexcel IGCSE syllabus and grade threshold PDFs into [`packages/db/seeds/pdfs/`](file:///c:/Users/USER/Desktop/The-ANTS/packages/db/seeds/pdfs/). Once uploaded, let me know and I will extract the topics (`0008`) and the 9–1 grade thresholds (`0009`)!

Viewed .gitkeep:1-2