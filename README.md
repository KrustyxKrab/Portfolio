# Silas’ Website

A personal website built with Astro. The retro interface is real HTML and CSS, surrounded by a Three.js computer on desktop. Below 1024px wide or 700px high, the interface fills the viewport. There is no dock.

## Where to put content

- New app / window, frontmatter, folders, hiding: `src/content/windows/_README.md`
- Copy-paste starting points (text, list, gallery, videos, links, folder): `src/content/windows/_templates/`
- English versions: `src/content/translations/en/_README.md`
- Photos: `public/photos/README.md`
- Desktop icons: `public/os-icons/README.md`

## Write content

**`src/content/windows/` is the app registry.** Add, edit or delete Markdown files here; desktop icons, the file menu, folder listings, window contents and static routes follow automatically. No JavaScript registry to maintain. The initial sections contain neutral empty states until you add your own copy. Legacy demo files are preserved with `draft: true` and never appear in the interface or generated app routes.

A new `src/content/windows/ueber-mich.md` only needs:

```md
---
title: Über mich
icon: about
order: 0
---

Your Markdown goes here.
```

This creates `/apps/ueber-mich/`, an icon and a menu entry. The window renders the title automatically; start your body with a paragraph or `## Heading`. Markdown supports headings, lists, quotes, links, images, tables and fenced code blocks, with the paper reader styling already applied.

### Stable URLs and folders

The filename becomes the URL slug: `mein-projekt.md` → `/apps/mein-projekt/`. Filenames are normalized to lowercase with hyphens. Nested source paths flatten into one slug (`projects/mein-projekt.md` → `/apps/projects-mein-projekt/`). To keep a URL stable while renaming or moving a file, set an explicit `slug`:

```md
---
title: My project
slug: my-project
parent: projects
icon: projects
description: A short summary for the folder listing.
order: 1
---

## The idea

Your write-up, images and links.
```

`parent` references the **public slug** of another file, not its title or source path. This article appears automatically inside the Projects window, with a link to `/apps/my-project/`. Child files do not clutter the desktop or file menu. Any file can contain child files, and nesting works to any depth. Source-folder placement is organizational; the `parent` field determines the interface hierarchy.

- Edit the Markdown body or frontmatter to change content.
- Delete a file to remove its route, icon and automatic folder link.
- Add `draft: true` to unpublish a file without deleting it. Drafts have no generated route.
- Deleting or drafting a parent hides its descendants until you restore the parent or change their `parent` fields. This prevents orphan links.
- Every file-menu entry also has a desktop icon. Set `nav: false` to remove a menu entry; set both `nav: false` and `deskIcon: false` to hide the file from the desktop while keeping its page published.
- Duplicate slugs and circular parent relationships stop the build with an actionable error.

`welcome.md` is the optional welcome window at `/`, with its own title/body. Its `items` become welcome buttons; remove those items to remove the buttons. The slug `welcome` is reserved for this root window. All other published files get `/apps/<slug>/` routes. Internal Markdown links such as `[My project](/apps/my-project/)` work as deep links; links in automatic folder listings also open the window in place.

### Available frontmatter

| Field | Default | Purpose |
| --- | --- | --- |
| `title` | Required | Window and reader title |
| `slug` | Filename | Stable lowercase URL using letters, numbers and hyphens |
| `parent` | None | Place this file inside another public slug |
| `description` | None | Reader introduction and folder-list summary |
| `date` | None | Publication date, e.g. `2026-10-24` |
| `icon` | `journal` | Icon name or public asset path |
| `order` | `100` | Sort order within the desktop/menu/folder |
| `draft` | `false` | Exclude from routes and navigation |
| `deskIcon` | Top-level files only | Show on desktop and mobile home |
| `nav` | Top-level files only | Show in the file menu |
| `desktopX`, `desktopY` | Automatic placement | Icon position as percentages, from `0` to `100` |
| `layout` | `text` | `text`, `list` or `gallery`; also determines empty-state illustration |
| `width`, `height` | `580`, `440` | Preferred desktop window size; phone layout stays fullscreen |
| `x`, `y` | `64`, `62` | Initial desktop window position |
| `items` | `[]` | Optional gallery/link items (below) |
| `entries` | `[]` | Optional compact timeline/list entries |

Built-in icons: `about`, `projects`, `folder`, `journal`, `photos`, `contact`, `ideas`, `links`, `videos`, `career`, `reading`. Use `icon: folder` for the tabbed paper folder; existing `journal` references select the same artwork. For a custom image, use a public path such as `icon: /my-icons/camera.webp`. Bare filenames such as `icon: document.svg` use `public/icons/`.

To move an icon, add `desktopX: 82` and `desktopY: 9` to its file. These position the icon’s top-left corner within the usable desktop area below the menu bar. Coordinates are clamped at the edges. Files without coordinates are automatically placed in distributed free slots. Mobile uses a grid in `order` sequence; desktop coordinates do not affect the phone layout.

Add images to `public/photos/` and reference them in Markdown with `![Description](/photos/my-photo.webp)`. The body can mix Markdown with a gallery in frontmatter:

```yaml
items:
  - label: A photo
    image: /photos/my-photo.webp
    note: Optional caption
  - label: Another file
    target: my-project
  - label: External link
    href: https://example.com
```

`target` references a published slug and gets a working deep link; references to deleted/draft files disappear automatically. Images open in the lightbox. YouTube URLs in `href` generate a thumbnail and open the video viewer. `entries` accepts `heading`, `subheading`, `date`, `detail`, and `body` for simple list/timeline rows. Both remain optional; regular Markdown and child files are sufficient for most content.

## Structure

- `src/pages/index.astro` and `src/pages/apps/[app].astro` render the same desktop with the relevant initial window.
- `src/lib/apps.ts` derives and validates the manifest from published Markdown.
- `src/content.config.ts` validates frontmatter.
- `src/components/Desktop.astro` composes the manifest and rendered Markdown.
- `src/components/Window.astro` supplies the window controls.
- `src/components/layouts/` and `src/styles/markdown.css` provide the reader, list and gallery layouts.
- `public/os-icons/` and `public/wallpapers/` contain interface assets.
- `docs/vision/` holds visual references and prompts.
- `/pixel-studio/` remains a separate tool; it is no longer listed as a project.

## 3D model

The desktop computer is the full Macintosh assembly (65 source meshes, 3,393,356-byte GLB); its intro moves from the full kit to the display, with a subtle camera orbit. See [model notes](docs/model-notes.md) for details.

## Development

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev -- --background
```

Manage the background server with `npm run astro -- dev status`, `npm run astro -- dev logs`, and `npm run astro -- dev stop`.

```sh
npm run build
npm run test:ui
```

UI checks use `http://localhost:4321`. Override with `UI_TEST_URL=http://localhost:4323 npm run test:ui`. If Chromium is missing, install it with `npx playwright install chromium`.

## Translate content

German is the default (`/`); English lives under `/en/`. UI strings are in `src/lib/i18n.ts`.

To translate a page, add a file with the same name in `src/content/translations/en/` (e.g. `about.md`). It only needs the fields that differ; missing frontmatter fields (icon, position, order, parent, slug, ...) and an empty body inherit from the German file in `src/content/windows/`. Slugs and `parent` always come from the German file, so URLs match (`/apps/about/` and `/en/apps/about/`). Set `draft: true` in the English file to hide a page in English only. Each page shows only one language; visitors in Germany (by timezone) land on German, everyone else on English, and the `DE`/`EN` switch in the menubar remembers the choice.

```md
---
title: About me
---

English text.
```
