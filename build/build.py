#!/usr/bin/env python3
"""Build the Ninja CREAMi recipe book: JSON data -> HTML -> PDF (headless Chrome).

Usage: python3 build.py [--duplex] [--html-only]
"""
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from art import illustration, legible, lighten, darken, mix

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
BUILD = ROOT / "build"
CHROME = shutil.which("google-chrome") or shutil.which("chromium") or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHROME_ARGS = ["--no-sandbox"] if sys.platform == "linux" else []

DUPLEX = "--duplex" in sys.argv
BOOK_TITLE = "Pint Perfect"

SECTIONS = [
    dict(key="s1_whey", title="Protein Pints", sub="Whey-Powered", colour="#3559A8",
         blurb="Ten scoopable, macro-friendly pints built on a scoop of whey and everyday Amul milk. "
               "Each one clears 25 g of protein per pint and runs on LITE ICE CREAM, so expect a re-spin or two.",
         art=("LITE ICE CREAM", "#6B4226", "#F2C14E")),
    dict(key="s2_yogurt", title="Protein Pints", sub="Greek Yogurt, Turbo & Paneer", colour="#0F8077",
         blurb="Tangy, creamy and protein-dense, built on Greek yogurt, Epigamia Turbo, high-protein paneer and "
               "Amul's protein range. Several need no cooking and almost no measuring.",
         art=("LITE ICE CREAM", "#F4B13E", "#E8484D")),
    dict(key="s3_desi", title="Desi Ice Creams", sub="Parlour Classics at Home", colour="#D0611B",
         blurb="Malai kulfi, aamras, filter coffee, paan, sitaphal. The flavours you queue for at Naturals or the "
               "kulfi-wala, made full-fat and proper with Amul cream and Milkmaid.",
         art=("ICE CREAM", "#F3D9A4", "#4F8A3A")),
    dict(key="s4_global", title="Global Classics", sub="The Scoop-Shop Greats", colour="#A3324F",
         blurb="Vanilla bean, dark chocolate, butterscotch, cookie dough and the rest of the parlour menu. "
               "Rich ICE CREAM bases, most with a MIX-IN finish.",
         art=("ICE CREAM", "#5A3622", "#F7F1E3")),
    dict(key="s5_gelato", title="Gelato", sub="Sicilian-Style, With or Without Eggs", colour="#5C7F2C",
         blurb="More milk, less cream, a cornflour-thickened base cooked on the stove. Dense, silky and served "
               "a little warmer than ice cream. Eggless by default, each with an optional egg-yolk crema version.",
         art=("GELATO", "#BDB98A", "#8DA35A")),
    dict(key="s6_sorbet", title="Sorbets, Bowls & Shakes", sub="Bright, Fruity & Fun", colour="#D6404E",
         blurb="Gola-stall kala khatta, aam panna, Nagpur santra and more dairy-free sorbets, plus a protein "
               "smoothie bowl and a nostalgic malt thickshake.",
         art=("SORBET", "#E8506A", "#7BC043")),
    dict(key="s7_milk", title="Everyday Milk Pints", sub="Ghar Ka Doodh, Spun", colour="#B07A2A",
         blurb="Haldi doodh, ragi malt, til-gud and a banana paneer shake. Low-cook pints built on the milk "
               "already in your fridge, and the easiest ones to make gym- or diabetic-friendly.",
         art=("LITE ICE CREAM", "#E9C46A", "#8C5A2B")),
]

PROGRAM_COLOURS = {
    "ICE CREAM": "#C2366B",
    "LITE ICE CREAM": "#2B77B5",
    "GELATO": "#5C7F2C",
    "SORBET": "#DB6A1F",
    "SMOOTHIE BOWL": "#7E4AA8",
    "MILKSHAKE": "#8A5A2B",
    "MIX-IN": "#4A4F57",
    "RE-SPIN": "#4A4F57",
}

STEP_TAGS = {
    "PREP": ("Prep", "#6B7280"),
    "COOK": ("Cook", "#C2410C"),
    "COOL": ("Cool", "#0E7490"),
    "BLAST": ("Blast", "#6D28D9"),
    "FREEZE": ("Freeze", "#2563EB"),
    "SPIN": ("Spin", "#BE185D"),
    "RESPIN": ("Re-spin", "#9D174D"),
    "MIXIN": ("Mix-in", "#B45309"),
    "SERVE": ("Serve", "#15803D"),
}

ICONS = {
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "snow": '<path d="M12 2v20M4.9 6.5l14.2 11M4.9 17.5l14.2-11"/><path d="M9.5 3.5 12 5.5l2.5-2M9.5 20.5 12 18.5l2.5 2"/>',
    "gauge": '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/>',
    "people": '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c3 .2 5 2.4 5 5.8"/>',
    "spin": '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/>',
    "cart": '<path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/>',
    "bulb": '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    "swap": '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    "pen": '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    "x": '<path d="M6 6l12 12M18 6 6 18"/>',
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    "egg": '<path d="M12 3c3.6 0 6.5 5.6 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.6 8.4 3 12 3z"/><circle cx="12" cy="14" r="2.6"/>',
    "flame": '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5.5 1 1 1.5 2 1.5 3 1-2.5 1.5-5 1.5-7.5z"/>',
}


