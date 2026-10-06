# Pint Perfect

50 Ninja CREAMi (NC300IN) + Ninja Blast recipes for the Indian kitchen, as a printable PDF and an offline phone app.

- `Pint-Perfect-Ninja-Creami-Recipes.pdf` (single-sided) and `-duplex.pdf` (double-sided): the printed book.
- `docs/`: the built web app, served by GitHub Pages at https://manitgupta.github.io/pint-perfect/. On iPhone: open in Safari → Share → Add to Home Screen.
- `data/`: recipe and guide content (JSON). Edit here, then rebuild.

## Rebuild

```sh
python3 build/build.py            # PDF (single-sided)
python3 build/build.py --duplex   # PDF (double-sided)
python3 build/build_app.py        # app -> docs/
./build/deploy_app.sh             # rebuild app, commit and push (updates the live site)
```

Requires Google Chrome (headless) for PDF rendering and icon generation.
