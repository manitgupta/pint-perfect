#!/usr/bin/env python3
"""Check recipe data and variants against README.md / data/VARIANTS.md.

Usage: python3 build/validate.py [data/s1_whey.json ...]   (default: every section file)
Exits 1 if there are errors. Warnings are printed but don't fail.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from variants import VARIANTS, VariantError, resolve  # noqa: E402

DATA = Path(__file__).resolve().parent.parent / "data"
PROGRAMS = {"ICE CREAM", "LITE ICE CREAM", "GELATO", "SORBET", "SMOOTHIE BOWL", "MILKSHAKE"}
STEP_TAGS = {"PREP", "COOK", "COOL", "BLAST", "FREEZE", "SPIN", "RESPIN", "MIXIN", "SERVE"}
TAGS = {"High Protein", "Eggless", "No Added Sugar", "Low Sugar", "Vegan", "Gluten-Free Option", "Kid Favourite",
        "Desi Classic", "Mix-In Special", "No-Cook", "Fruit Forward", "Lazy 3-Ingredient", "Party Pint"}
NUTRI = ("kcal", "protein_g", "carbs_g", "fat_g", "added_sugar_g")
# Not allowed in a Diabetic variant's ingredients or mix-ins (matched on the item name, lowercase).
DIABETIC_BANNED = [r"(?<!no )(?<!no added )\bsugar\b(?![- ]free)", r"sugar free (natura|gold)", "sucralose", "aspartame", "maltitol",
                   "milkmaid", "condensed", "jaggery", r"\bgur\b", "honey", "syrup", "rooh afza", "gulkand",
                   "biscoff", "oreo", "bournvita", "maltodextrin", "xanthan", r"\bguar\b", "digestive", "nutella",
                   "marshmallow", "tutti", "milk chocolate", "compound", r"\bjam\b", r"(?<!un)sweetened"]


def words(s):
    return len(str(s).split())


def check_nutri(n, where, err, warn):
    for k in NUTRI:
        if not isinstance(n.get(k), int):
            err(f"{where}: nutrition_per_pint.{k} missing or not an integer")
            return
    calc = 4 * n["protein_g"] + 4 * n["carbs_g"] + 9 * n["fat_g"]
    if calc and abs(n["kcal"] - calc) / calc > 0.08:
        warn(f"{where}: kcal {n['kcal']} vs 4P+4C+9F = {calc}")
    if n["added_sugar_g"] > n["carbs_g"]:
        err(f"{where}: added_sugar_g {n['added_sugar_g']} > carbs_g {n['carbs_g']}")


def check_recipe(r, slugs, err, warn):
    s = r.get("slug", "?")
    for k in ("slug", "title", "subtitle", "program", "respin", "difficulty", "servings", "tags", "colors",
              "intro", "ingredients", "steps", "tips", "swaps", "nutrition_per_pint", "shop_note"):
        if k not in r:
            err(f"{s}: missing {k}")
    if r.get("program") not in PROGRAMS:
        err(f"{s}: bad program {r.get('program')!r}")
    for t in r.get("tags", []):
        if t not in TAGS:
            err(f"{s}: unknown tag {t!r}")
    for st in r.get("steps", []):
        if st.get("tag") not in STEP_TAGS:
            err(f"{s}: bad step tag {st.get('tag')!r}")
    if r.get("mixins") and not any(st.get("tag") == "MIXIN" for st in r["steps"]):
        warn(f"{s}: has mix-ins but no MIXIN step")
    if words(r.get("subtitle", "")) > 7:
        warn(f"{s}: subtitle > 7 words")
    if words(r.get("intro", "")) > 40:
        warn(f"{s}: intro > 40 words")
    if len(r.get("steps", [])) > 8:
        warn(f"{s}: > 8 steps")
    for st in r.get("steps", []):
        if words(st.get("text", "")) > 30:
            warn(f"{s}: step > 28 words: {st['text'][:40]}…")
    check_nutri(r.get("nutrition_per_pint", {}), s, err, warn)

    variants = r.get("variants")
    if variants is None:
        warn(f"{s}: no variants")
        return
    for vid in variants:
        if vid not in VARIANTS:
            err(f"{s}: unknown variant {vid!r}")
    for vid in VARIANTS:
        v = variants.get(vid)
        where = f"{s}/{vid}"
        if not v:
            err(f"{where}: missing")
            continue
        if not v.get("why"):
            err(f"{where}: missing why")
        elif words(v["why"]) > 38:
            warn(f"{where}: why > 35 words")
        if v.get("unsuitable"):
            if vid == "gym":
                err(f"{where}: gym can't be unsuitable")
            if v.get("try") not in slugs:
                err(f"{where}: try {v.get('try')!r} is not a known slug")
            continue
        try:
            rv = resolve(r, vid)
        except (VariantError, KeyError, TypeError) as ex:
            err(f"{where}: {ex}")
            continue
        if rv["program"] not in PROGRAMS:
            err(f"{where}: bad program {rv['program']!r}")
        for t in rv.get("tags", []):
            if t not in TAGS:
                err(f"{where}: unknown tag {t!r}")
        for st in rv["steps"]:
            if st.get("tag") not in STEP_TAGS:
                err(f"{where}: bad step tag {st.get('tag')!r}")
            if words(st.get("text", "")) > 30:
                warn(f"{where}: step > 28 words: {st['text'][:40]}…")
        if rv["mixins"] and not any(st["tag"] == "MIXIN" for st in rv["steps"]):
            warn(f"{where}: has mix-ins but no MIXIN step")
        if not rv["mixins"] and any(st["tag"] == "MIXIN" for st in rv["steps"]):
            warn(f"{where}: MIXIN step but no mix-ins")
        if "nutrition_per_pint" not in v:
            err(f"{where}: missing nutrition_per_pint")
        else:
            n = v["nutrition_per_pint"]
            check_nutri(n, where, err, warn)
            if vid == "diabetic" and n.get("added_sugar_g"):
                err(f"{where}: added_sugar_g must be 0")
            if vid == "gym" and isinstance(n.get("added_sugar_g"), int) and n["added_sugar_g"] > 10:
                warn(f"{where}: added sugar {n['added_sugar_g']} g > 10")
        if vid == "diabetic":
            for x in rv["ingredients"] + rv["mixins"]:
                item = x["item"].lower()
                for pat in DIABETIC_BANNED:
                    if re.search(pat, item):
                        err(f"{where}: not allowed in diabetic: {x['item']!r}")
                if "whey" in item and "unflavoured" not in item:
                    err(f"{where}: diabetic whey must be unflavoured: {x['item']!r}")
            if "No Added Sugar" not in rv.get("tags", []):
                warn(f"{where}: missing 'No Added Sugar' tag")


def main():
    files = [Path(a) for a in sys.argv[1:]] or sorted(DATA.glob("s*_*.json"))
    all_slugs = {r["slug"] for f in sorted(DATA.glob("s*_*.json")) for r in json.loads(f.read_text())}
    errors = warnings = 0
    for f in files:
        try:
            recipes = json.loads(Path(f).read_text())
        except json.JSONDecodeError as ex:
            print(f"ERROR {f}: invalid JSON: {ex}")
            errors += 1
            continue
        for r in recipes:
            def err(m):
                nonlocal errors
                errors += 1
                print(f"ERROR {Path(f).name}: {m}")

            def warn(m):
                nonlocal warnings
                warnings += 1
                print(f"warn  {Path(f).name}: {m}")
            check_recipe(r, all_slugs, err, warn)
    print(f"{errors} errors, {warnings} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
