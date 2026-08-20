#!/usr/bin/env python3
"""Generate the XR Guild wordmark and mark as outlined SVG.

The letterforms are converted to vector paths rather than left as <text>, so
every file renders identically for a volunteer who does not have the typeface
installed. Re-run after any change to weight, tracking, or proportion.

Layout follows the existing XR Guild artwork: XR large on top, GUILD below,
tracked out so the two lines share one width and read as a single block.
"""
import pathlib

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONT = "brand/00-fonts/space-grotesk-latin.woff2"
OUT = pathlib.Path("brand/01-logos")

# Palette (mirrors brand/tools/contrast.py - keep the two in step).
VOID = "#08070F"
INDIGO = "#181143"
CYAN = "#5CE1F2"
WHITE = "#FFFFFF"

TRACK_TOP = -0.045   # em, tight - matches the compact feel of the current mark
TRACK_BOTTOM = 0.30  # em, tracked out so GUILD spans the same width as XR


def load(weight: int = 700) -> TTFont:
    font = TTFont(FONT)
    return instancer.instantiateVariableFont(font, {"wght": weight})


def line_path(font: TTFont, text: str, tracking: float) -> tuple[str, float]:
    """Return (path data, advance width) for text laid out on a baseline at 0."""
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upem = font["head"].unitsPerEm
    track = tracking * upem

    parts, x = [], 0.0
    for ch in text:
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.1f}")
        glyphs[name].draw(pen)
        d = pen.getCommands()
        if d:
            parts.append(f'<path transform="translate({x:.1f} 0)" d="{d}"/>'
                         if x else f'<path d="{d}"/>')
        x += glyphs[name].width + track
    return "".join(parts), x - track  # drop trailing track


def measure(font: TTFont, path_group: str) -> None:
    return None


def stacked(font: TTFont, fg: str, bg: str | None, pad: float = 0.14) -> str:
    """Build the primary stacked lockup as a complete SVG document."""
    upem = font["head"].unitsPerEm
    top_d, top_w = line_path(font, "XR", TRACK_TOP)
    bot_d, bot_w = line_path(font, "GUILD", TRACK_BOTTOM)

    # Cap height drives vertical rhythm; Space Grotesk caps sit at ~700/1000.
    cap = font["OS/2"].sCapHeight
    gap = cap * 0.26

    # Scale GUILD to exactly match the width of XR so the block is one shape.
    bot_scale = top_w / bot_w
    bot_cap = cap * bot_scale

    block_w = top_w
    block_h = cap + gap + bot_cap

    pad_x = block_w * pad
    vb_w = block_w + pad_x * 2
    vb_h = block_h + pad_x * 2

    # y origin at top of the viewBox; baselines measured down from there.
    top_baseline = pad_x + cap
    bot_baseline = pad_x + cap + gap + bot_cap

    bg_rect = f'<rect width="{vb_w:.1f}" height="{vb_h:.1f}" fill="{bg}"/>' if bg else ""

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.1f} {vb_h:.1f}" role="img" aria-label="XR Guild">
<title>XR Guild</title>
{bg_rect}<g fill="{fg}">
<g transform="translate({pad_x:.1f} {top_baseline:.1f}) scale(1 -1)">{top_d}</g>
<g transform="translate({pad_x:.1f} {bot_baseline:.1f}) scale({bot_scale:.4f} -{bot_scale:.4f})">{bot_d}</g>
</g>
</svg>
'''


def horizontal(font: TTFont, fg: str, bg: str | None, pad: float = 0.18) -> str:
    """Single-line lockup for tight horizontal spaces such as page headers."""
    cap = font["OS/2"].sCapHeight
    d, w = line_path(font, "XR GUILD", -0.02)
    pad_y = cap * pad
    vb_w = w + pad_y * 2
    vb_h = cap + pad_y * 2
    bg_rect = f'<rect width="{vb_w:.1f}" height="{vb_h:.1f}" fill="{bg}"/>' if bg else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.1f} {vb_h:.1f}" role="img" aria-label="XR Guild">
<title>XR Guild</title>
{bg_rect}<g fill="{fg}" transform="translate({pad_y:.1f} {pad_y + cap:.1f}) scale(1 -1)">{d}</g>
</svg>
'''


def tile(font: TTFont, fg: str, bg: str, radius_ratio: float = 0.0) -> str:
    """Square XR tile for avatars, favicons, and anywhere under 32px."""
    cap = font["OS/2"].sCapHeight
    d, w = line_path(font, "XR", TRACK_TOP)
    size = w / 0.68  # XR occupies 68% of the tile width
    x = (size - w) / 2
    y = (size + cap) / 2
    r = size * radius_ratio
    rect = (f'<rect width="{size:.1f}" height="{size:.1f}" rx="{r:.1f}" fill="{bg}"/>'
            if r else f'<rect width="{size:.1f}" height="{size:.1f}" fill="{bg}"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size:.1f} {size:.1f}" role="img" aria-label="XR Guild">
<title>XR Guild</title>
{rect}<g fill="{fg}" transform="translate({x:.1f} {y:.1f}) scale(1 -1)">{d}</g>
</svg>
'''


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    font = load(700)

    files = {
        # Primary. Cyan on indigo is the master lockup.
        "xr-guild-wordmark-stacked-cyan-on-indigo.svg": stacked(font, CYAN, INDIGO),
        # Transparent variants for placing on photography or the swirl texture.
        "xr-guild-wordmark-stacked-white.svg":          stacked(font, WHITE, None),
        "xr-guild-wordmark-stacked-cyan.svg":           stacked(font, CYAN, None),
        # Single-colour fallbacks for print, embroidery, and one-colour partners.
        "xr-guild-wordmark-stacked-black.svg":          stacked(font, VOID, None),
        "xr-guild-wordmark-horizontal-white.svg":       horizontal(font, WHITE, None),
        "xr-guild-wordmark-horizontal-black.svg":       horizontal(font, VOID, None),
        # Avatars and small sizes.
        "xr-guild-mark-xr-tile-cyan-on-indigo.svg":     tile(font, CYAN, INDIGO),
        "xr-guild-mark-xr-tile-indigo-on-cyan.svg":     tile(font, INDIGO, CYAN),
        "xr-guild-mark-xr-tile-white-on-void.svg":      tile(font, WHITE, VOID),
    }
    for name, svg in files.items():
        (OUT / name).write_text(svg)
        print(f"{OUT / name}  {len(svg):,} bytes")


if __name__ == "__main__":
    main()
