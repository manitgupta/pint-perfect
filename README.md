# Pint Perfect

50 Ninja CREAMi (NC300IN) + Ninja Blast recipes for the Indian kitchen, as a printable PDF and an offline iPhone app. Both are generated from the same recipe data.

- **App:** https://manitgupta.github.io/pint-perfect/
- **PDFs:** `Pint-Perfect-Ninja-Creami-Recipes.pdf` (single-sided) and `Pint-Perfect-Ninja-Creami-Recipes-duplex.pdf` (double-sided)

## Project layout

| Path | What it is |
|---|---|
| `data/s1_whey.json` … `s6_sorbet.json` | The 50 recipes, one file per section, in book order |
| `data/frontmatter.json` | Guide pages: programs, Blast tips, golden rules, pantry, protein & sweetener guides, troubleshooting, storage, conversions |
| `build/build.py`, `book.css`, `fit.js`, `art.py` | PDF builder (HTML → headless Chrome). `art.py` draws the ice-cream illustrations |
| `build/build_app.py`, `deploy_app.sh` | App builder and deploy script |
| `app_src/` | App source (`index.html`, `app.css`, `app.js`, service worker template). Edit this, never `docs/` |
| `docs/` | Built app, served by GitHub Pages. Regenerated on every build |
| `test/harness.html` | Local test page that loads the app in iPhone-sized frames |

Requirements: macOS with Google Chrome installed (used headless for the PDF and the app icons) and Python 3. No other dependencies.

## Common tasks

### Edit or add a recipe

1. Edit the recipe in `data/sN_*.json` (format below).
2. Rebuild and check the PDF still fits one page per recipe:
   ```sh
   ./build/check.sh          # lists pages whose text was shrunk to fit; below ~0.85 is getting small
   python3 build/build.py && python3 build/build.py --duplex
   ```
3. Publish the app and commit everything:
   ```sh
   ./build/deploy_app.sh     # rebuilds docs/, commits docs/ only, pushes; live in ~1 min
   git add -A && git commit -m "Update recipes" && git push   # data, PDFs and anything else
   ```

`deploy_app.sh` only commits `docs/`. Commit data and PDF changes yourself.

### Print the book

Print at **100% / Actual size** on A4 with **Background graphics on**. Use the single-sided PDF if you print on one side, or the duplex PDF for double-sided (its binding margin and edge tabs alternate sides). Pages have a wider binding margin for spiral binding.

### Install / update the app on iPhone

- **Install:** open the app URL in **Safari** → Share → **Add to Home Screen**. Open it once online; after that it works fully offline.
- **Updates:** after a deploy, the app shows "Recipes updated · Reload" the next time it opens online.
- **Your data** (favourites, ratings, notes, ticks, freezer log) is stored only on the phone. Back it up from **Guide → Your data → Back up to Files**. It does not carry over if the app URL changes.

### Test the app locally

```sh
python3 build/build_app.py
python3 -m http.server 8766        # from the repo root
# open http://localhost:8766/docs/ (or test/harness.html?f=[{"h":""}] for an iPhone-sized frame)
```

## Recipe format

Each section file is a JSON array of recipe objects:

```json
{
  "slug": "kesar-pista-protein-kulfi",
  "title": "Kesar Pista Protein Kulfi",
  "subtitle": "≤ 7 words",
  "program": "LITE ICE CREAM",
  "respin": "Usually 1 re-spin with 1 tbsp milk",
  "prep_min": 15, "cook_min": 0,
  "difficulty": "Easy | Medium | Weekend Project",
  "servings": 2,
  "tags": ["High Protein", "Eggless"],
  "colors": { "base": "#F2D27A", "accent": "#7FA65A", "deep": "#8A5A12" },
  "intro": "≤ 40 words",
  "ingredients": [{ "qty": "250 ml (1 cup)", "item": "Amul Taaza toned milk", "note": "optional, ≤ 8 words" }],
  "mixins": [],
  "steps": [{ "tag": "BLAST", "text": "≤ 28 words each, ≤ 8 steps" }],
  "tips": ["≤ 3 tips"],
  "swaps": ["≤ 3 swaps"],
  "egg_option": { "title": "Custard-style with 2 yolks", "text": "How to add yolks safely", "adds": "+2 yolks · ≈ +110 kcal" },
  "nutrition_per_pint": { "kcal": 480, "protein_g": 60, "carbs_g": 35, "fat_g": 11 },
  "shop_note": "Where to buy anything unusual"
}
```

- **`program`**: exactly one of `ICE CREAM`, `LITE ICE CREAM`, `GELATO`, `SORBET`, `SMOOTHIE BOWL`, `MILKSHAKE`.
- **`steps[].tag`**: one of `PREP`, `COOK`, `COOL`, `BLAST`, `FREEZE`, `SPIN`, `RESPIN`, `MIXIN`, `SERVE`. If there are mix-ins, include a `MIXIN` step.
- **`tags`**: pick from `High Protein`, `Eggless`, `No Added Sugar`, `Low Sugar`, `Vegan`, `Gluten-Free Option`, `Kid Favourite`, `Desi Classic`, `Mix-In Special`, `No-Cook`, `Fruit Forward`, `Lazy 3-Ingredient`, `Party Pint`. App filters use `Vegan`, `Desi Classic`, `Kid Favourite` and `Party Pint`.
- **`colors`**: `base` is the ice cream's colour (drives the illustration and page tint), `accent` the garnish/mix-in colour, `deep` a dark shade for headings (must read well on white).
- **`egg_option`**: optional. Main recipes stay eggless; add this only where yolks genuinely help. Always cook yolks to 80–82 °C.
- **`nutrition_per_pint`**: whole-pint, eggless estimate. Calories should roughly equal protein×4 + carbs×4 + fat×9.
- Keep the liquid base at about 400–450 ml so it stays under the pint's MAX FILL line.
- The word limits above keep each recipe on one printed page; `check.sh` tells you if one doesn't fit.

Adding a recipe to a section file automatically renumbers the book, updates the contents, dividers, leaderboard and app. Page numbers shown in the app match the printed PDF only if you rebuild and reprint both.
