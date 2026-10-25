# Werdegang: deine eigenen Notizen

Die Stationen stehen unter `entries` in `../windows/career.md`. Rolle, Organisation, Zeitraum und kurze fachliche Beschreibung bleiben dort. Das Feld `note` verknüpft eine persönliche Markdown-Datei:

```yaml
- heading: Founding Engineer
  subheading: House of AI Hamburg
  date: Aug. 2026–heute
  icon: career
  note: house-of-ai
```

Dein deutscher Text steht dann in `de/house-of-ai.md`, der englische in `en/house-of-ai.md`. Du kannst Absätze, Überschriften, Listen, Links, Bilder und Zitate verwenden. Die Notiz erscheint direkt unter der zugehörigen Station im Werdegang; sie erzeugt kein neues Fenster und kein Desktop-Icon.

Die Ausgangstexte enthalten nur Gedanken, die du bereits mitgeteilt hast. Weitere Fragen stehen als unsichtbare HTML-Kommentare in jeder Datei. Schreib darunter weiter oder ersetze den Text vollständig. Eine leere Datei oder eine Datei mit ausschließlich Kommentaren erzeugt keinen leeren Notizbereich auf der Website.

```md
---
---

Das beschäftigt mich an dieser Station gerade …

## Noch nicht ganz sortiert

- Eine Beobachtung.
- Ein Widerspruch, den ich noch nicht aufgelöst habe.

<!-- Diese Frage hilft mir beim Weiterschreiben, erscheint aber nicht auf der Website. -->
```

Mit `draft: true` zwischen den beiden `---` lässt sich eine Notiz ausblenden. Falls eine englische Datei fehlt, fällt die englische Ansicht auf die deutsche Notiz zurück. Vorhandene englische Texte werden nicht automatisch übersetzt; bitte beide Fassungen selbst weiterpflegen.

Eine neue Station benötigt einen Eintrag in den beiden `career.md`-Dateien und – wenn du persönliche Gedanken ergänzen möchtest – die beiden passenden Notizdateien. Der Dateiname bleibt stabil, auch wenn du später die Rollenbezeichnung änderst.

Die Herkunft der Fakten und historische Abweichungen sind in `../../../docs/career-sources.md` dokumentiert.
