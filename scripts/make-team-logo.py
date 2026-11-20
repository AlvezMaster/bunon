"""
Team logo for the competition profile: team Maku (মাকু, the loom shuttle that carries the thread through the cloth),
the team behind Bunon. Drawn with Pillow: a shuttle mark with its bobbin and a terracotta thread. The Bunon product
mark (mark() below, the same shapes as src/components/BunonLogo.tsx) is kept for product images.

    python scripts/make-team-logo.py

Writes to brand/:
    team-logo.png              1024 x 1024, navy with woven threads: shuttle, "TEAM / Maku", tagline, "The team behind Bunon"
    team-logo-mark.png         512 x 512 avatar: the shuttle alone on navy
    team-logo-transparent.png  1100 x 400, navy shuttle and wordmark on a transparent background (for light pages)
Everything stays inside the central circle, so a round profile crop cuts nothing off.
"""
import math
import os
import re

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "brand")
FONTS = "C:/Windows/Fonts"
NAVY_TOP, NAVY_BOTTOM = (30, 58, 95), (13, 27, 46)
TERRACOTTA = (255, 154, 92)
WHITE = (255, 255, 255)

# The Bunon mark: a bar and an angular "b" with a hole (fill-rule evenodd), viewBox 555 540 820 850.
VIEW = (555, 540, 820, 850)
BAR = (568, 553, 797, 122, 18)  # x, y, w, h, corner radius
PATH = (
    "M1113 675 L680 885 C600 925 600 1045 680 1080 C850 1140 1000 1250 1100 1365 Q1110 1378 1125 1378 "
    "L1225 1378 Q1255 1378 1255 1348 L1255 675 Z M1200 768 L775 985 C900 1040 1010 1110 1113 1197 L1113 855 Z"
)


