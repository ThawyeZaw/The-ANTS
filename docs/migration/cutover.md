# Phase 6 — Production cutover

> Tracker: [`cloudflare.md`](./cloudflare.md)  
> **Status (2026-09-12):** Apex + www attached to Worker `the-ants-web`. Finish smoke + Telegram + decommission below.

## Locked cutover choices

| Item | Choice |
|---|---|
| Canonical host | **`the-ants.org`** (www → apex) |
| DNS | Zone active on Cloudflare |
| Cookies | `SameSite=Lax` + `crossSubDomainCookies` domain `.the-ants.org` |
| Decommission | Delete Neon + Vercel **after smoke passes** |
| OAuth | Skip for now |

## Done (MCP / repo)

- [x] Zone `the-ants.org` active on Cloudflare
- [x] Removed Vercel A records for apex/`www`
- [x] Attached **`the-ants.org`** + **`www.the-ants.org`** → **`the-ants-web`**
- [x] Left **`api.the-ants.org`** → `the-ants-api`
- [x] Repo: Lax + cross-subdomain cookies; Next www→apex redirect; wrangler custom_domain routes

## You — remaining manual only

### 1. Redeploy API (Lax cookies) + web
- [x] API redeployed with custom domain `api.the-ants.org` and `workers_dev: true`
- [x] Web redeployed via OpenNext with `NEXT_PUBLIC_API_URL=https://api.the-ants.org`

### 2. Smoke
- [x] https://the-ants.org loads (verified)
- [x] https://api.the-ants.org/health returns ok (verified)
- [x] https://the-ants.org/robots.txt live (verified)
- [x] https://the-ants.org/sitemap.xml live (verified)
- [x] https://the-ants.org/manifest.webmanifest live (verified)
- [ ] Login/signup → `api.the-ants.org/api/auth/...`
- [ ] D1-backed page/action works

### 3. Telegram webhook
- [x] Verified active at: `https://the-ants.org/api/telegram/webhook` (0 pending updates)

### 4. After smoke — decommission

1. Vercel: remove domains / delete project  
2. Neon: delete project  
3. Optional: remove `*.the-ants.org` Vercel A records and `_domainconnect` CNAME

## Routing note (important)

Do **not** add a Worker route pattern `*.the-ants.org/*` on `the-ants-web`. That steals `api.the-ants.org` from `the-ants-api` and breaks login (CORS / 404 HTML from Next). Use **custom domains** only:

- `the-ants.org` + `www.the-ants.org` → `the-ants-web`
- `api.the-ants.org` → `the-ants-api`

(Fixed 2026-09-12: deleted wildcard route `*.the-ants.org/*`.)

## Rollback

Cloudflare → Workers → `the-ants-web` → Domains → detach apex/`www`; restore Vercel DNS; reset Telegram webhook. Delete Redirect Rule “www to apex (Phase 6)” if rolling back www.
