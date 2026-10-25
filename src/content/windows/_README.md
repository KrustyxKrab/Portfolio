# Creating apps / windows (`src/content/windows/`)

One `.md` file = one app (desktop icon + menu entry + window + route).
Filename → URL slug: `mein-projekt.md` → `/apps/mein-projekt/` (EN: `/en/apps/mein-projekt/`).
This file is named `_README.md` on purpose: the loader ignores `_`-prefixed files and folders
(a plain `README.md` would be loaded and fail the schema). Same for `_templates/`.

**Quick start:** copy a file from `_templates/`, drop it one level up, rename it, remove `draft: true`.

**Current V1 editing map:** `docs/content-v1.md`. Project pages live in `projects/`, idea notes in `ideas/`, and the interface note in `about/`. Their explicit `slug` fields keep the public URLs short and stable.

## Frontmatter (only `title` is required)

| Field | Default | Notes |
| --- | --- | --- |
| `title` | required | Window title |
| `slug` | filename | Stable URL; lowercase, digits, hyphens |
| `description` | – | Intro under the title; also folder-list summary |
| `date` | – | e.g. `2026-10-24` |
| `parent` | – | Slug of another file → appears inside that window |
| `icon` | `journal` | Name (`about` → `/os-icons/about.webp`), file with dot (`x.svg` → `/icons/x.svg`), or path starting `/` |
| `layout` | `text` | `text` / `list` / `gallery`; only changes the empty-state art (folder look when not `text`) |
| `order` | `100` | Sort order (menu, folders) |
| `draft` | `false` | `true` = no route, no icon |
| `nav` | top-level: true | Show in File menu |
| `deskIcon` | top-level: true | Show on desktop |
| `desktopX`, `desktopY` | auto slot | Icon position in % (0-100) |
| `width`, `height` | 580 x 440 | Window size (280-1200 / 200-1000) |
| `x`, `y` | 64, 62 | Initial window position |
| `entries` | `[]` | Timeline rows: `heading`, `subheading`, `date` (text; quote plain years: `"2022"`), `detail`, `body`, optional `icon` and `href` |
| `items` | `[]` | Tiles: `label`, `href`, `image`, `note`, `target` (slug of another app) |

Body (Markdown) renders first, then `entries`, then `items`, then child apps. All can be mixed.
Files with a `parent` get no desktop icon or menu entry by default.

## Placing the desktop icon
`desktopX: 67` / `desktopY: 18` = percent of the screen (top-left of the icon, below the menu bar).
The wallpaper's sky is the top area: keep **`desktopY` <= ~40**, otherwise icons sit over the skyline.
Existing ones use x 5-89, y 7-41; keep ~10 points apart in x or ~19 in y.
Without coordinates a free slot is chosen automatically.

## Folders (sub-pages)
Create the folder file (e.g. `projekte.md`) and children with `parent: projekte`.
Children show as cards (icon + title + `description`) inside the folder. Draft/delete the parent and children vanish too.
Template: `_templates/folder-with-subpage.md`.

## Hide / deactivate
`draft: true` hides a file everywhere; remove it to bring it back. Currently deactivated this way:
**Leseliste** (`reading.md`), **Journal** (`blog.md`), **Videos** (`videos.md`), plus demo files (education, project-*, ...).
`nav: false` / `deskIcon: false` hide only the menu / desktop icon but keep the page.

## Content types

| Type | What to do | Template |
| --- | --- | --- |
| Text page | Markdown body only | `_templates/text.md` |
| List / timeline | `entries:` | `_templates/list.md` |
| Photo gallery | `items:` with `image` (click = lightbox) | `_templates/gallery.md` |
| YouTube videos | `items:` with a YouTube `href` (auto thumbnail, plays in viewer) | `_templates/videos.md` |
| Links | `items:` with `href` (external = new tab) or `target` | `_templates/links.md` |
| Folder + sub-page | `parent` on child files | `_templates/folder-with-subpage.md`, `_templates/folder-subpage.md` |

Images: `public/photos/README.md`. Icons: `public/os-icons/README.md`.
English: `src/content/translations/en/_README.md`.
