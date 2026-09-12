# Handoff — Phase 5 skipped; Phase 6 needs explicit OK

> Tracker: [`cloudflare.md`](./cloudflare.md)

## Status snapshot (2026-09-12)

| Item | Value |
|---|---|
| **Completed through** | Phase 4 (repo) |
| **Phase 5** | **Skipped** — owner confirmed Neon has little/no important data |
| **Next** | **Phase 6 cutover** — only after explicit approval |
| **Do not yet** | Flip apex DNS to web Worker; delete Neon/Vercel |

### Live stack

- D1 `the-ants-db` is source of truth (includes `testuser@the-ants.org`)
- API: `https://api.the-ants.org`
- Web preview: `https://the-ants-web.thawyezaw.workers.dev`
- Production apex still on Vercel until Phase 6

### To start Phase 6

Paste a prompt that says you **explicitly approve Phase 6 cutover planning** (DNS hosting to Workers, Telegram webhook, smoke tests, then Neon/Vercel decommission). Do not approve casually — this flips production web hosting.
