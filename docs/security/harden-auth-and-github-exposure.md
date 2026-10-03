# Plan — Harden auth boundaries & minimize GitHub exposure

> **Status:** Plan only. **Do not change application code until Phase 0 analysis is complete and the owner approves implementation.**  
> **Scope packages:** `apps/web`, `apps/api`, `packages/db`  
> **Related reviews:** full-app security audit + GitHub exposure check (2026-10-03)

---

## Instructions for the AI agent (read first)

1. **Analyze before you edit.** Do not open a PR or patch files until Phase 0 is done and summarized in chat.
2. **Re-verify every finding** below against the current tree. Paths/lines may have moved; quote current evidence (file + line + short snippet).
3. **Mark each item:** `confirmed` / `already fixed` / `false positive` / `needs owner decision`.
4. **Prefer behavior-preserving fixes** for legitimate users: bind identity to Better Auth **session**, not client-supplied `userId` / `reviewerId` / `promoterId`.
5. **Do not** force-push `main`, rewrite git history, rotate production secrets, or flip Phase 6 DNS unless the owner explicitly asks.
6. **Do not** reintroduce clubs/classrooms. Do not expand `NEXT_PUBLIC_*` surface.
7. **Ownership:** backend / API / DB / server actions → Thaw Ye Zaw (`AGENTS.features.md`). Stay off marketing/auth UI primary paths unless a fix requires a tiny shared change (announce it).
8. After analysis, propose a **phased PR split** (small, reviewable). Wait for owner “go” before coding.
9. Pass `npm run typecheck` before any PR. Prefer one concern per PR.

### Suggested Phase 0 analysis checklist

- [ ] Trace Better Auth session creation/validation (`apps/api/src/auth.ts`, web `auth-session.ts`).
- [ ] List every `'use server'` action that mutates data **without** `requireSessionUser` / admin role check.
- [ ] List every Hono route under `apps/api/src/routes/` that trusts body/query `userId` (or role IDs) without session middleware.
- [ ] Confirm what is **tracked** vs gitignored: `git ls-files '*/node_modules*'`, `.env*`, `.dev.vars*`, `wrangler-account.json`.
- [ ] Confirm hardcoded secret fallback still present; list all secret env vars and where they are read (`c.env` vs `process.env`).
- [ ] Map Telegram link + password-reset + cron + R2 upload trust boundaries end-to-end.
- [ ] Note which public GETs must stay public (curriculum/exam catalogs) so hardening does not break them.
- [ ] Deliver: findings table + proposed PR sequence + residual risks. **Stop for approval.**

---

## Problem inventory (all known issues)

### A. GitHub / repo exposure

| ID | Severity | Problem | Where (approx.) |
|---|---|---|---|
| G1 | Critical | **215 files under `apps/api/node_modules` are tracked in git** (vendored `zod` + cache), despite root `.gitignore` | `apps/api/node_modules/**` |
| G2 | Critical | **Wrangler account cache tracked** — credential-adjacent Cloudflare account metadata in history | `apps/api/node_modules/.cache/wrangler/wrangler-account.json` |
| G3 | Critical | **Hardcoded Better Auth secret fallback** in source (public to anyone with repo access) | `apps/api/src/auth.ts` (`the-ants-auth-secret-production-2026`) |
| G4 | High | **Personal admin email** committed in bootstrap SQL | `apps/api/scripts/promote-local-admin.sql` (`thawyezaw@gmail.com`) |
| G5 | Medium | Untracked **brag-output** folder may be committed later; briefs contain local machine paths | `brag-output-2026-10-02-232002/` |
| G6 | Low | Infra identifiers in repo (expected for Workers, not secrets, but map attack surface) | D1 `database_id`, R2 bucket name in `wrangler.jsonc`; bot username in `NEXT_PUBLIC_*` |
| G7 | Info | No gitleaks/trufflehog in toolchain; `gh` may be unauthenticated locally | Dev machine hygiene |

**Already OK (do not “fix” into breaking):**