def icon(name, cls="ic"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>')


def e(s):
    return html.escape(str(s), quote=True)


def rich(s):
    """Escape, then bold any CREAMi program names in caps."""
    out = e(s)
    names = sorted(PROGRAM_COLOURS, key=len, reverse=True) + ["MAX FILL"]
    pat = "|".join(re.escape(n) for n in names)
    return re.sub(rf"(?<![A-Za-z-])({pat})(?![A-Za-z-])", r'<span class="prog-word">\1</span>', out)


def program_badge(p, small=False):
    c = PROGRAM_COLOURS.get(p.upper(), "#444")
    return f'<span class="prog{" sm" if small else ""}" style="--pc:{c}">{e(p.upper())}</span>'


# ---------------------------------------------------------------- data

def load():
    sections = []
    n = 0
    for s in SECTIONS:
        path = DATA / f"{s['key']}.json"
        recipes = json.loads(path.read_text()) if path.exists() else []
        for r in recipes:
            n += 1
            r["num"] = n
            r["section"] = s
        sections.append(dict(s, recipes=recipes, num=len(sections) + 1))
    fm = json.loads((DATA / "frontmatter.json").read_text())
    return sections, fm


# ---------------------------------------------------------------- page shells

class Book:
    def __init__(self):
        self.pages = []  # (kind, builder) builders take page number

    def add(self, fn, tab=None, cls=""):
        self.pages.append(dict(fn=fn, tab=tab, cls=cls))
        return len(self.pages)

    def render(self):
        out = []
        for i, p in enumerate(self.pages, start=1):
            side = "even" if (DUPLEX and i % 2 == 0) else "odd"
            tab = ""
            if p["tab"]:
                sec = p["tab"]
                tab = (f'<div class="tab" style="--sc:{sec["colour"]};top:{40 + (sec["num"] - 1) * 34}mm">'
                       f'<span>{sec["num"]:02d}</span></div>')
            body = p["fn"](i)
            folio = "" if "nofolio" in p["cls"] else (
                f'<footer class="folio"><span class="pg">{i}</span><span class="bk">{BOOK_TITLE}'
                f'{" · " + e(p["tab"]["title"]) if p["tab"] else ""}</span></footer>')
            out.append(f'<section class="page {side} {p["cls"]}">{tab}{body}{folio}</section>')
        return "\n".join(out)


# ---------------------------------------------------------------- cover

def cover(sections):
    def fn(_):
        arts = []
        picks = [("ICE CREAM", "#F4C9D6", "#D6404E", "#8A2340", True),
                 ("LITE ICE CREAM", "#6B4226", "#F2C14E", "#3A2414", True),
                 ("GELATO", "#BDB98A", "#8DA35A", "#4A5422", False),
                 ("SORBET", "#F49A3C", "#7BC043", "#8A4A10", False),
                 ("MILKSHAKE", "#C8A27A", "#3559A8", "#5A3A1C", False),
                 ("SMOOTHIE BOWL", "#E04C8C", "#F2C14E", "#7A1F4A", False)]
        for i, (p, b, a, d, mx) in enumerate(picks):
            arts.append(f'<div class="cv-art a{i}">{illustration(p, b, a, d, seed=i + 11, has_mixins=mx, protein=(p == "LITE ICE CREAM"))}</div>')
        allr = [r for s in sections for r in s["recipes"]]
        hp = sum(1 for r in allr if "High Protein" in r.get("tags", []) or r["nutrition_per_pint"]["protein_g"] >= 30)
        stats = "".join(f'<div><b>{v}</b><span>{e(k)}</span></div>' for v, k in [
            (len(allr), "recipes"), (hp, "high-protein pints"), ("100%", "vegetarian, eggless by default"), (7, "CREAMi programs used")])
        secs = "".join(f'<li style="--sc:{s["colour"]}"><b>{s["num"]:02d}</b> {e(s["title"])}'
                       f'{": " + e(s["sub"]) if s["title"] == "Protein Pints" else ""}</li>' for s in sections)
        return f'''
<div class="cover-bg"></div>
<div class="inner cover-inner">
  <div class="cv-top">
    <div class="cv-eyebrow">For the Ninja CREAMi NC300IN &amp; Ninja Blast</div>
    <h1 class="cv-title">Pint<br><em>Perfect</em></h1>
    <p class="cv-sub">{len(allr)} Ninja CREAMi recipes for the Indian kitchen</p>
    <p class="cv-chips"><span>High-protein pints</span><span>Desi classics</span><span>Gelato</span><span>Sorbet</span><span>Shakes &amp; bowls</span></p>
  </div>
  <div class="cv-arts">{"".join(arts)}</div>
  <div class="cv-bottom">
    <ul class="cv-secs">{secs}</ul>
    <div class="cv-stats">{stats}</div>
    <p class="cv-note">Everything sourced from Blinkit, Zepto, Instamart, BigBasket &amp; Amazon. Vegetarian throughout. Every recipe works without eggs; optional egg-yolk versions where they help. Gym and diabetic versions of every recipe are in the companion app.</p>
  </div>
</div>'''
    return fn


# ---------------------------------------------------------------- contents

def contents(sections, recipe_pages, divider_pages, extra):
    def fn(_):
        cols = []
        for s in sections:
            rows = "".join(
                f'<li><span class="c-n">{r["num"]:02d}</span><span class="c-t">{e(r["title"])}</span>'
                f'<span class="c-p">{r["nutrition_per_pint"]["protein_g"]}g</span>'
                f'<span class="c-dots"></span><span class="c-pg">{recipe_pages[r["num"]]}</span></li>'
                for r in s["recipes"])
            cols.append(f'<div class="c-sec" style="--sc:{s["colour"]}"><h3><span>{s["num"]:02d}</span>{e(s["title"])}'
                        f'<small>{e(s["sub"])}</small><em>{divider_pages[s["num"]]}</em></h3><ol>{rows}</ol></div>')
        ex = "".join(f'<li><span class="c-t">{e(t)}</span><span class="c-dots"></span><span class="c-pg">{p}</span></li>'
                     for t, p in extra)
        # split sections across the two columns so the taller column is as short as possible
        # (the guide list sits at the top of the left column; a heading costs about 2.4 lines)
        guide_h = len(extra) + 2.4
        heights = [len(s["recipes"]) + 2.4 for s in sections]
        split = min(range(len(sections) + 1),
                    key=lambda k: max(guide_h + sum(heights[:k]), sum(heights[k:])))
        dense = " dense" if max(guide_h + sum(heights[:split]), sum(heights[split:])) > 44 else ""
        return f'''
<div class="inner">
  <div class="pg-head"><div class="eyebrow">Inside</div><h1>Contents</h1></div>
  <div class="contents{dense}">
    <div class="c-col">
      <div class="c-sec c-guide"><h3><span>✦</span>The Guide</h3><ol class="c-extra">{ex}</ol></div>
      {"".join(cols[:split])}
    </div>
    <div class="c-col">{"".join(cols[split:])}</div>
  </div>
  <p class="c-legend">Numbers in grey = protein per pint. Recipe pages show nutrition for the whole pint and per serving. Gym and diabetic versions of every recipe are in the app.</p>
</div>'''
    return fn


# ---------------------------------------------------------------- guide pages

def finder(sections):
    allr = [r for s in sections for r in s["recipes"]]
    n = lambda r: r["nutrition_per_pint"]
    groups = [
        ("Post-workout", "40 g+ protein per pint", "#3559A8", [r for r in allr if n(r)["protein_g"] >= 40]),
        ("Lean & light", "Under 450 kcal for the whole pint", "#0F8077", [r for r in allr if n(r)["kcal"] < 450]),
        ("10-minute pints", "No stove, 10 minutes or less hands-on", "#6D28D9", [r for r in allr if not r.get("cook_min") and r.get("prep_min", 99) <= 10]),
        ("Dairy-free & vegan", "Sorbets for everyone at the table", "#D6404E", [r for r in allr if "Vegan" in r.get("tags", [])]),
        ("Desi favourites", "Flavours from the kulfi cart and the mithai box", "#D0611B", [r for r in allr if "Desi Classic" in r.get("tags", [])]),
        ("Party pints", "Crowd-pleasers worth making two of", "#A3324F", [r for r in allr if {"Party Pint", "Kid Favourite"} & set(r.get("tags", []))]),
    ]
    cards = []
    for t, sub, c, rs in groups:
        K = 5
        more = f'<li class="more">+ {len(rs) - K} more</li>' if len(rs) > K else ""
        items = "".join(f'<li><b>{r["num"]:02d}</b>{e(r["title"])}</li>' for r in rs[:K]) + more
        cards.append(f'<div class="fd-card" style="--fc:{c}"><h4>{e(t)}</h4><p>{e(sub)}</p><ul>{items}</ul></div>')
    return f'<div class="finder"><h2 class="sec-h">Find your pint</h2><div class="fd-grid">{"".join(cards)}</div></div>'


NUM_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]


