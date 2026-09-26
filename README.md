# MengenWerk

MengenWerk verwandelt einen hochgeladenen Baueinreichplan (PDF) automatisch in
einen **Massenauszug**: eine nach österreichischer LB-HB-Norm gruppierte
Stückliste aller Bauteile (Fenster, Türen, Wände, Flächen, Beton, Fliesen …)
mit Maßen, Mengen und einer Kostenschätzung — inklusive Rechenweg für jede
einzelne Zahl.

## Wofür die App gedacht ist

Wer ein Angebot oder eine Bestellung aus einem Bauplan ableiten will, misst
sonst jede Wand, jedes Fenster und jeden Raum von Hand aus. MengenWerk nimmt
diesen Schritt ab: Plan hochladen, wenige Minuten warten, fertigen
Massenauszug mit Kostenschätzung erhalten — und für jede Menge nachvollziehen,
aus welchen Planangaben sie berechnet wurde.

## Wie die Auswertung abläuft

1. **Plan → Bilder** (`src/lib/plan-zu-bildern.ts`): Die PDF wird im Browser
   (via `pdfjs-dist`) seitenweise in Bilder umgewandelt. Es läuft kein
   externes Binary wie `pdftoppm` — alles passiert clientseitig.
2. **Text- und Bildlesen** (`src/lib/plan-lesen.ts`): Wo möglich, wird die
   Textebene der PDF direkt gelesen (schneller, günstiger, keine
   Bilderkennungsfehler); nur wenn das nicht reicht, greift die
   KI-Bilderkennung.
3. **Analyse durch Claude** (`src/lib/analyze.ts`, `src/app/api/analyze`):
   Für jede Planseite ruft die App die Anthropic-API (`@anthropic-ai/sdk`)
   auf und lässt Claude Bauteile, Raumstempel, Legende und Nachweise
   (Flächenaufstellungen etc.) erkennen. Ergebnis pro Element: Typ, Maße,
   Material, **Konfidenz** (`plan` / `berechnet` / `annahme`) und der
   Rechenweg als Text.
4. **Ableitung** (`src/lib/ableitung.ts`): Aus den erkannten Räumen,
   Elementen und dem Plankontext (Legende, Geschosshöhen, Nachweise) wird der
   vollständige Massenauszug gerechnet — inklusive Verschnittzuschlägen
   (`src/lib/annahmen.ts`) und Rundung. Jede Ableitung trägt die schwächste
   Konfidenz ihrer Eingangswerte weiter, damit unsichere Zahlen als solche
   erkennbar bleiben.
5. **Zuordnung zur LB-HB** (`src/lib/lbhb.ts`, `src/data/lbhb023.json`):
   Bauteile werden Leistungsgruppen der österreichischen Leistungsbeschreibung
   Hochbau zugeordnet (Material aus der Planlegende, z. B. rot = Ziegel, grün
   = Stahlbeton).
6. **Kostenschätzung** (`src/lib/preise.ts`, `src/app/einheitspreise`):
   Anhand hinterlegter oder selbst eingegebener Einheitspreise wird eine
   Kostenschätzung je Position und in Summe ausgewiesen.
7. **Ergebnis & Export** (`src/components/Massenauszug.tsx`,
   `src/lib/export-html.ts`): Raumbuch, Abschnitte, getroffene Annahmen und
   Prüfpunkte werden in der Oberfläche dargestellt und lassen sich als
   eigenständige HTML-Datei herunterladen.

Ein Prüfskript (`npm run pruefe`, `scripts/pruefe-ableitung.mts`) rechnet die
Ableitung gegen Beispieldaten (`src/lib/beispiel.ts`) nach, unabhängig vom
Next.js-Typescope.

## Aufbau des Projekts

```
src/
  app/            Next.js App Router — Seiten und API-Routen
    api/analyze/  Serverseitiger Aufruf der Anthropic-API
    api/login/    einfache Authentifizierung (src/lib/auth.ts)
    app/          die eigentliche Anwendung (Upload, Ergebnis)
    einheitspreise/  Einheitspreis-Verwaltung
    preise/, kontakt/, ueber-uns/, impressum/, datenschutz/  Marketingseiten
  components/     UI-Bausteine (Massenauszug-Ansicht, Startseiten-Animation, Icons)
  lib/            die gesamte Fachlogik (siehe Ablauf oben)
  data/           LB-HB-Leistungskatalog (lbhb023.json, siehe src/data/README.md)
scripts/
  pruefe-ableitung.mts   Ableitung gegen Beispieldaten prüfen
  update-changelog.mjs   siehe Abschnitt „Changelog“
  githooks/, install-git-hooks.mjs
```

### Wichtige Fachbegriffe

- **Konfidenz**: `plan` (direkt aus dem Plan abgelesen) > `berechnet`
  (aus Planwerten hergeleitet) > `annahme` (mangels Angabe geschätzt). Eine
  Ableitung erbt immer die schwächste Konfidenz ihrer Eingangswerte.
- **Nachweise**: Werte aus Flächenaufstellungen im Plan (z. B.
  Bruttogrundrissfläche), die per unscharfem Namensabgleich gefunden werden
  (`src/lib/nachweise.ts`).
- **Plankontext**: Legende, Geschosshöhen und Nachweise — gilt für den
  gesamten Plansatz, nicht nur für eine Seite.

## Loslegen

```bash
npm install
npm run dev
```

App unter [http://localhost:3000](http://localhost:3000). Für die Analyse
wird ein Anthropic-API-Key benötigt (siehe Hinweis in der Oberfläche, falls er
fehlt).

Weitere Befehle:

```bash
npm run build   # Produktionsbuild
npm run start   # Produktionsbuild starten
npm run pruefe  # Ableitungslogik gegen Beispieldaten prüfen
```

## Changelog

[`CHANGELOG.md`](./CHANGELOG.md) dokumentiert automatisch jeden Commit dieses
Repos — mit Datum, Uhrzeit, Autor und Commit-Message, unabhängig davon, wer
committet. Ein `post-commit`-Git-Hook (`scripts/githooks/post-commit`,
installiert über `npm install` via das `prepare`-Script) trägt neue Commits
selbstständig ein; die Datei sollte daher nicht händisch bearbeitet werden.

## Technologie

Next.js (App Router) mit React 19 und TypeScript, Tailwind CSS 4 für das
Styling, `pdfjs-dist` für die PDF-Verarbeitung im Browser, `zod` für
Validierung und `@anthropic-ai/sdk` für die Planauswertung durch Claude.
