# Elbatelier

Browser: `/pixel-studio`. Start with `npm run dev -- --background`.

Generate a native-resolution image and editable project without browser automation:

```sh
node scripts/pixel-art.mjs --width 2560 --height 768 --out /tmp/hamburg
node scripts/pixel-art.mjs --input /tmp/hamburg.pixel.json --out /tmp/final
```

Raster limits: 64–4096 × 32–2048 pixels. Native resolution is separate from viewing zoom. PNG export does not upscale. No image generation, image tracing, antialiasing or external services are used.

`public/pixel-studio/engine.js` exports `hamburg`, `painter`, `layer`, `composite`, `serialize`, `deserialize`. Each layer holds one palette index per pixel (`Uint8Array`); index 0 is transparent. Use `painter(layer.pixels,width,height)` to draw with `dot(x,y,colorIndex)`, `line(x1,y1,x2,y2,colorIndex)`, `rect(x,y,width,height,colorIndex)`, `ellipse(x,y,rx,ry,colorIndex)` or `poly([[x,y],...],colorIndex)`. All shapes rasterize directly to integer pixels.

The scene is a stylized composition, not a geographically precise view. Silhouettes adapt to the chosen canvas size; increasing resolution provides more editable pixels but does not automatically add architectural complexity. Fine textures are drawn at native resolution. For a polished large-format artwork, add deliberate detail to each building in the generator or to the saved layer pixels.

The browser stores no project automatically: download JSON to preserve your changes. PNG contains the visible layers; JSON contains all layers. Undo/redo covers brush strokes; visibility switches are stored in the project. Stroke history is limited to 40 entries / approximately 32 MB (one large stroke may exceed this). Maximum JSON import size: 150 MB.
