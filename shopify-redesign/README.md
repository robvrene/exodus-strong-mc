# Exodus Strong — Website Redesign Workspace

Planning + tooling for a complete, world-class, high-converting redesign of the
Exodus Strong storefront.

## Hard rules
- **Never touch the live theme.** Live = `booster-7-1-7-medical-1` (role `MAIN`).
  All design work happens on the **unpublished Dawn** theme, kept unpublished
  until explicitly approved for go-live.
- Reuse existing brand assets — copy, product info, images, videos.

## Decisions locked
| Decision | Choice |
|---|---|
| Theme base | **Fresh Dawn** (clean OS 2.0, fast, fully customizable) |
| Working canvas | The existing **unpublished Dawn** theme in the library |
| Live theme | `booster-7-1-7-medical-1` — untouched the entire project |

## Store facts (from `get-shop-info`)
- Name: **Exodus Strong** · Domain: `exodusstrong.com`
- Plan: Advanced · Currency: USD · Timezone: CDT · Country: US

## Access — IMPORTANT
Two ways to reach Shopify from a Claude Code web session:

1. **Shopify MCP connector** (`mcp__Shopify__*`). Works via Anthropic's MCP
   gateway. Caveat: if it drops mid-session it does NOT re-register into that
   running session — needs a **fresh session**.
2. **Admin API token via `harvest.sh`** (this folder). Requires the environment
   **network egress policy** to allow `*.myshopify.com` and `cdn.shopify.com`.
   Until that's open, direct calls fail with `403 CONNECT` at the proxy.

### Running the harvest
```bash
cd shopify-redesign
SHOPIFY_TOKEN=shpat_xxxxx ./harvest.sh
# or, if domain probing fails:
SHOPIFY_TOKEN=shpat_xxxxx SHOPIFY_DOMAIN=<store>.myshopify.com ./harvest.sh
```
Read-only. Writes JSON to `shopify-redesign/data/`.

> Rotate any token after use. Never commit tokens (`.env*` is gitignored).

## Harvest checklist → feeds the redesign brief
- [ ] Shop settings, all pages, navigation menus, blogs/articles
- [ ] Full product catalog (titles, descriptions, variants, pricing, tags)
- [ ] Collections (custom + smart) and product organization
- [ ] Product/lifestyle images + videos (CDN URLs)
- [ ] Live theme brand assets — colors, fonts, logo (`settings_data.json`)
- [ ] Best-sellers / analytics + reviews (conversion intelligence)

## Themes in library (snapshot 2026-06-30)
- `booster-7-1-7-medical-1` — **MAIN (live)** — do not touch
- `Dawn` — unpublished — **redesign canvas**
- `Website-Changes-booster-7-1-7-medical-1` — unpublished (staging copy)
- `booster-6-2-2-beer`, several `Copy of booster-6-2-0-tea`, `Loop's Copy of Live`,
  `AVADA Assets - DO NOT REMOVE` — unpublished/legacy
- `Prestige` (demo), `Dawn` (trial)
