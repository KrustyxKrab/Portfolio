---
# List / timeline (CV, reading list...). Copy to ../mein-cv.md and delete "draft: true".
title: Meine Liste
icon: career
layout: list                # pixel icons, text and hairlines; rows come from "entries"
order: 20
draft: true
desktopX: 30
desktopY: 24
entries:
  - heading: Titel der Zeile      # required
    subheading: Ort / Firma       # optional
    date: 2024 - heute            # optional, free text
    icon: career                 # optional; uses the shared icon family
    detail: Kurze Beschreibung.   # optional
    href: https://example.org     # optional; makes the heading a link
    note: meine-station           # optional; src/content/career/de/meine-station.md
  - heading: Weitere Station
    date: "2022"                  # quote pure numbers: date must be a string
    body: Zusätzlicher sichtbarer Absatz (nur Klartext, kein Markdown).
---

Optionaler Markdown-Text über der Liste.
