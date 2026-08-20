#!/usr/bin/env python3
"""Rasterise SVG and HTML sources to exact-pixel PNGs using headless Chromium.

Used for the platform assets that must be delivered as PNG (Luma covers,
LinkedIn logos and banners) and for visual checks during design.
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]

# This environment ships Chromium at a fixed path and the pip-installed
# Playwright may expect a different build number, so point at it explicitly
# rather than downloading a second copy.
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"


def render(jobs: list[tuple[str, str, int, int]]) -> None:
    """jobs: (source path, output path, width px, height px)."""
    with sync_playwright() as p:
        launch = {"args": ["--force-color-profile=srgb",
                           "--font-render-hinting=none"]}
        if pathlib.Path(CHROME).exists():
            launch["executable_path"] = CHROME
        browser = p.chromium.launch(**launch)
        for src, out, w, h in jobs:
            page = browser.new_page(viewport={"width": w, "height": h},
                                    device_scale_factor=1)
            page.goto((ROOT / src).as_uri())
            page.wait_for_timeout(350)
            outp = ROOT / out
            outp.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(outp), omit_background=False)
            page.close()
            print(f"{out}  {w}x{h}")
        browser.close()


def pdf(jobs: list[tuple[str, str]]) -> None:
    """jobs: (source html path, output pdf path). Letter size, no browser margins."""
    with sync_playwright() as p:
        launch = {"args": ["--force-color-profile=srgb"]}
        if pathlib.Path(CHROME).exists():
            launch["executable_path"] = CHROME
        browser = p.chromium.launch(**launch)
        for src, out in jobs:
            page = browser.new_page()
            page.goto((ROOT / src).as_uri())
            page.wait_for_timeout(400)
            outp = ROOT / out
            outp.parent.mkdir(parents=True, exist_ok=True)
            page.pdf(path=str(outp), format="Letter", print_background=True,
                     margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
            page.close()
            print(f"{out}  PDF")
        browser.close()


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) != 4:
        raise SystemExit("usage: render.py <src> <out> <w> <h>")
    render([(args[0], args[1], int(args[2]), int(args[3]))])