def section_name(s):
    return f'{s["title"]}: {s["sub"]}' if s["title"] == "Protein Pints" else s["title"]


def live_counts(text, sections):
    """Keep recipe / section counts in guide prose in step with the data (the prose is hand-written)."""
    n = sum(len(s["recipes"]) for s in sections)
    k = len(sections)
    word = NUM_WORDS[k] if k < len(NUM_WORDS) else str(k)
    text = re.sub(r"\b\d+ recipes\b", f"{n} recipes", text)
    text = re.sub(r"\b(?:\d+|" + "|".join(NUM_WORDS[2:]) + r") sections\b", f"{word} sections", text)
    names = [section_name(s) for s in sections]
    listing = "; ".join(names[:-1]) + "; and " + names[-1] if len(names) > 1 else names[0]
    return re.sub(r"(\b\w+ sections: )[^.]*\.", lambda m: m.group(1) + listing + ".", text, count=1)


def welcome(fm, sections, ctx):
    def fn(_):
        w = fm["welcome"]
        paras = "".join(f"<p>{rich(live_counts(p, sections))}</p>" for p in w["paragraphs"])
        hp = ctx.get("healthier pints")
        eggs_row = ('<div class="an-row"><b>With eggs (optional)</b><p>Every recipe is eggless as written. Where yolks make it richer, '
                    'a yellow panel shows the custard-style upgrade.</p></div>')
        progs = "".join(f'<li>{program_badge(k, True)}</li>' for k in PROGRAM_COLOURS if k not in ("MIX-IN", "RE-SPIN"))
        tags = "".join(f'<li><span class="stag" style="--tc:{c}">{e(lbl)}</span></li>' for k, (lbl, c) in STEP_TAGS.items())
        if fm.get("variants_legend"):
            eggs_row = ('<div class="an-row"><b>Eggs, gym &amp; diabetic</b><p>Every recipe is eggless as written; a yellow panel shows '
                        'the optional custard-style upgrade. The app adds a Gym and a Diabetic version of every recipe'
                        + (f' (see p.&nbsp;{hp})' if hp else "") + '.</p></div>')
        return f'''
<div class="inner">
  <div class="pg-head"><div class="eyebrow">Start here</div><h1>{e(w["title"])}</h1></div>
  <div class="welcome-grid">
    <div class="welcome-text">{paras}</div>
    <aside class="anatomy">
      <h3>Reading a recipe page</h3>
      <div class="an-row"><b>Program badge</b><p>The CREAMi button to press. Colour-coded across the book:</p><ul class="pill-list">{progs}</ul></div>
      <div class="an-row"><b>Step tags</b><p>Every step is labelled so you can see the flow at a glance:</p><ul class="pill-list">{tags}</ul></div>
      <div class="an-row"><b>Per pint</b><p>Nutrition is for the whole 473 ml pint, with a per-serving figure underneath. Estimates from typical Indian label values.</p></div>
      <div class="an-row"><b>Re-spin</b><p>How many re-spins to expect. Protein and sugar-free pints almost always need one.</p></div>
      {eggs_row}
      <div class="an-row"><b>My notes</b><p>Space to log the date, rate the pint, and write down your tweaks.</p></div>
    </aside>
  </div>
  {finder(sections)}
</div>'''
    return fn


