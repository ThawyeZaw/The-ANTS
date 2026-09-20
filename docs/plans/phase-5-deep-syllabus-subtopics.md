# Phase 5 — Deep Syllabus Subtopics (Learning Objectives)

> **Status:** **In progress** (UI + structured JSON; subject/calculator structure deferred by user)  
> **Prerequisites:** Phase 1 merged  
> **Replaces:** Chapter-level bullets with full syllabus learning objectives (`{ code, title }`)

---

## Handoff prompt (paste into new chat)

```
Implement Phase 5 from docs/plans/phase-5-deep-syllabus-subtopics.md in The ANTS repo.

Prerequisites: Phase 1 merged (chapter-level subtopics exist).

Upgrade topic tracker subtopics from chapter bullets to full syllabus learning objectives
(e.g. 0580 E1.1, E1.2 …) parsed from PDFs in packages/db/seeds/pdfs/.

Reference existing deep seed: packages/db/seeds/0017_backfill_caie_igcse_subtopics.sql

Scope: all activated subjects with syllabus PDFs in manifest.json.
Preserve backward compatibility for user topic_progress.completed_subtopics (migrate strings).

Run seed validation + npm run typecheck before finishing.
```

---

## Goal

Phase 1 ships **3–8 chapter bullets** per topic for fast coverage. Phase 5 upgrades to **official syllabus learning objective codes** matching Cambridge/Pearson spec documents — the depth already achieved for 0580 in seed `0017`.

---

## Why separate phase

| Reason | Detail |
|--------|--------|
| PDF parsing effort | Each board/spec uses different numbering (E1.1 vs 1.2 vs LO1) |
| UI density | 15+ subtopics per topic needs collapsible groups, search, syllabus code display |
| Migration | Users who checked chapter bullets need string migration to objective codes |
| Maintenance | Spec updates (2027 syllabi) require re-parse pipeline |

---

## Target depth by board

| Board | Format example | Reference seed |
|-------|----------------|----------------|
| CAIE IGCSE | `E1.1`, `A2.3`, `P3.5` | `0017_backfill_caie_igcse_subtopics.sql` |
| CAIE A Level | `1.1`, `3.2`, `M1.4` | Inline in `0011` (partial — expand) |
| Edexcel IGCSE | Spec section codes | `0018` (partial — re-parse specs) |
| Edexcel IAL | Unit content statements | `0019`, `0020` |

---

## Schema consideration

Current: `topics.subtopics` = JSON string array

### Option A — Keep JSON, richer objects (recommended)
```typescript
type Subtopic = {
  code: string;      // 'E1.1'
  title: string;     // 'Types of number'
  parent?: string;   // optional grouping
};
```

Migration: alter JSON from `string[]` to `Subtopic[]`; UI renders `code` in monospace (JetBrains Mono).

### Option B — Normalize to `subtopics` table
Only if querying/filtering by code becomes critical (Phase 6 flashcards). Defer unless needed.

---

## Generator pipeline

New script: `_gen_syllabus_objectives.py`

Input:
- All syllabus PDFs in `packages/db/seeds/pdfs/manifest.json`
- Board-specific regex patterns (config YAML per syllabus code)

Output:
- `0032_deep_subtopics_caie_igcse.sql`
- `0033_deep_subtopics_caie_alevel.sql`
- `0034_deep_subtopics_edexcel.sql`

Idempotent: `UPDATE topics SET subtopics=..., subtopics_count=... WHERE id=...`

### Validation
- `_validate_subtopics.py` — count objectives per syllabus vs PDF page count sanity check
- Flag subjects with < 50% extraction confidence for manual review

---

## UI updates — TopicTracker

**File:** `apps/web/src/components/curriculum/TopicTracker.tsx`

1. Display subtopic **code** + title (mono font for code)
2. Group by syllabus section within expandable topic
3. Search by code (`E1.1`) or title
4. Progress bar: "42/118 objectives"
5. Export/print checklist (optional stretch)

### Migration UX
If user's `completed_subtopics` contains old chapter strings:
- Fuzzy match to new objectives under same topic
- Or show "legacy" checks with prompt to re-confirm

---

## Subject priority order

1. **CAIE IGCSE** (12 codes) — PDFs already in repo
2. **Edexcel IGCSE** — specs partially in `pdfs/Edexcel/9781446*.pdf`
3. **CAIE A Level** — after Phase 2 PDFs confirmed
4. **Edexcel IAL** — unit specs in ISS PDFs

---

## Acceptance criteria

- [ ] 0580 has ≥100 objective-level subtopics (match 0017 depth)
- [ ] All CAIE IGCSE 12 codes upgraded
- [ ] Subtopic JSON uses `{ code, title }` shape
- [ ] TopicTracker search by code works
- [ ] User progress migrated or gracefully handled
- [ ] `subtopics_count` accurate
- [ ] Seed validation passes

---

## Relationship to Phase 4

If Phase 4 shipped first: update `topic_paper_tags.subtopic_key` to use objective codes instead of chapter strings. Include migration in this phase.
