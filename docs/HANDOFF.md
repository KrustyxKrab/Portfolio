# Übergabe — Silas Website

Stand: 24.10.2026. Die Arbeit wurde auf Wunsch des Nutzers für diese Übergabe angehalten. **Die jüngsten Anforderungen sind noch nicht fertig umgesetzt.** Alle Agenten haben ihre aktuellen Schreibvorgänge beendet; keine Tests laufen mehr.

## Auftrag und bestätigte Richtung

Persönliche Astro-Website für Kunden, Community und Interessierte an Silas’ Arbeit und Person. Desktop: echter dreidimensionaler Vintage-Computer mit bedienbarem HTML-Bildschirm. Mobile: bildschirmfüllende Retro-Oberfläche mit denselben Pixel-Icons, ohne Gerätegehäuse. Kein Dock. Detailliertes Hamburg-Pixelpanorama mit warmem Abendlicht; Hamburg beibehalten, keine San-Francisco-Architektur aus der letzten Farbreferenz übernehmen.

Silas schreibt die persönlichen Inhalte selbst. Keine Biografie, Projekte oder Kontaktangaben erfinden. Neutrale leere Inhaltsbereiche sind gewollt. KISS, sauberes Astro, möglichst wenig Laufzeit-JavaScript. Kleine Lese-/Schreibarbeiten ausdrücklich an leichtere Modelle delegieren; komplexe Kamera-/Rendering-Arbeit beim Hauptagenten behalten.

Die frühere Forderung, Apple-Branding zu entfernen, wurde ausdrücklich ersetzt: Für den Entwurf sollen wieder das Apple-Logo und die bunten Streifen verwendet werden. Rechtliche Klärung erfolgt später. Nicht erneut ungefragt entfernen oder Freigaben verlangen. Keine rechtliche Unbedenklichkeit versprechen. Kein Deployment beauftragt.

## Neueste offene Anforderungen — zuerst bearbeiten

Die folgenden Wünsche kamen **nach** der letzten funktionierenden Modellansicht:

1. Den bisherigen Mac-Fallback vollständig entfernen. Statt des statischen Ersatzgehäuses eine schöne Ladeansicht zeigen, solange das echte Modell lädt. Der bisherige Fallback ist CSS-Geometrie, kein Rasterbild; auch er soll weg. Für einen echten Lade-/WebGL-Fehler eine verständliche, bedienbare Lösung vorsehen, ohne wieder einen Ersatz-Mac zu zeichnen.
2. Eine jederzeit gut erreichbare, schnelle Umschaltung zwischen Gesamtansicht und Bildschirmansicht hinzufügen. Der aktuelle Menüpunkt innerhalb des winzigen Bildschirms ist in der Gesamtansicht ungeeignet. Besonders dort braucht es einen deutlich erreichbaren Zurück-zum-Bildschirm-Button **außerhalb** der perspektivisch verkleinerten Oberfläche.
3. Zwischen beiden Ansichten **weich animieren**. Der aktuelle `toggleOverview()` springt sofort. Auch schnelles erneutes Umschalten muss sauber vom aktuellen Kamerazustand weiterlaufen. `prefers-reduced-motion` beachten.
4. Gesamtkamera nachjustieren: weniger seitlicher/rotationaler Versatz, näher und etwas tiefer als im aktuellen Screenshot. Tastatur, Maus und Kabel sollen weiterhin enthalten sein.
5. Die Spalten/Gaps oben und unten in der Nahansicht schließen. Wahrscheinliche Ursache: HTML-Displayfläche ist bewusst kleiner als die tatsächlichen Glasscreen-Bounds; außerdem hat die Bühne Außenabstände. Visuell überprüfen, nicht nur CSS blind vergrößern.
6. Szene ruhiger/sauberer; Hintergrund beziehungsweise Boden etwas dunkler.
7. Rendering deutlich fotorealistischer: plausiblere Materialien, gerichtetes Licht, weiche reale Kontakt-/Objektschatten. Noch **nicht** umgesetzt. Performance weiterhin wichtig; keine schwere Dauer-Render-Schleife oder unnötige Frameworks.
8. Vollständige deutsche und englische Lokalisierung. Architektur und Übersetzungsdateien sind angelegt, Integration ist ausdrücklich **unfertig**; siehe unten.