def machines(fm):
    def fn(_):
        rows = "".join(
            f'<tr><td>{program_badge(p["name"], True)}</td><td>{e(p["best_for"])}</td><td>{e(p["texture"])}</td><td>{e(p["use_when"])}</td></tr>'
            for p in fm["programs"])
        b = fm["blast"]
        dos = "".join(f'<li>{icon("check")}<span>{rich(x)}</span></li>' for x in b["dos"])
        donts = "".join(f'<li>{icon("x")}<span>{rich(x)}</span></li>' for x in b["donts"])
        return f'''
<div class="inner">
  <div class="pg-head"><div class="eyebrow">The kit</div><h1>Meet your machines</h1></div>
  <div class="machine-intro">
    <div class="mi-card"><h3>Ninja CREAMi NC300IN</h3><p>Freezes nothing itself. You freeze a 473 ml pint solid for 24 hours, and the CREAMi's spinning blade shaves it into ice cream in about two minutes. Seven one-touch programs plus RE-SPIN.</p></div>
    <div class="mi-card"><h3>Ninja Blast</h3><p>{rich(b["intro"])}</p></div>
  </div>
  <h2 class="sec-h">The programs</h2>
  <table class="tbl programs"><thead><tr><th>Program</th><th>Best for</th><th>Texture</th><th>Use when</th></tr></thead><tbody>{rows}</tbody></table>
  <h2 class="sec-h">The Blast: dos &amp; don'ts</h2>
  <div class="dodont"><ul class="do">{dos}</ul><ul class="dont">{donts}</ul></div>
</div>'''
    return fn


def blueprints():
    cats = [("Milk / water", "--s1"), ("Cream", "--s2"), ("Protein & milk solids", "--s3"),
            ("Sugar / sweetener", "--s4"), ("Fruit & flavour", "--s5")]
    rows = [("ICE CREAM", [50, 33, 0, 15, 2]),
            ("LITE ICE CREAM", [68, 0, 24, 2, 6]),
            ("GELATO", [68, 10, 8, 14, 0]),
            ("SORBET", [18, 0, 0, 22, 60])]
    legend = "".join(f'<li><i style="--c:var({v})"></i>{e(k)}</li>' for k, v in cats)
    out = []
    for prog, vals in rows:
        segs = "".join(
            f'<span class="bp-seg" style="--c:var({cats[i][1]});flex:{v}">{f"{v}%" if v >= 8 else ""}</span>'
            for i, v in enumerate(vals) if v)
        out.append(f'<div class="bp-row">{program_badge(prog, True)}<div class="bp-bar">{segs}</div></div>')
    return (f'<h2 class="sec-h">Base blueprints</h2><ul class="bp-legend bp">{legend}</ul>'
            f'<div class="bp">{"".join(out)}</div>'
            '<p class="bp-note">Typical share of a ~450 ml base by weight across this book. Use it to sanity-check your own creations: '
            'more sugar or fat = softer, more water = icier.</p>')


def method_rules(fm):
    def fn(_):
        steps = "".join(f'<li><span class="hw-n">{i}</span><b>{e(s["step"])}</b><p>{rich(s["text"])}</p></li>'
                        for i, s in enumerate(fm["how_it_works"], 1))
        rules = "".join(f'<li><span class="gr-n">{i:02d}</span><div><b>{e(r["title"])}</b><p>{rich(r["text"])}</p></div></li>'
                        for i, r in enumerate(fm["golden_rules"], 1))
        return f'''
<div class="inner">
  <div class="pg-head"><div class="eyebrow">The method</div><h1>From Blast to bowl</h1></div>
  <ol class="howitworks">{steps}<li class="hw-plan"><b>Plan ahead</b><p><u>Tonight</u> blend &amp; freeze.<br><u>Tomorrow night</u> spin &amp; serve.<br>Keep 2–3 pints frozen and you never wait.</p></li></ol>
  <h2 class="sec-h">10 golden rules</h2>
  <ol class="rules">{rules}</ol>
  {blueprints()}
</div>'''
    return fn


def pantry_pages(fm):
    cats = fm["pantry"]
    mid = (len(cats) + 1) // 2
    halves = [cats[:mid], cats[mid:]]

    def mk(part, first):
        def fn(_):
            blocks = []
            for c in part:
                items = "".join(f'<li><span class="chk"></span><div><b>{e(i["name"])}</b><p>{e(i["use"])}</p></div>'
                                f'<span class="where">{e(i["where"])}</span></li>' for i in c["items"])
                blocks.append(f'<div class="pantry-cat"><h3>{e(c["category"])}</h3><ul>{items}</ul></div>')
            tips = ""
            if not first:
                tips = ('<div class="shop-tips"><h3>' + icon("cart") + ' Quick-commerce shopping tips</h3><ul>' +
                        "".join(f"<li>{rich(t)}</li>" for t in fm["shopping_tips"]) + "</ul></div>")
            head = ('<div class="pg-head"><div class="eyebrow">Stock up</div><h1>The Indian Creami pantry</h1>'
                    '<p class="lede">Tick off what you have. Everything here turns up on quick-commerce apps or Amazon.</p></div>') if first else \
                '<div class="pg-head small"><div class="eyebrow">Stock up</div><h1>The pantry, continued</h1></div>'
            return f'<div class="inner">{head}<div class="pantry">{"".join(blocks)}</div>{tips}</div>'
        return fn
    return [mk(halves[0], True), mk(halves[1], False)]


def program_cell(text):
    """'LITE ICE CREAM or ICE CREAM' -> one badge per program; anything else stays as text."""
    parts = [x.strip() for x in re.split(r"\s+or\s+|\s*/\s*", text)]
    if all(x.upper() in PROGRAM_COLOURS for x in parts):
        return " ".join(program_badge(x, True) for x in parts)
    return e(text)


