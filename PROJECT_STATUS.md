# Oscar — Project Status

**Updated:** 2026-07-07 · **Live:** https://oscar.theastraway.com · **Repo:** https://github.com/theastraway/oscar

## Done — on main and live

- Landing page (dark-academia, live demo, quickstart, pricing) deployed on Vercel, custom domain via Cloudflare CNAME.
- `/api/ask` free-tier API proxying Oscar's MIND tenant (10 queries/day per IP, Pro keys via `OSCAR_PRO_KEYS` env).
- MCP server: `npx -y github:theastraway/oscar` → `ask_oscar` tool. Verified end-to-end (init + grounded answer).
- Stripe live: Oscar Pro $20/mo and Oscar Team $99/mo products + payment links (wired on the pricing section).
- Docs (`docs/mcp.md`, `docs/api.md`) and examples (curl, Python).

## How to test

1. Open https://oscar.theastraway.com → ask a question in the live demo (free tier, no signup).
2. `claude mcp add oscar -- npx -y github:theastraway/oscar` → ask Claude Code to "ask Oscar how MERGE deduplicates".
3. Click "Get Oscar Pro" on the pricing section → real Stripe checkout.

## Next (V2)

- Stripe webhook → auto-provision Pro API keys (currently manual: add key to `OSCAR_PRO_KEYS` in Vercel, redeploy, email buyer).
- Durable rate limiting (Upstash/KV) instead of per-lambda memory.
- Marketing assets + GTM checklist live in `~/Documents/Oscar-GTM/` (local) and MIND.

## Env (Vercel production)

- `OSCAR_MIND_API_KEY` — upstream MIND tenant key (set)
- `OSCAR_PRO_KEYS` — comma-separated Pro keys (empty until first sale)
- `OSCAR_FREE_PER_IP` / `OSCAR_FREE_GLOBAL` — optional overrides (defaults 10 / 1000)