Der frühere Wunsch nach Kamerabewegung ist bereits umgesetzt und bleibt verbindlich: **Der Computer steht fest. Nur die Kamera bewegt sich sehr subtil auf einem kleinen Bogen um den Computer/Bildschirm.** Die Ausgangsansicht soll fast frontal sein, nicht stark schräg.

## Projekt und Entwicklungsregeln

- Arbeitsverzeichnis: `/Users/silaskruckenberg/Documents/Personal/Personal_Website`
- `AGENTS.md` lesen. Dev-Server ausschließlich im Hintergrund starten: `npm run dev -- --background`. Verwaltung über `npm run astro -- dev status`, `dev logs`, `dev stop`.
- Astro-Dokumentation vor passenden Änderungen konsultieren: Komponenten, Styling, Routing, Content Collections, i18n.
- Designkontext: `.impeccable.md`. Bereits angewandte Skills: `frontend-design`, `animate`, `imagegen`; Bildgenerierung für neue Bitmap-Assets über das Bildtool. Vorhandene Pixel-Icons weiterverwenden.
- Keine Git-Commits/PRs behaupten: Git-Metadaten wurden hier bisher nicht als verwendbares Repository erkannt.
- Abhängigkeiten: Astro `^7.1.3`, Three `^0.186.1`, Pixelify Sans, Playwright-Test. `npm run build`, `npm run test:ui` vorhanden.

### Laufende Server: vor Neustarts beachten

Der Nutzer betrachtet `http://localhost:4323/`. Nach letzter `lsof`-Prüfung:

- PID **67232**: eigener Hauptserver auf `[::1]:4323`.
- PID **97133**: zusätzlicher eigener Server tatsächlich auf `[::1]:5173`.
- `.astro/dev.json` verweist fälschlich auf PID97133/Port4324. Diese Lockdatei ist veraltet.

Nicht blind einen dritten Server starten. Bei Bereinigung die bekannten eigenen Prozesse und die Astro-Verwaltung verwenden; andere Server auf4321/4322 nicht anfassen. Unter Sandbox kann `astro dev status` wegen fehlendem Prozesszugriff fälschlich „not running“ melden. Escalated lokale Server-/Playwright-Aufrufe wurden bereits erlaubt.

`astro build` bei laufenden Dev-Servern hat zuvor die Lockdatei beziehungsweise Vite-Optimierung verändert und veraltete Dependency-URLs/504 ausgelöst. Finalen Build und anschließenden Dev-Neustart gezielt koordinieren. Aktueller Stand wurde seit den jüngsten Änderungen **nicht final gebaut**.

## Bereits umgesetzt

### Vollständiges geliefertes 3D-Modell

Quelle: `/Users/silaskruckenberg/Downloads/macintosh-128k-computer-1984/source/Mac128K.fbx`.

- `public/models/macintosh/computer.glb`: **3.393.356Bytes**, vollständiges Set aus65 Quellmeshes: Computer, Helligkeitsregler, Tastatur, einzelne Tasten, Maus, Kabel.
- `public/models/macintosh/display.json`: normalisierte Bounds und Metadaten, keine Blob-Quellen mehr.
- `public/models/macintosh/textures/`: Quelltexturen für reproduzierbare Konvertierung; Laufzeit-GLB bettet die verwendeten Texturen ein.
- `scripts/convert-model.cjs`: portable Offline-Konvertierung per Playwright, `FBXLoader`, `GLTFExporter`, `mergeVertices`; gemeinsame Materialien; gegen den Monitor auf10Einheiten Höhe normalisiert.
- Reproduktion bei laufendem Dev-Server:

```sh
MODEL_DEV_URL=http://localhost:4323 node scripts/convert-model.cjs '/Users/silaskruckenberg/Downloads/macintosh-128k-computer-1984/source/Mac128K.fbx'
```

`src/scripts/mac-scene.js` lädt das GLB nur auf Desktop. Reale HTML-Oberfläche wird per Homographie an die Kamera gekoppelt. Inverse Projektion ermöglicht korrektes Fensterziehen im perspektivischen Bildschirm. Das Modell wird nicht gedreht.