- `.env*` / `.dev.vars*` gitignored; only empty `*.example` tracked.
- Client public env limited to `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
- `packages/db` seeds look free of live passwords / user dumps.
- Real bot/OAuth/cron secrets are env/Wrangler-secret shaped, not literal values in examples.

---

### B. Critical authz / authn (production trust boundary)

| ID | Severity | Problem | Where (approx.) |
|---|---|---|---|
| C1 | Critical | Unauthenticated **role escalation** server actions (`actionUpdateUserRoles`, `changeUserRole`, `actionPromoteUserToAdminByEmail`, `getAllUsers`) | `apps/web/src/actions/role-upgrade.ts` |
| C2 | Critical | Unauthenticated **role APIs** (`PUT /roles`, `GET /users`); promote/review trust spoofable body IDs | `apps/api/src/routes/role-upgrade.ts` |
| C3 | Critical | Auth secret fail-open via literal / `CRON_SECRET` reuse | `apps/api/src/auth.ts` |
| C4 | Critical | Password reset writes **plaintext** `account.password` | `apps/web/src/actions/profile.ts` (`actionResetPasswordWithCode`) |
| C5 | Critical | Telegram `/start <username>` links any chat → account takeover / OTP hijack | `apps/web/src/app/api/telegram/webhook/route.ts` |
| C6 | Critical | Unauthenticated **R2 presign/upload** (up to 50MB) | `apps/api/src/routes/storage.ts` |
| C7 | Critical | Systemic API **IDOR**: no session middleware; client `userId` is authorization | `apps/api/src/routes/profile.ts`, `timetable.ts`, `exams.ts`, `curriculum.ts`, `editor.ts`, etc. |

---

### C. High — server actions, cron, redirects, CORS

| ID | Severity | Problem | Where (approx.) |
|---|---|---|---|
| H1 | High | Org CMS mutations unauthenticated (mission/team/timeline) | `apps/web/src/actions/org.ts` |
| H2 | High | Profile / username / certifications / contributor profile writes accept arbitrary `userId` | `apps/web/src/actions/profile.ts` |
| H3 | High | Timetable / exam countdown / enrollment-sync / notifications writes weak or missing session; timetable toggle **falls through on Unauthorized** | `timetable.ts`, `exam-data.ts`, `enrollment-sync.ts`, `notifications.ts` |
| H4 | High | Cron HTTP open if secret unset; reads `process.env.CRON_SECRET` (often empty on Workers vs `c.env`) | `apps/api/src/routes/cron.ts` |
| H5 | High | Telegram webhook secret optional; status/test endpoints over-expose or allow unauthenticated bot send | webhook route; `apps/web/src/app/api/telegram/test/route.ts` |
| H6 | High | Open redirect via `next` on email confirm | `apps/web/src/app/auth/confirm/route.ts` |
| H7 | High | Auth 500 responses return **stack traces** | `apps/api/src/index.ts` |
| H8 | High | Broad credentialed CORS (`*.workers.dev`, Vercel previews) | `apps/api/src/index.ts` |

---

### D. Medium / quality (safe follow-ons)

| ID | Severity | Problem |
|---|---|---|
| M1 | Medium | Weak 6-digit OTP, user enumeration, no rate limit on password reset |
| M2 | Medium | In-memory rate limiter ineffective across Worker isolates |
| M3 | Medium | Public profile / unauthenticated `/me` may expose email |
| M4 | Medium | Custom markdown allows unsafe `javascript:` hrefs (`apps/web/src/lib/markdown.ts`) |
| M5 | Medium | Notification queue clear/enqueue helpers callable without ownership checks |
| M6 | Medium | Client-only `(app)` gate; no Next middleware session check |
| M7 | Medium | `AuthContext` can restore cached admin role from `localStorage` on fetch failure |
| M8 | Medium | Clubs/classrooms UI leftovers; `library/courses` hop via `/courses` |
| M9 | Medium | Silent `return []` / fake success on errors; unbounded list queries |
| M10 | Medium | No automated tests for role denial, cron auth, storage auth, timetable IDOR, Telegram link |
| M11 | Low | Role-upgrade stubs that always succeed; duplicate notification processors |

**Patterns that already look solid (preserve):**

- `requireSessionUser` in `apps/web/src/lib/auth-session.ts` when used.
- Curriculum enroll/progress, past-paper upserts, pomodoro XP + focus token, `admin-exam-data.ts`.
- New signups forced to `student`; Better Auth `role` input disabled where configured.
- Drizzle parameterized SQL; R2 filename sanitization against `../`.

---

## Implementation phases (after Phase 0 approval)

### Phase 1 — Repo hygiene (no runtime behavior change)

**Goals:** Stop leaking node_modules / account cache; reduce identity in bootstrap scripts; ignore brag output.

1. `git rm -r --cached apps/api/node_modules` (confirm `git ls-files '*/node_modules*'` empty).
2. Ensure `.gitignore` covers `node_modules/`, `.wrangler/`, `.env*`, `.dev.vars*`, and add `brag-output*/` if owner agrees.
3. Parameterize or localize `promote-local-admin.sql` (no hard-coded personal email in repo).
4. Document: owner should **rotate Cloudflare API tokens** used on machines that produced `wrangler-account.json`. History rewrite only if owner explicitly requests.
5. Optional: add gitleaks pre-commit or GitHub secret scanning note in docs.

**Do not** commit secrets “to fix” anything. Examples stay empty.

---

### Phase 2 — Emergency lock (fail closed)

**Goals:** Stop privilege escalation and forgeable sessions without breaking real admin UI that already uses session cookies.

1. Remove hardcoded auth secret + `CRON_SECRET` reuse as auth secret; **throw/fail boot** if `BETTER_AUTH_SECRET` missing outside local/dev.
2. Gate **all** role-upgrade actions + API routes: session required; actor role from DB for **session user only**; ignore body `reviewerId`/`promoterId`.
3. Disable or hard-gate `actionPromoteUserToAdminByEmail` (CLI / one-time env secret + admin session).
4. Cron: read `c.env.CRON_SECRET`; **401 if unset or mismatch**.
5. Strip `stack` from client-facing auth/API 500 bodies.

**Verify manually:** real admin contributor-manager flows still work; anonymous `PUT /api/role-upgrade/roles` returns 401.

---

### Phase 3 — Session middleware + IDOR sweep

**Goals:** One trust boundary on the API; actions match.

1. Add Hono middleware: validate Better Auth session → `c.set('userId', …)`.
2. Private routes use session user only; keep public catalog GETs open.
3. Auth-gate R2 upload/presign; scope object keys under `{userId}/…`; keep intentional public file GET.
4. Sweep server actions: profile, timetable (remove Unauthorized fallthrough), exam-data, enrollment-sync, notifications, org CMS → `requireSessionUser` + admin where needed.
5. Prefer ignoring client `userId` on writes (session wins).

**Verify:** student can still edit own timetable/profile; cannot edit another UUID; storage upload without cookie → 401.

---

### Phase 4 — Account takeover paths

1. Telegram: Settings issues short-lived signed/link token; reject bare `/start <username>`.
2. Password reset: use Better Auth hash/reset APIs; never store plaintext; generic responses; rate limit.
3. Open redirect: allow only same-origin relative paths (`/` but not `//`).
4. Lock or remove `/api/telegram/test` in production; webhook fail-closed without secret.
5. Tighten production CORS allowlist to exact origins (apex, www, known web Worker, localhost for dev).

