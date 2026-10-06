"""SVG illustrations for recipe pages: a scoop/serving drawn per CREAMi program,
tinted from the recipe's colours."""
import colorsys
import math
import random


def _rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _hex(rgb):
    return "#" + "".join(f"{max(0, min(255, round(c * 255))):02X}" for c in rgb)


def mix(c1, c2, t):
    a, b = _rgb(c1), _rgb(c2)
    return _hex(tuple(x + (y - x) * t for x, y in zip(a, b)))


def lighten(c, t):
    return mix(c, "#FFFFFF", t)


def darken(c, t):
    return mix(c, "#000000", t)


def luminance(c):
    def ch(v):
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(v) for v in _rgb(c))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def legible(c, max_lum=0.12):
    """Darken a colour until it reads well as text on white."""
    out = c
    for _ in range(20):
        if luminance(out) <= max_lum:
            break
        out = darken(out, 0.12)
    return out


def saturate(c, f):
    r, g, b = _rgb(c)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return _hex(colorsys.hls_to_rgb(h, l, min(1, s * f)))


def scoop(cx, cy, r, base, accent=None, seed=0, sprinkles=True):
    """A scoop: dome on top, ruffled drip edge at the bottom."""
    rnd = random.Random(seed)
    hi = lighten(base, 0.45)
    sh = darken(base, 0.18)
    n = 6
    pts = []
    # ruffled bottom from right to left
    for i in range(n + 1):
        x = cx + r - (2 * r) * i / n
        pts.append(x)
    d = f"M{cx - r:.1f},{cy:.1f} A{r:.1f},{r * 0.95:.1f} 0 0 1 {cx + r:.1f},{cy:.1f} "
    for i in range(n):
        x0, x1 = pts[i], pts[i + 1]
        xm = (x0 + x1) / 2
        dip = r * (0.22 + 0.10 * rnd.random())
        d += f"Q{xm:.1f},{cy + dip * 1.6:.1f} {x1:.1f},{cy:.1f} "
    d += "Z"
    out = [f'<path d="{d}" fill="{base}" stroke="{sh}" stroke-width="1.6" stroke-linejoin="round"/>']
    # drip
    dx = cx + r * (0.25 + 0.3 * rnd.random()) * (1 if seed % 2 else -1)
    out.append(
        f'<path d="M{dx - r * 0.09:.1f},{cy + r * 0.15:.1f} q0,{r * 0.42:.1f} {r * 0.09:.1f},{r * 0.42:.1f} '
        f'q{r * 0.09:.1f},0 {r * 0.09:.1f},-{r * 0.42:.1f}z" fill="{base}"/>')
    # highlight
    out.append(
        f'<path d="M{cx - r * 0.62:.1f},{cy - r * 0.2:.1f} A{r * 0.7:.1f},{r * 0.7:.1f} 0 0 1 {cx - r * 0.05:.1f},{cy - r * 0.78:.1f}" '
        f'fill="none" stroke="{hi}" stroke-width="{r * 0.12:.1f}" stroke-linecap="round" opacity="0.85"/>')
    out.append(f'<circle cx="{cx + r * 0.28:.1f}" cy="{cy - r * 0.62:.1f}" r="{r * 0.07:.1f}" fill="{hi}" opacity="0.9"/>')
    if accent and sprinkles:
        for _ in range(9):
            a = rnd.uniform(math.pi * 1.08, math.pi * 1.92)
            rr = rnd.uniform(0.25, 0.8) * r
            x, y = cx + rr * math.cos(a), cy + rr * math.sin(a) * 0.95 + r * 0.05
            if rnd.random() < 0.5:
                rot = rnd.uniform(0, 180)
                out.append(
                    f'<rect x="{x - r * 0.07:.1f}" y="{y - r * 0.025:.1f}" width="{r * 0.14:.1f}" height="{r * 0.05:.1f}" rx="{r * 0.025:.1f}" '
                    f'fill="{accent}" transform="rotate({rot:.0f} {x:.1f} {y:.1f})"/>')
            else:
                out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * 0.055:.1f}" fill="{accent}"/>')
    return "\n".join(out)