def protein_sweet(fm):
    def fn(_):
        pg = fm["protein_guide"]
        prow = "".join(f'<tr><td><b>{e(r["base"])}</b></td><td class="num">{e(r["protein"])}</td><td>{e(r["texture"])}</td><td>{e(r["tip"])}</td></tr>'
                       for r in pg["rows"])
        srow = "".join(f'<tr><td><b>{e(r["name"])}</b>{DIAB_MARK if r.get("diabetic_ok") else ""}</td><td class="num">{e(r["sweetness"])}</td><td>{e(r["freeze_effect"])}</td>'
                       f'<td class="progs">{program_cell(r["program"])}</td><td>{e(r["tip"])}</td></tr>'
                       for r in fm["sweetener_guide"])
        legend = (f'<p class="dleg">{DIAB_MARK} = diabetic-friendly: no added sugar and little effect on blood glucose. '
                  'The Diabetic versions in the app use only these.</p>') if any(r.get("diabetic_ok") for r in fm["sweetener_guide"]) else ""
        return f'''
<div class="inner ps">
  <div class="pg-head"><div class="eyebrow">Building blocks</div><h1>Protein &amp; sweeteners</h1></div>
  <h2 class="sec-h">{icon("bolt")} The protein toolkit</h2>
  <p class="lede">{rich(pg["intro"])}</p>
  <table class="tbl"><thead><tr><th>Base</th><th>Protein</th><th>Texture</th><th>Tip</th></tr></thead><tbody>{prow}</tbody></table>
  <h2 class="sec-h">Sweeteners &amp; what they do to texture</h2>
  <p class="lede">Sugar does more than sweeten: it keeps the pint soft. Swap it out and the pint freezes harder, so expect LITE ICE CREAM and a RE-SPIN.</p>
  <table class="tbl sweet"><thead><tr><th>Sweetener</th><th>vs sugar</th><th>Freezing effect</th><th>Program</th><th>Tip</th></tr></thead><tbody>{srow}</tbody></table>
  {legend}
</div>'''
    return fn


DIAB_MARK = '<span class="dmark" title="Diabetic-friendly">D</span>'


def _lede(d):
    return f'<p class="lede">{rich(d["intro"])}</p>' if d.get("intro") else ""


def variants_block(fm):
    vl = fm.get("variants_legend") or {}
    cards = ""
    for key, lbl, c in (("gym", "Gym", "#3559A8"), ("diabetic", "Diabetic", "#0F8077")):
        v = vl.get(key)
        if v:
            rules = "".join(f"<li>{rich(x)}</li>" for x in v.get("rules", []))
            cards += f'<div class="hv-card" style="--hc:{c}"><h3><span>{lbl}</span>{e(v.get("goal", ""))}</h3><ul>{rules}</ul></div>'
    disc = f'<p class="hv-disc">{rich(vl["disclaimer"])}</p>' if vl.get("disclaimer") else ""
    return f'<div class="hv-grid">{cards}</div>{disc}' if cards else ""


def swaps_block(fm):
    hs = fm.get("healthier_swaps") or {}
    if not hs.get("rows"):
        return ""
    rows = "".join(f'<tr><td>{rich(r["out"])}</td><td class="arrow">→</td><td><b>{rich(r["in"])}</b></td>'
                   f'<td>{rich(r["effect"])}</td><td class="saves">{e(r["saves"])}</td></tr>' for r in hs["rows"])
    return (f'<h2 class="sec-h">{icon("swap")} {e(hs.get("title") or "Healthier swaps")}</h2>'
            f'<table class="tbl hs"><thead><tr><th>Swap out</th><th></th><th>Swap in</th><th>What changes</th><th>Saves</th></tr></thead>'
            f'<tbody>{rows}</tbody></table>')


def label_block(fm):
    lr = fm.get("label_reading") or {}
    if not lr.get("rows"):
        return ""
    rows = "".join(f'<tr><td class="code">{e(r["code"])}</td><td>{rich(r["what"])}</td><td>{rich(r["verdict"])}</td></tr>'
                   for r in lr["rows"])
    return (f'<h2 class="sec-h">{icon("check")} {e(lr.get("title") or "Reading the label")}</h2>{_lede(lr)}'
            f'<table class="tbl lr"><thead><tr><th>On the label</th><th>What it is</th><th>Verdict</th></tr></thead>'
            f'<tbody>{rows}</tbody></table>')


def shelf_block(fm):
    hp = fm.get("healthy_pantry") or {}
    items = hp.get("items") or []
    if not items:
        return ""
    mixed = len({bool(i.get("diabetic_ok")) for i in items}) > 1  # mark only if it tells items apart
    lis = "".join(
        f'<li><span class="chk"></span><div><b>{e(i["name"])}</b>{DIAB_MARK if mixed and i.get("diabetic_ok") else ""}'
        f'{(" <i>" + e(i["brand"]) + "</i>") if i.get("brand") else ""}'
        f'<p>{rich(i.get("why", ""))} <u>{rich(i.get("use", ""))}</u></p><span class="where">{e(i.get("where", ""))}</span></div></li>'
        for i in items)
    leg = f'<p class="dleg">{DIAB_MARK} = fine in the Diabetic versions.</p>' if mixed else ""
    return (f'<h2 class="sec-h">{icon("cart")} {e(hp.get("title") or "The healthy pantry")}</h2>{_lede(hp)}'
            f'<ul class="hshelf">{lis}</ul>{leg}')


def science_block(fm, head=True):
    ts = fm.get("texture_science") or {}
    if not ts.get("points"):
        return ""
    pts = "".join(f'<li><b>{e(x["h"])}</b><p>{rich(x["text"])}</p></li>' for x in ts["points"])
    h = f'<h2 class="sec-h">{icon("snow")} {e(ts.get("title") or "Texture science")}</h2>{_lede(ts)}' if head else ""
    return f'<div class="tsci">{h}<ol>{pts}</ol></div>'


def guide_page(eyebrow, title, lede, blocks, cls=""):
    """Generic guide page: page heading, optional lede, then content blocks."""
    def fn(_):
        body = "".join(blocks)
        return (f'<div class="inner hpage {cls}"><div class="pg-head"><div class="eyebrow">{eyebrow}</div><h1>{e(title)}</h1>'
                f'{lede}</div>{body}</div>')
    return fn


