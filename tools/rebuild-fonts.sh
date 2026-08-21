#!/usr/bin/env bash
# ── rebuild the Chiron GoRound TC subset ─────────────────────────────────
#
# Run this whenever new text is added to the suite — especially anything with
# uncommon characters, like the classical 課文 in 課文工房.
#
# Why it exists: the subset is built from the characters the prototype actually
# uses, which keeps it at ~1.4 MB instead of ~17 MB. That is only safe if it is
# rebuilt when the text changes. It was not, after 岳陽樓記 and 出師表 were
# added, so 268 characters — 岳 among them — silently fell back to PingFang and
# rendered in a visibly different face (2026-08-21).
#
# The charset is derived from the source files every time rather than kept in a
# list, so it cannot drift out of step with the pages again.
#
#   cd Study_LLM && bash tools/rebuild-fonts.sh
#
# Needs: python3, and  pip install fonttools brotli

set -euo pipefail
cd "$(dirname "$0")/.."

echo "── 1. deriving the charset from the suite"
python3 - << 'PY'
import glob, re, html
text = []
for fn in glob.glob('*.html') + glob.glob('*.js') + glob.glob('*.css'):
    t = open(fn, encoding='utf-8').read()
    t = re.sub(r'<[^>]+>', ' ', t)
    text.append(html.unescape(t))
chars = sorted(set(''.join(text)))
keep = [c for c in chars if ord(c) > 0x1F and not (0x1F300 <= ord(c) <= 0x1FAFF)]
open('tools/charset.txt', 'w', encoding='utf-8').write(''.join(keep))
print('   %d characters' % len(keep))
PY

echo "── 2. fetching the source faces"
mkdir -p tools/src
for W in 400 500 600 700 800; do
  if [ ! -f "tools/src/$W.ttf" ]; then
    URL=$(curl -s "https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@$W&display=block" \
          | grep -o 'https://[^)]*\.ttf')
    curl -s -o "tools/src/$W.ttf" "$URL"
    echo "   $W ✓"
  else
    echo "   $W (cached)"
  fi
done

echo "── 3. subsetting"
for W in 400 500 600 700 800; do
  pyftsubset "tools/src/$W.ttf" \
    --text-file=tools/charset.txt \
    --output-file="fonts/chiron-goround-tc-$W.woff2" \
    --flavor=woff2 \
    --layout-features='*' \
    --no-hinting
  printf "   %s  %s\n" "$W" "$(du -h "fonts/chiron-goround-tc-$W.woff2" | cut -f1)"
done

echo "── 4. verifying coverage"
python3 tools/check-fonts.py
