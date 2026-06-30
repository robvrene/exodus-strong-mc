#!/usr/bin/env bash
#
# Exodus Strong — Shopify content/brand harvest
# ---------------------------------------------------------------------------
# Pulls everything needed to plan the Dawn-theme redesign WITHOUT touching the
# live Booster theme. READ-ONLY: this script only performs GET requests.
#
# Prereqs (see ../shopify-redesign/README.md):
#   * Environment network policy must allow *.myshopify.com (and cdn.shopify.com)
#   * A Shopify Admin API access token with read scopes
#
# Usage:
#   SHOPIFY_TOKEN=shpat_xxx ./harvest.sh
#   SHOPIFY_TOKEN=shpat_xxx SHOPIFY_DOMAIN=exodus-strong.myshopify.com ./harvest.sh
#
# Output: ./data/*.json  (catalog, pages, blogs, collections, menus, themes...)
# ---------------------------------------------------------------------------
set -euo pipefail

API="${SHOPIFY_API_VERSION:-2025-07}"
TOKEN="${SHOPIFY_TOKEN:-${1:-}}"
OUT="$(cd "$(dirname "$0")" && pwd)/data"
mkdir -p "$OUT"

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: set SHOPIFY_TOKEN env var (or pass token as first arg)." >&2
  exit 1
fi

hdr=(-H "X-Shopify-Access-Token: $TOKEN" -H "Content-Type: application/json")

# --- 1. Resolve the .myshopify.com domain --------------------------------
resolve_domain() {
  if [[ -n "${SHOPIFY_DOMAIN:-}" ]]; then echo "$SHOPIFY_DOMAIN"; return; fi
  local candidates=(exodus-strong-mc exodusstrong exodus-strong exodusstrongco \
                    exodusstrongofficial exodus-strong-official exodusstrongstore)
  for c in "${candidates[@]}"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "${hdr[@]}" \
      "https://$c.myshopify.com/admin/api/$API/shop.json" || true)
    if [[ "$code" == "200" ]]; then echo "$c.myshopify.com"; return; fi
  done
  echo ""  # not found
}

DOMAIN="$(resolve_domain)"
if [[ -z "$DOMAIN" ]]; then
  echo "ERROR: could not resolve .myshopify.com domain." >&2
  echo "  -> If you get HTTP 000/403, the network policy is still blocking myshopify.com." >&2
  echo "  -> Otherwise set SHOPIFY_DOMAIN=<your-store>.myshopify.com and re-run." >&2
  exit 2
fi
echo ">> Store domain: $DOMAIN"
BASE="https://$DOMAIN/admin/api/$API"

get() {  # get <path> <outfile>
  echo ">> GET $1"
  curl -s "${hdr[@]}" "$BASE/$1" -o "$OUT/$2"
}

# --- 2. Paginated REST fetch (follows Link: rel=next) --------------------
get_paged() {  # get_paged <resource.json?params> <outfile-prefix> <json-key>
  local url="$BASE/$1" prefix="$2" key="$3" page=1
  : > "$OUT/$prefix.ndjson"
  while [[ -n "$url" ]]; do
    echo ">> GET (page $page) $url"
    headers="$(mktemp)"
    curl -s -D "$headers" "${hdr[@]}" "$url" \
      | python3 -c "import sys,json;[print(json.dumps(x)) for x in json.load(sys.stdin).get('$key',[])]" \
      >> "$OUT/$prefix.ndjson" || true
    url="$(grep -i '^link:' "$headers" | grep -o '<[^>]*>; rel="next"' | sed -E 's/<([^>]*)>.*/\1/' || true)"
    rm -f "$headers"; page=$((page+1))
  done
  echo ">> $prefix: $(wc -l < "$OUT/$prefix.ndjson") records"
}

# --- 3. Harvest ----------------------------------------------------------
get "shop.json"                                   shop.json
get "pages.json?limit=250"                        pages.json
get "blogs.json?limit=250"                        blogs.json
get "custom_collections.json?limit=250"           custom_collections.json
get "smart_collections.json?limit=250"            smart_collections.json
get "themes.json"                                 themes.json
get_paged "products.json?limit=250&status=active" products products

# Articles per blog
python3 - "$OUT/blogs.json" <<'PY' || true
import json,sys
try:
    blogs=json.load(open(sys.argv[1])).get("blogs",[])
    print(" ".join(str(b["id"]) for b in blogs))
except Exception: print("")
PY

# Navigation menus (GraphQL — REST has no stable menu endpoint)
echo ">> GET menus (GraphQL)"
curl -s "${hdr[@]}" -X POST "$BASE/graphql.json" \
  -d '{"query":"{ menus(first:20){nodes{handle title items{title url type resourceId items{title url type}}}} }"}' \
  -o "$OUT/menus.json" || true

# Live theme brand settings (read-only): find MAIN theme, pull settings_data.json
echo ">> Resolving MAIN theme id for brand settings"
MAIN_ID="$(python3 -c "import json;print(next((t['id'] for t in json.load(open('$OUT/themes.json'))['themes'] if t.get('role')=='main'),''))" 2>/dev/null || true)"
if [[ -n "$MAIN_ID" ]]; then
  for key in config/settings_data.json config/settings_schema.json; do
    safe="${key//\//_}"
    echo ">> GET theme $MAIN_ID asset $key"
    curl -s "${hdr[@]}" "$BASE/themes/$MAIN_ID/assets.json?asset%5Bkey%5D=$key" \
      -o "$OUT/livetheme_$safe" || true
  done
fi

echo
echo "==================================================================="
echo "Harvest complete. Files in: $OUT"
ls -la "$OUT"
echo "Next: review data and compile the redesign brief (see README.md)."