def healthier_pages(fm):
    """New 'healthier pints' guide pages, in book order, as (contents title, builder). Empty if the data is absent."""
    vl = fm.get("variants_legend") or {}
    out = []
    a = [variants_block(fm), swaps_block(fm)]
    if any(a):
        out.append(("Healthier pints: gym & diabetic, swaps",
                    guide_page("Gym &amp; diabetic", vl.get("title") or "Healthier pints", _lede(vl), a, "healthier")))
    b = [shelf_block(fm), label_block(fm)]
    if any(b):
        out.append(("The healthy pantry & reading labels",
                    guide_page("Shop smarter", "The healthy pantry & labels", "", b, "shelf")))
    c = science_block(fm, head=False)
    if c:
        ts = fm["texture_science"]
        out.append(("Texture science", guide_page("The science", ts.get("title") or "Texture science", _lede(ts), [c], "science")))
    return out


def trouble(fm):
    def fn(_):
        rows = "".join(f'<tr><td><b>{e(r["problem"])}</b></td><td>{rich(r["why"])}</td><td>{rich(r["fix"])}</td></tr>'
                       for r in fm["troubleshooting"])
        store = "".join(f"<li>{rich(s)}</li>" for s in fm["storage"])
        conv = "".join(f'<tr><td>{e(c["from"])}</td><td>{e(c["to"])}</td></tr>' for c in fm["conversions"])
        return f'''
<div class="inner">
  <div class="pg-head"><div class="eyebrow">When things go sideways</div><h1>Troubleshooting</h1></div>
  <table class="tbl trouble"><thead><tr><th>Problem</th><th>Why it happens</th><th>Fix</th></tr></thead><tbody>{rows}</tbody></table>
  <div class="two-up">
    <div class="card"><h3>Storing leftovers</h3><ul class="dots">{store}</ul></div>
    <div class="card"><h3>Handy conversions</h3><table class="conv">{conv}</table></div>
  </div>
</div>'''
    return fn


# ---------------------------------------------------------------- section divider

def custard101():
    steps = [("Whisk", "Yolks and sugar together until pale and thick, about 1 minute."),
             ("Temper", "Heat the milk until steaming, not boiling. Pour a ladleful into the yolks while whisking, then the rest."),
             ("Cook", "Back on low heat, stirring with a spatula, to 80–82 °C: it coats a spoon and a finger-line holds. Above 85 °C it scrambles."),
             ("Cool", "Strain, cool in a bowl set in iced water, then Blast and freeze within 2 hours.")]
    li = "".join(f'<li><b>{e(t)}</b><span>{e(x)}</span></li>' for t, x in steps)
    return (f'<div class="c101">{icon("egg")}<div><h3>Egg-yolk custard 101</h3><ol>{li}</ol>'
            '<p>No thermometer? Cook until the back of the spoon stays coated. Slightly grainy? The Blast smooths it out once cool. '
            'Spare whites: meringues or an omelette.</p></div></div>')


def divider(s, recipe_pages):
    def fn(_):
        sc = s["colour"]
        items = "".join(
            f'<li><span class="d-n">{r["num"]:02d}</span><span class="d-t">{e(r["title"])}<small>{e(r["subtitle"])}</small></span>'
            f'{program_badge(r["program"], True)}<span class="d-pg">p. {recipe_pages[r["num"]]}</span></li>'
            for r in s["recipes"])
        c101 = s["key"] == "s5_gelato"
        compact = " compact" if len(s["recipes"]) + (4 if c101 else 0) > 10 else ""
        p, b, a = s["art"]
        art = illustration(p, b, a, darken(b, 0.5), seed=s["num"] * 5, has_mixins=True, protein=s["key"].startswith(("s1", "s2")))
        return f'''
<div class="div-bg" style="--sc:{sc};--st:{lighten(sc, 0.9)}"></div>
<div class="inner divider{compact}" style="--sc:{sc}">
  <div class="div-top">
    <div class="div-num">{s["num"]:02d}</div>
    <div class="div-art">{art}</div>
  </div>
  <div class="eyebrow">Section {s["num"]:02d}</div>
  <h1 class="div-title">{e(s["title"])}</h1>
  <p class="div-sub">{e(s["sub"])}</p>
  <p class="div-blurb">{e(s["blurb"])}</p>
  <ol class="div-list">{items}</ol>
  {custard101() if c101 else ""}
</div>'''
    return fn


# ---------------------------------------------------------------- recipe page

