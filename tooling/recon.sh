#!/usr/bin/env bash
# Reproducible web-recon for REF: Dating Coach (clean-room, no secrets stored).
# Usage: bash tooling/recon.sh
set -euo pipefail
ID=6803683151
OUT="$(cd "$(dirname "$0")/.." && pwd)/recon"
mkdir -p "$OUT"

# 1) App Store metadata
curl -s --max-time 25 "https://itunes.apple.com/lookup?id=${ID}" -o "$OUT/lookup.json"

# 2) Production SPA shell + main bundle
curl -s --max-time 25 -A "Mozilla/5.0" https://refdating.com -o "$OUT/site_index.html"
BUNDLE=$(grep -oE '/assets/main-[A-Za-z0-9_-]+\.js' "$OUT/site_index.html" | head -1)
curl -s --max-time 30 -A "Mozilla/5.0" "https://refdating.com${BUNDLE}" -o "$OUT/main.js"

echo "== backend domains =="
grep -oiE "https?://[a-z0-9.-]+\.(supabase\.co|lovable\.app|stripe\.com|rev\.cat|lovable\.dev)[a-z0-9/_?=.&-]*" "$OUT/main.js" | sort -u

echo "== edge functions (supabase.functions.invoke) =="
grep -oiE '\.invoke\("[a-z0-9_-]+' "$OUT/main.js" | sed 's/.*"//' | sort -u

echo "== feature keyword counts =="
for kw in coaching icebreaker profile-review screenshot subscription revenuecat stripe paywall; do
  printf "%-16s %s\n" "$kw" "$(grep -oiE "$kw" "$OUT/main.js" | wc -l)"
done
echo "Artifacts in $OUT"
