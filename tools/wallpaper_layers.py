"""Cut hamburg-mobile-v2.webp into parallax layers (sky/city/water).
Run: .venv/bin/python tools/wallpaper_layers.py"""
import random
import numpy as np
from PIL import Image, ImageFilter

SRC = 'public/wallpapers/hamburg-mobile-v2.webp'
OUT = 'public/wallpapers/layers/'
P = 30            # overscan (image px) on every side
Y0, W, EXT = 1225, 1556, 14   # city band top, waterline, city extension under water
SPLIT_X = 440     # right of this: silhouette fill per column
BOATS = [(255, 1500, 325, 1580), (690, 1520, 750, 1600)]

im = Image.open(SRC).convert('RGB')
A = np.asarray(im).astype(int)
H, Wd = A.shape[:2]
lum = A @ [0.3, 0.59, 0.11]

def morph(mask, n, grow=True):
    f = ImageFilter.MaxFilter(n) if grow else ImageFilter.MinFilter(n)
    return np.asarray(Image.fromarray((mask * 255).astype('uint8')).filter(f)) > 0

# --- city mask (rows Y0..W) ---
M = np.zeros((H, Wd), bool)
band = (lum[Y0:W] < 135) | (A[Y0:W, :, 2] > A[Y0:W, :, 0] - 60)
M[Y0:W] = band
M = morph(morph(M, 3), 3, False)
for x in range(SPLIT_X, Wd):
    ys = np.nonzero(M[Y0:W, x])[0]
    if len(ys): M[Y0 + ys[0]:W, x] = True
M[1430:W, :SPLIT_X] = True
M = morph(M, 5)
M[:Y0] = False
M[W:] = False

# boat sails above the waterline belong to the water layer
boat = np.zeros((H, Wd), bool)
for x0, y0, x1, y1 in BOATS:
    sub = A[y0:W, x0:x1]
    lu = lum[y0:W, x0:x1]
    sat = sub.max(2) - sub.min(2)
    boat[y0:W, x0:x1] = ((lu > 175) & (sat < 80)) | ((lu < 110) & (sub[..., 0] > sub[..., 2]))
boat = morph(boat, 3)

def inpaint_rows(img, mask):
    """Fill masked pixels with the nearest unmasked pixel in the same row."""
    out = img.copy()
    for y in range(img.shape[0]):
        ok = ~mask[y]
        if not ok.any():
            out[y] = out[y - 1] if y else out[y]
            continue
        idx = np.where(ok, np.arange(Wd), -1)
        left = np.maximum.accumulate(idx)
        idx2 = np.where(ok, np.arange(Wd), 10**6)
        right = np.minimum.accumulate(idx2[::-1])[::-1]
        pick = np.where((left >= 0) & ((np.arange(Wd) - left) <= (right - np.arange(Wd))), left, right)
        pick = np.where(pick >= 10**6, left, pick)
        out[y] = img[y][pick]
    return out

def pad(a):
    return np.pad(a, ((P, P), (P, P), (0, 0)), mode='edge')

def save(a, name, mode, q):
    Image.fromarray(a.astype('uint8'), mode).save(OUT + name, 'WEBP', quality=q, alpha_quality=100, method=6)

# --- sky: remove city, then clouds are baked (static) ---
sky_mask = morph(M, 9)
sky = inpaint_rows(A.copy(), sky_mask)[:W]
save(pad(sky), 'sky.webp', 'RGB', 88)

# --- city ---
rgb = inpaint_rows(A.copy(), boat)[Y0:W + EXT]
alpha = np.zeros((H, Wd), np.uint8)
alpha[M] = 255
alpha[W:W + EXT] = 255
city = np.dstack([rgb, alpha[Y0:W + EXT]])
save(pad(city), 'city.webp', 'RGBA', 88)

# --- water (+ sails) ---
wy0 = 1500
alpha = np.zeros((H, Wd), np.uint8)
alpha[W:] = 255
alpha[boat] = 255
water = np.dstack([A, alpha])[wy0:]
save(pad(water), 'water.webp', 'RGBA', 88)
