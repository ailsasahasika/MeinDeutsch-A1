"""Aset vektor asli untuk tema Lucent: motif map, ornamen, perangko, ilustrasi, favicon."""
import math, random, pathlib
A = pathlib.Path(__file__).resolve().parent.parent
def W(rel, s):
    p = A / rel; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(s.strip() + "\n")
R = random.Random(11)
ESP, VD, ISA, PEONY, PLAV, RES, KRAFT, BLUE, OX = "#3E2723", "#48372F", "#F4F3EE", "#F4C9D6", "#C8A1B1", "#6D6943", "#D8BC92", "#A9BCD4", "#8E1C1C"
def svg(w, h, body, extra=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"{extra}>{body}</svg>'
def wrap(cx, cy, w, h, fn, m=16):
    """gambar ulang bentuk di sisi seberang bila menyentuh tepi, agar motif menyambung di tepi tile"""
    return "".join(fn(cx + dx, cy + dy) for dx in (-w, 0, w) for dy in (-h, 0, h)
                   if -m < cx + dx < w + m and -m < cy + dy < h + m)

# ---------- MOTIF (tile berulang) ----------
W("patterns/polka-cream.svg", svg(28, 28, f'<rect width="28" height="28" fill="#F1EDE4"/><circle cx="7" cy="7" r="3.4" fill="#2A1C18"/><circle cx="21" cy="21" r="3.4" fill="#2A1C18"/>'))
W("patterns/polka-espresso.svg", svg(22, 22, f'<rect width="22" height="22" fill="#33211D"/><circle cx="5.5" cy="5.5" r="1.6" fill="{ISA}"/><circle cx="16.5" cy="16.5" r="1.6" fill="{ISA}"/>'))
W("patterns/polka-pink.svg", svg(24, 24, f'<rect width="24" height="24" fill="#F7E3E8"/><circle cx="6" cy="6" r="2" fill="#5A3D35"/><circle cx="18" cy="18" r="2" fill="#5A3D35"/>'))
W("patterns/argyle.svg", svg(40, 52,
  f'<rect width="40" height="52" fill="#EFE6D3"/><path d="M20 0 40 26 20 52 0 26Z" fill="#6E5242"/>'
  f'<path d="M0 0 40 52M40 0 0 52" stroke="#C8A1B1" stroke-width="1" stroke-dasharray="3 3"/>'))
plaid = f'<rect width="48" height="48" fill="#F4E9EA"/>'
for x, wd, c, o in [(0, 14, "#C8A1B1", .35), (22, 4, "#8B6F64", .35), (34, 8, "#E8C7CF", .6)]:
    plaid += f'<rect x="{x}" width="{wd}" height="48" fill="{c}" opacity="{o}"/><rect y="{x}" height="{wd}" width="48" fill="{c}" opacity="{o}"/>'
plaid += '<path d="M24 0V48M0 24H48" stroke="#FFFFFF" stroke-width="1" opacity=".7"/>'
W("patterns/plaid-pink.svg", svg(48, 48, plaid))
W("patterns/stripes.svg", svg(20, 20, f'<rect width="20" height="20" fill="#F6E1E7"/><rect y="0" width="20" height="7" fill="#5E443B"/>'))
# totol rusa
def deer():
    w = h = 180; b = f'<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#8A5A36"/><stop offset=".5" stop-color="#A8713F"/><stop offset="1" stop-color="#8A5A36"/></linearGradient></defs><rect width="{w}" height="{h}" fill="url(#g)"/>'
    for _ in range(46):
        cx, cy = R.uniform(0, w), R.uniform(0, h); rx = R.uniform(3, 8); ry = rx * R.uniform(.7, 1.1); a = R.uniform(0, 180)
        b += wrap(cx, cy, w, h, lambda x, y: f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" transform="rotate({a:.0f} {x:.1f} {y:.1f})" fill="#FBF3E6" opacity=".92"/>')
    return svg(w, h, b)
W("patterns/deer-spots.svg", deer())
def dalmatian():
    w = h = 200; b = f'<rect width="{w}" height="{h}" fill="#EFE8DA"/>'
    for _ in range(30):
        cx, cy = R.uniform(0, w), R.uniform(0, h); r = R.uniform(4, 11)
        pts = []
        for i in range(14):
            t = i / 14 * 2 * math.pi; rr = r * R.uniform(.82, 1.15); pts.append((math.cos(t) * rr, math.sin(t) * rr))
        def blob(x, y, pts=pts):
            d = "M" + " ".join(f"{x+px:.1f} {y+py:.1f}" for px, py in pts) + "Z"
            return f'<path d="{d}" fill="#1E1714" stroke="#1E1714" stroke-width="4.5" stroke-linejoin="round"/>'
        b += wrap(cx, cy, w, h, blob)
    return svg(w, h, b)
W("patterns/dalmatian.svg", dalmatian())
# renda: jaring + bunga
def lace(bg="#F1EBDF", ink="#1F1714"):
    w = h = 64
    net = "".join(f'<path d="M{x} 0 L{x+32} 64 M{x+32} 0 L{x} 64" stroke="{ink}" stroke-width=".5" opacity=".45"/>' for x in range(-32, 64, 8))
    def flower(x, y, s):
        p = "".join(f'<ellipse cx="{x}" cy="{y-s*.55}" rx="{s*.26}" ry="{s*.45}" transform="rotate({k*60} {x} {y})" fill="none" stroke="{ink}" stroke-width="1.6"/>' for k in range(6))
        return p + f'<circle cx="{x}" cy="{y}" r="{s*.2}" fill="{ink}"/><circle cx="{x}" cy="{y}" r="{s*.95}" fill="none" stroke="{ink}" stroke-width=".8" stroke-dasharray="1.5 2"/>'
    leaves = f'<path d="M0 32 Q16 20 32 32 T64 32" fill="none" stroke="{ink}" stroke-width="1.2"/>'
    return svg(w, h, f'<rect width="{w}" height="{h}" fill="{bg}"/>{net}{leaves}{flower(16,16,13)}{flower(48,48,13)}{flower(48,-16,13)}{flower(-16,48,13)}{flower(80,48,13)}{flower(16,80,13)}')
W("patterns/lace.svg", lace())
W("patterns/lace-espresso.svg", lace("#3A2622", "#E9DCCB"))
W("patterns/gingham.svg", svg(8, 8, f'<rect width="8" height="8" fill="#E9D3AE"/><rect width="4" height="8" fill="#6B4A2E" opacity=".45"/><rect width="8" height="4" fill="#6B4A2E" opacity=".45"/>'))
W("patterns/quilted.svg", svg(40, 40,
  '<defs><radialGradient id="q" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#6B4038"/><stop offset=".7" stop-color="#3B2420"/><stop offset="1" stop-color="#26160F"/></radialGradient></defs>'
  '<rect width="40" height="40" fill="#26160F"/><path d="M20 1 39 20 20 39 1 20Z" fill="url(#q)"/><path d="M0 0 20 0 0 20Z M40 0 40 20 20 0Z M0 40 0 20 20 40Z M40 40 20 40 40 20Z" fill="url(#q)" opacity=".85"/>'))
def zebra():
    w, h = 160, 120; b = f'<rect width="{w}" height="{h}" fill="#EEE5D3"/>'
    for i in range(6):
        y0 = i * 20 + 4; th = R.uniform(6, 10); ph = R.uniform(0, 6.28)
        top = [(x, y0 + 7 * math.sin(2 * math.pi * x / w + ph)) for x in range(0, w + 1, 8)]
        bot = [(x, y + th + 2 * math.sin(4 * math.pi * x / w + ph)) for x, y in reversed(top)]
        d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in top + bot) + "Z"
        b += f'<path d="{d}" fill="#1C1714"/>'
    return svg(w, h, b)
W("patterns/zebra.svg", zebra())
W("patterns/ruled.svg", svg(40, 32, f'<rect width="40" height="32" fill="none"/><path d="M0 31.5H40" stroke="#B9C7DA" stroke-width="1"/>'))

# ---------- ORNAMEN ----------
def star(id="s"):
    pts = []
    for i in range(10):
        r = 48 if i % 2 == 0 else 20; t = -math.pi / 2 + i * math.pi / 5
        pts.append((50 + r * math.cos(t), 52 + r * math.sin(t)))
    faces = ""
    shades = ["#FFFFFF", "#9EA3AA", "#E9ECEF", "#7B8189", "#D5D9DE", "#8D939B", "#F3F5F7", "#6E747C", "#C9CED4", "#A7ADB4"]
    for i in range(10):
        a, b = pts[i], pts[(i + 1) % 10]
        faces += f'<path d="M50 52 L{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}Z" fill="{shades[i]}"/>'
    outline = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"
    return svg(100, 100, f'<defs><filter id="d" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="2" stdDeviation="1.6" flood-opacity=".45"/></filter></defs><g filter="url(#d)">{faces}<path d="{outline}" fill="none" stroke="#5B6168" stroke-width="1.2" stroke-linejoin="round"/></g><circle cx="44" cy="40" r="3" fill="#fff" opacity=".9"/>')
W("ornaments/star-silver.svg", star())
W("ornaments/paperclip.svg", svg(40, 110,
  '<defs><linearGradient id="m" x1="0" x2="1"><stop offset="0" stop-color="#8A9097"/><stop offset=".45" stop-color="#F4F6F8"/><stop offset="1" stop-color="#7C828A"/></linearGradient></defs>'
  '<path d="M28 30 V88 a10 10 0 0 1 -20 0 V18 a13 13 0 0 1 26 0 V80 a6 6 0 0 1 -12 0 V30" fill="none" stroke="#55595F" stroke-width="5" stroke-linecap="round" opacity=".35" transform="translate(1.5 2)"/>'
  '<path d="M28 30 V88 a10 10 0 0 1 -20 0 V18 a13 13 0 0 1 26 0 V80 a6 6 0 0 1 -12 0 V30" fill="none" stroke="url(#m)" stroke-width="3.6" stroke-linecap="round"/>'))
W("ornaments/binder-clip.svg", svg(90, 70,
  '<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2C27A"/><stop offset=".5" stop-color="#B8913F"/><stop offset="1" stop-color="#8A6A2A"/></linearGradient><linearGradient id="w" x1="0" x2="1"><stop offset="0" stop-color="#8E7135"/><stop offset=".5" stop-color="#F0D99A"/><stop offset="1" stop-color="#8E7135"/></linearGradient></defs>'
  '<path d="M26 36 C14 4, 34 2, 34 20 M64 36 C76 4, 56 2, 56 20" fill="none" stroke="url(#w)" stroke-width="3.2" stroke-linecap="round"/>'
  '<path d="M12 34 H78 L72 66 H18Z" fill="url(#b)" stroke="#7A5C22" stroke-width="1.2"/><path d="M14 40 H76" stroke="#F6E2A8" stroke-width="1.5" opacity=".8"/>'))
W("ornaments/binder-ring.svg", svg(26, 54,
  '<defs><linearGradient id="r" x1="0" x2="1"><stop offset="0" stop-color="#6F757C"/><stop offset=".4" stop-color="#F2F4F6"/><stop offset=".7" stop-color="#A5ABB2"/><stop offset="1" stop-color="#5E636A"/></linearGradient></defs>'
  '<ellipse cx="13" cy="46" rx="7" ry="5" fill="#1D1411" opacity=".55"/><path d="M8 46 C2 30, 2 10, 13 4 C24 10, 24 30, 18 46" fill="none" stroke="url(#r)" stroke-width="5" stroke-linecap="round"/>'))
def washi(name, base, deco):
    right = " ".join(f"L{140 - (4 if i % 2 else 0)} {i*4}" for i in range(9))
    left = " ".join(f"L{4 if i % 2 else 0} {32 - i*4}" for i in range(9))
    d = f"M0 0 L140 0 {right} L0 32 {left}Z"
    return svg(140, 32, f'<defs><pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse">{deco}</pattern><clipPath id="c"><path d="{d}"/></clipPath></defs><g clip-path="url(#c)" opacity=".88"><rect width="140" height="32" fill="{base}"/><rect width="140" height="32" fill="url(#p)"/><rect width="140" height="32" fill="#fff" opacity=".12"/></g>')
W("ornaments/washi-pink.svg", washi("pink", PEONY, '<circle cx="5" cy="5" r="1.3" fill="#FFFFFF" opacity=".9"/>'))
W("ornaments/washi-sage.svg", washi("sage", "#B9B98F", '<path d="M0 10 L10 0" stroke="#FFFFFF" stroke-width="1.4" opacity=".6"/>'))
W("ornaments/washi-blue.svg", washi("blue", "#BFD0E2", '<rect x="0" y="0" width="5" height="10" fill="#FFFFFF" opacity=".35"/>'))
def lace_edge():
    b = ""
    for i in range(4):
        x = i * 30 + 15
        b += f'<path d="M{x-15} 0 V10 A15 15 0 0 0 {x+15} 10 V0Z" fill="#FBF8F1"/>'
        b += f'<circle cx="{x}" cy="12" r="3.2" fill="none" stroke="#D9CFC0" stroke-width="1"/>'
        b += "".join(f'<circle cx="{x+12*math.cos(t):.1f}" cy="{10+12*math.sin(t):.1f}" r="1.5" fill="#D9CFC0"/>' for t in [math.pi*k/6 for k in range(1, 6)])
    return svg(120, 26, b)
W("ornaments/lace-edge.svg", lace_edge())
W("ornaments/heart-charm.svg", svg(40, 60,
  '<defs><linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7F8FA"/><stop offset=".5" stop-color="#9CA2A9"/><stop offset="1" stop-color="#E6E9EC"/></linearGradient></defs>'
  '<circle cx="20" cy="6" r="4" fill="none" stroke="#A7ADB4" stroke-width="2"/><path d="M20 10 V16" stroke="#A7ADB4" stroke-width="2"/>'
  '<path d="M20 56 C4 44, 2 32, 8 24 C13 18, 19 20, 20 26 C21 20, 27 18, 32 24 C38 32, 36 44, 20 56Z" fill="url(#h)" stroke="#6E747C" stroke-width="1.5"/>'
  '<path d="M20 50 C9 42, 8 33, 12 28 C15 25, 19 26, 20 31 C21 26, 25 25, 28 28 C32 33, 31 42, 20 50Z" fill="none" stroke="#FFFFFF" stroke-width="1" opacity=".8"/>'))

# ---------- PERANGKO & CAP POS ----------
def perforated(w, h, inner, r=3.2, step=10, paper="#F4EFE4"):
    holes = ""
    for x in range(step // 2, w, step): holes += f'<circle cx="{x}" cy="0" r="{r}"/><circle cx="{x}" cy="{h}" r="{r}"/>'
    for y in range(step // 2, h, step): holes += f'<circle cx="0" cy="{y}" r="{r}"/><circle cx="{w}" cy="{y}" r="{r}"/>'
    return (f'<defs><mask id="pm"><rect width="{w}" height="{h}" fill="#fff"/><g fill="#000">{holes}</g></mask>'
            f'<filter id="sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-opacity=".35"/></filter></defs>'
            f'<g filter="url(#sh)"><rect width="{w}" height="{h}" fill="{paper}" mask="url(#pm)"/></g>{inner}')
tor = ('<g fill="#2B2220">'
       '<rect x="40" y="118" width="80" height="8"/>' + "".join(f'<rect x="{44+i*13}" y="86" width="6" height="32"/>' for i in range(6)) +
       '<rect x="38" y="78" width="84" height="8"/><path d="M38 78 H122 L116 72 H44Z"/><rect x="66" y="62" width="28" height="10"/>'
       '<path d="M70 62 C72 50, 78 50, 80 56 C82 50, 88 50, 90 62Z"/></g>')
flag = ('<path d="M24 34 C50 22, 74 46, 100 34 C116 27, 128 30, 136 34 V50 C128 46, 116 43, 100 50 C74 62, 50 38, 24 50Z" fill="#111"/>'
        '<path d="M24 50 C50 38, 74 62, 100 50 C116 43, 128 46, 136 50 V66 C128 62, 116 59, 100 66 C74 78, 50 54, 24 66Z" fill="#DD0000"/>'
        '<path d="M24 66 C50 54, 74 78, 100 66 C116 59, 128 62, 136 66 V82 C128 78, 116 75, 100 82 C74 94, 50 70, 24 82Z" fill="#FFCE00"/>')
inner = (f'<rect x="10" y="10" width="140" height="180" fill="#E9E3D5"/>{flag}<g opacity=".95">{tor}</g>'
         f'<text x="80" y="152" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="34" fill="{ESP}">A1</text>'
         f'<text x="80" y="176" text-anchor="middle" font-family="Courier New,monospace" font-weight="700" font-size="11" letter-spacing="3" fill="{ESP}">DEUTSCHLAND</text>'
         f'<text x="140" y="26" text-anchor="end" font-family="Courier New,monospace" font-weight="700" font-size="12" fill="{OX}">80</text>')
W("stamps/stamp-a1.svg", svg(160, 200, perforated(160, 200, inner)))
# perangko kecil per bagian (dipakai di beranda)
def arc_text(t, cx, cy, r, mid, color, flip=False, size=14, step=12.5):
    out = ""; n = len(t)
    for i, ch in enumerate(t):
        ang = mid + (i - (n - 1) / 2) * step * (-1 if flip else 1)
        a = math.radians(ang); x = cx + r * math.cos(a); y = cy + r * math.sin(a)
        rot = ang + (-90 if flip else 90)
        out += f'<text x="{x:.1f}" y="{y:.1f}" transform="rotate({rot:.1f} {x:.1f} {y:.1f})" text-anchor="middle" dominant-baseline="central" font-family="Courier New,monospace" font-weight="700" font-size="{size}" fill="{color}">{ch}</text>'
    return out
def postmark(name, top, bottom, center, color="#2B2220"):
    w, h = 300, 150
    dots = "".join(f'<circle cx="{R.uniform(0,w):.0f}" cy="{R.uniform(0,h):.0f}" r="{R.uniform(.6,2.2):.1f}"/>' for _ in range(160))
    waves = "".join(f'<path d="M150 {40+i*18} c20 -8 40 8 60 0 s40 -8 60 0 s30 8 30 0" fill="none" stroke="{color}" stroke-width="2.4" stroke-dasharray="{R.randint(18,34)} {R.randint(4,9)}"/>' for i in range(4))
    return svg(w, h,
      f'<defs><mask id="g"><rect width="{w}" height="{h}" fill="#fff"/><g fill="#000">{dots}</g></mask>'
      f'<path id="t" d="M30 75 A45 45 0 0 1 120 75"/><path id="b" d="M24 75 A51 51 0 0 0 126 75"/></defs>'
      f'<g mask="url(#g)" opacity=".82"><circle cx="75" cy="75" r="62" fill="none" stroke="{color}" stroke-width="3"/><circle cx="75" cy="75" r="40" fill="none" stroke="{color}" stroke-width="2"/>'
      + arc_text(top, 75, 75, 50, -90, color) + arc_text(bottom, 75, 75, 50, 90, color, flip=True) +
      f'<text x="75" y="82" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="22" fill="{color}">{center}</text>{waves}</g>')
W("stamps/postmark-luftpost.svg", postmark("lp", "DEUTSCHLAND", "LUFTPOST", "A1"))
W("stamps/postmark-pruefung.svg", postmark("pr", "SIMULASI", "BUKAN RESMI", "A1", OX))
# cap paspor per bab (dikumpulkan saat bab selesai)
COLS = [OX, RES, "#2F4A6D", "#7A3B55", "#5A3D35", "#3F5E4C"]
TH = ["Hallo!", "Familie", "Essen", "Zeit", "Wohnen", "Freizeit", "Arbeit", "Stadt", "Kleidung", "Körper", "Reisen", "Feste"]
for i in range(12):
    c = COLS[i % 6]; n = i + 1; w = h = 140
    dots = "".join(f'<circle cx="{R.uniform(0,w):.0f}" cy="{R.uniform(0,h):.0f}" r="{R.uniform(.5,2):.1f}"/>' for _ in range(90))
    shape = i % 3
    if shape == 0: frame = f'<circle cx="70" cy="70" r="62" fill="none" stroke="{c}" stroke-width="4"/><circle cx="70" cy="70" r="54" fill="none" stroke="{c}" stroke-width="1.5"/>'
    elif shape == 1: frame = f'<rect x="10" y="22" width="120" height="96" rx="10" fill="none" stroke="{c}" stroke-width="4"/><rect x="17" y="29" width="106" height="82" rx="6" fill="none" stroke="{c}" stroke-width="1.5"/>'
    else: frame = f'<ellipse cx="70" cy="70" rx="64" ry="50" fill="none" stroke="{c}" stroke-width="4"/><ellipse cx="70" cy="70" rx="56" ry="42" fill="none" stroke="{c}" stroke-width="1.5" stroke-dasharray="4 3"/>'
    body = (f'<defs><mask id="m"><rect width="{w}" height="{h}" fill="#fff"/><g fill="#000">{dots}</g></mask></defs>'
            f'<g mask="url(#m)" transform="rotate({R.choice([-12,-8,-5,6,9,13])} 70 70)" opacity=".85">{frame}'
            f'<text x="70" y="52" text-anchor="middle" font-family="Courier New,monospace" font-weight="700" font-size="13" letter-spacing="2" fill="{c}">BAB {n:02d}</text>'
            f'<text x="70" y="80" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="22" fill="{c}">{TH[i]}</text>'
            f'<text x="70" y="102" text-anchor="middle" font-family="Courier New,monospace" font-weight="700" font-size="11" letter-spacing="2" fill="{c}">GESCHAFFT</text></g>')
    W(f"stamps/bab-{n:02d}.svg", svg(w, h, body))

# ---------- ILUSTRASI ----------
W("illustrations/envelope.svg", svg(600, 380,
  '<defs><linearGradient id="in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93A8C4"/><stop offset="1" stop-color="#B3C4DA"/></linearGradient>'
  '<linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DA580"/><stop offset="1" stop-color="#858D69"/></linearGradient>'
  '<filter id="s" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-opacity=".45"/></filter></defs>'
  '<g filter="url(#s)"><path d="M20 120 L300 2 L580 120 V370 H20Z" fill="url(#in)"/>'
  '<path d="M20 150 L300 300 L580 150 V372 H20Z" fill="url(#bd)"/><path d="M20 150 L240 270 L20 372Z" fill="#8E9672"/><path d="M580 150 L360 270 L580 372Z" fill="#8E9672"/>'
  '<path d="M20 150 L300 300 L580 150" fill="none" stroke="#6F7656" stroke-width="1.5" opacity=".6"/></g>'))
W("illustrations/brandenburger-tor.svg", svg(240, 150,
  f'<g fill="none" stroke="{ESP}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">'
  '<path d="M20 140 H220"/><path d="M28 140 V64 M212 140 V64"/>' + "".join(f'<path d="M{x} 140 V66"/>' for x in (52, 76, 100, 140, 164, 188)) +
  '<path d="M22 64 H218 L212 54 H28Z"/><path d="M26 48 H214"/><path d="M84 48 V34 H156 V48"/>'
  '<path d="M104 34 C104 22, 110 18, 114 22 L118 14 L122 22 C126 18, 136 22, 136 34"/><path d="M120 14 V6 M116 8 L124 4"/>'
  '<path d="M36 76 H44 M60 76 H68 M84 76 H92 M148 76 H156 M172 76 H180 M196 76 H204"/></g>'))
W("illustrations/earphones.svg", svg(160, 160,
  '<g fill="none" stroke="#F4F3EE" stroke-width="2.5" stroke-linecap="round"><path d="M40 30 C40 80, 70 90, 80 120 C90 150, 130 150, 130 120 C130 90, 100 100, 110 60 C114 44, 120 36, 120 30"/><path d="M80 120 V150"/></g>'
  '<g fill="#F4F3EE" stroke="#B8B2A8" stroke-width="1.5"><ellipse cx="40" cy="22" rx="11" ry="13"/><ellipse cx="120" cy="22" rx="11" ry="13"/></g>'
  '<rect x="76" y="146" width="8" height="12" rx="2" fill="#C9C3B8"/>'))

# ---------- FAVICON ----------
W("icons/favicon.svg", svg(64, 64,
  f'<rect x="4" y="4" width="56" height="56" rx="6" fill="{ESP}"/><rect x="9" y="9" width="46" height="46" rx="3" fill="none" stroke="{PEONY}" stroke-width="2" stroke-dasharray="3 3"/>'
  f'<text x="32" y="42" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="26" fill="{PEONY}">A1</text>'))
print("ok", sum(1 for _ in A.rglob("*.svg")))
W("ornaments/binder-ring-h.svg", svg(56, 84, extra=' preserveAspectRatio="xMinYMin meet"', body=
  '<defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6F757C"/><stop offset=".35" stop-color="#F2F4F6"/><stop offset=".7" stop-color="#A5ABB2"/><stop offset="1" stop-color="#5E636A"/></linearGradient></defs>'
  '<path d="M4 15 C10 4, 34 2, 46 9" fill="none" stroke="#1D1411" stroke-width="5" stroke-linecap="round" opacity=".35" transform="translate(1 3)"/>'
  '<path d="M4 15 C10 4, 34 2, 46 9" fill="none" stroke="url(#r)" stroke-width="4.5" stroke-linecap="round"/>'))
W("ornaments/barcode.svg", svg(120, 30, "".join(f'<rect x="{x}" width="{w}" height="30" fill="#2B1D19"/>' for x, w in [(i*3+ (1 if i%3==0 else 0), (2 if i%4 else 1)) for i in range(40)])))
print("extra ok")