---

### Phase 5 — Quality / defense in depth (non-blocking)

1. Sanitize markdown URL schemes; strip email from public DTOs.
2. Optional Next middleware for `(app)` routes.
3. Clear privileged `localStorage` cache on auth failure.
4. Strip clubs leftovers; fix library→curriculum redirect.
5. Surface real errors instead of empty success where it matters.
6. Add Vitest/Miniflare tests: role deny, cron 401, storage 401, timetable IDOR, Telegram token link.
7. Cloudflare Rate Limiting / WAF for `/api/auth/*` and reset endpoints.

---

## Explicit non-goals (unless owner asks)

- Phase 6 DNS cutover / deleting Neon or Vercel.
- Rewriting git history to purge `wrangler-account.json` (separate, explicit ops task).
- Broad UI redesign or Stitch token work.
- Changing public curriculum/exam catalog availability.
- Expanding client-exposed env vars.

---

## PR sequence (recommended)

| PR | Title focus | Touches |
|---|---|---|
| PR1 | Untrack `apps/api/node_modules`; gitignore brag-output; scrub bootstrap email | git / scripts / ignore only |
| PR2 | Fail-closed auth secret + role API/action gates + cron + no stacks | `apps/api`, `apps/web/src/actions/role-upgrade.ts` |
| PR3 | API session middleware + storage auth + action IDOR sweep | `apps/api/src/**`, selected `actions/*` |
| PR4 | Telegram link tokens + password reset hash + redirect/CORS/test route | webhook, profile reset, `index.ts` CORS |
| PR5 | Tests + markdown/PII/clubs leftovers | tests + small web cleanups |

---

## Acceptance criteria

- [ ] `git ls-files` shows **no** `node_modules` and **no** `wrangler-account.json`.
- [ ] No literal auth secret in source; deploy fails clearly if secret missing (non-local).
- [ ] Unauthenticated callers cannot change roles, upload to R2, or drain cron.
- [ ] Mutating user-scoped API/actions require session; IDOR attempts fail.
- [ ] Telegram cannot be linked by guessing a username alone.
- [ ] Password reset never stores plaintext passwords.
- [ ] `NEXT_PUBLIC_*` set unchanged in spirit (API URL + bot username only).
- [ ] `npm run typecheck` passes; smoke: login, own profile edit, admin role UI for real admin, student timetable.

---

## Owner decisions needed before coding

1. Confirm production already has a strong `BETTER_AUTH_SECRET` set (if the literal may have been used → **rotate** sessions/secret).
2. Confirm whether to **history-purge** `wrangler-account.json` or only untrack going forward.
3. Confirm Telegram linking UX (token from Settings) is acceptable product change.
4. Confirm CORS: drop wildcard preview origins in production?
5. Approve starting at **Phase 0 analysis only**, then Phase 1–2 first.

---

## Paste prompt for a new chat

```text
Read docs/security/harden-auth-and-github-exposure.md end-to-end.

Phase 0 only: analyze apps/web, apps/api, and packages/db against every problem ID in that doc.
Re-verify each finding with current file:line evidence. Mark confirmed / fixed / false positive / needs decision.
Do not change any code yet. End with a proposed PR sequence and questions for me.
```
