# Cloudflare migration — phase tracker

> **Source of truth for migration progress.** Linked from [`AGENTS.md`](../../AGENTS.md).  
> Do **not** delete Neon/Vercel or flip production **web** DNS hosting until Phase 6 is explicitly approved.

## Current phase

| Field | Value |
|---|---|
| **Active phase** | **Phase 6 cutover in progress** — apex/www on `the-ants-web`; finish redeploy + smoke + Telegram + decommission |
| **Last updated** | 2026-09-12 |
| **Owner** | Thaw Ye Zaw (features / backend) |

## Locked decisions (Phase 0)

| ID | Decision |
|---|---|
| D1 | Web → Cloudflare **Workers** via OpenNext (not classic Pages) |
| D2 | **D1 bound to the web Worker**; keep server actions + `getDb()` |
| D3 | Site primary: `the-ants.org` (www → apex) |
| D4 | API: **`api.the-ants.org`** |
| D5 | Split hosts; prefer `Secure` + `HttpOnly` + `SameSite=Lax` + `Domain=.the-ants.org`; `SameSite=None` only if Lax breaks sessions |
| D6 | Downtime OK (dev phase) |
| D7–D8 | Little/no critical data → **Phase 5 skipped** (2026-09-12: owner confirmed Neon has no important data worth migrating) |
| D9 | **Drop** GitHub Actions cron |
| D10 | **Delete QStash**; replace with **DB queue + Worker cron** |
| D11 | Remove review-queue + curriculum admin; **keep** countdown + grade calculator (+ editors), rebuild on Drizzle |
| D12 | Delete orphan Supabase migration script |
| D13 | Same Cloudflare account for web + API + D1 + R2 |
| D14 | Move DNS authority to Cloudflare; keep web on Vercel until Phase 6 |
| D15 | Telegram webhook currently on Vercel (verify before cutover) |
| D16 | OAuth not configured yet — set up only with final auth URLs |

## Phase checklist

| Phase | Status | Summary |
|---|---|---|
| **0 — Discovery** | ✅ Done | Inventory Supabase / QStash / Neon / Vercel; lock architecture |
| **1 — Legacy cleanup** | ✅ Repo done — confirm manual steps | Remove Supabase stubs + QStash + GH cron; drop review-queue/curriculum admin; Drizzle reads for countdown/calculator |
| **2 — Cloudflare web target** | ✅ Done | OpenNext Workers for `apps/web`; preview deploy |
| **3 — D1 + Better Auth** | ✅ Done (signup verified on remote D1) | SQLite schema + D1; user `testuser@the-ants.org` present |
| **4 — Remove Neon clients** | ✅ Repo done — confirm manual steps | Neon runtime leftovers out; CORS / auth / storage URLs → `api.the-ants.org` |
| **5 — Data migration runbook** | ⏭️ **Skipped** | No important Neon data; D1 is source of truth (`testuser@…` already on D1). Neon project kept until Phase 6 decommission only. |
| **6 — Cutover** | 🔄 In progress | Apex/`www` → `the-ants-web` (MCP done). You: redeploy, smoke, Telegram webhook, delete Neon/Vercel — [`cutover.md`](./cutover.md) |

## Temporary notification story (Phase 1+)

| Path | Status |
|---|---|
| Cloudflare Worker cron `* * * * *` → `processNotificationQueue` | **Canonical** |
| Worker `POST /api/cron/process-queue` | Keep (manual / local nudge) |
| QStash → Vercel | **Removed in Phase 1** |
| GitHub Actions → Vercel `/api/cron/process-notifications` | **Removed in Phase 1** |
| Next.js enqueue server actions | Keep: insert into `notification_queue` only |

## Manual vs automated (high level)

| Phase | Repo (agent) | You (dashboards / DNS / CLI) |
|---|---|---|
| 0 | Inventory / plans | Confirm decisions |
| 1 | Delete legacy code; Drizzle reads for exam tools | Remove `QSTASH_*` from Vercel; disable old GH Actions after merge; finish DNS NS → Cloudflare (grey-cloud → Vercel for web) |
| 2 | OpenNext + wrangler for `apps/web` | Create Workers project; set secrets/bindings; preview URL |
| 3–4 | Schema + auth + bindings | Create D1; wrangler secrets; no DNS flip yet |
| 5 | Scripts + runbook | Run export/import with guidance |
| 6 | Cutover docs | **Your explicit OK** then DNS hosting, Telegram webhook, decommission Vercel/Neon |

