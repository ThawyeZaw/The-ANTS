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

### 1. Redeploy API (Lax cookies) + optional web (workers_dev restore)

```bash
cd apps/api && npx wrangler deploy
npm run cf:deploy:web
```

Web redeploy is optional for www redirect (now fixed at Cloudflare edge). Still recommended once for `workers_dev: true` restore.

### 2. Smoke

- [x] https://the-ants.org loads (verified)
- [ ] https://www.the-ants.org → 301 to apex (Cloudflare Redirect Rule)
- [ ] Login/signup → `api.the-ants.org/api/auth/...`
- [ ] D1-backed page/action works

### 3. Telegram webhook

```text
https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

Set to: `https://the-ants.org/api/telegram/webhook`  
(`TELEGRAM_BOT_TOKEN` already on `the-ants-web`.)

### 4. After smoke — decommission

1. Vercel: remove domains / delete project  
2. Neon: delete project  
3. Optional: remove `*.the-ants.org` Vercel A records and `_domainconnect` CNAME

## Rollback

Cloudflare → Workers → `the-ants-web` → Domains → detach apex/`www`; restore Vercel DNS; reset Telegram webhook. Delete Redirect Rule “www to apex (Phase 6)” if rolling back www.
