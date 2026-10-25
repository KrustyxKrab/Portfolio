# Photos

Put images here; they are served from `/photos/<file>`. (Current files are SVG placeholders.)

- Format: `.webp` (preferred) or `.jpg`. Rough size: 1600 px on the long edge, ideally < 400 KB each.
  Use lowercase, hyphenated names without spaces: `strand-sommer-2026.webp`.
- Gallery tile (in a window file's frontmatter):

```yaml
items:
  - label: Strand am Abend     # caption and lightbox alt text
    image: /photos/strand-sommer-2026.webp
    note: Sommer 2026          # optional
```

- In Markdown bodies: `![Beschreibung des Bildes](/photos/strand-sommer-2026.webp)`.
- Alt text: in galleries the `label` is the lightbox alt text (grid thumbnails are decorative); in Markdown the text in `[...]` is the alt text, so describe the image.
- `image: name.svg` (no slash) would be looked up in `public/icons/`; always use the full `/photos/...` path.
- Click on a tile opens the image in a lightbox.
