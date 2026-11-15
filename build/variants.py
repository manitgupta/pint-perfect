"""Resolve a recipe's Gym / Diabetic variant into a full recipe. Format: data/VARIANTS.md."""
import copy

VARIANTS = ("gym", "diabetic")
LABELS = {"default": "Default", "gym": "Gym", "diabetic": "Diabetic"}


class VariantError(ValueError):
    pass


def _find(lines, match, where):
    hits = [i for i, x in enumerate(lines) if match.lower() in x["item"].lower()]
    if len(hits) != 1:
        raise VariantError(f"{where}: match {match!r} hit {len(hits)} lines")
    return hits[0]


def _apply_lines(lines, ops, where):
    """Apply replace/remove/add ops. Returns new lines, each marked changed=True if new or replaced."""
    lines = [dict(x) for x in lines]
    for op in ops.get("replace", []):
        i = _find(lines, op["match"], f"{where} replace")
        new = {k: v for k, v in op.items() if k != "match" and v != ""}
        new["was"] = f'{lines[i]["qty"]} {lines[i]["item"]}'
        new["changed"] = True
        lines[i] = new
    for m in ops.get("remove", []):
        lines.pop(_find(lines, m, f"{where} remove"))
    for op in ops.get("add", []):
        new = {k: v for k, v in op.items() if k != "after" and v != ""}
        new["changed"] = True
        if op.get("after"):
            lines.insert(_find(lines, op["after"], f"{where} add-after") + 1, new)
        else:
            lines.append(new)
    return lines


def _apply_steps(steps, ops, where):
    out = [dict(s) for s in steps]
    for op in ops.get("replace", []):
        i = op["i"]
        if not 0 <= i < len(steps):
            raise VariantError(f"{where}: step replace index {i} out of range")
        out[i] = dict(tag=op.get("tag", steps[i]["tag"]), text=op["text"], changed=True)
    inserts = {}
    for op in ops.get("insert", []):
        a = op["after"]
        if not -1 <= a < len(steps):
            raise VariantError(f"{where}: step insert after {a} out of range")
        inserts.setdefault(a, []).append(dict(tag=op["tag"], text=op["text"], changed=True))
    removed = set(ops.get("remove", []))
    for i in removed:
        if not 0 <= i < len(steps):
            raise VariantError(f"{where}: step remove index {i} out of range")
    res = list(inserts.get(-1, []))
    for i, s in enumerate(out):
        if i not in removed:
            res.append(s)
        res += inserts.get(i, [])
    return res


def resolve(r, vid):
    """Return the full recipe for variant `vid` ("default", "gym", "diabetic"), or None if unsuitable/missing."""
    if vid == "default":
        return r
    v = (r.get("variants") or {}).get(vid)
    if not v or v.get("unsuitable"):
        return None
    where = f'{r["slug"]}/{vid}'
    out = copy.deepcopy({k: x for k, x in r.items() if k not in ("variants", "section")})
    out["ingredients"] = _apply_lines(r["ingredients"], v.get("ingredients", {}), f"{where} ingredients")
    out["mixins"] = _apply_lines(r.get("mixins", []), v.get("mixins", {}), f"{where} mixins")
    out["steps"] = _apply_steps(r["steps"], v.get("steps", {}), f"{where} steps")
    for k in ("program", "respin", "tags", "nutrition_per_pint", "why", "gum_option"):
        if k in v:
            out[k] = copy.deepcopy(v[k])
    out.pop("egg_option", None)
    return out
