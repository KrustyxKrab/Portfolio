---
name: icon-restyle
description: Convert a legacy PNG desktop icon in public/icons/ into a modern Apple "Liquid Glass" SVG in the site's shared icon style, wired into the content collection.
---

# icon-restyle

Convert a legacy PNG desktop icon into an Apple **Liquid Glass** icon matching
`public/icons/about.svg` (the reference).

## Architecture: the icon's own FACES are the glass

No generic tile/slab/button box around the icon. The icon is a little **3D object
built out of glass panes** — each FACE is its own real `backdrop-filter` surface
that refracts the wallpaper, and the primary panes carry the crisp shadcn/21st.dev
**"LiquidButton"** bevel. Two layers per icon:

1. **Glass faces — CSS, behind.** For each face the SVG flags `data-glass`,
   `Icon.astro` renders an absolutely-positioned `<div class="glass-face">` behind
   the glyph. The SVG element **type** picks the treatment:
   - **`<rect>` / `<circle>` = PRIMARY pane** → a positioned `border-radius` div,
     so it gets the full LiquidButton look: inset-bevel specular rim + a `::before`
     sheet + its own outer drop shadow. (This is the "perfect glass" a flat
     silhouette clip can't have — `box-shadow` needs an un-clipped box.)
   - **`<path>` = DEPTH pane** → a `clip-path` div (top/side extrusions). A bevel
     `box-shadow` can't follow a `clip-path`, so the SVG paints its edge instead.
2. **Glyph — the SVG, on top.** Your job. Paints only what rides ON the glass:
   faint depth-plane tints, ridge highlights, the screen, slots/vents, the LED,
   the badge tint + info glyph, and rim strokes on the depth edges. The **front
   pane is left unpainted** so its glass + specular show through.

`Icon.astro` inlines each `.svg` (scopes its `id`s), reads the `data-glass`
faces, and wraps everything in `<span class="icon-glass"><span class="glass-faces">
…panes…</span><span class="glass-glyph">…svg…</span></span>`. PNG icons stay
`<img>` in a flat `.icon-tile`.

**To add a glass icon:** (a) draw the glyph SVG with its `data-glass` faces; (b)
set `icon: NAME.svg` in the matching `src/content/windows/*.md`. Panes, bevel,
lens, hover and shadow follow. No CSS change. An SVG with no `data-glass` faces
renders as a flat glyph (graceful fallback).

## Gotchas that shape the design (know these)

- **`box-shadow` does NOT follow `clip-path`.** So the bevel only works on
  un-clipped `border-radius` boxes → primary panes are `<rect>`/`<circle>`; the
  angled depth panes are `<path>` and get their edge from an SVG rim stroke.
- **A CSS `filter` on an ANCESTOR isolates the backdrop** and kills every
  descendant `backdrop-filter`. So the wrapper carries NO filter; the primary
  panes cast the real drop shadow (their own `box-shadow`), and the glyph gets
  only a whisper `drop-shadow` (harmless — the glyph has no backdrop-filter).
- **`transform` on the wrapper is safe** — an ancestor `transform: scale()`
  (hover) does NOT break child `backdrop-filter` (verified). Hover scales the
  wrapper; the glass survives.
- **One coordinate space, one scale.** Faces are authored in the SVG's 128
  viewBox units inside `.glass-faces` (a 128x128 layer scaled by a single CSS var
  `--s`); the wrapper and glyph size from the SAME `--s`. So panes, glyph and clip
  paths stay aligned at every size (desktop 64 → `--s:0.5`, mobile 48 →
  `--s:0.375`) with no per-shape rescaling.

## Golden rule: keep the original architecture

**Modernize the material, not the object.** Stay close to the source PNG's
silhouette, proportions, viewing angle, accents. Slim front-on tower stays a slim
front-on tower — never a fat isometric cube. Replace only *dated* elements (a
Finder face → a glass info/logo badge). Silhouette in, silhouette out.

## Glyph SVG spec (what you draw)

`viewBox="0 0 128 128"`, small inset margin.

### 1. Declare the glass FACES — `data-glass`, in `<defs>`

Put them in `<defs>` (never painted) in **back-to-front order**: depth panes
first, primary panes last. Authored in 128 viewBox units.
```xml
<path   data-glass d="M 87.07 18.93 L 99.07 9.93 … L 90 98 L 90 26 … Z"/> <!-- side (FULL height) -->
<path   data-glass d="M 34 18 A 10 10 0 0 1 40 16 … Z"/>       <!-- top depth  -->
<rect   data-glass x="30" y="16" width="60" height="92" rx="10"/> <!-- FRONT (beveled) -->
<circle data-glass cx="34" cy="96" r="16"/>                    <!-- badge (beveled) -->
```
Choose `<rect>`/`<circle>` for the panes you want the crisp bevel on (they must
be axis-aligned rounded rects / circles); use `<path>` for angled depth panes.

### 2. Tangent extrusion (gap-free depth)

Extrude the rounded-rect front face along a small vector; connectors run parallel
to it so they meet the corner arcs tangentially (no gaps).
- Front face `x=30 y=16 w=60 h=92 rx=10`; arc centers TL`(40,26)` TR`(80,26)`.
- Vector `d=(12,-9)` (3-4-5), unit `(0.8,-0.6)`; back centers = front `+ d`.
- The shipped depth panes tile the extrusion with the ridge `(87.07,18.93)→
  (99.07,9.93)` as the shared edge, and the **side runs the FULL height** down to
  the bottom connector `(98,97)→(86,106)` (no missing wedge at the bottom-right):
  - **side** `M 87.07 18.93 L 99.07 9.93 A 10 10 0 0 1 102 17 L 102 89 A 10 10 0 0 1 98 97 L 86 106 A 10 10 0 0 0 90 98 L 90 26 A 10 10 0 0 0 87.07 18.93 Z`
  - **top** `M 34 18 A 10 10 0 0 1 40 16 L 80 16 A 10 10 0 0 1 87.07 18.93 L 99.07 9.93 A 10 10 0 0 0 92 7 L 52 7 A 10 10 0 0 0 46 9 Z`
    (shares the front top arcs → gapless).
- **Concentric radii:** every inset `inner = outer − inset`.

### 3. What the glyph paints (NOT the front pane)

```
DEPTH-PANE BEVEL PARITY (top + side) — match the front pane's glass, per pane:
  1. faint plane tint:   fill sideBody @~0.4 (darker) / topBody @~0.42 (lighter)
  2. specular sheet:     fill url(#spec)  (= the CSS ::before analogue, top-left white)
  3. dual-rim bevel:     stroke the pane outline with url(#rimLight) THEN url(#rimDark),
                         ~1.6px — same visual weight as the front's inset bevel, so
                         the folds where faces meet read as continuous beveled glass
screen (on front):  frosted recess -> vivid blue-cyan glass(~0.94) -> top gloss -> inner border
accents (on front): floppy slot + vents, semi-transparent (etched into the glass); pulsing LED
badge (on its pane): ONLY a faint badgeTint @~0.34 (so it reads blue) + the crisp white "i"
```
Leave the **front pane AND the badge pane free of painted specular** — no white
highlight ellipses/dots. Their bevel + specular come only from the CSS
(`box-shadow` bevel + `::before` sheet), so the two beveled panes match; painted
blobs would fight the CSS specular. The front pane also gets no body fill (its
glass shows). Screen/slot/vents draw on the front glass. No frost/blue washes, no
in-SVG refraction filter, no floor shadow (primary panes' `box-shadow` grounds it).

**Palette / `<defs>`:** `topBody` `#dce5f7→#f8fbff` · `sideBody` `#93a1c7→#6d7c9a`
· `screen` `#7cc4ff→#2f66e6→#78e4ff` · `badgeTint` `#a9d4ff→#3d6fe8` · `spec`
white `0.32→0.07→0` (top-left diagonal — depth-pane specular) · `rimLight` white
`0.95→0.14→0` (top-left) · `rimDark` `#2b3a68` `0.45→0` (bottom-right).
**No `<filter>` elements in the SVG.**

### 4. Animation — SMIL, LED pulse only

```xml
<circle cx="52" cy="98" r="2.2" fill="#8fe0ff">
  <animate attributeName="opacity" values="0.35;1;0.35" dur="2.4s" repeatCount="indefinite"/>
</circle>
```
Keep only the LED pulse — the icon's hover/active/scale live in CSS; drop sheen
sweeps / bobs that would fight them.

## The shared glass layer (reference — do NOT re-implement per icon)

`Icon.astro` maps each `data-glass` element → a pane div (128-space, no rescale):
```
<rect>   -> <span class="glass-face glass-beveled" style="left:x;top:y;width:w;height:h;border-radius:rx">
<circle> -> <span class="glass-face glass-beveled" style="left:cx-r;top:cy-r;width:2r;height:2r;border-radius:50%">
<path>   -> <span class="glass-face glass-depth"    style="clip-path:path('d')">
```
`src/styles/global.css` (once):
```css
.icon-glass{ --s:.5;                                   /* 64/128; mobile overrides .375 */
  position:relative;display:inline-flex;
  width:calc(128px*var(--s));height:calc(128px*var(--s));transition:transform 200ms ease;}
.glass-faces{position:absolute;top:0;left:0;width:128px;height:128px;
  transform:scale(var(--s));transform-origin:top left;}          /* the shared scaler */
.glass-face{position:absolute;background:rgba(255,255,255,.08);   /* Safari-safe: NO url() */
  -webkit-backdrop-filter:blur(3px) saturate(1.8);backdrop-filter:blur(3px) saturate(1.8);}
@supports (backdrop-filter:url("#liquid-lens")) or (-webkit-backdrop-filter:url("#liquid-lens")){
  .glass-face{                                          /* Chromium lens, layered ON TOP */
    -webkit-backdrop-filter:blur(2px) saturate(1.8) url("#liquid-lens");
    backdrop-filter:blur(2px) saturate(1.8) url("#liquid-lens");}}
.glass-depth{top:0;left:0;width:128px;height:128px;}
.glass-beveled{                                          /* LiquidButton bevel, 128-space */
  box-shadow:
    inset 4px 2px 0 -2px rgba(255,255,255,.95),          /* bright specular rim  */
    inset -3px -2px 0 -2px rgba(255,255,255,.85),
    inset -4px -12px 2px -10px rgba(255,255,255,.6),
    inset -2px 4px 6px -2px rgba(0,0,0,.22),             /* inner recede         */
    inset 0 -8px 2px -4px rgba(0,0,0,.12),
    0 6px 12px -1px rgba(0,0,0,.22);}                    /* the pane's drop shadow */
.glass-beveled::before{content:'';position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(135deg,rgba(255,255,255,.3) 0%,rgba(255,255,255,.07) 34%,rgba(255,255,255,0) 55%);}
.glass-glyph{position:relative;z-index:1;display:block;width:100%;height:100%;}
.glass-glyph svg{display:block;width:100%;height:100%;
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.22));}         /* whisper only; NOT on .icon-glass */
.icon:hover .icon-glass{transform:scale(1.04)}           /* wrapper transform is glass-safe */
.icon:active .icon-glass{transform:scale(.97)}
@media(prefers-reduced-motion:reduce){.icon-glass{transition:none}
  .icon:hover .icon-glass,.icon:active .icon-glass{transform:none}}
@media(max-width:768px){ .icon .icon-glass{ --s:.375 } } /* 48/128 — resizes everything */
```
Shared lens filter, declared ONCE in `Desktop.astro` (`<svg class="glass-defs">`):
```xml
<filter id="liquid-lens" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="turbulence" baseFrequency="0.012 0.012" numOctaves="1" seed="3" result="t"/>
  <feGaussianBlur in="t" stdDeviation="2" result="b"/>
  <feDisplacementMap in="SourceGraphic" in2="b" scale="14" xChannelSelector="R" yChannelSelector="G"/>
</filter>
```
`scale` tuning (over a striped stress-background): **12–14 = clean glass ripple**;
18 shows turbulence swirl; 30 melts. Over the near-uniform wallpaper the lens is
subtle — the bevel + specular + saturate carry the glass; the lens reads mainly
where an icon overlaps a window/texture.

**Wallpaper.** `backdrop-filter` needs texture behind it. `.desktop` carries a few
barely-perceptible large-scale radial washes over `var(--wallpaper)` — keep subtle.

**Safari.** The base declaration (plain `blur+saturate`, no `url()`) always
applies; the `url(#liquid-lens)` lens is added only inside `@supports`, so if
Safari can't do a `url()` backdrop-filter it keeps a clean blurred glass. Verify
in Safari when possible.

## Verification (mandatory — real browser, not qlmanage)

`qlmanage`/`<img>` show only the bare glyph; the glass needs a real browser.
1. `astro dev --background` (manage via `astro dev status` / `logs`).
2. Screenshot with headless Chromium (renders `backdrop-filter` + SVG lens):
   `chrome-headless-shell --headless --force-device-scale-factor=2 \
    --window-size=1280,800 --virtual-time-budget=2000 --screenshot=out.png http://localhost:4321/`
   (binary under `~/Library/Caches/ms-playwright/chromium_headless_shell-*/`), or
   the `claude-in-chrome` MCP if a browser extension is connected.
3. Crop the icon (`sips -c H W --cropOffset Y X f.png`) and LOOK: is it a 3D glass
   object (front pane glass with a bright specular bevel, top/side depth panes,
   crisp screen, badge as its own beveled glass) — NOT a flat box and NOT a washed
   silhouette blob? Legible at 64px? Iterate.
4. Tuning harness: a throwaway HTML with `.glass-face` divs over a striped
   background isolates lens `scale` / hover. NOTE `file://` pages can't `fetch()`
   the dev server (CORS) — INLINE the markup, don't fetch it.
5. `npx astro build` must pass.

## Checklist

- [ ] Silhouette, proportions, viewing angle & accents echo the PNG
- [ ] `data-glass` faces in `<defs>`, back-to-front; `<rect>`/`<circle>` for
      beveled primary panes, `<path>` for angled depth panes
- [ ] Front pane AND badge pane free of painted specular blobs (bevel/specular
      from CSS only); front pane also gets no body fill
- [ ] Depth panes at parity: faint tint + `url(#spec)` sheet + dual-rim
      (rimLight+rimDark) at the front's bevel weight; side pane runs FULL height
      (no missing bottom-right wedge)
- [ ] Depth via tangent extrusion (shared arcs, no gaps); concentric radii
- [ ] NO baked glass in the SVG: no `<filter>`, no frost/tint washes, no floor shadow
- [ ] SMIL LED pulse only
- [ ] Verified in a REAL browser: reads as a 3D glass object, crisp bevel on the
      front + badge panes; legible at 64px
- [ ] `icon:` in `src/content/windows/*.md` switched .png → .svg; old PNG left