def subpaths(d, steps=40):
    """SVG path (M, L, C, Q, Z) to lists of points, curves flattened."""
    tokens = re.findall(r"[MLCQZ]|-?\d+(?:\.\d+)?", d)
    out, cur, pos, i = [], [], (0.0, 0.0), 0
    while i < len(tokens):
        cmd = tokens[i]
        i += 1
        if cmd == "M":
            if cur:
                out.append(cur)
            pos = (float(tokens[i]), float(tokens[i + 1]))
            i += 2
            cur = [pos]
        elif cmd == "L":
            pos = (float(tokens[i]), float(tokens[i + 1]))
            i += 2
            cur.append(pos)
        elif cmd == "C":
            p1, p2, p3 = [(float(tokens[i + k]), float(tokens[i + k + 1])) for k in (0, 2, 4)]
            i += 6
            p0 = pos
            for s in range(1, steps + 1):
                t = s / steps
                u = 1 - t
                cur.append((
                    u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
                ))
            pos = p3
        elif cmd == "Q":
            p1, p2 = [(float(tokens[i + k]), float(tokens[i + k + 1])) for k in (0, 2)]
            i += 4
            p0 = pos
            for s in range(1, steps + 1):
                t = s / steps
                u = 1 - t
                cur.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))
            pos = p2
        elif cmd == "Z":
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def mark(height, color):
    """The Bunon mark as an RGBA image `height` pixels tall, drawn at 4x and scaled down for smooth edges."""
    ss = 4
    scale = height * ss / VIEW[3]
    w, h = math.ceil(VIEW[2] * scale), math.ceil(VIEW[3] * scale)
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    tx = lambda p: ((p[0] - VIEW[0]) * scale, (p[1] - VIEW[1]) * scale)
    x, y, bw, bh, r = BAR
    d.rounded_rectangle([tx((x, y)), tx((x + bw, y + bh))], radius=r * scale, fill=255)
    outer, hole = subpaths(PATH)
    d.polygon([tx(p) for p in outer], fill=255)
    d.polygon([tx(p) for p in hole], fill=0)  # evenodd: the inner shape is a hole
    mask = mask.resize((w // ss, h // ss), Image.LANCZOS)
    img = Image.new("RGBA", mask.size, color + (0,))
    img.putalpha(mask)
    return img


def shuttle(width, body, thread):
    """A loom shuttle (মাকু): a pointed body with a window, the bobbin inside, and the thread leaving the tip."""
    ss = 4
    W = int(width * ss)
    cw, ch = int(W * 1.3), int(W * 0.46)
    img = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    cx, cy = W * 0.5 + W * 0.02, ch * 0.42
    L, H = W / 2, W * 0.135

    # Body: pointed at both ends (the profile of a cosine), as one shape.
    mask = Image.new("L", (cw, ch), 0)
    md = ImageDraw.Draw(mask)
    top = [(cx + x, cy - H * math.cos(math.pi * x / (2 * L)) ** 0.8) for x in [L * (i / 200 * 2 - 1) for i in range(201)]]
    bottom = [(cx + x, cy + H * math.cos(math.pi * x / (2 * L)) ** 0.8) for x in [L * (1 - i / 200 * 2) for i in range(201)]]
    md.polygon(top + bottom, fill=255)
    # The window in the middle, where the bobbin sits.
    ww, wh = W * 0.38, H * 0.95
    md.rounded_rectangle([cx - ww / 2, cy - wh / 2, cx + ww / 2, cy + wh / 2], radius=wh / 2, fill=0)
    layer = Image.new("RGBA", (cw, ch), body + (0,))
    layer.putalpha(mask)
    img.alpha_composite(layer)

    d = ImageDraw.Draw(img)
    # Bobbin with wound thread.
    bw, bh = W * 0.3, wh * 0.56
    d.rounded_rectangle([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], radius=bh / 2, fill=thread + (255,))
    dark = tuple(max(0, int(c * 0.78)) for c in thread) + (255,)
    for k in range(1, 8):
        x = cx - bw / 2 + bw * k / 8
        d.line([(x, cy - bh / 2 + bh * 0.14), (x, cy + bh / 2 - bh * 0.14)], fill=dark, width=max(2, int(W * 0.006)))
    # The thread runs from the bobbin out of the right tip and away in a soft wave.
    pts = []
    x0, y0 = cx + bw / 2, cy
    p1, p2, p3 = (cx + L * 0.85, cy - H * 0.05), (cx + L * 1.05, cy + H * 0.2), (cx + L * 1.12, cy + H * 0.55)
    q1, q2, q3 = (cx + L * 1.2, cy + H * 0.95), (cx + L * 1.38, cy + H * 1.25), (cx + L * 1.5, cy + H * 1.05)
    for (a, b, c, e) in [((x0, y0), p1, p2, p3), (p3, q1, q2, q3)]:
        for t in [i / 60 for i in range(61)]:
            u = 1 - t
            pts.append((u**3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t**3 * e[0], u**3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t**3 * e[1]))
    d.line(pts, fill=thread + (255,), width=max(3, int(W * 0.014)), joint="curve")
    return img.resize((cw // ss, ch // ss), Image.LANCZOS)


def background(size):
    """Navy gradient, a faint woven grid (Bunon means weaving) and a warm glow low on the right."""
    w, h = size
    bg = Image.new("RGB", size)
    px = bg.load()
    for yy in range(h):
        for xx in range(w):
            t = (xx / w * 0.35 + yy / h * 0.65)
            px[xx, yy] = tuple(int(NAVY_TOP[k] + (NAVY_BOTTOM[k] - NAVY_TOP[k]) * t) for k in range(3))
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy, rad = int(w * 0.72), int(h * 0.8), int(w * 0.5)
    gd.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(194, 65, 12, 58))
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.16))
    bg = Image.alpha_composite(bg.convert("RGBA"), glow)
    grid = Image.new("RGBA", size, (0, 0, 0, 0))
    gr = ImageDraw.Draw(grid)
    step = max(16, w // 32)
    for v in range(0, w, step):
        gr.line([(v, 0), (v, h)], fill=(255, 255, 255, 12), width=max(1, w // 512))
    for v in range(0, h, step):
        gr.line([(0, v), (w, v)], fill=(255, 255, 255, 9), width=max(1, w // 512))
    return Image.alpha_composite(bg, grid)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def centered(draw, y, text, f, fill, spacing=0):
    """Draws text centred horizontally at y; `spacing` adds letter spacing in pixels."""
    if spacing:
        widths = [draw.textlength(ch, font=f) for ch in text]
        total = sum(widths) + spacing * (len(text) - 1)
        x = (draw.im.size[0] - total) / 2
        for ch, cw in zip(text, widths):
            draw.text((x, y), ch, font=f, fill=fill)
            x += cw + spacing
    else:
        draw.text(((draw.im.size[0] - draw.textlength(text, font=f)) / 2, y), text, font=f, fill=fill)


def main():
    os.makedirs(OUT, exist_ok=True)
    label = font("seguisb.ttf" if os.path.exists(os.path.join(FONTS, "seguisb.ttf")) else "segoeuib.ttf", 34)

    # 1) Profile logo, 1024 square.
    S = 1024
    logo = background((S, S))
    m = shuttle(560, WHITE, TERRACOTTA)
    # Centre the shuttle's body (it sits at 52% of the mark's width), not the body plus its trailing thread.
    logo.alpha_composite(m, (S // 2 - int(560 * 0.52), 228))
    d = ImageDraw.Draw(logo)
    centered(d, 492, "TEAM", label, TERRACOTTA + (255,), spacing=14)
    centered(d, 532, "Maku", font("georgiab.ttf", 150), WHITE + (255,))
    centered(d, 732, "Carrying every answer to every buyer.", font("georgiai.ttf", 38), (214, 221, 233, 255))
    centered(d, 808, "THE TEAM BEHIND BUNON", font("segoeuib.ttf", 22), (148, 160, 184, 255), spacing=6)
    logo.convert("RGB").save(os.path.join(OUT, "team-logo.png"), optimize=True)

    # 2) Avatar: the shuttle alone.
    A = 512
    avatar = background((A, A))
    m = shuttle(330, WHITE, TERRACOTTA)
    avatar.alpha_composite(m, (A // 2 - int(330 * 0.52) - 24, (A - m.height) // 2 + 10))
    avatar.convert("RGB").save(os.path.join(OUT, "team-logo-mark.png"), optimize=True)

    # 3) Horizontal lockup on transparent, navy, for light backgrounds.
    W, H = 1100, 400
    flat = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    m = shuttle(330, NAVY_TOP, (194, 65, 12))
    flat.alpha_composite(m, (40, (H - m.height) // 2 + 10))
    d = ImageDraw.Draw(flat)
    x = 40 + m.width + 10
    d.text((x, 92), "TEAM", font=font("segoeuib.ttf", 30), fill=(194, 65, 12, 255))
    d.text((x, 126), "Maku", font=font("georgiab.ttf", 124), fill=NAVY_TOP + (255,))
    d.text((x + 4, 276), "Carrying every answer to every buyer.", font=font("georgiai.ttf", 30), fill=(90, 100, 120, 255))
    flat.save(os.path.join(OUT, "team-logo-transparent.png"), optimize=True)

    print("saved brand/team-logo.png, brand/team-logo-mark.png, brand/team-logo-transparent.png")


if __name__ == "__main__":
    main()
