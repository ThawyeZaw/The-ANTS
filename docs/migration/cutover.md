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
| OAuth | Google ready in code — set Worker secrets + Google Cloud redirect URIs |

## Done (MCP / repo)

- [x] Zone `the-ants.org` active on Cloudflare
- [x] Removed Vercel A records for apex/`www`
- [x] Attached **`the-ants.org`** + **`www.the-ants.org`** → **`the-ants-web`**
- [x] Left **`api.the-ants.org`** → `the-ants-api`
- [x] Repo: Lax + cross-subdomain cookies; Next www→apex redirect; wrangler custom_domain routes

## Google OAuth setup (manual)

Code is ready (Continue with Google on `/login` and `/signup`). You still need credentials:

1. **Google Cloud Console** → OAuth consent screen (External) → app name The ANTS; authorized domain `the-ants.org`. Add test users while in Testing.
2. **Credentials → OAuth client ID → Web application**
   - Authorized JavaScript origins: `https://the-ants.org`, `https://www.the-ants.org`, `http://localhost:3005`, `http://127.0.0.1:3005`
   - Authorized redirect URIs:
     - `https://api.the-ants.org/api/auth/callback/google`
     - `http://127.0.0.1:8787/api/auth/callback/google`
     - `http://localhost:8787/api/auth/callback/google`
3. **Production secrets** (from `apps/api`):
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```
   Redeploy `the-ants-api` after setting secrets.
4. **Local** (optional): put the same keys in `apps/api/.dev.vars`. Use matching hosts for web + API (`127.0.0.1` or `localhost`, not mixed).
5. **Smoke:** `/login` → Continue with Google → land on `/dashboard`; confirm D1 `account.provider_id = google` and a `profiles` row.
6. Do **not** put the client secret in Next.js / `apps/web` env. Publish the consent screen before inviting the public.

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
