#!/bin/sh
# Build HTML, dump the fitted DOM and summarise per-page font scale.
cd "$(dirname "$0")"
python3 build.py --html-only $1 >/dev/null
f=book.html; [ "$1" = "--duplex" ] && f=book-duplex.html
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=20000 --dump-dom "file://$PWD/$f" 2>/dev/null > dom.html
python3 - <<'PY'
import re
d=open('dom.html').read()
pages=re.findall(r'<section class="page ([^"]*)"([^>]*)>',d)
low=[]
for i,(cls,attrs) in enumerate(pages,1):
    fs=float(re.search(r'data-fs="([\d.]+)"',attrs).group(1)); ov=re.search(r'data-overflow="(\d+)"',attrs)
    if fs<0.999 or ov: low.append((i,cls.split()[1],fs,ov.group(1) if ov else ''))
print(len(pages),'pages; scaled:',len(low)); 
for x in sorted(low,key=lambda x:x[2]): print(*x)
PY