def _cone(cx, top, w, h):
    c, line = "#E2A764", "#B9772F"
    out = [f'<path d="M{cx - w / 2},{top} L{cx + w / 2},{top} L{cx},{top + h} Z" fill="{c}" stroke="{line}" stroke-width="1.6" stroke-linejoin="round"/>']
    out.append(f'<clipPath id="cone{cx:.0f}{top:.0f}"><path d="M{cx - w / 2},{top} L{cx + w / 2},{top} L{cx},{top + h} Z"/></clipPath>')
    lines = []
    for i in range(-6, 8):
        x = cx - w / 2 + i * w / 6
        lines.append(f'<line x1="{x}" y1="{top}" x2="{x + h * 0.6}" y2="{top + h}" stroke="{line}" stroke-width="1.1"/>')
        lines.append(f'<line x1="{x + w}" y1="{top}" x2="{x + w - h * 0.6}" y2="{top + h}" stroke="{line}" stroke-width="1.1"/>')
    out.append(f'<g clip-path="url(#cone{cx:.0f}{top:.0f})" opacity="0.7">{"".join(lines)}</g>')
    return "\n".join(out)


def _sparkles(colour, rnd, n=4, box=(10, 10, 190, 190)):
    out = []
    for _ in range(n):
        x = rnd.uniform(box[0], box[2])
        y = rnd.uniform(box[1], box[3])
        s = rnd.uniform(4, 7)
        out.append(
            f'<path d="M{x:.1f},{y - s:.1f} Q{x:.1f},{y:.1f} {x + s:.1f},{y:.1f} Q{x:.1f},{y:.1f} {x:.1f},{y + s:.1f} '
            f'Q{x:.1f},{y:.1f} {x - s:.1f},{y:.1f} Q{x:.1f},{y:.1f} {x:.1f},{y - s:.1f}Z" fill="{colour}" opacity="0.8"/>')
    return "".join(out)


