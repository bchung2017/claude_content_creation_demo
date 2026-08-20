#!/usr/bin/env python3
"""Fetch the latin subsets of the XR Guild typefaces and store them locally.

All three families are SIL Open Font Licence, so volunteers can install and
redistribute them without a purchase. Keeping copies in the package means the
guide and templates render identically offline and after any CDN change.
"""
import pathlib
import re
import subprocess

OUT = pathlib.Path("brand/00-fonts")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# The latin subset carries basic Latin plus common punctuation. Google Fonts
# emits it as the block whose unicode-range starts at U+0000.
LATIN_START = "U+0000"

FAMILIES = {
    "space-grotesk": "Space+Grotesk:wght@500;700",
    "figtree":       "Figtree:wght@400;500;700",
    "jetbrains-mono": "JetBrains+Mono:wght@400;500",
}


def curl(url: str) -> bytes:
    return subprocess.run(
        ["curl", "-sSL", "-A", UA, "--max-time", "30", url],
        check=True, capture_output=True).stdout


def latin_url(css: str) -> str:
    """Return the woff2 URL of the latin (not latin-ext) @font-face block."""
    blocks = re.findall(r"@font-face\s*\{[^}]*\}", css)
    for block in blocks:
        rng = re.search(r"unicode-range:\s*([^;]+);", block)
        src = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", block)
        if rng and src and rng.group(1).strip().startswith(LATIN_START):
            return src.group(1)
    raise SystemExit("no latin block found")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, spec in FAMILIES.items():
        css = curl(f"https://fonts.googleapis.com/css2?family={spec}&display=swap").decode()
        url = latin_url(css)
        data = curl(url)
        path = OUT / f"{slug}-latin.woff2"
        path.write_bytes(data)
        print(f"{path}  {len(data):,} bytes")


if __name__ == "__main__":
    main()