def recipe_page(r):
    def fn(_):
        s = r["section"]
        c = r.get("colors", {})
        base = c.get("base", "#E8C07A")
        accent = c.get("accent", "#7FA65A")
        deep = legible(c.get("deep", darken(base, 0.5)))
        tint = lighten(base, 0.8)
        n = r["nutrition_per_pint"]
        serv = max(1, int(r.get("servings", 2)))
        protein = n["protein_g"] >= 25 and s["key"] in ("s1_whey", "s2_yogurt")
        art = illustration(r["program"], base, accent, deep, seed=r["num"], has_mixins=bool(r.get("mixins")), protein=protein)

        tags = "".join(f'<span class="tag">{e(t)}</span>' for t in r.get("tags", []))

        def ing_list(items):
            return "".join(
                f'<li><span class="chk"></span><span class="q">{e(i["qty"])}</span>'
                f'<span class="it">{e(i["item"])}{("<small>" + e(i["note"]) + "</small>") if i.get("note") else ""}</span></li>'
                for i in items)
        mix = ""
        if r.get("mixins"):
            mix = f'<h3 class="h-mix">Mix-ins</h3><ul class="ing">{ing_list(r["mixins"])}</ul>'
        steps = "".join(
            f'<li><span class="st-t"><span class="stag" style="--tc:{STEP_TAGS.get(st["tag"], (st["tag"], "#555"))[1]}">'
            f'{e(STEP_TAGS.get(st["tag"], (st["tag"].title(), ""))[0])}</span>{rich(st["text"])}</span></li>'
            for st in r["steps"])
        tips = "".join(f"<li>{rich(t)}</li>" for t in r.get("tips", []))
        swaps = "".join(f"<li>{rich(t)}</li>" for t in r.get("swaps", []))
        eo = r.get("egg_option")
        egg = (f'<div class="egg">{icon("egg")}<div><span class="egg-k">With eggs <i>(optional)</i></span>'
               f'<b>{e(eo["title"])}</b> {rich(eo["text"])} <span class="egg-adds">{e(eo.get("adds", ""))}</span></div></div>') if eo else ""
        cook = f'{r["prep_min"]} min prep' + (f' + {r["cook_min"]} cook' if r.get("cook_min") else "")
        per_serv_p = round(n["protein_g"] / serv)
        per_serv_k = round(n["kcal"] / serv)
        return f'''
<div class="r-band" style="--tint:{tint};--tint2:{lighten(base, 0.9)}"><svg class="r-wave" viewBox="0 0 210 8" preserveAspectRatio="none"><path d="M0,0 H210 V3 Q201,9 192,4 T174,4 T156,4 T138,4 T120,4 T102,4 T84,4 T66,4 T48,4 T30,4 T12,4 T0,3 Z" fill="{tint}"/></svg></div>
<div class="inner recipe" style="--deep:{deep};--accent:{accent};--base:{base};--tint:{tint};--sc:{s["colour"]}">
  <header class="r-head">
    <div class="r-ht">
      <div class="kicker"><span class="r-num">No. {r["num"]:02d}</span><span class="k-sec">{e(s["title"])}{" · " + e(s["sub"]) if s["title"] == "Protein Pints" else ""}</span></div>
      <h1>{e(r["title"])}</h1>
      <p class="subtitle">{e(r["subtitle"])}</p>
      <div class="tags">{tags}</div>
    </div>
    <div class="r-art">{art}</div>
  </header>
  <div class="statbar">
    <div class="stat st-prog">{program_badge(r["program"])}</div>
    <div class="stat">{icon("clock")}<span><b>{e(cook)}</b><i>+ 24 h freeze</i></span></div>
    <div class="stat">{icon("gauge")}<span><b>{e(r.get("difficulty", "Easy"))}</b><i>difficulty</i></span></div>
    <div class="stat">{icon("people")}<span><b>Serves {serv}</b><i>1 pint · 473 ml</i></span></div>
    <div class="stat st-respin">{icon("spin")}<span><i>re-spin</i><b>{e(r.get("respin", ""))}</b></span></div>
  </div>
  <p class="intro">{rich(r["intro"])}</p>
  <div class="cols">
    <div class="col-ing">
      <h3>Ingredients</h3>
      <ul class="ing">{ing_list(r["ingredients"])}</ul>
      {mix}
      <div class="nutri">
        <div class="n-h">Per pint <small>/ per serving</small></div>
        <div class="n-grid">
          <div class="n-p"><b>{n["protein_g"]}<u>g</u></b><span>protein</span><em>{per_serv_p} g</em></div>
          <div><b>{n["kcal"]}</b><span>kcal</span><em>{per_serv_k}</em></div>
          <div><b>{n["carbs_g"]}<u>g</u></b><span>carbs</span><em>{round(n["carbs_g"] / serv)} g</em></div>
          <div><b>{n["fat_g"]}<u>g</u></b><span>fat</span><em>{round(n["fat_g"] / serv)} g</em></div>
        </div>
      </div>
    </div>
    <div class="col-method">
      <h3>Method</h3>
      <ol class="steps">{steps}</ol>
    </div>
  </div>
  <div class="boxes">
    <div class="box tips"><h4>{icon("bulb")} Pro tips</h4><ul>{tips}</ul></div>
    <div class="box swaps"><h4>{icon("swap")} Swaps &amp; twists</h4><ul>{swaps}</ul></div>
  </div>
  {egg}
  <p class="shop">{icon("cart")}<span>{rich(r.get("shop_note", ""))}</span></p>
  <div class="notes">
    <div class="notes-h">{icon("pen")}<b>My notes</b><span class="nf">Made on <i></i></span><span class="nf">Re-spins <i class="short"></i></span><span class="stars">☆☆☆☆☆</span></div>
    <div class="lines"></div>
  </div>
</div>'''
    return fn


# ---------------------------------------------------------------- back matter

def leaderboard(sections, recipe_pages):
    def fn(_):
        allr = [r for s in sections for r in s["recipes"]]
        top = sorted(allr, key=lambda r: -r["nutrition_per_pint"]["protein_g"])[:24]
        mx = max(r["nutrition_per_pint"]["protein_g"] for r in top) or 1
        rows = "".join(
            f'<tr><td class="num">{i}</td><td><b>{e(r["title"])}</b></td><td>{program_badge(r["program"], True)}</td>'
            f'<td class="bar-td"><span class="bar" style="width:{r["nutrition_per_pint"]["protein_g"] / mx * 100:.0f}%;--sc:{r["section"]["colour"]}"></span>'
            f'<b>{r["nutrition_per_pint"]["protein_g"]} g</b></td><td class="num">{r["nutrition_per_pint"]["kcal"]}</td>'
            f'<td class="num">{r["nutrition_per_pint"]["protein_g"] * 100 / max(1, r["nutrition_per_pint"]["kcal"]):.1f}</td><td class="num">{recipe_pages[r["num"]]}</td></tr>'
            for i, r in enumerate(top, 1))
        return f'''
<div class="inner">
  <div class="pg-head"><div class="eyebrow">Quick reference</div><h1>Protein leaderboard</h1>
  <p class="lede">The {len(top)} highest-protein pints of the {len(allr)} in the book, ranked per whole pint. "g / 100 kcal" shows how lean the protein is: above 7 is excellent.</p></div>
  <table class="tbl lb"><thead><tr><th>#</th><th>Recipe</th><th>Program</th><th>Protein / pint</th><th>kcal</th><th>g / 100 kcal</th><th>Page</th></tr></thead><tbody>{rows}</tbody></table>
</div>'''
    return fn


