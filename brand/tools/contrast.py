#!/usr/bin/env python3
"""Compute WCAG 2.1 contrast ratios for the XR Guild palette.

Every colour pair the brand guide recommends is checked here, so the guide can
publish measured numbers instead of assurances. Run it after any palette change.
"""
import itertools
import json
import sys

PALETTE = {
    "void":    "#08070F",  # deepest ground - near black with an indigo cast
    "indigo":  "#181143",  # primary brand ground
    "panel":   "#221A57",  # raised panel on indigo
    "cyan":    "#5CE1F2",  # signal accent
    "silver":  "#C3CADE",  # secondary text and rules
    "muted":   "#8E96B4",  # tertiary text
    "white":   "#FFFFFF",
    "black":   "#000000",
    "paper":   "#F4F5F9",  # light ground for print and documents
}


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_colour: str) -> float:
    h = hex_colour.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return (0.2126 * srgb_to_linear(r)
            + 0.7152 * srgb_to_linear(g)
            + 0.0722 * srgb_to_linear(b))


def ratio(fg: str, bg: str) -> float:
    a, b = luminance(fg), luminance(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def grade(r: float, large: bool = False) -> str:
    if large:
        return "AAA" if r >= 4.5 else "AA" if r >= 3.0 else "FAIL"
    return "AAA" if r >= 7.0 else "AA" if r >= 4.5 else "FAIL"


# The pairs the guide actually recommends. Anything not listed is not endorsed.
PAIRS = [
    ("silver", "void", False), ("silver", "indigo", False), ("silver", "panel", False),
    ("muted", "void", False), ("muted", "indigo", False), ("muted", "panel", False),
    ("cyan", "void", False), ("cyan", "indigo", False), ("cyan", "panel", False),
    ("white", "void", False), ("white", "indigo", False), ("white", "panel", False),
    ("indigo", "cyan", False), ("void", "cyan", False),
    ("indigo", "paper", False), ("void", "paper", False), ("black", "paper", False),
    ("indigo", "white", False), ("void", "white", False),
]


def main() -> int:
    rows, failures = [], []
    for fg, bg, large in PAIRS:
        r = ratio(PALETTE[fg], PALETTE[bg])
        g = grade(r, large)
        rows.append({"fg": fg, "bg": bg, "hex_fg": PALETTE[fg],
                     "hex_bg": PALETTE[bg], "ratio": round(r, 2), "grade": g})
        if g == "FAIL":
            failures.append(f"{fg} on {bg} = {r:.2f}")

    width = max(len(f"{r['fg']} on {r['bg']}") for r in rows)
    for r in rows:
        label = f"{r['fg']} on {r['bg']}"
        print(f"{label:<{width}}  {r['ratio']:>6.2f}:1  {r['grade']}")

    if "--json" in sys.argv:
        print(json.dumps(rows, indent=2))

    if failures:
        print("\nFAILURES:", "; ".join(failures), file=sys.stderr)
        return 1
    print("\nAll endorsed pairs pass WCAG AA for normal text.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
