#!/usr/bin/env python3
"""Fail loudly if the suite uses characters the subset does not carry.

Run after editing copy. The 2026-08-21 regression — 268 characters falling
back to PingFang because the subset predated the 課文 demo texts — was
invisible until someone noticed 岳 rendering in the wrong face.
"""
import glob, re, html, sys
from fontTools.ttLib import TTFont

text = []
for fn in glob.glob('*.html') + glob.glob('*.js') + glob.glob('*.css'):
    t = open(fn, encoding='utf-8').read()
    t = re.sub(r'<[^>]+>', ' ', t)
    text.append(html.unescape(t))
def is_text(c):
    """Only glyphs the text font is responsible for.

    Icons, arrows, dingbats and emoji (★ ✨ ⏱ ▾ ✓) are deliberately absent —
    fonts.css says so — and fall back to the system emoji font. Flagging them
    would make this check fail permanently, which means it would be ignored,
    which means the next real regression goes unnoticed.
    """
    o = ord(c)
    return (
        0x20 <= o <= 0x7E                      # ASCII
        or 0xA0 <= o <= 0x24F                  # Latin-1 + Latin Extended
        or o in (0x2013, 0x2014, 0x2026)       # – — …
        or 0x2018 <= o <= 0x201D               # curly quotes
        or 0x3000 <= o <= 0x303F               # CJK punctuation 。，「」（）
        or 0x3400 <= o <= 0x9FFF               # CJK Unified
        or 0xF900 <= o <= 0xFAFF               # CJK Compatibility
        or 0xFF00 <= o <= 0xFFEF               # fullwidth forms
    )

used = {c for c in set(''.join(text)) if is_text(c)}

bad = 0
for w in (400, 500, 600, 700, 800):
    f = TTFont('fonts/chiron-goround-tc-%d.woff2' % w)
    cov = set()
    for t in f['cmap'].tables:
        cov |= set(t.cmap.keys())
    missing = sorted(c for c in used if ord(c) not in cov)
    if missing:
        bad += 1
        print('   weight %d — %d missing: %s' % (w, len(missing), ''.join(missing[:60])))
    else:
        print('   weight %d — complete (%d chars)' % (w, len(used)))

if bad:
    print('\n   Run  bash tools/rebuild-fonts.sh')
    sys.exit(1)
