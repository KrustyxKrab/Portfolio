"""Slice a pixel-art icon sheet into individual transparent PNGs.

Detects icons on a white(ish) background, crops each one, removes the outer
background (flood fill from the borders, so white pixels INSIDE an icon are
kept), and upscales with nearest-neighbor to an exact integer multiple so the
result stays true pixel art (>= 256px).

Usage:
  python slice_icons.py <sheet.(jpeg|png)> <out_dir> [--min-size 256]
"""

import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

NEAR_WHITE = 235  # JPEG-artifact tolerance for background detection
MIN_ICON_PX = 8   # ignore specks smaller than this


def outer_background(rgb: np.ndarray) -> np.ndarray:
    """Boolean mask of near-white pixels connected to the image border."""
    near_white = (rgb > NEAR_WHITE).all(axis=2)
    h, w = near_white.shape
    outer = np.zeros((h, w), dtype=bool)
    queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not outer[y, x]:
                outer[y, x] = True
                queue.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not outer[y, x]:
                outer[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and near_white[ny, nx] and not outer[ny, nx]:
                outer[ny, nx] = True
                queue.append((ny, nx))
    return outer


def gap(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> int:
    """Chebyshev gap between two (y0, y1, x0, x1) boxes; 0 if they overlap."""
    dy = max(a[0] - b[1], b[0] - a[1], 0)
    dx = max(a[2] - b[3], b[2] - a[3], 0)
    return max(dy, dx)


def merge_fragments(
    boxes: list[tuple[int, int, int, int]], max_gap: int = 5
) -> list[tuple[int, int, int, int]]:
    """Union small fragments (icon dots, shadows) into the nearest big seed box."""
    seeds = [b for b in boxes if b[1] - b[0] >= MIN_ICON_PX and b[3] - b[2] >= MIN_ICON_PX]
    for frag in (b for b in boxes if b not in seeds):
        best = min(seeds, key=lambda s: gap(s, frag), default=None)
        if best is not None and gap(best, frag) <= max_gap:
            i = seeds.index(best)
            seeds[i] = (
                min(best[0], frag[0]), max(best[1], frag[1]),
                min(best[2], frag[2]), max(best[3], frag[3]),
            )
    return seeds


def components(mask: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Bounding boxes (y0, y1, x0, x1) of connected regions, BFS labeling."""
    h, w = mask.shape
    seen = np.zeros((h, w), dtype=bool)
    boxes = []
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        seen[sy, sx] = True
        queue = deque([(sy, sx)])
        y0 = y1 = sy
        x0 = x1 = sx
        while queue:
            y, x = queue.popleft()
            y0, y1, x0, x1 = min(y0, y), max(y1, y), min(x0, x), max(x1, x)
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1),
                           (y - 1, x - 1), (y - 1, x + 1), (y + 1, x - 1), (y + 1, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
        boxes.append((y0, y1 + 1, x0, x1 + 1))
    return boxes


def despeckle(mask: np.ndarray, rgb: np.ndarray, max_px: int = 20) -> np.ndarray:
    """Drop tiny bright blobs (JPEG dust) from the opacity mask."""
    h, w = mask.shape
    seen = np.zeros((h, w), dtype=bool)
    out = mask.copy()
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        seen[sy, sx] = True
        queue = deque([(sy, sx)])
        blob = [(sy, sx)]
        while queue:
            y, x = queue.popleft()
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
                    blob.append((ny, nx))
        if len(blob) <= max_px:
            ys, xs = zip(*blob)
            if rgb[ys, xs].mean() > 200:
                out[ys, xs] = False
    return out


def quantize(crop: np.ndarray, opaque: np.ndarray, colors: int = 64) -> np.ndarray:
    """Snap JPEG color noise to a small per-icon palette (clean pixel art).

    Only opaque pixels vote for the palette; transparent ones are filled with
    the icon's dominant color first so they can't claim a palette slot.
    """
    if not opaque.any():
        return crop
    pixels = crop[opaque]
    dominant = np.median(pixels, axis=0).astype(np.uint8)
    voting = crop.copy()
    voting[~opaque] = dominant
    im = Image.fromarray(voting)
    pal = im.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
    return np.array(pal.convert("RGB"))


def slice_sheet(sheet_path: Path, out_dir: Path, min_size: int) -> list[Path]:
    img = Image.open(sheet_path).convert("RGB")
    rgb = np.array(img)
    icon_mask = ~outer_background(rgb)

    out_dir.mkdir(parents=True, exist_ok=True)
    native_dir = out_dir / "native"
    native_dir.mkdir(exist_ok=True)
    written = []
    # sort boxes into reading order: bucket rows by box center, then by x
    boxes = merge_fragments(components(icon_mask))
    boxes.sort(key=lambda b: ((b[0] + b[1]) // 2 // 20, b[2]))
    for n, (by0, by1, bx0, bx1) in enumerate(boxes, start=1):
        cell = icon_mask[by0:by1, bx0:bx1]
        ys, xs = np.nonzero(cell)
        if len(ys) == 0:
            continue
        cy0, cy1 = by0 + ys.min(), by0 + ys.max() + 1
        cx0, cx1 = bx0 + xs.min(), bx0 + xs.max() + 1
        w, h = cx1 - cx0, cy1 - cy0
        if w < MIN_ICON_PX or h < MIN_ICON_PX:
            continue
        by0, by1, bx0, bx1 = cy0, cy1, cx0, cx1

        crop = rgb[by0:by1, bx0:bx1]
        opaque = despeckle(icon_mask[by0:by1, bx0:bx1], crop)
        alpha = np.where(opaque, 255, 0).astype(np.uint8)
        rgba = np.dstack([quantize(crop, opaque), alpha])

        side = max(w, h)
        canvas = np.zeros((side, side, 4), dtype=np.uint8)
        oy, ox = (side - h) // 2, (side - w) // 2
        canvas[oy:oy + h, ox:ox + w] = rgba

        native = Image.fromarray(canvas)
        native.save(native_dir / f"icon_{n:02d}.png")

        scale = -(-min_size // side)  # ceil -> integer factor, >= min_size
        out = native.resize((side * scale, side * scale), Image.NEAREST)
        path = out_dir / f"icon_{n:02d}.png"
        out.save(path)
        written.append(path)
    return written


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    sheet, out = Path(sys.argv[1]), Path(sys.argv[2])
    if not sheet.is_file():
        sys.exit(f"not found: {sheet}")
    min_size = 256
    if "--min-size" in sys.argv:
        min_size = int(sys.argv[sys.argv.index("--min-size") + 1])
    written = slice_sheet(sheet, out, min_size)
    print(f"{len(written)} icons -> {out}")
    for p in written:
        print(" ", p.name)


if __name__ == "__main__":
    main()
