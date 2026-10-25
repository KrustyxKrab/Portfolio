# Content V1 — selbst weiterschreiben

Die Website verwendet jetzt kurze Ausgangstexte und einzelne Markdown-Dateien. Der ältere lange Entwurf in `docs/content-draft-de.md` ist ein überholter Arbeitsstand. Maßgeblich sind die Dateien unter `src/content/windows/`.

## Direkt bearbeiten

| Bereich | Datei |
| --- | --- |
| Startfenster | `src/content/windows/welcome.md` |
| Über mich | `src/content/windows/about.md` |
| Interface & Medium | `src/content/windows/about/interface.md` |
| Projektübersicht | `src/content/windows/projects.md` |
| Einzelne Projekte | `src/content/windows/projects/*.md` |
| Werdegang | `src/content/windows/career.md` |
| Persönliche Notizen je Station | `src/content/career/de/*.md` |
| Kontakt | `src/content/windows/contact.md` |
| Fotos | `src/content/windows/photos.md` — aktuell leer |
| Links | `src/content/windows/links.md` |
| Ideenübersicht | `src/content/windows/ideas.md` |
| Einzelne Ideen | `src/content/windows/ideas/*.md` |

## Angelegte Projektseiten

- `projects/inplicit.md` → `/apps/inplicit/`
- `projects/ignite.md` → `/apps/ignite/`
- `projects/house-of-ai.md` → `/apps/house-of-ai/`
- `projects/documentaries.md` → `/apps/documentaries/`
- `projects/pullit.md` → `/apps/pullit/`
- `projects/pakets-in-the-air.md` → `/apps/pakets-in-the-air/`
- `projects/anamorphic-videography.md` → `/apps/anamorphic-videography/`
- `projects/wdt-tool.md` → `/apps/wdt-tool/`

## Angelegte Ideen

- `ideas/dream-horizon.md` → `/apps/dream-horizon/`
- `ideas/semantic-context.md` → `/apps/semantic-context/`
- `ideas/memory-and-context.md` → `/apps/memory-and-context/`
- `ideas/ai-and-education.md` → `/apps/ai-and-education/`
- `ideas/ai-and-society.md` → `/apps/ai-and-society/`
- `ideas/homelab.md` → `/apps/homelab/`
- `ideas/where-next.md` → `/apps/where-next/`

## Wie die Struktur funktioniert

Jede Seite hat einen stabilen `slug`. `parent: projects`, `parent: ideas` oder `parent: about` verknüpft sie mit ihrem übergeordneten Fenster. Unterseiten erscheinen dort automatisch als Karten. Sie erzeugen keine zusätzlichen Desktop-Icons. Ordner auf der Festplatte dienen der Übersicht; entscheidend für die Zuordnung ist `parent`.

Unter dem zweiten `---` steht dein Text. Markdown unterstützt Absätze, Überschriften, Listen, Links, Bilder und Code. Die vorhandenen HTML-Kommentare `<!-- ... -->` sind Schreibhinweise, die nicht als sichtbarer Text dargestellt werden.

Ein neues Projekt kann so anfangen:

```md
---
title: Mein Projekt
slug: mein-projekt
parent: projects
icon: folder
description: Ein präziser Satz über die Arbeit.
order: 20
---

Hier beginnt mein Text.
```

`draft: true` blendet eine Seite aus. Löschen entfernt auch Route und automatische Karte. `order` ordnet die Karten innerhalb des Fensters. Die vorhandenen Templates liegen unter `src/content/windows/_templates/`.

## Werdegang pflegen

Die Einträge stehen im Frontmatter von `career.md` unter `entries`:

```yaml
entries:
  - heading: Rollenbezeichnung
    subheading: Organisation
    date: Zeitraum
    icon: career
    detail: Kurze Beschreibung.
    href: https://example.org
    note: meine-station
```

Das Layout setzt links ein größeres Pixel-Icon und rechts Rolle, Organisation, Zeitraum und Beschreibung. Feine Linien trennen die Stationen. Die persönliche Notiz folgt darunter und darf ausführlich, unfertig und widersprüchlich sein.

Mit `note: meine-station` verknüpfst du `src/content/career/de/meine-station.md` und `src/content/career/en/meine-station.md`. Jede der 18 vorhandenen Stationen hat bereits beide Dateien. Dort kannst du normales Markdown schreiben. Reine Schreibfragen in HTML-Kommentaren, leere Dateien und `draft: true` erzeugen keinen sichtbaren Notizbereich. Die vollständige Anleitung steht in `src/content/career/README.md`.

Der Werdegang umfasst die fünf Berufsstationen, vier Ausbildungsstationen, sechs Ehrenämter, das Stipendium und die Publikation aus dem wiedergefundenen eigenen LinkedIn-Profil, ergänzt um inplicit.ai. Quellenstand und historische Änderungen sind in `docs/career-sources.md` dokumentiert.

## Englisch und Medien

Englische Fassungen liegen mit derselben Ordnerstruktur unter `src/content/translations/en/`. Die V1 enthält kurze englische Gegenstücke. Änderungen am deutschen Text anschließend dort übertragen; die vorhandene englische Fassung wird nicht automatisch neu übersetzt.

Fotos können später in `public/photos/` liegen. Projektmedien können in `public/projects/<slug>/` abgelegt und mit `![Beschreibung](/projects/<slug>/bild.webp)` eingebunden werden. Die Galerie unter Fotos bleibt bis zu deiner Auswahl leer.

Der bestätigte YouTube-Kanal `https://www.youtube.com/@silaskruckenberg` ist unter Links ergänzt. LinkedIn-Daten konnten aus den eigenen lokal gespeicherten Profilansichten rekonstruiert werden; der Startmonat bei inplicit.ai bleibt bis zu deiner Angabe offen.
