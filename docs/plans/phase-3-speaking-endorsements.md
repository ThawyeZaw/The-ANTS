# Phase 3 — Speaking Endorsement Tracking

> **Status:** Planned  
> **Prerequisites:** Phase 1 merged  
> **Priority:** Medium — excluded from Phase 1 tracker by user choice

---

## Handoff prompt (paste into new chat)

```
Implement Phase 3 from docs/plans/phase-3-speaking-endorsements.md in The ANTS repo.

Prerequisite: Phase 1 merged.

Add optional speaking endorsement tracking for:
- CAIE 0510 English as a Second Language — Component 04 (Speaking Endorsement)
- Edexcel 4ES1 ESL — Paper 03 (optional speaking test)

User decision from planning: endorsements are OPTIONAL — do not block subject completion.
Exclude from exam countdown auto-sync (already in CAIE_COUNTDOWN_EXCLUDED for 0510).

Design mobile-friendly status UI on subject page + past paper tracker sidebar.
Run npm run typecheck before finishing.
```

---

## Background

Phase 1 **excludes** speaking components from:
- Past paper grid rows
- Required-papers progress denominator
- Exam countdown (0510/04 already in `CAIE_COUNTDOWN_EXCLUDED`)

Students still need to track speaking grades separately — this phase adds that without polluting the main paper grid.

---

## Subjects affected

| Board | Code | Component | Current exclusion |
|-------|------|-----------|-----------------|
| CAIE IGCSE | 0510 | Component 04 (Speaking Endorsement) | `CAIE_COUNTDOWN_EXCLUDED['0510'] = ['04']` |
| Edexcel IGCSE | 4ES1 | Paper 03 (Speaking) | Not yet in allowlists |

---

## Product decisions (confirm unchanged)

| Decision | Value |
|----------|-------|
| Required for subject completion? | **No** — optional |
| Countdown | **Excluded** — manual pin only if student wants |
| Grade boundaries | Track **endorsement grade** (Distinction/Merch/Pass/Fail for 0510; Edexcel speaking bands) |
| Calculator | **Separate mini-calculator** or status badge — not part of subject composite |

---

## Schema options

### Option A — Extend `user_past_paper_records` (preferred if speaking rows exist in `past_papers`)
- Seed `past_papers` rows for 0510/04 and 4ES1/03 with `qualification='IGCSE'`, special `title`
- Track via existing record table with `status`, `calculated_grade`
- Flag: `is_endorsement: boolean` on `past_papers` (new column) OR derive from `paper_number IN ('04','03')` + syllabus

### Option B — New `user_endorsement_records`
```sql
CREATE TABLE user_endorsement_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  component_code TEXT NOT NULL,  -- '04' or '03'
  status TEXT NOT NULL,            -- not_done | done | skipped
  grade TEXT,                    -- endorsement grade label
  examiner_notes TEXT,
  recorded_at INTEGER
);
```

**Recommendation:** Option A if grade boundaries exist in PDFs; Option B if speaking has no boundary tables and is purely status tracking.

---

## Seed work

1. Add speaking paper catalog rows (if not present):
   - 0510 Component 04 — no variant; series may match written papers
   - 4ES1 Paper 03 — check Edexcel spec for R-paper variant
2. Parse endorsement grade descriptors from syllabus PDFs (0510 in `pdfs/CIE/`, 4ES1 spec if added)
3. **Do not** add to `CAIE_IGCSE_PRACTICE_VARIANTS` main lists — separate `ENDORSEMENT_PAPERS` constant in `exam-papers.ts`

---

## UI design

### Subject page — Endorsement card
Location: curriculum subject page, below `SubjectProgressHeader` or in sidebar

```
┌─────────────────────────────────────┐
│ Speaking Endorsement (Optional)     │
│ Status: ● Not recorded              │
│ [Mark as done] [Enter grade ▼]      │
│ Does not affect written exam grade  │
└─────────────────────────────────────┘
```

### Past paper tracker
- Collapsible **"Speaking & endorsements"** section below main grid
- Single row per series (not full variant matrix)
- Mobile: same card pattern as desktop

### Grade entry
- Dropdown with valid endorsement grades (from syllabus)
- No raw mark entry unless boundaries PDF provides mark ranges

---

## Files to touch

| File | Change |
|------|--------|
| `packages/shared-types/src/exam-papers.ts` | `ENDORSEMENT_COMPONENTS` map |
| `packages/db/seeds/` | Speaking paper rows |
| `apps/web/src/actions/past-papers.ts` | CRUD for endorsement records |
| `apps/web/src/components/past-papers/EndorsementCard.tsx` | **New** |
| `apps/web/src/components/curriculum/SubjectHubCard.tsx` | Optional badge "Speaking pending" |
| `apps/web/src/components/past-papers/PastPaperTracker.tsx` | Collapsible section |

---

## Acceptance criteria

- [ ] 0510 and 4ES1 speaking trackable independently
- [ ] Subject progress **unchanged** when speaking not done
- [ ] Countdown does not auto-add speaking exams
- [ ] Grade dropdown matches syllabus bands
- [ ] Mobile-friendly card UI
- [ ] `npm run typecheck` passes

---

## Open questions for implementer (ask user if unclear)

1. Does 0510 speaking grade appear on the same certificate series as written papers, or can it differ by session?
2. Should students upload speaking completion date for their own records?
3. Edexcel 4ES1 Paper 03 — is it sat in Myanmar centers or only optional abroad?