Aktuell: Kamerafeld32°, nahe Ansicht fast frontal (`yaw .012`, `pitch .004`), Cursoramplitude `.009/.005`Radiant, gedämpft, Rendering nur bei Änderungen. Intro einmal pro Session:400ms Gesamtansicht,1800ms Zoom zum großen bedienbaren Display. Session-Key `silas-computer-intro`. Intro derzeit nur bei `location.pathname === '/'`; für englische Startseite anpassen.

Gesamtansicht: aktuell `wideYaw .18`, `widePitch .30`; echte Bounds je Mesh werden auf die Kamera projiziert und zentriert. Passt komplettes Set ein, ist dem Nutzer aber noch zu schräg/hoch/weit. `toggleOverview()` ist bisher unmittelbar, keine Transition.

Aktuelle Screenshots als Zwischenstand, **nicht Zielzustand der neuesten Wünsche**:

- `docs/vision/current-full-model.png`
- `docs/vision/current-working-view.png`

### Displaykalibrierung und Renderinghinweise

Aktuelles `DISPLAY` in `mac-scene.js`:

```js
{ width: 5.35, height: 4.00, y: 1.76017, z: 3.493 }
```

Tatsächlicher Screen-Material-Bounds aus Konvertierung:

```text
min [-2.72621536, -0.29260510, 3.07596850]
max [ 2.72621536,  3.81293869, 3.48317933]
Breite ≈5.45243; Höhe ≈4.10554; Zentrum y≈1.76017
```

Das Glas ist gewölbt. Die verkleinerte flache HTML-Fläche kann die schwarzen Reststreifen oben/unten erklären. Beim Vergrößern die tatsächlichen Ecken/Rundungen prüfen. Logische HTML-Breite1120px, Höhe aus Display-Seitenverhältnis. Im aktuellen CSS WebGL-Screen-Radius34px.

Aktuelle Beleuchtung: `RoomEnvironment`→PMREM, EnvironmentIntensity.5, Material-envMapIntensity.6; warmes Richtlicht2.7, kühles Fülllicht.65, Hemisphere.7. ACESFilmic/exposure1.12. Roughness: Screen.22, Metal.32, sonst pauschal.61. Bodenschatten sind bisher nur drei radiale transparente Ebenen, keine echten geworfenen Schatten.

Quelltexturen: acht Diffuse-Maps plus `metal_metallic.png`, alle1024². **Keine** Normal-, Roughness- oder AO-Maps vorhanden. Metallmaske ist bisher nicht im GLB. Vor Verwendung ihren Blaukanal prüfen; Three liest Metalness aus Blau, Non-Color-Daten ohne sRGB. GLB besitzt Normals und nur eine UV-Gruppe (`TEXCOORD_0`); AO nicht ohne Vorbereitung behaupten. Nicht künstlich starke Körnung/Bumps erfinden. Physikalische Materialerweiterungen kosten zusätzliche GPU-Zeit; gezielt einsetzen.

### Oberfläche, Fenster und responsive Verhalten

- `.screen` enthält echte Menüs, Fenster, Icons; mobile unter1024px Breite **oder**700px Höhe bildschirmfüllend, kein Three-/GLB-Download.
- Zehn Desktop-/Mobile-Icons: About, Projects, Journal (`blog`), Photos, Contact, Ideas, Links, Videos, Career, Reading. Neue vier Icons sind generiert und transparent als192px WebP unter `public/os-icons/` integriert.
- Jede Datei-Menü-App erhält einen Desktop-Icon. Desktoppositionen aus `desktopX/Y` im Markdown, bewusst über die Fläche verteilt; mobile sortiertes Grid mit Scrollen bei wenig Platz.
- Fenster sind einmal im DOM vorhanden; erneutes Öffnen fokussiert die bestehende Instanz. Kein Duplizieren.
- `src/scripts/window-manager.js`: Drag innerhalb logischer Display-Bounds, Zoom/Restore mit `aria-pressed`, Close/Focus/History, mobile Einzelfenster, Deep Links, Gallerydialog.
- Close/Zoom-Symbole sind CSS-Formen mit eigenen Trefferflächen, keine fehlerhaften Font-Zeichen.
- `src/scripts/environment.js`: dynamischer Renderer, Layoutwechsel, Uhr, Hintergrund-/Ansicht-Menü. Noch deutsche Strings und alter Fallback-Catch.
- Alter Mac-Fallback steht noch in `Desktop.astro` (`computer-fallback`, `computer-foot`) und `global.css`. **Noch kein `SceneChrome.astro` und kein `scene.css` erstellt.** Geplant war separate Komponente mit Ladeansicht und externem Ansichtsschalter; dadurch Rendering/Sprachintegration überschaubar halten.
- `src/styles/global.css` ist im Hauptteil formatiert, spätere Ergänzungen sind noch kompakt. Änderungen nicht pauschal neu schreiben.

