# Silas Kruckenberg — Portfolio

Persönliche Portfolio-Website von Silas Kruckenberg, Videograf und Dokumentarfilmer aus Deutschland.

## Stack

- [Astro](https://astro.build) — Static Site Generator
- [Tailwind CSS v4](https://tailwindcss.com) — Styling
- [motion](https://motion.dev) — Animationen (AnimatedText)
- pnpm — Package Manager

## Lokale Entwicklung

```bash
pnpm install
pnpm dev        # http://localhost:5200
pnpm build      # Production Build
pnpm preview    # Build lokal ansehen
```

## Struktur

```
public/assets/          # Bilder, Logo, Foto
src/
  collections/          # Navigationsdaten (menu.json)
  components/
    home/               # HeroCard (interaktive Projektkarte)
    sections/           # Hero, Arbeit, Leistungen, UeberMich, Kontakt, Header, Footer
    ui/                 # AnimatedText, Button, Logo
  config/               # site.js (SEO-Metadaten)
  layouts/              # Layout.astro, Meta.astro
  pages/                # index.astro, impressum.astro, 404.astro
  styles/               # global.css (Design-System)
```

## Seiten

| Route | Inhalt |
|---|---|
| `/` | One-Pager: Hero → Arbeit → Leistungen → Über mich → Kontakt |
| `/impressum` | Impressum (Pflichtangaben eintragen) |
| `/404` | Fehlerseite |

## To-do (manuell)

- [ ] Impressum mit echten Angaben befüllen (`src/pages/impressum.astro`)
- [ ] Instagram-URL im Kontakt ergänzen (`src/components/sections/Kontakt.astro`)
- [ ] E-Mail verifizieren (aktuell `silas@kruckenbg.de`)
- [ ] Deployment auf Netlify/Vercel einrichten
- [ ] `PUBLIC_SITE_URL` in `.env` setzen

## Kontakt

**Silas Kruckenberg**
[LinkedIn](https://www.linkedin.com/in/silas-johannes-kruckenberg/)
