#!/usr/bin/env python3
"""Render the SVG icon sources to the PNG sizes each platform actually asks for."""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from render import render  # noqa: E402

JOBS = [
    # (svg source, png output, size)
    ("brand/02-favicons/favicon.svg", "brand/02-favicons/favicon-16.png", 16),
    ("brand/02-favicons/favicon.svg", "brand/02-favicons/favicon-32.png", 32),
    ("brand/02-favicons/favicon.svg", "brand/02-favicons/favicon-48.png", 48),
    ("brand/02-favicons/favicon.svg", "brand/02-favicons/favicon-180-apple-touch.png", 180),
    ("brand/03-app-icons/app-icon-ios-1024.svg", "brand/03-app-icons/app-icon-ios-1024.png", 1024),
    ("brand/03-app-icons/app-icon-android-512.svg", "brand/03-app-icons/app-icon-android-512.png", 512),
    ("brand/03-app-icons/app-icon-android-maskable-512.svg", "brand/03-app-icons/app-icon-android-maskable-512.png", 512),
    ("brand/03-app-icons/app-icon-android-512.svg", "brand/03-app-icons/app-icon-android-192.png", 192),
]

WRAP = '''<!doctype html><meta charset="utf-8">
<style>html,body{{margin:0;padding:0;width:{s}px;height:{s}px;overflow:hidden}}
img{{width:{s}px;height:{s}px;display:block;image-rendering:auto}}</style>
<img src="{src}">'''


def main() -> None:
    tmp = pathlib.Path("/tmp/claude-0/-home-user-claude-content-creation-demo/"
                       "0ea8476c-d2ac-50b8-8bb9-7429f5c90289/scratchpad/icons")
    tmp.mkdir(parents=True, exist_ok=True)
    root = pathlib.Path.cwd()
    jobs = []
    for src, out, size in JOBS:
        html = tmp / (pathlib.Path(out).stem + ".html")
        html.write_text(WRAP.format(s=size, src=(root / src).as_uri()))
        jobs.append((str(html), out, size, size))
    render(jobs)


if __name__ == "__main__":
    main()
