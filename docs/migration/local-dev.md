# Local development — shared remote D1

> **Default:** `npm run dev` starts **web** (`127.0.0.1:3005`) and **API** (`127.0.0.1:8787`) against **remote Cloudflare D1 `the-ants-db`**. Both developers share the same database.

---

## Quick start

```bash
# One-time: wrangler login OR CLOUDFLARE_API_TOKEN in apps/api/.dev.vars
npm run dev
```

Confirm API logs show **`D1 Database — remote`**, **`the-ants-db`**, and **`R2 Bucket — remote`** (`the-ants-assets`).

Ensure `.env.local` (repo root or `apps/web/.env.local`) includes:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
```

---

## Scripts

| Command | What runs |
|---|---|
| **`npm run dev`** | Web + API (remote **`the-ants-db`**) |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | API only (remote **`the-ants-db`**) |
| `npm run dev:api:local` | API with **isolated local D1** (per-machine) |
| `npm run dev:shared` (api ws) | Optional staging DB **`the-ants-db-dev`** |

---

## One-time setup (each developer)

1. **Cloudflare auth** — `npx wrangler login` or `CLOUDFLARE_API_TOKEN` in `apps/api/.dev.vars` (see `.dev.vars.example`).
2. **Web env** — `NEXT_PUBLIC_API_URL=http://127.0.0.1:8787` in `.env.local`.
3. **SSL / VPN** — if remote dev fails with certificate errors, install your org root CA or disable SSL-inspecting VPN. API `dev` script passes `--use-system-ca` to Node.
4. **Remote D1 drops** — Wrangler can briefly lose the production D1 proxy (`Network connection lost`). Sign-in retries automatically; if it still fails, wait a few seconds and try again, or restart `npm run dev`.

---

## Server actions vs API

| Layer | `npm run dev` | Notes |
|---|---|---|
| Auth + API routes | Via API `@ 8787` | Remote **`the-ants-db`** |
| Admin user list / role toggles | Via API `@ 8787` | Same production rows as the-ants.org |
| Other Next.js server actions (`getDb()`) | Web wrangler D1 `remote: true` | Needs Cloudflare auth; SSL uses `--use-system-ca` |

---

## Related

- [`d1.md`](./d1.md) — schema & migrations
- [`cloudflare.md`](./cloudflare.md) — migration tracker
