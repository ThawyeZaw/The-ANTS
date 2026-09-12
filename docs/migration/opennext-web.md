# Cloudflare Workers — web app (OpenNext)

> Phase 2 of [`cloudflare.md`](./cloudflare.md).  
> Production apex stays on **Vercel** until Phase 6. Use Workers for **preview** only until cutover.  
> **Live DB:** D1 binding `DB` (Phase 3+) — not Neon `DATABASE_URL`.

## What lives where

| App | Directory | Wrangler name | Production host (target) |
|---|---|---|---|
| Next.js web | `apps/web` | `the-ants-web` | `the-ants.org` (Phase 6) |
| Hono API | `apps/api` | `the-ants-api` | **`api.the-ants.org`** (live) |

**Never** run `npx wrangler deploy` from the monorepo root.

## Local commands

```bash
# Normal Next dev (Node) — still preferred for day-to-day UI work
npm run dev:web

# Build + preview in the Workers runtime (requires wrangler login)
npm run cf:preview:web
# or:
npm --workspace=@the-ants/web run cf:preview
```

Copy env for Wrangler preview:

```bash
copy apps\web\.dev.vars.example apps\web\.dev.vars
# fill CRON_SECRET / Telegram as needed — D1 comes from wrangler.jsonc binding DB
```

## First Cloudflare deploy (preview Worker — not apex DNS)

### A) Repo (already done in Phase 2)

- `@opennextjs/cloudflare` + `wrangler` in `apps/web`
- `apps/web/wrangler.jsonc`, `open-next.config.ts`, `public/_headers`
- Scripts: `cf:build`, `cf:preview`, `cf:deploy`
- Next.js bumped to **≥16.3.5** (OpenNext peer requirement)

### B) You — CLI deploy once

1. `npx wrangler login` (same account as `the-ants-api`)
2. From repo root:

```bash
npm run cf:deploy:web
```

3. Success: Workers dashboard shows **`the-ants-web`** with a `*.workers.dev` URL.
4. Open that URL — home page should load. DB-backed server actions need D1 binding `DB` (already in `wrangler.jsonc`).

### C) You — secrets / vars on `the-ants-web`

Cloudflare Dashboard → Workers & Pages → **the-ants-web** → Settings → Variables and Secrets:

| Name | Type | Notes |
|---|---|---|
| `CRON_SECRET` | Secret | Optional on web; preferred on API |
| `TELEGRAM_BOT_TOKEN` | Secret | Optional on web; preferred on API |
| `NEXT_PUBLIC_API_URL` | Plaintext | **`https://api.the-ants.org`** (also forced in `cf:build`) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Plaintext | without `@` |

**Do not** set `DATABASE_URL` on the web Worker — D1 binding `DB` is the database.

CLI alternative (from `apps/web`):

```bash
npx wrangler secret put CRON_SECRET
```

If an old `DATABASE_URL` secret still exists from Phase 2, delete it in the dashboard (harmless leftover).

### D) You — Workers Builds (Git) — optional

If connecting GitHub for auto-deploy:

| Setting | Value |
|---|---|
| **Root directory** | `apps/web` |
| **Build command** | `npm run cf:build` (or leave empty if deploy command builds) |
| **Deploy command** | `npx wrangler deploy` |
| **Custom domain** | **Do not** attach `the-ants.org` until Phase 6 |

Install at monorepo root may be required — if Builds fails on workspace packages, set:

- Build: `cd ../.. && npm install && npm --workspace=@the-ants/web run cf:build`
- Or use root deploy: `npm run cf:deploy:web` with root as checkout and override working directory to `apps/web` after install.

Exact Builds UI varies; the hard rule is: **working directory for wrangler = `apps/web`**.

## Bindings

| Binding | Phase | Purpose |
|---|---|---|
| `ASSETS` | 2 | OpenNext static assets (auto) |
| `WORKER_SELF_REFERENCE` | 2 | Self service binding |
| `IMAGES` | 2 | Cloudflare image optimization |
| `DB` (D1) | 3+ | App + auth database (`the-ants-db`) |
| `NEXT_INC_CACHE_R2_BUCKET` | optional | Next incremental cache |

R2 app media uses API Worker binding `ASSETS_BUCKET` → bucket `the-ants-assets` (not this web Worker).

## Troubleshooting

### Signup shows "Failed to fetch" / `ERR_CONNECTION_REFUSED` to `127.0.0.1:8787`

`NEXT_PUBLIC_API_URL` is **baked into the client JS at build time**. If `.env.local` or `.dev.vars` still say `http://127.0.0.1:8787`, a Cloudflare deploy will call your laptop (connection refused).

**Fix:** `npm run cf:deploy:web` forces `NEXT_PUBLIC_API_URL=https://api.the-ants.org` during build. Redeploy, hard-refresh the signup page, and confirm Network requests go to `https://api.the-ants.org/api/auth/...`.

### `Asset too large` / 25 MiB limit

Cloudflare Workers Static Assets reject any single file **≥ 25 MiB**. Pomodoro vibe MP3s in `public/pomodoro/vibes/**` are copied into `.open-next/assets`.

Fix: re-encode under the limit (prefer &lt; 5 MiB):

```bash
ffmpeg -y -i apps/web/public/pomodoro/vibes/deep-focus/ambience.mp3 ^
  -codec:a libmp3lame -b:a 96k -ac 2 -ar 44100 ^
  apps/web/public/pomodoro/vibes/deep-focus/ambience.out.mp3
```

Then replace the original and re-run `npm run cf:deploy:web`.

Large media should eventually live in R2 (`the-ants-assets`), not Worker assets.

## Vercel coexistence

- Keep `vercel.json` and `npm run build` (`next build`) for production web until Phase 6.
- Cloudflare Worker `the-ants-web` is for preview/proof only until cutover approval.
- Vercel cannot run D1-backed server actions; use CF web preview for DB flows until Phase 6.
