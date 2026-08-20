#!/usr/bin/env python3
"""Generate the XR Guild 'lens' texture.

The existing artwork carries an iridescent swirl. The owner keeps it as part of
the identity but not the core of it, so it is rebuilt here in the cool palette
and defined as a background texture the wordmark sits on - never as a fill
inside the letterforms, which is what breaks legibility at small sizes.

Built from SVG filter primitives so it stays a single small file with no bitmap.
"""
import pathlib

OUT = pathlib.Path("brand/08-texture")

# Cool-palette stops. The original swirl ran green/pink; these keep the same
# iridescent behaviour inside the indigo-silver-cyan system.
STOPS = [
    ("0%", "#08070F"),
    ("28%", "#181143"),
    ("52%", "#3B2E86"),
    ("72%", "#2F7FA8"),
    ("88%", "#5CE1F2"),
    ("100%", "#C3CADE"),
]


def texture(w: int = 1600, h: int = 1600, seed: int = 7, scale: float = 46) -> str:
    stops = "".join(
        f'<stop offset="{o}" stop-color="{c}"/>' for o, c in STOPS)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="XR Guild lens texture">
<title>XR Guild lens texture</title>
<defs>
  <linearGradient id="iris" x1="0" y1="0" x2="1" y2="1">{stops}</linearGradient>
  <filter id="swirl" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0012 0.0019" numOctaves="5" seed="{seed}" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="{scale * 11:.0f}" xChannelSelector="R" yChannelSelector="G" result="warp"/>
    <feGaussianBlur in="warp" stdDeviation="{scale / 3:.0f}" result="soft"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="2" seed="{seed + 5}" result="fine"/>
    <feDisplacementMap in="soft" in2="fine" scale="{scale / 1.5:.0f}" xChannelSelector="R" yChannelSelector="B"/>
  </filter>
</defs>
<rect width="{w}" height="{h}" fill="#181143"/>
<g filter="url(#swirl)">
  <rect x="{-w * 0.3:.0f}" y="{-h * 0.3:.0f}" width="{w * 1.6:.0f}" height="{h * 1.6:.0f}" fill="url(#iris)"/>
  <ellipse cx="{w * 0.34:.0f}" cy="{h * 0.30:.0f}" rx="{w * 0.32:.0f}" ry="{h * 0.28:.0f}" fill="#5CE1F2" opacity="0.5"/>
  <ellipse cx="{w * 0.74:.0f}" cy="{h * 0.58:.0f}" rx="{w * 0.30:.0f}" ry="{h * 0.32:.0f}" fill="#6E5BD0" opacity="0.55"/>
  <ellipse cx="{w * 0.50:.0f}" cy="{h * 0.90:.0f}" rx="{w * 0.40:.0f}" ry="{h * 0.24:.0f}" fill="#181143" opacity="0.8"/>
  <ellipse cx="{w * 0.14:.0f}" cy="{h * 0.72:.0f}" rx="{w * 0.22:.0f}" ry="{h * 0.20:.0f}" fill="#2F7FA8" opacity="0.5"/>
</g>
<rect width="{w}" height="{h}" fill="#08070F" opacity="0.34"/>
</svg>
'''


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, seed in (("lens-texture-01.svg", 7), ("lens-texture-02.svg", 23)):
        (OUT / name).write_text(texture(seed=seed))
        print(OUT / name)


if __name__ == "__main__":
    main()
