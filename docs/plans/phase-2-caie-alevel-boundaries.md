# Phase 2 — CAIE A Level Grade Boundaries & Reserved Subject Activation

> **Status:** Blocked — requires CAIE A Level grade boundary PDFs  
> **Prerequisites:** Phase 1 merged  
> **Unblocks:** Full A Level calculator composite, reserved CAIE AL subjects

---

## Handoff prompt (paste into new chat)

```
Implement Phase 2 from docs/plans/phase-2-caie-alevel-boundaries.md in The ANTS repo.

Prerequisite: Phase 1 (docs/plans/phase-1-smart-grade-tracker.md) must be merged.

Before coding, verify CAIE A Level grade boundary PDFs exist under:
  packages/db/seeds/pdfs/CIE/
If missing, STOP and ask the user to add PDFs (Cambridge published grade thresholds).

Then:
1. Extend _gen_caie_alevel_thresholds.py to parse PDFs → 0023_caie_alevel_grade_thresholds.sql
2. Add subject_grade_boundaries for A Level composites where Cambridge publishes them
3. Activate reserved CAIE A Level subjects in 0007 + target-catalog
4. Enable calculator composite + tracker subject grade for in-db AL subjects (9709, 9702, …)
5. Seed component routes for newly activated subjects (9231, 9626, etc.)

Read packages/shared-types/src/exam-papers.ts for Myanmar AL paper maps.
Run npm run typecheck + seed validation before finishing.
```

---

## Blocker

Phase 1 intentionally left `packages/db/seeds/0023_caie_alevel_grade_thresholds.sql` as a stub because **no CAIE A Level grade boundary PDFs** were in `packages/db/seeds/pdfs/CIE/` at planning time (only IGCSE GB PDFs + syllabi + timetable).

**User decision:** Do not activate reserved CAIE A Level subjects until GB PDFs arrive.

### Required PDFs (user action)

Add Cambridge **A Level grade threshold** publications to `packages/db/seeds/pdfs/CIE/`. Naming convention suggestion:

```
GradeBoundaries_AL_2022_March_to_2023_OctNov.pdf
GradeBoundaries_AL_2024_March_to_2025_March.pdf
… (match IGCSE naming pattern)
```

Update `packages/db/seeds/pdfs/manifest.json` with entries for each PDF.

---

## Goals

1. Seed **per-paper** `past_papers` + `paper_grade_boundaries` for all CAIE A Level subjects
2. Seed **subject-level** `subject_grade_boundaries` where official composite tables exist
3. **Activate reserved subjects** and seed topics + past paper catalog
4. Remove "boundaries coming soon" UI for subjects with complete data
5. Enable **official composite grading** in calculator + tracker (no percentage fallback)

---

## Subjects in scope

### Already in-db (enhance with full GB data)
| Code | Subject ID | Notes |
|------|------------|-------|
| 9709 | `subj-caie-al-maths` | AS + A Level routes; P42 vs P52 |
| 9702 | `subj-caie-al-phys` | AS/A2; practical 33 vs 34 |
| 9701 | `subj-caie-al-chem` | Same |
| 9700 | `subj-caie-al-bio` | Same |
| 9618 | `subj-caie-al-cs` | AS: 12,22; A2: 32,42 |
| 9708 | `subj-caie-al-econ` | AS/A2 papers |

### Reserved — activate in this phase
| Code | Reserved ID | Name |
|------|-------------|------|
| 9231 | `subj-caie-al-fmaths` | Further Mathematics |
| 9626 | `subj-caie-al-it` | Information Technology |
| 9609 | `subj-caie-al-biz` | Business |
| 9706 | `subj-caie-al-acc` | Accounting |
| 9093 | `subj-caie-al-eng-lang` | English Language |
| 9695 | `subj-caie-al-lit` | Literature in English |

---

## Myanmar paper maps (from reference spec)

Use `packages/shared-types/src/exam-papers.ts` — extend if missing:

**9709 Mathematics:**
- AS: Paper 12 + Paper 42 OR 52
- A Level: Paper 12, 32, 42, 52 (exclusive 42|52)

**Sciences (9702/9701/9700):**
- AS: 12, 22, 33/34
- A2: 42, 52

**9626 IT:** series-dependent (02/04 vs 21/41) — reuse `CAIE_SERIES_PAPERS` pattern from Phase 1

Seed `0026`-style routes for each subject in `0028_caie_alevel_component_routes.sql` (or extend `0026`).

---

## Generator work

### Extend `_gen_caie_alevel_thresholds.py`

Input: all `GradeBoundaries_AL_*.pdf` in `pdfs/CIE/`

Output: `0023_caie_alevel_grade_thresholds.sql`

Per row:
```sql
-- past_papers: paper_number='1', variant='2' → combined ID 12
-- paper_grade_boundaries: grade, min_mark, max_mark (no UMS)
```

Handle:
- All variants v1/v2/v3 for practice
- Series: May/June, Oct/Nov, Feb/March
- Syllabus codes: 9709, 9702, 9701, 9700, 9618, 9708, 9231, 9626, 9609, 9706, 9093, 9695

### New: `_gen_caie_alevel_composites.py`

If Cambridge publishes subject-level threshold tables (similar to IGCSE option tables):
→ `0029_caie_alevel_subject_composites.sql` → `subject_grade_boundaries`

**9709 note:** Composite may require route-specific boundaries (Mechanics vs Statistics totals differ). Use `route_key` column or tier field if needed — evaluate PDF structure during implementation.

---

## UI changes (minimal — Phase 1 lays groundwork)

| Surface | Change |
|---------|--------|
| Grade Calculator | Remove "coming soon" when `listSubjectCompositeBoundaries` returns data for AL subject |
| Past Paper Tracker | Enable official composite in `SubjectProgressHeader` |
| Subject hub | Show calculator + tracker as fully supported |

**Plugin updates:** `apps/web/src/lib/grading/caie-alevel.ts`
- Ensure `compositeGrade()` sums correct papers for AS vs A Level + route
- Exclusive groups: applied math (42|52), science practical (33|34)

---

## Topics seed (if not done in Phase 1)

For newly activated reserved subjects:
- Add topic rows in `0011_topics_caie_alevel.sql` or new `0030_topics_caie_alevel_extras.sql`
- Chapter-level subtopics (3–8 bullets) from syllabus PDFs already in `pdfs/CIE/`

Syllabus PDFs present at planning time include 718141, 718148, 718783, 721337, etc. — map via `manifest.json`.

---

## Acceptance criteria

- [ ] CAIE AL GB PDFs in repo + manifest updated
- [ ] `0023` contains real data (not stub)
- [ ] All 12 CAIE A Level codes have past paper rows for ≥3 recent series
- [ ] 9709: calculator composite works for AS (mech + stats routes) and A Level
- [ ] Sciences: 33 vs 34 route affects required papers + composite
- [ ] Reserved subjects activated in `target-catalog.md` as `in-db`
- [ ] `npm run typecheck` + seed validation pass
- [ ] No percentage fallback for composites (official only)

---

## Risk notes

- **9709 composite boundaries** may not be published as a single table — may need to sum per-paper max marks and use percentage bands as interim for composite ONLY if user approves (currently: official only)
- **9626** has unusual paper numbering (02, 04, 12, 32) — verify against timetable PDF `757649-november-2026-zone-4-timetable.pdf`
- **9231 Further Maths** has complex paper combinations — seed all practice variants but default Myanmar route from reference doc (12, 22, 32, 42)
