"""
Generates the Cadence brand asset pack from the master logo.

    python scripts/build-brand-assets.py

Source of truth is brand/source/cadence-logo-master.png (2000x2000, logo on
navy). Everything else here is derived from it, so re-running after replacing
the master regenerates the whole pack.
"""

import os

import numpy as np
from PIL import Image

SRC = "brand/source/cadence-logo-master.png"
OUT = "brand"

NAVY = (10, 25, 44)          # #0A192C - master background
CYAN = (8, 200, 220)         # #08C8DC
BLUE = (22, 145, 211)        # #1691D3

os.makedirs(f"{OUT}/logo", exist_ok=True)
os.makedirs(f"{OUT}/favicon", exist_ok=True)

master = Image.open(SRC).convert("RGB")
W, H = master.size


def cut_background(img: Image.Image) -> Image.Image:
    """
    Knock out the navy field, keeping the mark and wordmark with soft edges.

    The master has a subtle vignette, so keying on distance from a single navy
    value leaves faint speckle across the canvas that defeats bbox trimming.
    Instead we key on what actually distinguishes the artwork: the mark is
    strongly saturated, the wordmark is bright. The background is neither.
    """
    # int32 throughout: (mx - mn) * 255 reaches ~48000, which overflows int16
    # and silently wraps negative, leaving only the artwork's edges.
    a = np.asarray(img.convert("RGB")).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]

    mx = a.max(axis=2)
    mn = a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) * 255 // np.maximum(mx, 1), 0)

    # Cyan/blue mark: saturated and reasonably bright.
    mark_a = np.clip((sat - 60) * 4, 0, 255) * (mx > 60)
    # White wordmark: bright and near-neutral.
    word_a = np.clip((mn - 90) * 4, 0, 255)

    alpha = np.maximum(mark_a, word_a).astype(np.uint8)
    alpha[alpha < 30] = 0  # kill residual speckle so trimming is exact

    out = np.dstack([r, g, b, alpha]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def trim(img: Image.Image, pad: int = 0) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    l, t = max(0, l - pad), max(0, t - pad)
    r, b = min(img.size[0], r + pad), min(img.size[1], b + pad)
    return img.crop((l, t, r, b))


print("cutting background...")
transparent = cut_background(master)

# ------------------------------------------------------------ lockups -----

lockup = trim(transparent, pad=8)
lockup.save(f"{OUT}/logo/cadence-logo-full.png")
print(f"  logo/cadence-logo-full.png            {lockup.size[0]}x{lockup.size[1]}")

# On-navy version is the master artwork as supplied.
on_navy = master.copy()
on_navy.save(f"{OUT}/logo/cadence-logo-on-navy.png")
print(f"  logo/cadence-logo-on-navy.png         {on_navy.size[0]}x{on_navy.size[1]}")

# Light-background lockup: same art, navy wordmark instead of white.
light = lockup.copy()
px = light.load()
for y in range(light.size[1]):
    for x in range(light.size[0]):
        r, g, b, a = px[x, y]
        if a > 0 and min(r, g, b) > 150:      # the white wordmark
            px[x, y] = (*NAVY, a)
light.save(f"{OUT}/logo/cadence-logo-on-light.png")
print(f"  logo/cadence-logo-on-light.png        {light.size[0]}x{light.size[1]}")

# --------------------------------------------------- mark and wordmark -----

# The mark sits in the left ~35% of the canvas; the wordmark to its right.
split = int(W * 0.37)
mark = trim(transparent.crop((0, 0, split, H)), pad=6)
mark.save(f"{OUT}/logo/cadence-mark.png")
print(f"  logo/cadence-mark.png                 {mark.size[0]}x{mark.size[1]}")

wordmark = trim(transparent.crop((split, 0, W, H)), pad=6)
wordmark.save(f"{OUT}/logo/cadence-wordmark.png")
print(f"  logo/cadence-wordmark.png             {wordmark.size[0]}x{wordmark.size[1]}")

# ---------------------------------------------------------- favicons -------

def square(img: Image.Image, size: int, bg=None, inset=0.82) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (*bg, 255) if bg else (0, 0, 0, 0))
    target = int(size * inset)
    m = img.copy()
    m.thumbnail((target, target), Image.LANCZOS)
    canvas.paste(m, ((size - m.size[0]) // 2, (size - m.size[1]) // 2), m)
    return canvas


for s in (16, 32, 180, 192, 512):
    square(mark, s, bg=NAVY).save(f"{OUT}/favicon/icon-{s}.png")
print("  favicon/icon-{16,32,180,192,512}.png   on navy")

square(mark, 512).save(f"{OUT}/favicon/icon-512-transparent.png")
print("  favicon/icon-512-transparent.png       transparent")

# --------------------------------------------- wire into the Next.js app ---
# Next.js auto-emits the <link> tags for these exact filenames in app/.

square(mark, 256, bg=NAVY).save(
    "src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (256, 256)]
)
print("  src/app/favicon.ico                    browser tab")

square(mark, 512, bg=NAVY).convert("RGB").save("src/app/icon.png")
print("  src/app/icon.png                       512, general")

# iOS home screen. Must be opaque - Safari composites transparency onto black -
# and must not be pre-rounded, because iOS applies its own corner mask.
square(mark, 180, bg=NAVY, inset=0.68).convert("RGB").save("src/app/apple-icon.png")
print("  src/app/apple-icon.png                 180, iOS home screen")

# ------------------------------------------------------ social / OG --------

og = Image.new("RGBA", (1200, 630), (*NAVY, 255))
m = lockup.copy()
m.thumbnail((760, 760), Image.LANCZOS)
og.paste(m, ((1200 - m.size[0]) // 2, (630 - m.size[1]) // 2), m)
og.convert("RGB").save(f"{OUT}/logo/cadence-og-1200x630.png")
print("  logo/cadence-og-1200x630.png          1200x630")

print("\ndone")
