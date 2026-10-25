# Desktop icons

Use an icon by name: `icon: mein-icon` in a window file loads `/os-icons/mein-icon.webp`.
(`icon: foo.svg` loads `public/icons/foo.svg`; `icon: /any/path.webp` uses that public path.)

Existing: about, career, contact, ideas, folder, journal, links, photos, projects, reading, videos.

`folder` selects the revised tabbed paper folder (`journal` remains an alias for existing content).
The revised camera, envelope, sticky-note stack and open career bag use `photos`, `contact`, `ideas` and `career`.
The launcher and folder cards share `src/lib/icons.ts`; its revision query makes browsers load the updated artwork.

To add one:
1. Create a **192 x 192 px transparent WebP** (square, subject centered with a little margin).
2. Keep the existing style: pixel-art look, same palette, outline and lighting as the current icons. Open a few of them as reference.
3. Save as lowercase `name.webp` here (e.g. `public/os-icons/kamera.webp`).
4. Reference it: `icon: kamera`.

The same icon is also used on folder cards (shown at 48 px), so keep the shape readable when small.