def pint_log(_sections):
    def fn(_):
        rows = "".join("<tr>" + "<td></td>" * 6 + "</tr>" for _ in range(22))
        return f'''
<div class="inner">
  <div class="pg-head"><div class="eyebrow">Keep track</div><h1>Freezer pint log</h1>
  <p class="lede">Write it down when a pint goes in the freezer. Anything older than 2 weeks should be eaten or re-spun soon.</p></div>
  <table class="tbl log"><thead><tr><th>Date frozen</th><th>Flavour</th><th>Program</th><th>Re-spins</th><th>Rating</th><th>Notes</th></tr></thead><tbody>{rows}</tbody></table>
</div>'''
    return fn


def blank_recipe(i):
    def fn(_):
        progs = "".join(f'<span class="chkline"><span class="chk"></span>{program_badge(k, True)}</span>' for k in PROGRAM_COLOURS if k not in ("MIX-IN", "RE-SPIN"))
        return f'''
<div class="inner blank">
  <div class="pg-head"><div class="eyebrow">Your creation {i}</div><h1 class="blank-title">Recipe: <i></i></h1></div>
  <div class="b-progs">{progs}</div>
  <div class="cols b-cols">
    <div class="col-ing"><h3>Ingredients</h3><div class="lines tall"></div></div>
    <div class="col-method"><h3>Method</h3><div class="lines tall"></div></div>
  </div>
  <div class="notes"><div class="notes-h">{icon("pen")}<b>Notes &amp; verdict</b><span class="stars">☆☆☆☆☆</span></div><div class="lines"></div></div>
</div>'''
    return fn


# ---------------------------------------------------------------- assemble

def guide_entries(fm, sections, ctx=None):
    """Front-matter guide pages in book order as (contents title, page builder). New guide pages go here."""
    ctx = {} if ctx is None else ctx
    pp = pantry_pages(fm)
    out = [("Start here", welcome(fm, sections, ctx)), ("Meet your machines", machines(fm)),
           ("From Blast to bowl: method & golden rules", method_rules(fm)),
           ("The Indian Creami pantry", pp[0]), ("The pantry, continued", pp[1]),
           ("Protein & sweeteners", protein_sweet(fm))]
    out += healthier_pages(fm)
    out.append(("Troubleshooting, storage & conversions", trouble(fm)))
    return out


BACK_MATTER = ["Protein leaderboard", "Freezer pint log", "Your own recipes", "Your own recipes"]


def page_plan(sections, fm):
    """Printed page numbers, shared with build_app.py so the app's page refs match the PDF.

    Book order: cover, contents, guide pages, then per section a divider and its recipes, then back matter.
    Returns (recipe_pages {recipe num: page}, divider_pages {section num: page},
             guide_titles [(title, page)] for the guide and back-matter entries listed on the contents page).
    """
    titles = [t for t, _ in guide_entries(fm, sections)]
    page = 2 + len(titles)
    divider_pages, recipe_pages = {}, {}
    for s in sections:
        page += 1
        divider_pages[s["num"]] = page
        for r in s["recipes"]:
            page += 1
            recipe_pages[r["num"]] = page
    guide_titles = [(t, 3 + i) for i, t in enumerate(titles)]
    guide_titles += [(t, page + 1 + i) for i, t in enumerate(BACK_MATTER[:3])]
    return recipe_pages, divider_pages, guide_titles


def build():
    sections, fm = load()
    book = Book()

    recipe_pages, divider_pages, guide_titles = page_plan(sections, fm)
    ctx = {t.split(":")[0].lower(): p for t, p in guide_titles}
    guide = guide_entries(fm, sections, ctx)
    assert [t for t, _ in guide] == [t for t, _ in guide_titles[:len(guide)]]

    book.add(cover(sections), cls="cover nofolio")
    book.add(contents(sections, recipe_pages, divider_pages, guide_titles), cls="contents-page")
    for _, g in guide:
        book.add(g, cls="guide")
    for s in sections:
        book.add(divider(s, recipe_pages), tab=s, cls="divider-page")
        for r in s["recipes"]:
            book.add(recipe_page(r), tab=s, cls="recipe-page")
    book.add(leaderboard(sections, recipe_pages), cls="guide")
    book.add(pint_log(sections), cls="guide")
    book.add(blank_recipe(1), cls="guide")
    book.add(blank_recipe(2), cls="guide")
    assert len(book.pages) == 2 + len(guide) + len(sections) + len(recipe_pages) + len(BACK_MATTER)
    n_recipes = len(recipe_pages)

    css = (BUILD / "book.css").read_text()
    doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{BOOK_TITLE}: {n_recipes} Ninja CREAMi Recipes</title>
<style>{css}</style></head><body class="{'duplex' if DUPLEX else 'simplex'}">
{book.render()}
<script>{(BUILD / "fit.js").read_text()}</script>
</body></html>'''
    name = "book-duplex" if DUPLEX else "book"
    out_html = BUILD / f"{name}.html"
    out_html.write_text(doc)
    print(f"pages: {len(book.pages)}  html: {out_html}")
    if "--html-only" in sys.argv:
        return
    pdf = ROOT / ("Pint-Perfect-Ninja-Creami-Recipes" + ("-duplex" if DUPLEX else "") + ".pdf")
    subprocess.run([CHROME, "--headless=new", *CHROME_ARGS, "--disable-gpu", "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
                    "--virtual-time-budget=20000", f"--print-to-pdf={pdf}", out_html.as_uri()],
                   check=True, capture_output=True)
    print(f"pdf: {pdf}")


if __name__ == "__main__":
    build()
