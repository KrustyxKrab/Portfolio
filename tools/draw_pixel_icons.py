"""Draw a cohesive set of retro-Mac pixel-art icons as transparent PNGs.

Each icon is authored on a 64x64 logical grid, then upscaled 4x with
nearest-neighbor to 256x256 so it stays crisp when displayed at 128x128.

Usage:
    source .venv/bin/activate
    python tools/draw_pixel_icons.py
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image

# ---------------------------------------------------------------------------
# Palette (extracted from the inspiration images)
# ---------------------------------------------------------------------------
T = (0, 0, 0, 0)
BLK = (0, 0, 0, 255)
WHT = (255, 255, 255, 255)

# Platinum / metal family
PL1 = (232, 232, 232, 255)  # brightest face
PL2 = (208, 208, 208, 255)  # face
PL3 = (176, 176, 176, 255)  # light shadow
PL4 = (136, 136, 136, 255)  # mid shadow
PL5 = (96, 96, 96, 255)     # dark shadow
PL6 = (64, 64, 64, 255)     # very dark

# Blue / glass family
BL1 = (200, 230, 255, 255)  # highlight
BL2 = (140, 190, 255, 255)  # face
BL3 = (92, 146, 230, 255)   # shadow
BL4 = (48, 88, 160, 255)    # deep shadow

# Amber / sticky note
AM1 = (255, 240, 170, 255)
AM2 = (240, 200, 80, 255)
AM3 = (200, 150, 40, 255)

# Rainbow badge
RAINBOW = [
    (120, 196, 80, 255),   # green
    (255, 220, 60, 255),   # yellow
    (255, 150, 40, 255),   # orange
    (235, 70, 70, 255),    # red
    (170, 90, 190, 255),   # purple
    (50, 160, 235, 255),   # blue
]

GRID = 64
SCALE = 4
OUT_DIR = Path(__file__).parent.parent / "public" / "icons"


@dataclass
class Canvas:
    """A 64x64 pixel canvas."""

    width: int = GRID
    height: int = GRID
    pixels: list[list[tuple[int, int, int, int]]] | None = None

    def __post_init__(self) -> None:
        if self.pixels is None:
            self.pixels = [[T for _ in range(self.width)] for _ in range(self.height)]

    def set(self, x: int, y: int, color: tuple[int, int, int, int]) -> None:
        if 0 <= x < self.width and 0 <= y < self.height:
            self.pixels[y][x] = color

    def get(self, x: int, y: int) -> tuple[int, int, int, int]:
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.pixels[y][x]
        return T

    def rect(self, x: int, y: int, w: int, h: int, color: tuple[int, int, int, int]) -> None:
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.set(xx, yy, color)

    def rect_outline(self, x: int, y: int, w: int, h: int, color: tuple[int, int, int, int], thick: int = 1) -> None:
        for t in range(thick):
            for xx in range(x + t, x + w - t):
                self.set(xx, y + t, color)
                self.set(xx, y + h - 1 - t, color)
            for yy in range(y + t, y + h - t):
                self.set(x + t, yy, color)
                self.set(x + w - 1 - t, yy, color)

    def line(self, x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int, int]) -> None:
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        while True:
            self.set(x0, y0, color)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def fill(self, x: int, y: int, color: tuple[int, int, int, int]) -> None:
        target = self.get(x, y)
        if target == color:
            return
        stack = [(x, y)]
        while stack:
            cx, cy = stack.pop()
            if self.get(cx, cy) != target:
                continue
            self.set(cx, cy, color)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                stack.append((cx + dx, cy + dy))

    def circle(self, cx: int, cy: int, r: int, color: tuple[int, int, int, int]) -> None:
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.3:
                    self.set(x, y, color)

    def circle_outline(self, cx: int, cy: int, r: int, color: tuple[int, int, int, int]) -> None:
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                d2 = (x - cx) ** 2 + (y - cy) ** 2
                if r * r - r * 0.8 <= d2 <= r * r + r * 0.8:
                    self.set(x, y, color)

    def dither_gradient(
        self,
        x: int,
        y: int,
        w: int,
        h: int,
        c1: tuple[int, int, int, int],
        c2: tuple[int, int, int, int],
        vertical: bool = True,
    ) -> None:
        """Fill a rectangle with a rough dithered gradient."""
        bands = 4
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if vertical:
                    t = (yy - y) / max(1, h - 1)
                else:
                    t = (xx - x) / max(1, w - 1)
                band = int(t * bands)
                # simple checker dither at band boundaries
                if band < bands // 2:
                    col = c1 if (xx + yy) % 2 == 0 else c2 if band % 2 else c1
                else:
                    col = c2 if (xx + yy) % 2 == 0 else c1 if band % 2 else c2
                # blend-ish: pick mostly c2 as t increases
                if t < 0.25:
                    col = c1
                elif t < 0.5:
                    col = c1 if (xx + yy) % 2 == 0 else c2
                elif t < 0.75:
                    col = c2 if (xx + yy) % 2 == 0 else c1
                else:
                    col = c2
                self.set(xx, yy, col)

    def save(self, path: Path) -> None:
        flat = [px for row in self.pixels for px in row]
        img = Image.new("RGBA", (self.width, self.height))
        img.putdata(flat)
        img = img.resize((self.width * SCALE, self.height * SCALE), Image.NEAREST)
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path)


# ---------------------------------------------------------------------------
# Shared primitives
# ---------------------------------------------------------------------------
def rainbow_badge(c: Canvas, x: int, y: int, w: int = 12, h: int = 6) -> None:
    """Chunky rainbow strip, lower-right corner detail."""
    seg = max(1, w // 6)
    for i, col in enumerate(RAINBOW):
        c.rect(x + i * seg, y, seg, h, col)


def mac_face(c: Canvas, cx: int, cy: int, r: int) -> None:
    """Classic Finder/About happy face badge."""
    c.circle(cx, cy, r, BL2)
    c.circle_outline(cx, cy, r, BLK)
    # eyes
    c.rect(cx - r // 2 - 1, cy - r // 4, max(2, r // 3), max(3, r // 2), BLK)
    c.rect(cx + r // 2 - max(2, r // 3) + 1, cy - r // 4, max(2, r // 3), max(3, r // 2), BLK)
    # smile
    sm = r // 3
    for i in range(-sm, sm + 1):
        yy = cy + r // 4 + (sm - abs(i)) // 2
        c.set(cx + i, yy, BLK)


# ---------------------------------------------------------------------------
# Icon definitions
# ---------------------------------------------------------------------------
def icon_about() -> Canvas:
    """About This Computer — chunky Mac tower with a happy-face badge."""
    c = Canvas()

    # Tower front face — big, filling the frame
    c.rect(10, 6, 36, 54, PL2)
    # Top handle / inset
    c.rect(16, 2, 24, 6, PL3)
    c.rect(18, 2, 20, 4, PL5)

    # Side depth plane (extruded right)
    c.rect(46, 12, 12, 44, PL4)
    # Top plane
    c.rect(12, 2, 40, 8, PL1)
    c.rect(14, 2, 36, 4, PL2)

    # Thick black outline
    c.rect_outline(10, 6, 36, 54, BLK, thick=2)
    c.line(46, 12, 46, 54, BLK)
    c.line(46, 12, 58, 6, BLK)
    c.line(58, 6, 58, 48, BLK)
    c.line(46, 54, 58, 48, BLK)
    # inner side shadow line
    c.line(46, 12, 46, 54, PL5)

    # Screen recess
    c.rect(14, 12, 28, 22, PL5)
    c.rect(16, 14, 24, 18, BL4)
    c.rect(18, 16, 20, 14, BL2)
    # screen header bar
    c.rect(18, 16, 20, 4, BL3)
    # screen content lines
    c.rect(18, 22, 18, 2, BL1)
    c.rect(18, 26, 14, 2, BL1)
    c.rect(18, 30, 16, 2, BL1)

    # Floppy drive slot
    c.rect(14, 38, 28, 4, PL5)
    c.rect(16, 38, 24, 2, PL3)

    # Vents
    for yy in range(46, 56, 3):
        c.line(16, yy, 40, yy, PL4)

    # Feet / base
    c.rect(10, 58, 10, 4, PL5)
    c.rect(36, 58, 10, 4, PL5)

    # Happy Finder face badge, overlapping lower left
    mac_face(c, 16, 48, 10)

    # Rainbow badge lower right
    rainbow_badge(c, 42, 54, w=12, h=5)

    return c


# ---------------------------------------------------------------------------
# Registry and runner
# ---------------------------------------------------------------------------
ICONS: dict[str, Callable[[], Canvas]] = {
    "about": icon_about,
}


def draw_all() -> None:
    for name, fn in ICONS.items():
        canvas = fn()
        canvas.save(OUT_DIR / f"{name}.png")
        print(f"saved {OUT_DIR / f'{name}.png'}")


if __name__ == "__main__":
    draw_all()