def illustration(program, base, accent, deep, seed=0, has_mixins=False, protein=False):
    rnd = random.Random(seed * 7 + 3)
    tint = lighten(base, 0.72)
    parts = [f'<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="art">',
             f'<circle cx="100" cy="104" r="86" fill="{tint}"/>',
             f'<circle cx="100" cy="104" r="86" fill="none" stroke="{lighten(base, 0.4)}" stroke-width="1.5" stroke-dasharray="2 6" stroke-linecap="round"/>']
    parts.append(_sparkles(accent, rnd, 4, (18, 18, 70, 70)))
    parts.append(_sparkles(lighten(deep, 0.3), rnd, 2, (140, 30, 185, 80)))
    sp = has_mixins
    p = program.upper()
    if p == "SORBET":
        glass, gl = "#FFFFFF", "#9FB3C8"
        parts.append(f'<path d="M48,112 Q100,168 152,112 Z" fill="{glass}" stroke="{gl}" stroke-width="2"/>')
        parts.append(f'<rect x="96" y="138" width="8" height="34" fill="{glass}" stroke="{gl}" stroke-width="2"/>')
        parts.append(f'<ellipse cx="100" cy="176" rx="30" ry="6" fill="{glass}" stroke="{gl}" stroke-width="2"/>')
        parts.append(scoop(78, 106, 26, base, accent, seed, sp))
        parts.append(scoop(122, 106, 26, base, accent, seed + 1, sp))
        parts.append(scoop(100, 82, 28, base, accent, seed + 2, sp))
        # mint / citrus garnish
        parts.append(f'<path d="M118,50 q14,-10 22,2 q-12,10 -22,-2z" fill="{accent}" stroke="{darken(accent, 0.25)}" stroke-width="1.2"/>')
        parts.append(f'<path d="M48,112 Q100,168 152,112" fill="none" stroke="{gl}" stroke-width="2"/>')
    elif p == "GELATO":
        cup, cl = "#FFFFFF", lighten(deep, 0.35)
        parts.append(scoop(100, 100, 44, base, accent, seed, sp))
        parts.append(f'<path d="M50,106 L150,106 L138,172 L62,172 Z" fill="{cup}" stroke="{cl}" stroke-width="2" stroke-linejoin="round"/>')
        parts.append(f'<path d="M58,124 L142,124" stroke="{lighten(base, 0.2)}" stroke-width="7"/>')
        parts.append(f'<path d="M60,140 L140,140" stroke="{accent}" stroke-width="3" opacity="0.6"/>')
        # paddle spoon
        parts.append(f'<g transform="rotate(28 130 70)"><rect x="126" y="30" width="7" height="50" rx="3" fill="#F2C94C" stroke="#C99A1E" stroke-width="1.2"/>'
                     f'<rect x="121" y="22" width="17" height="16" rx="5" fill="#F2C94C" stroke="#C99A1E" stroke-width="1.2"/></g>')
    elif p == "SMOOTHIE BOWL":
        parts.append(f'<ellipse cx="100" cy="112" rx="66" ry="18" fill="{base}" stroke="{darken(base, 0.2)}" stroke-width="1.6"/>')
        parts.append(f'<path d="M34,112 Q38,170 100,172 Q162,170 166,112" fill="#FFFFFF" stroke="{lighten(deep, 0.35)}" stroke-width="2"/>')
        parts.append(f'<path d="M48,140 Q100,150 152,140" fill="none" stroke="{accent}" stroke-width="5" opacity="0.5"/>')
        for i, x in enumerate((66, 84, 102)):
            parts.append(f'<circle cx="{x}" cy="{108 - i % 2 * 4}" r="9" fill="#FFF3C4" stroke="#E0B84A" stroke-width="1.5"/>')
        for _ in range(16):
            x, y = rnd.uniform(110, 150), rnd.uniform(102, 118)
            parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(1.5, 3):.1f}" fill="{rnd.choice([accent, "#C68B3E", "#3A3A3A"])}"/>')
        parts.append(f'<path d="M120,100 q8,-14 20,-6 q-8,12 -20,6z" fill="#7DBE5B"/>')
    elif p == "MILKSHAKE":
        gl = "#9FB3C8"
        parts.append(f'<path d="M66,70 L134,70 L124,178 L76,178 Z" fill="{base}" stroke="{gl}" stroke-width="2" stroke-linejoin="round"/>')
        parts.append(f'<path d="M70,82 L74,170" stroke="#FFFFFF" stroke-width="5" opacity="0.5" stroke-linecap="round"/>')
        parts.append(f'<g transform="rotate(14 112 40)"><rect x="108" y="14" width="9" height="64" fill="#FFFFFF" stroke="{accent}" stroke-width="1.5"/>'
                     + "".join(f'<rect x="108" y="{18 + i * 12}" width="9" height="5" fill="{accent}"/>' for i in range(5)) + '</g>')
        parts.append(f'<path d="M62,72 q8,-18 22,-10 q8,-16 24,-6 q14,-10 24,4 q10,4 6,12 Z" fill="#FFFDF7" stroke="#D9D2C3" stroke-width="1.6"/>')
        parts.append(f'<circle cx="100" cy="48" r="7" fill="#C62828"/>')
    elif p == "LITE ICE CREAM" or protein:
        # CREAMi pint tub with a scoop on top
        tub, tl = "#FFFFFF", lighten(deep, 0.3)
        parts.append(scoop(100, 82, 40, base, accent, seed, sp))
        parts.append(f'<path d="M56,92 L144,92 L138,176 L62,176 Z" fill="{tub}" stroke="{tl}" stroke-width="2" stroke-linejoin="round"/>')
        parts.append(f'<rect x="52" y="88" width="96" height="10" rx="4" fill="{lighten(base, 0.35)}" stroke="{tl}" stroke-width="1.6"/>')
        parts.append(f'<rect x="64" y="118" width="72" height="30" rx="5" fill="{deep}"/>')
        label = "PROTEIN" if protein else "PINT"
        parts.append(f'<text x="100" y="138" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="800" font-size="13" letter-spacing="1.5" fill="#FFFFFF">{label}</text>')
        parts.append(f'<path d="M66,160 L134,160" stroke="{tl}" stroke-width="1.2" stroke-dasharray="3 3"/>')
    else:  # ICE CREAM: double scoop cone
        parts.append(_cone(100, 112, 66, 72))
        parts.append(scoop(100, 106, 36, base, accent, seed, sp))
        parts.append(scoop(100, 70, 31, lighten(base, 0.08), accent, seed + 3, sp))
        parts.append(f'<circle cx="104" cy="36" r="7" fill="#C62828"/><path d="M104,30 q4,-10 12,-12" stroke="#5B8C32" stroke-width="2" fill="none"/>')
    parts.append("</svg>")
    return "\n".join(parts)