## Phase 4 — manual checklist (you)

After merging/deploying this phase:

1. **Redeploy API** (`cd apps/api && npx wrangler deploy`) so auth baseURL + storage URL defaults ship.
2. **Redeploy web** (`npm run cf:deploy:web`) so client JS bakes `NEXT_PUBLIC_API_URL=https://api.the-ants.org`.
3. **the-ants-web** → delete obsolete `DATABASE_URL` secret if still present (D1 `DB` only).
4. **Vercel** → set `NEXT_PUBLIC_API_URL=https://api.the-ants.org`; keep Neon `DATABASE_URL` until Phase 6 if you want (unused by Workers).
5. Smoke: open CF web preview signup → Network tab hits `https://api.the-ants.org/api/auth/...`; [`/health`](https://api.the-ants.org/health) stays ok.
6. **Do not** flip apex DNS or delete Neon/Vercel.

## Phase 2 — manual checklist (you)

1. `npx wrangler login` (same account as API).
2. Copy `apps/web/.dev.vars.example` → `apps/web/.dev.vars` (CRON/Telegram optional; D1 via wrangler `DB`).
3. Preview locally (optional): `npm run cf:preview:web`
4. First Worker deploy (preview only): `npm run cf:deploy:web` → confirm Worker **`the-ants-web`** + `*.workers.dev` URL.
5. Set vars on `the-ants-web` (`NEXT_PUBLIC_API_URL=https://api.the-ants.org`, etc.) — see [`opennext-web.md`](./opennext-web.md). **No `DATABASE_URL`.**
6. **Do not** attach `the-ants.org` / `www` to this Worker yet.
7. If Workers Builds is connected: Root directory = **`apps/web`** (never monorepo root).
8. Reply when preview URL works so we can **verify Phase 3 plan** (D1 + Better Auth).

## Phase 1 — manual checklist (you)

After merging/deploying this phase:

1. **Vercel** → Project → Settings → Environment Variables → delete `QSTASH_TOKEN` / `QSTASH_URL` if present → Redeploy web.
2. **GitHub** → Actions → confirm `Process Telegram Notification Queue` workflow is gone; cancel any leftover runs.
3. **Upstash** (if account exists) → delete unused QStash credentials.
4. **DNS** → finish Cloudflare nameserver cutover (grey-cloud → Vercel for apex/`www`); attach `api.the-ants.org` to Worker `the-ants-api` only — **not** apex to a root Workers Builds project.
5. **Telegram** → `getWebhookInfo` (read-only); do not change webhook URL yet.
6. Reply here when manual steps are done so we can **verify Phase 2 plan** (OpenNext Workers for web).

## Phase 6 — manual checklist (you)

Full runbook: [`cutover.md`](./cutover.md).

**Do not start B1 (attach apex/`www` to `the-ants-web`) until the Phase 6 decision checklist in chat is confirmed.**

## Do not (until Phase 6 B1+ confirmed)

- Point apex/`www` orange-cloud hosting at a broken/incomplete web Worker
- Delete Neon project or Vercel project
- Transfer domain **registrar** (DNS nameservers to Cloudflare is OK)

## Related docs

- [`AGENTS.md`](../../AGENTS.md) — shared rules + link here
- [`AGENTS.features.md`](../../AGENTS.features.md) — backend owner
- [`opennext-web.md`](./opennext-web.md) — OpenNext / Workers web deploy
- [`d1.md`](./d1.md) — D1 + Better Auth
- [`cutover.md`](./cutover.md) — **Phase 6 production cutover runbook**
- [`handoff-phase-4.md`](./handoff-phase-4.md) — prior handoff notes
- [`spec.md`](../../spec.md) — system spec
- [`README.md`](../../README.md) — setup