### Inhaltssystem

`src/content/windows/*.md` ist die App-Registry. Dateiname→normalisierter Slug; optional expliziter `slug` für stabile URLs. `parent` erzeugt automatische Ordnerlinks, Kinder ohne Desktop-Icon. Draft/gelöschter Parent blendet Unterbaum aus. Doppelte Slugs und Zyklen führen zu hilfreichen Fehlern.

Markdown-Reader, Breadcrumbs, Code, Tabellen, Listen, Zitate, Bilder, leere Zustände sind vorhanden. `src/styles/markdown.css` wird zentral in **`src/layouts/BaseLayout.astro`** importiert. Der frühere Fehler eines fehlenden Imports aus `TextLayout.astro` wurde damit behoben. Achtung: BaseLayout liegt unter `layouts`, nicht `components`.

Pixel Studio/Pixelkunst wurde aus Projekten entfernt; separate Route `/pixel-studio/` bleibt als eigenständiges Werkzeug. Alte Beispielinhalte sind `draft: true`. `README.md` dokumentiert Contentpflege und Felder, `docs/content-template.md` ist Vorlage.

## Lokalisierung: angefangener, ungeprüfter Zwischenstand

Agent `content_system` hat auf den Übergabewunsch hin angehalten. Aktuell geschrieben:

- `astro.config.mjs`: `i18n` mit `de` als unpräfigiertem Default, `en` unter `/en/`.
- `src/lib/i18n.ts`: typisierter DE/EN-Katalog, `localeHome()`, `localizedAppHref()`, Locale-Typ.
- `src/content.config.ts`: Collection `windows` schließt `en/**` aus. Separate `windowTranslations` aus `src/content/windows/en/`, optionale Felder **ohne Defaults**, damit fehlende Übersetzungswerte vom Original erben.
- `src/lib/apps.ts`: `getApps(locale='de')`, Übersetzung übernimmt Metadaten/Body; öffentliche Slugs/Parents bleiben vom Original. Neu `app.data` für gemergte Daten; `app.entry` kann Basis oder Übersetzung sein.
- Elf englische Markdown-Overrides unter `src/content/windows/en/`: zehn übersetzte Titel und englisches Welcome. Weitere persönliche Texte weiterhin vom Nutzer.

**Noch nicht integriert:** Englische Seitenrouten; Locale-Props an Desktop/BaseLayout/Window/Reader/Gallery; `app.data` statt `app.entry.data` an den Renderstellen; `lang`, Meta, Datums-/Uhrformat; lokalisierter Windowmanager inklusive `/en/apps/`-Links und Root-History; Sprachumschalter auf korrespondierende Route; neue externe Ansichtsschalter-/Ladeansicht-Texte; README-Übersetzungsanleitung. Keine Tests nach diesen Teiländerungen. Deutsche Laufzeit sollte weitergehen, ist aber nach dem Stopp nicht nochmals überprüft.

Nicht einfach bestehende `en/*.md` als zusätzliche deutsche Apps zählen lassen; die Collection-Trennung ist absichtlich vorhanden.

## Bekannte offene Fehler und Tests

