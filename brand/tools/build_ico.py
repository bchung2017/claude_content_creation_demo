#!/usr/bin/env python3
"""Assemble favicon.ico from the rendered PNGs.

Written by hand rather than with an image library: the ICO container simply
wraps whole PNG files, which every browser in current use accepts.
"""
import pathlib
import struct

SIZES = [16, 32, 48]
SRC = pathlib.Path("brand/02-favicons")
OUT = SRC / "favicon.ico"


def main() -> None:
    images = [(s, (SRC / f"favicon-{s}.png").read_bytes()) for s in SIZES]
    header = struct.pack("<HHH", 0, 1, len(images))          # reserved, type=icon, count
    offset = len(header) + 16 * len(images)
    entries, blobs = b"", b""
    for size, data in images:
        entries += struct.pack("<BBBBHHII",
                               size if size < 256 else 0,     # width
                               size if size < 256 else 0,     # height
                               0, 0,                          # palette, reserved
                               1, 32,                         # planes, bpp
                               len(data), offset)
        blobs += data
        offset += len(data)
    OUT.write_bytes(header + entries + blobs)
    print(f"{OUT}  {OUT.stat().st_size:,} bytes  sizes={SIZES}")


if __name__ == "__main__":
    main()
