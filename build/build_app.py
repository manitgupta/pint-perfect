#!/usr/bin/env python3
"""Generate the Pint Perfect PWA data + assets from the same JSON as the PDF.

Writes into ../docs (served by GitHub Pages): data/book.json, art/*.svg, fonts/, icons/, and a versioned
precache list inside sw.js. The hand-written app shell (index.html, app.css,
app.js, sw.template.js) lives in ../app_src and is copied over.

Usage: python3 build_app.py
"""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

from art import illustration, legible, lighten, darken
from build import SECTIONS, PROGRAM_COLOURS, STEP_TAGS, CHROME, load

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "app_src"
OUT = ROOT / "docs"


def book_pages(sections):
    """Mirror build.py's pagination so the app can point at printed pages."""
    page = 2 + 7
    pages = {}
    for s in sections:
        page += 1
        for r in s["recipes"]:
            page += 1
            pages[r["num"]] = page
    return pages


def main():
    sections, fm = load()
    pages = book_pages(sections)
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "art").mkdir(parents=True)
    (OUT / "data").mkdir()
    (OUT / "icons").mkdir()
    shutil.copytree(ROOT / "build" / "fonts", OUT / "fonts",
                    ignore=shutil.ignore_patterns("Caveat*", "DMSans-Italic*"))

    out_sections, out_recipes = [], []
    for s in sections:
        protein = s["key"].startswith(("s1", "s2"))
        p, b, a = s["art"]
        (OUT / "art" / f"section-{s['num']}.svg").write_text(
            illustration(p, b, a, darken(b, 0.5), seed=s["num"] * 5, has_mixins=True, protein=protein))
        out_sections.append(dict(num=s["num"], key=s["key"], title=s["title"], sub=s["sub"],
                                 colour=s["colour"], tint=lighten(s["colour"], 0.9), blurb=s["blurb"],
                                 recipes=[r["slug"] for r in s["recipes"]]))
        for r in s["recipes"]:
            c = r.get("colors", {})
            base = c.get("base", "#E8C07A")
            accent = c.get("accent", "#7FA65A")
            deep = legible(c.get("deep", darken(base, 0.5)))
            is_protein = r["nutrition_per_pint"]["protein_g"] >= 25 and protein
            (OUT / "art" / f"{r['slug']}.svg").write_text(
                illustration(r["program"], base, accent, deep, seed=r["num"],
                             has_mixins=bool(r.get("mixins")), protein=is_protein))
            rec = {k: v for k, v in r.items() if k not in ("section", "colors")}
            rec.update(section=s["num"], page=pages[r["num"]],
                       base=base, accent=accent, deep=deep,
                       tint=lighten(base, 0.8), tint2=lighten(base, 0.9))
            out_recipes.append(rec)

    book = dict(title="Pint Perfect", sections=out_sections, recipes=out_recipes, guide=fm,
                programs=PROGRAM_COLOURS, steps={k: {"label": l, "colour": c} for k, (l, c) in STEP_TAGS.items()})
    (OUT / "data" / "book.json").write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")))

    # app shell
    for f in SRC.iterdir():
        if f.name == "sw.template.js" or f.name.startswith("."):
            continue
        if f.is_dir():
            shutil.copytree(f, OUT / f.name)
        else:
            shutil.copy(f, OUT / f.name)

    # icons: render icon.svg to PNG with headless Chrome
    art = illustration("LITE ICE CREAM", "#F4A7B9", "#3559A8", "#8A2340", seed=4, has_mixins=True, protein=False)
    inner = art.split(">", 1)[1].rsplit("</svg>", 1)[0]
    icon_svg = ('<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">'
                '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9DC"/>'
                '<stop offset="1" stop-color="#FFD3C2"/></linearGradient></defs>'
                f'<rect width="200" height="200" fill="url(#bg)"/><g transform="translate(14 8) scale(.86)">{inner}</g></svg>')
    (OUT / "icons" / "icon.svg").write_text(icon_svg)
    for size in (180, 192, 512):
        html = (f'<html><body style="margin:0;background:transparent">'
                f'<div style="width:{size}px;height:{size}px">{icon_svg.replace("<svg ", f"<svg width=\"{size}\" height=\"{size}\" ", 1)}</div></body></html>')
        tmp = OUT / "icons" / f"_tmp{size}.html"
        tmp.write_text(html)
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
                        f"--window-size={size},{size}", f"--screenshot={OUT / 'icons' / f'icon-{size}.png'}", tmp.as_uri()],
                       check=True, capture_output=True)
        tmp.unlink()

    # service worker with a precache list + content hash as version
    files = sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*") if p.is_file() and p.name != "sw.js")
    h = hashlib.sha256()
    for f in files:
        h.update(f.encode())
        h.update((OUT / f).read_bytes())
    version = h.hexdigest()[:10]
    sw = (SRC / "sw.template.js").read_text()
    sw = sw.replace("__VERSION__", version).replace("__FILES__", json.dumps(["./"] + files, indent=1))
    (OUT / "sw.js").write_text(sw)
    (OUT / ".nojekyll").write_text("")
    total = sum((OUT / f).stat().st_size for f in files)
    print(f"app: {OUT}  files: {len(files)}  size: {total / 1024:.0f} KB  version: {version}")


if __name__ == "__main__":
    main()
