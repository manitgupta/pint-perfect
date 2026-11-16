# Recipe variants: Default, Gym, Diabetic

Every recipe has three versions. **Default** is the existing top-level recipe. **Gym** and **Diabetic**
live in an optional `variants` object and store only what changes. Variants are shown in the app only;
the printed PDF shows the Default.

Validate with `python3 build/validate.py` (all files) or `python3 build/validate.py data/s1_whey.json`.
The resolver is `build/variants.py` (`resolve(recipe, "gym")` returns the full merged recipe).

## Goals

| | Gym | Diabetic |
|---|---|---|
| Aim | Less fat, minimum sugar, more protein | No added sugar, less fat, no additives |
| Targets per pint | protein ≥ 35 g, fat ≤ 15 g, added sugar ≤ 10 g (soft targets; say why if missed) | added sugar = 0 (hard), fat ≤ half of Default where possible |
| Sweetener | Munkito Monk Sweet + Allulose 1:1; sucralose OK as an alternative | Munkito only (or its liquid drops). No sucralose, aspartame, maltitol, erythritol-only blends |
| Not allowed | | sugar, jaggery, honey, Milkmaid/condensed milk, syrups, Rooh Afza, gulkand, biscuits, Bournvita, flavoured whey or flavoured protein drinks (they hide sucralose), maltodextrin, sweetened chocolate, tinned/sweetened pulp, gums in the main list |
| Gum | Optional ⅛ tsp xanthan is fine | Main method has **no gum**. Offer xanthan via `gum_option` so the app can show "With xanthan" / "No gum" |
| Body without fat | skimmed milk powder (Nakpro), unflavoured or flavoured whey, skyr / Greek yogurt, high-protein paneer, Amul High Protein Milk, inulin, cornflour, milk reduction | same, but unflavoured whey isolate only; plain skyr/curd; fruit ≤ ~100 g fresh |

## Munkito Monk Sweet + Allulose 1:1

Allulose + monk fruit extract, no erythritol (the red pouch; Munkito also sells an erythritol blend, avoid that
one). Sweetens 1:1 with sugar by weight. Allulose lowers the freezing point about 1.9× as much as sugar, so pints
come out softer and need fewer re-spins.

- Name the ingredient exactly `Munkito Monk Sweet + Allulose 1:1` with note e.g. `or any allulose`.
- Lite / protein pints: 45–60 g per pint.
- Full-fat or cream-rich pints: use 75–80% of the sugar weight it replaces, or the pint turns soupy. Top up
  sweetness with a few drops of Munkito liquid monk fruit if needed.
- Cooked bases: stir it in off the heat, below ~70 °C (allulose browns fast).
- Keep a pint ≤ ~60 g so a half-pint serving stays under ~30 g (more can upset the stomach).
- Nutrition: count Munkito as 0 kcal, 0 g carbs, 0 g added sugar.

## Schema

```json
"nutrition_per_pint": { "kcal": 480, "protein_g": 50, "carbs_g": 30, "fat_g": 12, "added_sugar_g": 0 },
"variants": {
  "gym": {
    "why": "≤ 35 words: what changed and why the texture still works",
    "program": "LITE ICE CREAM",
    "respin": "Usually 1 re-spin with 1 tbsp milk",
    "ingredients": {
      "replace": [{ "match": "fresh cream", "qty": "20 g (3 tbsp)", "item": "Nakpro skimmed milk powder", "note": "adds body without fat" }],
      "remove": ["xanthan"],
      "add": [{ "qty": "30 g (1 scoop)", "item": "unflavoured whey isolate", "note": "AS-IT-IS or Avvatar", "after": "milk" }]
    },
    "mixins": { "replace": [], "remove": [], "add": [] },
    "steps": {
      "replace": [{ "i": 0, "tag": "BLAST", "text": "≤ 28 words" }],
      "insert": [{ "after": 1, "tag": "PREP", "text": "≤ 28 words" }],
      "remove": [3]
    },
    "tags": ["High Protein", "Eggless", "No Added Sugar"],
    "nutrition_per_pint": { "kcal": 400, "protein_g": 55, "carbs_g": 30, "fat_g": 8, "added_sugar_g": 0 }
  },
  "diabetic": {
    "why": "...",
    "ingredients": { "...": "same ops" },
    "gum_option": { "qty": "⅛ tsp", "item": "xanthan gum", "note": "smoother, fewer re-spins; skip for additive-free" },
    "nutrition_per_pint": { "...": "..." }
  }
}
```

Rules:
- `nutrition_per_pint.added_sugar_g` is required on the Default and on every variant (integer grams; sugar,
  jaggery, honey, condensed milk, syrups, sweetened biscuits/chocolate/pulp count; lactose and whole fruit don't).
  `carbs_g` excludes allulose. kcal should be within ~8% of protein×4 + carbs×4 + fat×9.
- `why` is required. `program`, `respin`, `tags`, `mixins`, `steps`, `gum_option` are optional.
- `match` is a case-insensitive substring of an existing Default `item` and must hit exactly one line.
  `after` (on `add`) works the same way; without it the line is appended. Ops apply in order: replace, remove, add.
- `steps.i` / `after` / `remove` are 0-based indexes into the **Default** steps. Rewrite any step that names
  an ingredient the variant removed. Keep the MIXIN step if the variant still has mix-ins; remove it if not.
- `tags` replaces the Default tags; use the README tag list. Diabetic variants should carry `No Added Sugar`.
- Liquid base stays ~400–450 ml.
- If a Diabetic version makes no sense (the sugar is the dish, e.g. a litchi sorbet or gulab jamun), use
  `"diabetic": { "unsuitable": true, "why": "≤ 30 words", "try": "<slug of a diabetic-friendly recipe>" }`
  and make the Gym version a genuine lower-sugar version.
