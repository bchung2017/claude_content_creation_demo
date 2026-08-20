#!/usr/bin/env python3
"""Generate favicon and app-icon SVG sources.

Icons are not just the logo shrunk. At 16px the stacked lockup is unreadable, so
the icon drops GUILD entirely and enlarges XR until it survives. The app icons
add the platform padding each store expects instead of leaving it to chance.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from build_marks import CYAN, INDIGO, VOID, WHITE, line_path, load  # noqa: E402

FAVICON_OUT = pathlib.Path("brand/02-favicons")
APP_OUT = pathlib.Path("brand/03-app-icons")


def icon(font, fg: str, bg: str, fill_ratio: float, radius_ratio: float = 0.0,
         safe_ratio: float = 1.0) -> str:
    """Square icon with XR centred.

    fill_ratio  - width of XR as a fraction of the icon
    radius_ratio- corner radius as a fraction of the icon (0 = square)
    safe_ratio  - shrink the artwork into a central safe zone (Android maskable)
    """
    cap = font["OS/2"].sCapHeight
    d, w = line_path(font, "XR", -0.05)
    size = w / (fill_ratio * safe_ratio)
    x = (size - w) / 2
    y = (size + cap) / 2
    r = size * radius_ratio
    rect = f'<rect width="{size:.1f}" height="{size:.1f}"{f" rx={chr(34)}{r:.1f}{chr(34)}" if r else ""} fill="{bg}"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size:.1f} {size:.1f}" width="{size:.0f}" height="{size:.0f}" role="img" aria-label="XR Guild">
<title>XR Guild</title>
{rect}<g fill="{fg}" transform="translate({x:.1f} {y:.1f}) scale(1 -1)">{d}</g>
</svg>
'''


def main() -> None:
    FAVICON_OUT.mkdir(parents=True, exist_ok=True)
    APP_OUT.mkdir(parents=True, exist_ok=True)
    font = load(700)

    # Favicon: XR runs nearly edge to edge. Browser tabs render at 16px, and
    # anything smaller than this stops being readable.
    (FAVICON_OUT / "favicon.svg").write_text(icon(font, CYAN, INDIGO, 0.82))
    (FAVICON_OUT / "favicon-mono.svg").write_text(icon(font, WHITE, VOID, 0.82))

    # iOS: no transparency and no pre-rounded corners; the OS applies the mask.
    (APP_OUT / "app-icon-ios-1024.svg").write_text(icon(font, CYAN, INDIGO, 0.62))
    # Android standard: rounded, artwork in the middle.
    (APP_OUT / "app-icon-android-512.svg").write_text(icon(font, CYAN, INDIGO, 0.62, 0.22))
    # Android maskable: the OS may crop to a circle, so keep art inside the
    # central 80% safe zone or the letterforms lose their edges.
    (APP_OUT / "app-icon-android-maskable-512.svg").write_text(
        icon(font, CYAN, INDIGO, 0.62, 0.0, 0.80))

    for p in sorted(list(FAVICON_OUT.glob("*.svg")) + list(APP_OUT.glob("*.svg"))):
        print(p)


if __name__ == "__main__":
    main()
