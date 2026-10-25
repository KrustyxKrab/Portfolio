# Icon refinements — 25 October 2026

Five existing bitmap icons were regenerated with the built-in image-generation tool. The approved mini Mac (`about.webp`) and cream suitcase (`projects.webp`) were used only as style references; their production files are unchanged, verified against the copies in `before/`.

| Production file | Revised object |
| --- | --- |
| `public/os-icons/journal.webp` | Recognizable tabbed manila file folder, replacing the notebook-like shape |
| `public/os-icons/photos.webp` | Silver/black vintage film SLR with a round lens and prism housing |
| `public/os-icons/contact.webp` | Front/address side of a cream envelope, with an upper-right stamp and simple address strokes; fold seams remain on the unseen reverse |
| `public/os-icons/ideas.webp` | A compact stack of yellow sticky notes |
| `public/os-icons/career.webp` | An open brown leather bag with papers emerging from its top opening |

All files retain their existing URLs and are shared by desktop, mobile and both languages. This change does not alter which apps are published or their positions.

Historical/structural references:

- [1984 Macintosh Selling Guide, Computer History Museum](https://s3data.computerhistory.org/brochures/apple.macintosh.1984.102646178.pdf): familiar tabbed folder silhouette.
- [Smithsonian Institution Archives: Setting Up Paper Files](https://siarchives.si.edu/what-we-do/setting-paper-files): physical manila folder construction, tabs and lower folds. This is structural guidance, not an assertion that the generated folder reproduces a particular historical artifact.
- [Canon Camera Museum: AE-1](https://global.canon/en/c-museum/product/film93.html): 1976 silver/black 35mm SLR proportions and lens/prism arrangement; the icon has no Canon wordmark.

`prompts.json` contains the initial prompt set and reference roles. `contact-address-prompt.json` records the subsequent correction: postage belongs on the address side, not on the reverse with fold seams. `generated/` holds the five current transparent PNG masters; the earlier envelope is retained as `contact-seams-superseded.png`. `before/` preserves replaced assets and the two approved style references. `review.png` is a presentation sheet of the actual production exports.

To reproduce the production WebP files:

```sh
node scripts/prepare-icon-refinements.mjs docs/vision/assets/icon-refinement-2026-10-25/generated
```

Append an icon name (for example `contact`) to regenerate only that asset.

The script checks alpha transparency, trims surrounding transparent padding at alpha threshold8, fits each subject inside152px using nearest-neighbor resizing, and centers it on a transparent192px canvas. WebP encoding is lossless. `processing-report.json` records source bounds, dimensions and output bytes.

If rebuilding assets from the older six-icon atlas with `scripts/prepare-site-assets.mjs`, run this refinement step afterwards; the original atlas contains the superseded icons.
