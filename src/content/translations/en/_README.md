# English translations

German is the default. To translate a page, create a file in this folder with the **same filename**
as the German one in `src/content/windows/` (`about.md` -> `about.md`). The loader ignores `_`-prefixed
files, which is why this guide is `_README.md`.

- Only write the fields you want to change; everything else (icon, position, order, items, ...) inherits from German.
- `slug` and `parent` always come from the German file, so URLs match (`/apps/about/` and `/en/apps/about/`).
- Empty body = the German body is shown. Write a body to replace it.
- `draft: true` in the English file hides the page in English only.
- `items` / `entries` are replaced as a whole if present (no per-row merge), so copy all rows when translating.
- No German file (or it is a draft) = no English page.

Example `about.md`:

```md
---
title: About me
description: A short intro.
---

English text.
```