1. **Reading-Icon im Live-Cache:** Datei sagt `desktopX:51`, `desktopY:76`, gerendertes DOM hatte noch8/10 und lag hinter Welcome. Alle10Icon-Assets laden; Problem sind alte geparste Metadaten. Datei wirklich ändern/neu parsen, z.B. `nav: true` ergänzen, oder nach sauberem Dev-Neustart kontrollieren.
2. About82% und Projects91% liegen mit ihren Labelbreiten sehr eng. About auf80% verschieben beziehungsweise tatsächliche Label-Bounds ohne Überlappung prüfen. Noch nicht getan.
3. Letzter großer UI-Lauf **vor** i18n:65Checks bestanden,1Intro-Framing-Test fehlgeschlagen. Ursache wahrscheinlich HMR und alter2100ms-Wartewert während Änderung des Intros auf2200ms. Script nun3300ms plus Icon-Hit-/Label-Checks, aber **nicht erneut ausgeführt**. Nicht als vollständig grünen Testlauf ausgeben.
4. Separater Content-Akzeptanzlauf früher16/16 bestanden: neue MD-Route/Ordner, Markdown, interne Navigation, mobile Overflow, Draft/Publizieren/Löschen. Temporäre Fixture entfernt. Dieser Lauf deckt die neue Lokalisierung nicht ab.
5. Kein finaler Production-Build nach Modell/i18n-Umbau. Frühere Builds waren grün, aber zählen nicht für aktuellen Stand.

Tests:

```sh
UI_TEST_URL=http://localhost:4323 npm run test:ui
npm run build
```

`scripts/check-ui.cjs` verwendet Playwright. Chromium braucht hier ggf. escalated lokale Ausführung. Ergebnisse/Screenshots `/tmp/silas-os-ui-checks`; kopierter Zwischenbericht `docs/vision/checks-intermediate.json`. Aktuelle Fallback-Tests müssen zur gewünschten Lade-/Fehleransicht umgeschrieben werden, nicht die unerwünschte Mac-Ersatzdarstellung bewahren.

## Nächster sinnvoller Ablauf

1. Kurz Status melden, diese Übergabe und AGENTS lesen; jüngste Wünsche weiterführen, kein erneutes Vision-Board oder Contentfragen.
2. Lokalisierungsintegration an einen Agenten delegieren, Hauptagent übernimmt Szene/Kamera/Chrome. Dateibesitz absprechen: Desktop braucht Import/Locale-Prop der neuen SceneChrome-Komponente; Renderer/CSS nicht parallel überschreiben.
3. Ladeansicht + externer Ansichtsschalter; weiche Kamerastate-Transition, niedrigere/frontalere Gesamtansicht; Bildschirm-Gaps korrigieren.
4. Materialien, Licht und echte weiche Schatten nach Foto-Eindruck optimieren; Boden dezent dunkler. Übersicht und Nahansicht visuell prüfen.
5. Sauberer Serverzustand, beide Sprachen und mobile/fine-pointer/reduced-motion prüfen; aktuelle UI-Suite und Production-Build abschließen. Keine ungeprüften Zahlen als Erfolg melden.

## Wichtige Referenzen

- `Hamburg Silouette.png` im Projektroot, ursprüngliche Pixelpanorama-Richtung.
- Farbvorlage `/Users/silaskruckenberg/Downloads/IMG_4199.jpg` (nur Palette, nicht San-Francisco-Motive).
- `docs/vision/screen-desktop-03.png`, `screen-mobile-03.png`: frühere freigegebene Screens.
- Neue Wallpaper: `public/wallpapers/hamburg-v2.webp`, `hamburg-mobile-v2.webp`; Prompts in `docs/vision/assets/revision-prompts.json`.
- `public/brand/apple.svg`, `public/brand/NOTICE.txt`: austauschbares Logo und Attribution. Modell ohne mitgelieferte Lizenzdatei; Entwurfsstatus in `docs/model-notes.md` dokumentiert.
- Astro i18n: https://docs.astro.build/en/guides/internationalization/
- Three: https://threejs.org/docs/pages/WebGLRenderer.html, https://threejs.org/docs/pages/MeshStandardMaterial.html, https://threejs.org/docs/pages/MeshPhysicalMaterial.html, https://threejs.org/docs/pages/PMREMGenerator.html

Die letzte Nutzeranweisung war ausdrücklich: **„write a übergabe as our usage limit hits soon“**. Deshalb hier anhalten und die Übergabe verlinken; keine weiteren großen Änderungen starten.
