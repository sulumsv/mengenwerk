# Changelog

Jede Änderung an MengenWerk mit Datum und Uhrzeit (Wiener Zeit), Autor,
Commit und den Einzelheiten aus der Commit-Message, neueste zuerst.
Wird von `scripts/update-changelog.mjs` über den `post-commit`-Hook
(`scripts/githooks/post-commit`) gepflegt, nicht händisch bearbeiten.

### 2026-10-01 17:29 Uhr · Seiten-Hero sitewide auf dunkles Navy/Safran umgestellt

sulumsv · Commit `7a5f3aa`

SeitenHero (Über uns, Preise, Kontakt, Beispielauswertung, Demo, Konto-
Unterseiten, Impressum, Datenschutz) nutzt jetzt denselben dunklen
Navy-Hintergrund mit Safran-Akzent wie die neue Startseite, statt des
vorigen hellen Grautons - konsistentes Erscheinungsbild über die ganze
Seite statt nur auf "/". KnopfPrimaer entsprechend auf Safran-Füllung
umgestellt, da er nur noch auf diesen dunklen Heros vorkommt.

### 2026-10-01 16:51 Uhr · Startseite: Produktgalerie mit echten Screenshots in Laptop- und Handy-Rahmen

sulumsv · Commit `74a8db2`

Neue Abschnitte nach dem Hero, im Stil des Referenzdesigns: drei
Browser-gerahmte Screenshots der echten Beispielauswertung (Kostenschätzung,
Kennzahlen, Raumbuch) als Galerie, danach eine horizontal scrollbare
Handy-Reihe mit denselben Inhalten mobil. Alle Bilder sind echte
Screenshots aus der laufenden App, keine Fotomontagen. Wechsel
dunkel/hell zwischen den Abschnitten für mehr Rhythmus auf der Seite.

### 2026-10-01 16:45 Uhr · Startseite: dunkler Hero im Navy/Safran-Stil mit Stat-Reihe

sulumsv · Commit `0241fbf`

Ersetzt den hellen Einstieg durch eine dunkle Version (gleiche Fläche wie
die bestehende scan-buehne weiter unten): große Headline mit Safran-Akzent,
Buttons in Safran/Outline, eine Stat-Reihe mit echten Katalogzahlen (59
Leistungsgruppen, 22.650 Positionen, LB-HB 023 vollständig, 100 % Rechenweg
sichtbar) statt erfundener Social-Proof-Zahlen, und die bestehende
Massenauszug-Vorschaukarte bleibt als echtes Produktbeispiel rechts.

### 2026-10-01 15:09 Uhr · Korrektur: fehlende Unterlagen nachreichen statt nur Werte überschreiben

sulumsv · Commit `8954106`

Im Korrekturfeld lassen sich jetzt zusätzliche Dateien hochladen (z.B. eine
fehlende Fenster- und Türliste oder ein Schnitt). Sie laufen durch dieselbe
Auswertung wie der Haupt-Einreichplan (neuer Endpunkt
/api/korrektur-dateien, nutzt analysiereBildseiten) und die darin erkannten
Räume und Bauteile werden dem bestehenden Massenauszug hinzugefügt, statt
dass man die ganze Auswertung wiederholen muss.

### 2026-10-01 15:07 Uhr · PDF-Export: Projektkopf mit Logo, hervorgehobene Planangaben

sulumsv · Commit `a9692ef`

Der heruntergeladene Massenauszug trägt jetzt die Projektbezeichnung als
Titel (statt des Dateinamens) und die erkannte Planart, das
MengenWerk-Logo oben rechts im Kopf und als Logo mit Schriftzug in der
Fußzeile jeder Seite. Direkt unter dem Kopf steht ein hervorgehobener
Rahmen mit Planlegende, lichten Raumhöhen, Nachweisen und allgemeinen
Bedingungen - auf einen Blick sichtbar statt nur in der Bildschirmansicht.
Lokal gegen die Beispielauswertung erzeugt und als gerastertes PNG
visuell geprüft.

### 2026-10-01 15:00 Uhr · Konto: Projektbezeichnung statt Dateiname, Plan-Ansicht als PDF, Projekte ordnen, eigener Lösch-Dialog

sulumsv · Commit `8542094`

- Pläne zeigen jetzt die erkannte Projektbezeichnung als Titel, den
  Dateinamen nur noch als Zusatz.
- Originaldatei wird beim Speichern mit abgelegt (neuer Endpunkt
  /api/plaene/[hash]/datei) und lässt sich über "Ansehen" in einem Popup
  mit dem eingebauten PDF-Betrachter des Browsers ansehen, inklusive Zoom.
- Pläne lassen sich einem Standort/Vorhaben zuordnen (PATCH-Endpunkt) und
  werden danach danach gruppiert; innerhalb einer Gruppe nach Planart
  sortiert (Einreichplan vor Vorabzug vor Skizze).
- Löschen fragt jetzt über einen eigenen Dialog nach, nicht mehr über das
  native window.confirm() des Browsers.

### 2026-10-01 14:55 Uhr · Dokumentart fließt jetzt in die Mengenermittlung ein, nicht nur ins Ergebnis

sulumsv · Commit `5c77d28`

Planart, Projektbezeichnung und allgemeine Bedingungen wurden erkannt, aber
nie an die einzelnen Blätter weitergegeben - jede Seite lief blind mit
derselben Anweisung. Jetzt bekommt jedes Blatt die Dokumentart mit und
reagiert entsprechend: Deckblätter und Textseiten ohne Grundriss erzwingen
keine Räume mehr, Detailpläne liefern nur Bauteile statt Räume, ein
vorläufiger Stand (Vorabzug, Entwurf) wird einmal zentral vermerkt statt
stillschweigend wie ein fixer Plan behandelt.

### 2026-10-01 14:31 Uhr · Export-Mechanismus für Trainingsdaten

sulumsv · Commit `f7cb13a`

Sammelt alle gespeicherten Regeln, Auswertungen, Korrekturen und
CAD-Einträge aus R2 zu einem strukturierten Datensatz (GET
/api/daten/export, als Download). Braucht dafür eine echte Objektauflistung
in R2, die es bisher nicht gab (listeSchluessel, folgt der
Fortsetzungsmarke). Grundlage für ein künftiges Fine-Tuning oder ein
eigenes Modell, sobald genug echte Fälle gesammelt sind - läuft nur auf
Abruf, speichert nichts automatisch.

### 2026-10-01 14:09 Uhr · Projektübersicht: Bezeichnung, Planart und allgemeine Bedingungen jetzt mit erfasst

sulumsv · Commit `ef666a2`

Der Kontext-Durchgang liest jetzt zusätzlich Projektbezeichnung, Planart
(Einreichplan, Polierplan, Vorabzug ...) und allgemeine Bedingungen aus
Plankopf, Schriftfeld oder Ausschreibungstitel. Steht oben im Ergebnis,
vor Legende, Raumhöhen und Nachweisen - macht auf einen Blick klar, um
welches Dokument es sich handelt und was projektweit gilt.

### 2026-10-01 13:02 Uhr · Fix: Pläne mit JPEG2000-Rasterbildern kamen als leere Seiten an

sulumsv · Commit `2ec0483`

Root Cause gefunden und isoliert nachgestellt (gleiche pdfjs-Version, echter
Plan): ohne wasmUrl/cMapUrl/standardFontDataUrl kann pdf.js im Browser den
OpenJPEG-Dekoder nicht laden. Bei Plänen, deren Grundrisse als JPEG2000
eingebettet sind (z. B. dieser Polierplan-Export), blieb die Seite dadurch
leer, ohne dass ein Fehler sichtbar wurde - die KI-Auswertung lief auf
weißen Bildern und fand folgerichtig nichts. Betrifft alle vier
getDocument()-Aufrufe im Browser (Planvorschau, Bildauswertung, Textweg,
CAD-Ebenen).

### 2026-10-01 10:14 Uhr · Optionale Begleitunterlagen zum Einreichplan hochladbar

sulumsv · Commit `9aa6e0f`

Vorabzug, Ausschreibung, Detailpläne oder Statik liefern oft Legende,
Geschoßhöhen und Nachweise, die im Einreichplan selbst fehlen. Diese
Dateien sind ausdrücklich freiwillig und liefern nur Kontext für den
ersten Auswertungsdurchgang; die Mengen selbst kommen weiterhin
ausschließlich aus dem Einreichplan.

### 2026-10-01 10:01 Uhr · Leeres Guthaben: klare rote Meldung statt Fehlercode

sulumsv · Commit `c8e5de6`

In der Testphase ist ein leeres Anthropic-Guthaben kein Produktfehler.
Zeigt jetzt einen einfachen Hinweis ohne Statuscode oder SDK-Text.

### 2026-10-01 10:01 Uhr · Auswertung: gelernte Regeln aus dem Index fließen in jeden neuen Plan ein

sulumsv · Commit `be5a9bc`

Vor jeder Analyse liest die Route den Regel-Index und gibt ihn der KI als
zusätzlichen Kontext mit. Damit wirkt jeder gespeicherte Fund (etwa eine
korrigierte Ebenen-Zuordnung) auch auf künftige, andere Pläne, nicht nur
als Archiv-Eintrag für ein späteres eigenes Modell.

### 2026-10-01 10:01 Uhr · Datenspeicher: gelernte Regeln in einem laufenden Index statt verteilter Einzeldateien

sulumsv · Commit `5ae6bc5`

Jeder neue Regel-Eintrag ergänzt jetzt zusätzlich einen festen Index
(regeln/index.json), den die Auswertung in einem Lesezugriff mitgeben kann,
ohne R2 auflisten zu müssen. Begrenzt auf die letzten 40 Einträge.

### 2026-10-01 10:00 Uhr · CAD-Ebenen: Alternative Dickenschätzung getestet und verworfen

sulumsv · Commit `4940ce1`

2A/U statt der exakten Rechteckformel sollte Wandknoten robuster machen,
verschlechterte aber am echten Testplan sowohl den bisher guten
Unterzug-Treffer als auch den größten bekannten Fehler (Innenwand d=0,25).
Kein Nettogewinn, daher zurückgesetzt; der Versuch ist dokumentiert, damit
er nicht wiederholt wird.

### 2026-10-01 09:40 Uhr · Datenspeicher: eigene Kategorie für Regeln und Rechenwege

sulumsv · Commit `a4908f4`

Neben Auswertungen, Korrekturen und CAD-Ebenen können jetzt auch
destillierte Erkenntnisse (Regel, Begründung, Rechenweg) aus echten
Plänen abgelegt werden. Grundlage für ein eigenes, feineres Modell,
das aus den gesammelten Regeln statt nur aus Bildbeschreibung lernt.

### 2026-10-01 09:40 Uhr · CAD-Ebenen: Wand-ELR und Aufzugsschächte werden wieder als Innenwände erkannt

sulumsv · Commit `4f274a5`

Die ELR-Ausschlussregel traf fälschlich auch Ebenen wie "132 Wand ELR" (echte
Wandebene, kein Elektro-Leerrohr). Aufzugsschächte hatten gar keine Regel und
fielen komplett durch. Ändert bei Plänen, auf denen diese Ebenen als
durchgehende Flächen gezeichnet sind, die erkannten Wandmengen; bei
schraffiert gezeichneten Ebenen bleibt die Wirkung vorerst aus.

### 2026-10-01 09:10 Uhr · Korrekturfeld auffälliger gestalten: Rahmen, Icon und Korrekturen als Chips statt Textliste

sulumsv · Commit `1a67abf`

Das Feld, zu dem die neue Hinweiskarte oben verlinkt, war selbst nur eine kleine graue Überschrift. Jetzt dicker Akzentrahmen, Stift-Icon, größere Überschrift; aktive Korrekturen stehen als Chips mit eigenem Entfernen-Knopf statt als stille Textzeile mit Unterstrich-Link.

### 2026-10-01 09:02 Uhr · Einheitspreise und Korrekturen stehen nach der Auswertung im Mittelpunkt

Claude · Commit `fbc4551`

- Direkt unter dem Ergebnis zwei Karten für die nächsten Schritte: „Mengen prüfen und korrigieren“ und „Kostenschätzung mit Ihren Einheitspreisen“, jeweils mit Sprung zur Stelle
- Das Korrekturfeld steht jetzt vor dem Massenauszug statt ganz unten
- Neue, hervorgehobene Kostenkarte ganz oben im Massenauszug: wie viele Einheitspreise der Plan braucht, wie viele davon eigene sind, mit Fortschrittsbalken
- Knopf „Einheitspreise eintragen“ öffnet die Preistabelle für genau diesen Plan, bereits hinterlegte eigene Preise sind vorbelegt
- Hinweis, dass eingetragene Preise für jeden weiteren Plan gelten
- PDF-Download, Kennzahlen und Legende folgen nach der Kostenschätzung

### 2026-10-01 09:00 Uhr · Profil wird in einem eigenen Fenster verwaltet, Kontoübersicht wirkt fertig

Claude · Commit `791c28b`

- „Profil bearbeiten“ öffnet ein eigenes Fenster statt eines Formulars im Kopf
- Oben eine Live-Vorschau des Firmenzeichens mit Firmenname, Gewerk und Ansprechperson, dazu sechs Farben für das Firmenzeichen
- Abschnitt Betrieb: Firmenname, UID-Nummer, Website und Gewerk zum Antippen (Baumeister, Bauträger, Planer, Bodenleger, Fliesenleger, Maler, Dachdecker, Fenster und Türen, Trockenbau, Sonstiges)
- Abschnitt Ansprechperson: Name, Funktion, E-Mail, Telefon
- Schließt mit Escape, Klick daneben oder Kreuz; auf dem Handy als Blatt von unten
- Gespeichertes Profil wird mit grüner Bestätigung angezeigt, das Firmenzeichen im Konto übernimmt die gewählte Farbe
- Kennzahlen mit Symbolen; solange noch nichts ausgewertet ist, stehen sie gedämpft mit „nach der ersten Auswertung“

### 2026-10-01 08:55 Uhr · Speichern in R2 korrigiert, Upload-Grenzen werden angezeigt

Claude · Commit `264df85`

- Ursache für nicht gespeicherte Pläne: R2 lehnte jedes Schreiben mit 411 „MissingContentLength“ ab, weil die Daten ohne Längenangabe übertragen wurden
- Daten gehen jetzt als Bytes mit ausdrücklicher Content-Length an R2, für Konto, Lerndaten, Laufzeiten und Planbilder
- Die Speicherprüfung (/api/daten) sendet ebenso mit Längenangabe
- Upload-Grenzen stehen sichtbar im Upload-Feld: PDF, PNG, JPG, bis 100 MB, bis 10 Blätter je Auswertung
- Zu große Dateien werden gleich beim Auswählen abgelehnt, Plansätze mit mehr als 10 Blättern vor dem Hochladen, jeweils mit klarer Meldung
- Grenzen zentral in src/lib/einstellungen.ts (MAX_DATEI_MB, MAX_BLAETTER), der Server prüft dieselbe Blattgrenze

### 2026-10-01 08:50 Uhr · Anmeldung mit Benutzername und Passwort

Claude · Commit `09b4576`

- Die Anmeldeseite fragt jetzt Benutzername und Passwort ab
- Benutzername ist „mengenwerk“ (Groß- und Kleinschreibung egal), änderbar über die Umgebungsvariable MENGENWERK_USER
- Passwort bleibt MENGENWERK_PASSWORD
- Browser können Benutzername und Passwort jetzt als Zugang speichern

### 2026-10-01 08:50 Uhr · Speichern im Konto wird sichtbar bestätigt, Speicherprüfung nennt den genauen Grund

Claude · Commit `377f08f`

- Nach jeder Auswertung steht unter dem Ergebnis, ob der Plan im Konto gespeichert wurde, mit Link zu „Meine Pläne“
- Scheitert das Speichern, erscheint ein deutlicher Hinweis statt eines stillen Fehlers, mit Link zur Speicherprüfung
- /api/daten zeigt jetzt, welche R2-Variablen gesetzt sind, und die Antwort von R2 an beiden Adressen (EU und Standard) mit Fehlercode
- Umgebungsvariablen werden bereinigt: Leerzeichen und Anführungszeichen entfernt, eine ganze R2-Adresse statt der Konto-ID wird erkannt

### 2026-10-01 08:38 Uhr · Bekannte Dokumente werden schon beim Auswählen erkannt und laden sofort

Claude · Commit `45a31f1`

- Beim Ablegen oder Auswählen prüft MengenWerk sofort, ob das Konto die Datei schon kennt
- Bekannte Dokumente zeigen im Bestätigungsschritt einen grünen Hinweis mit Datum und Dauer der ersten Auswertung
- Der Knopf heißt dann „Ergebnis sofort öffnen“, daneben „Trotzdem neu auswerten“
- Beim Öffnen springt der Ladebalken auf 100 %, alle Schritte sind abgehakt, Anzeige „Bereits bekannt, aus dem Konto, sofort“
- Die Dauer jeder Auswertung wird mit dem Ergebnis im Konto gespeichert (dauer_s)
- Der Hinweis über dem Ergebnis nennt, wie lange die erste Auswertung gedauert hat

### 2026-10-01 08:34 Uhr · Kundenkonto als Übersicht mit Profil, Kennzahlen, Plänen und Einheitspreisen

Claude · Commit `7663ff5`

- Neuer Kopf auf nachtblauem Grund mit Firmenzeichen, Firmenname, Begrüßung und Gewerk
- Profil bearbeitbar: Firma, Ansprechperson, Gewerk, E-Mail, Telefon, gespeichert im Konto in R2 (konto/profil.json, /api/profil)
- Kennzahlen auf einen Blick: ausgewertete Pläne, gelesene Blätter, erfasste Fläche, ermittelte Positionen
- Pläne als Liste mit Suche, Datum, Blattzahl, Fläche und Positionen, Öffnen und Löschen
- Einheitspreise-Karte mit Fortschrittsring (Anteil eigener Preise) und aufklappbarer Übersicht nach Gewerk
- Kontaktdaten und Abmelden in eigener Karte
- Im Konto-Verzeichnis werden jetzt auch Fläche und Positionen je Plan abgelegt
- KI-Kosten nur in der Testphase sichtbar, abschaltbar über KI_KOSTEN_ANZEIGEN in src/lib/einstellungen.ts (gilt für Konto und Auswertung)
- Neue LIVE-CHECKLISTE.md mit allem, was vor dem Livegang umzustellen ist, darunter das Ausblenden der KI-Kosten

### 2026-10-01 08:29 Uhr · Auswertung startet erst nach Bestätigung, Zustimmung zum Speichern als Schalter

Claude · Commit `9fe3bbf`

- Nach dem Ablegen oder Auswählen eines Plans startet die Auswertung nicht mehr sofort
- Es erscheint ein Bestätigungsschritt mit Dateiname, Größe, dem Knopf „Auswertung starten“ und „Andere Datei wählen“
- Die Zustimmung zum Speichern der Planbilder ist ein deutlicher Schalter statt eines kleinen Häkchens, standardmäßig aus
- Der Text erklärt klar: freiwillig, nicht weitergegeben, auf Anfrage gelöscht; Mengen und Korrekturen werden immer ohne Dateiname und Adresse gespeichert
- Datenschutzerklärung um „Mein Konto“ ergänzt: Ergebnis mit Dateiname im eigenen Konto, Erkennung über einen Prüfwert, jederzeit löschbar

### 2026-10-01 08:28 Uhr · Startseite zeigt wieder die Scan-Animation und erklärt den Ablauf ausführlicher

Claude · Commit `3e7e814`

- Neuer Abschnitt „So liest MengenWerk einen Plan“ direkt unter dem Einstieg, auf nachtblauem Grund
- Animierter Grundriss: eine Scanlinie fährt über den Plan, Räume, Fenster und Maßketten leuchten nacheinander auf, Beschriftungen und das Mauerwerksergebnis erscheinen
- Daneben die vier Erkennungsschritte: Raumstempel, Fenster und Türen, Wände und Maßketten, Folgemengen
- Neuer Abschnitt „Vom Plan zum Angebot“ mit Massenauszug, Kostenschätzung und PDF-Export
- Neuer Abschnitt „Für wen“ für Baumeister, Boden- und Fliesenleger, Maler und Verputzer, Planer und Bauträger
- Die Animation ist reines CSS und steht bei reduzierter Bewegung still und vollständig da

### 2026-10-01 08:26 Uhr · Kundenkonto mit gespeicherten Plänen, bereits ausgewertete Pläne kosten nichts mehr

Claude · Commit `a0476e7`

- Jeder Plan bekommt beim Hochladen einen Fingerabdruck (SHA-256 des Dateiinhalts)
- Das Ergebnis jeder Auswertung wird im Konto in Cloudflare R2 abgelegt (konto/plaene/<Fingerabdruck>.json und ein Verzeichnis)
- Wird derselbe Plan erneut hochgeladen, kommt das gespeicherte Ergebnis sofort, ohne KI und ohne Kosten, mit Hinweis auf das Datum der ersten Auswertung
- „Trotzdem neu auswerten“ erzwingt eine neue Auswertung
- Neue Seite /konto „Meine Pläne“: Liste mit Name, Datum, Blattzahl und KI-Kosten, Öffnen, Löschen, Abmelden und Gesamtkosten
- Ein gespeicherter Plan lässt sich über /app?plan=<Fingerabdruck> wieder öffnen
- Kopfzeile zeigt angemeldet „Mein Konto“ und „Plan analysieren“, sonst „Anmelden“ und „Demo anfragen“
- /konto ist nur nach Anmeldung erreichbar, neues Abmelden über /api/konto

### 2026-10-01 08:14 Uhr · Einheitspreise-Seite zeigt in jedem Feld den gerechneten Preis

Claude · Commit `6e2c887`

- Die Preisfelder waren leer, obwohl mit den Richtwerten gerechnet wird; jetzt steht in jedem Feld der Preis, der tatsächlich in die Kostenschätzung eingeht
- Unter jedem Feld steht, ob es der Richtwert oder ein eigener Preis ist, eigene Preise sind gelb hervorgehoben
- Ein geleertes Feld springt beim Tippen nicht mehr auf den Richtwert zurück, erst beim Verlassen
- Spalte heißt jetzt „Gerechneter Preis“, Seitentext und Hinweiskasten beschreiben die recherchierten Richtwerte

### 2026-10-01 00:24 Uhr · Geschätzte Richtwerte durch recherchierte österreichische Preise ersetzt

Claude · Commit `dc0fbb9`

- 16 Richtwerte mit Preisspannen österreichischer Kostenportale belegt, die Spanne steht jeweils als Hinweis in der Position
- Laminat 58, Vinyl 35, Teppich 30, Linoleum 52 EUR/m² inkl. Verlegung
- Trockenbauwand 60, Flachdachabdichtung 85, Abdichtung erdberührt 90, VHF 250, Tapete 16 EUR/m²
- Pflaster 120 EUR/m² inkl. Unterbau, Rollrasen 26 EUR/m², Kanal 330 EUR/lfm, Geländer 300 EUR/lfm
- Dachflächenfenster 1.900 EUR je Stück, Raffstore 450 EUR je Element statt je m², Holzstütze 1.100 EUR/m³
- Nur die Verbundabdichtung im Nassraum bleibt grob geschätzt, dafür gab es keine belastbare Quelle
- Leistungsgruppen-Nummern gegen die amtlichen LB-HB-023-Dateien des Ministeriums geprüft, sie stimmen

### 2026-10-01 00:22 Uhr · Ladebalken lernt aus gemessenen Laufzeiten, wie lange ein Plan dauert

Claude · Commit `f258302`

- Nach jeder gelungenen KI-Auswertung wird die Laufzeit mit Blattzahl, Anzahl der Ausschnitte und KI-Modell in R2 gespeichert (system/dauer-proben.json, die letzten 300)
- Aus den Messungen wird die Schätzung gelernt: Grundzeit + Zeit je Runde von drei Blättern + Zeit je Ausschnitt
- Neuere Messungen zählen mehr, bei wenigen Messungen halten Startwerte die Schätzung stabil
- Gelernt wird je KI-Modell getrennt, damit ein Modellwechsel die Schätzung nicht verfälscht
- Der Ladebalken holt die gelernte Schätzung beim Öffnen der Seite und berücksichtigt jetzt auch die Ausschnitte großer Blätter

### 2026-10-01 00:21 Uhr · Kostenschätzung rechnet automatisch mit Richtwerten für alle Leistungsgruppen

Claude · Commit `03a0adc`

- Nach jeder Auswertung steht die Kostenschätzung sofort da, fehlende eigene Preise werden mit Richtwerten ergänzt
- Eigene Einheitspreise gehen weiterhin vor
- Die Pflicht, eigene Preise zu hinterlegen, und die Weiterleitung nach dem Login sind bis zu den Kundenkonten abgeschaltet (EIGENE_PREISE_PFLICHT)
- Preiskatalog nach den Leistungsgruppen des LB-HB 023 geordnet, falsche Zuordnungen korrigiert: Putz LG 10, Gerüst LG 04, WDVS LG 44, Dachdeckung LG 22, Holzbau LG 36, Parkett LG 38, Bodenbeschichtung LG 49, Malerei LG 48, Fenster LG 73
- Neu im Katalog: Kanal, Abdichtung Nassraum und erdberührt, Pflaster, Garten, Flachdachabdichtung, Laminat, Vinyl, Teppich, Linoleum, Holzstütze, Trockenbauwand, Dachflächenfenster, Raffstore, VHF, Geländer, Tapete
- Die neuen Richtwerte sind grob geschätzt und im Katalog so gekennzeichnet
- Beläge Laminat, Vinyl, Teppich, Linoleum, Kork und Epoxid werden erkannt und bepreist
- Holzstützen werden als Holzbau statt als Stahlbeton bepreist
- Einheitspreise-Seite nach den neuen Gruppen gegliedert

### 2026-10-01 00:13 Uhr · Auswertungen und Korrekturen werden in Cloudflare R2 gesammelt

Claude · Commit `6f865d1`

- Neuer Datenspeicher über Cloudflare R2 (EU-Bucket), Zugang über R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
- Jede Auswertung wird gespeichert: Räume, Bauteile, Legende, Geschoßhöhen, Nachweise, Hinweise, Verbrauch
- CAD-Auswertungen werden mit allen Ebenennamen, erkannten Ebenen und Maßstab gespeichert
- Korrekturen werden gesammelt: geänderte Raumflächen und Umfänge, Raumhöhen, Annahmen, ausgeschlossene CAD-Bauteile
- Dateinamen fallen weg, Straßennamen werden vor dem Speichern durch [Adresse] ersetzt
- Planbilder werden nur mit Häkchen beim Upload gespeichert
- GET /api/daten prüft nach dem Login, ob der Speicher erreichbar ist
- Datenschutzerklärung um die Datensammlung ergänzt

### 2026-10-01 00:08 Uhr · KI-Analyse läuft auf Sonnet 5.5 mit niedriger Denkstufe

Claude · Commit `f94e17c`

- Planauswertung und Korrekturfeld nutzen claude-sonnet-5-5 statt claude-opus-5-5
- Tokenpreis halbiert: 2 $ / 10 $ statt 4 $ / 20 $ je Million Token
- Denkstufe der Planauswertung „low“ statt „medium“, weniger Ausgabe-Tokens
- Tarif für Sonnet 5.5 in der Verbrauchsanzeige hinterlegt

### 2026-10-01 00:07 Uhr · Changelog zeigt jede Änderung mit Wiener Uhrzeit und Einzelheiten

Claude · Commit `0921e94`

- Jeder Eintrag hat Datum und Uhrzeit in Wiener Zeit, Autor, Commit und Titel
- Darunter stehen die Einzelheiten aus dem Text der Commit-Message als Liste
- Trailer wie Co-Authored-By und Claude-Session werden herausgefiltert
- Bisherige Einträge von UTC auf Wiener Zeit umgerechnet
- Die Änderungen vom 30. September um Einzelheiten ergänzt

### 2026-10-01 00:05 Uhr · Massenauszug wird als formatiertes PDF heruntergeladen

Claude · Commit `a683ec1`

- Download liefert ein PDF (A4 quer) statt einer HTML-Datei, erzeugt im Browser mit jsPDF
- Kopf in Nachtblau mit Titel und Erstellungsdatum, Kennzahlen als Kacheln
- Kostenschätzung mit Anteil aus Richtwerten, Raumbuch nach Geschoß
- Alle Abschnitte mit Rechenweg, Menge, EP, Betrag und Abschnittssumme
- Annahmen, Prüfpunkte, Legende und Seitenzahl auf jeder Seite

### 2026-10-01 00:02 Uhr · Richtwerte an aktuelle österreichische Marktpreise angepasst

Claude · Commit `482ffe6`

- Zehn Richtwerte auf die Mitte der Preisspannen österreichischer Kostenportale gesetzt
- Fußbodenheizung 70 €/m², Aushub 40 €/m³, Mauerwerk 500 €/m³ (ca. 125 €/m² Wand)
- WDVS 105 €/m², Innenputz 26 €/m², Malerei 11 €/m², Dachdeckung 65 €/m²
- Dachrinne 65 €/lfm, Fenster 550 €/m², Tür 340 €/m² (ca. 650 € je Innentür)
- Beton, Gerüst und Bewehrung unverändert, weil die Quellen sich widersprachen

### 2026-10-01 00:01 Uhr · Einheitspreise werden nach dem ersten Login und vor der ersten Kostenschätzung abgefragt

Claude · Commit `9a9872e`

- Erster Login auf einem Gerät ohne Preise führt zu den Einheitspreisen, mit Willkommenshinweis und „Später“
- Login ohne Zielseite führt nach /app statt auf die Startseite
- „Kostenschätzung erstellen“ fragt die für den Plan fehlenden Preise in einer Tabelle ab
- Leere Felder lassen sich mit Richtwerten füllen, gespeichert wird für alle weiteren Pläne

### 2026-09-30 23:57 Uhr · Große Planblätter werden zusätzlich in scharfen Ausschnitten ausgewertet

Claude · Commit `3d2f226`

- Blätter ab etwa A2 werden in bis zu 6 überlappende Ausschnitte mit rund 115 dpi zerlegt
- Übersicht und Ausschnitte gehen in einer Anfrage an die KI, mit Hinweis auf Doppelzählungen
- Alle Bilder bleiben unter 4 MB, sonst werden weniger Ausschnitte geschickt
- Pool, Zisterne und Außenanlagen zählen nicht als Bauteil, Garten nicht in Estrich
- Hinweis über dem Kostenblock erklärt, warum die KI-Auswertung nötig war

### 2026-09-30 23:45 Uhr · Ladeanzeige zeigt Fortschritt in Prozent, bisherige Dauer und Restzeit

Claude · Commit `3e8894f`

- Prozentanzeige mit Fortschrittsbalken während der Planauswertung
- Laufzeit und geschätzte Restzeit, abhängig von der Blattzahl
- Ab 90 % nähert sich die Anzeige 99 % nur noch an
- Hinweis, wenn die Auswertung deutlich länger dauert als geschätzt

### 2026-09-30 23:38 Uhr · KI-Analyse meldet Planbilder im richtigen Bildformat an

Claude · Commit `0d076f4`

- Planseiten kamen als JPEG, wurden aber als PNG angekündigt, die API lehnte mit 400 ab
- Bildformat wird jetzt an den ersten Bytes erkannt (JPEG, PNG, WebP, GIF)

### 2026-09-30 23:33 Uhr · Überschrift auf zwei Zeilen, Planauswertung nur noch nach Anmeldung beworben

Claude · Commit `ab871b3`

- Startseitenüberschrift über die volle Breite auf zwei Zeilen
- „Demo anfragen“ statt „Plan analysieren“ in Kopfzeile, Startseite, Preisen, Beispiel und Fußzeile
- Zur Auswertung geht es nur noch über „Anmelden“

### 2026-09-30 23:31 Uhr · Fehlermeldung nennt den Grund, wenn die Anthropic API eine Anfrage ablehnt

Claude · Commit `ba99aea`

- Statt nur „abgelehnt (400)“ steht die Begründung der API in der Meldung
- Bei fehlendem Guthaben steht direkt, wo man aufladen kann

### 2026-09-30 23:30 Uhr · KI-Analyse nutzt günstigeres Modell mit mittlerer Denkstufe

Claude · Commit `d587cb0`

- Planauswertung und Korrekturfeld laufen auf claude-opus-5-5 (4 $ / 20 $ statt 5 $ / 25 $ je Mio. Token)
- Denkstufe der Planauswertung „medium“ statt „high“
- Neuer Tarif in der Verbrauchsanzeige hinterlegt

### 2026-09-30 17:19 Uhr · Neues, einheitliches Design ohne Animationen

Claude · Commit `ebbe106`

- Alle Animationen der Webseite entfernt
- Einheitliches Designsystem: weiße Flächen, Nachtblau als Hauptfarbe, Safran als Akzent
- Startseite neu: Einstieg mit Beispiel-Massenauszug, Ablauf, Umfang, Nachvollziehbarkeit, FAQ
- Preise, Kontakt, Demo, Über uns und Login angeglichen

### 2026-09-30 08:39 Uhr · Bauteile in der Kontrollansicht per Klick aus der Zählung nehmen

Claude · Commit `3568bda`

### 2026-09-29 20:02 Uhr · Pläne mit allen Grundrissen auf einem Blatt und ArchiCAD-Raumstempel ohne KI lesen

Claude · Commit `8763b43`

### 2026-09-29 15:32 Uhr · Kontrollansicht zeigt die gezählten Bauteile farbig auf dem Plan

Claude · Commit `b66ffc5`

### 2026-09-29 15:23 Uhr · Wände und Unterzüge aus den CAD-Ebenen eines Vektor-PDFs berechnen

Claude · Commit `548fcd9`

### 2026-09-28 17:32 Uhr · App-Seiten, Beispiel, Einheitspreise und Rechtliches im neuen Design

Claude · Commit `8c19fe7`

### 2026-09-28 17:27 Uhr · Einheitspreise nur nach dem Login bearbeitbar

Claude · Commit `fb40a25`

### 2026-09-28 17:27 Uhr · Hochgeladener Plan erscheint während der Analyse als Scan-Animation

Claude · Commit `13fbe9a`

### 2026-09-28 17:24 Uhr · Safrangelb als Akzent und neutrale Beispielprojekte

Claude · Commit `64ed55d`

### 2026-09-28 17:18 Uhr · Farbwelt Nachtblau und Sand mit Graphit für Text

Claude · Commit `8e9560a`

### 2026-09-28 17:01 Uhr · Startseite erklärt, welche Positionen je Gewerk berechnet werden

Claude · Commit `157eaf8`

### 2026-09-28 17:01 Uhr · Folgemengen aus Fenstern und Türen berechnen

Claude · Commit `a3163ec`

### 2026-09-28 16:58 Uhr · Startseite zeigt auf den ersten Blick, was MengenWerk macht

Claude · Commit `af4bf3a`

### 2026-09-28 16:47 Uhr · Animierte Abendszene, Bernstein als Farbe und klarere Navigation

Claude · Commit `c707441`

### 2026-09-28 16:39 Uhr · Startseite als Bühne mit Menü links, weiß mit Hellblau

Claude · Commit `029d5b9`

### 2026-09-28 16:32 Uhr · Neue Schrift, kühle Farbwelt und neues Logo

Claude · Commit `b5060e4`

### 2026-09-28 16:28 Uhr · Übersicht im Dashboard-Stil auf der Startseite

Claude · Commit `ef6318a`

### 2026-09-28 16:18 Uhr · Eine einheitliche Schrift für die ganze Seite

Claude · Commit `597bfbf`

### 2026-09-28 16:14 Uhr · Gedankenstriche auch aus Skripten und Changelog entfernen

Claude · Commit `836f67b`

### 2026-09-28 16:13 Uhr · Neues Design in Papier und Terrakotta, Texte ohne Gedankenstriche

Claude · Commit `ab6040c`

### 2026-09-28 16:02 Uhr · Design durchgehend hell: Indigo und Apricot statt Grün und Marineblau

Claude · Commit `20fe5a9`

### 2026-09-28 15:42 Uhr · Neues helles Design mit aktuellem main zusammenführen

Claude · Commit `8ae603f`

### 2026-09-28 14:38 Uhr · Revert "Startseite: fließende Fotostrecke (Baustelle -> fertiges Haus) statt 3D-Szene"

sulumsv · Commit `439e1a3`

### 2026-09-28 14:15 Uhr · Revert "Startseiten-Animation als Bildfolge nach Storyboard: 16 Bauphasen vom Plan zum Traumhaus (#25)"

sulumsv · Commit `ad1e903`

### 2026-09-28 11:38 Uhr · Startseiten-Animation heller und flüssiger, Schlussbild wie ein Drohnenfoto

Claude · Commit `9fc7403`

### 2026-09-28 11:29 Uhr · Korrekturfeld unter der Mengenermittlung: angenommene Werte in eigenen Worten ersetzen

Claude · Commit `9e376fa`

### 2026-09-28 09:49 Uhr · Belagszeilen im Raumstempel nicht mehr als Raumnamen lesen

Claude · Commit `38df6d3`

### 2026-09-28 09:47 Uhr · Raumbuch mit der Wohnnutzfläche abgleichen statt den Plan abzulehnen

Claude · Commit `9fe58b6`

### 2026-09-28 09:44 Uhr · Startseiten-Animation fotorealistisch: echte Ziegel, echte Bäume, echter Horizont

Claude · Commit `dd315d3`

### 2026-09-28 09:09 Uhr · Changelog-Einträge nicht mehr an die Kopfzeile kleben

Claude · Commit `4e59442`

### 2026-09-28 09:09 Uhr · Kostenschätzung nur noch auf Knopfdruck statt automatisch mit Richtwerten

Claude · Commit `cbbeb51`

### 2026-09-27 00:12 Uhr · Startseiten-Animation endet mit fertigem Haus im Grünen (#15)

onturkaltanakif · Commit `0a226ce`

### 2026-09-26 22:11 Uhr · Merge branch 'sulum' into main

Claude · Commit `371ae52`

### 2026-09-26 22:07 Uhr · Ungenutzte 2D-Grundriss-Animation entfernen

Claude · Commit `c2fa252`

### 2026-09-26 22:07 Uhr · 3D-CAD-Aufbauanimation: fertiges Haus statt Grundriss-Skizze auf der Startseite

Claude · Commit `c85ff37`

### 2026-09-27 00:04 Uhr · Alle Unterseiten im dunklen Stil der Startseite (#13)

onturkaltanakif · Commit `be17a8f`

### 2026-09-26 22:03 Uhr · Eigenes Logo und Favicon statt reinem Textschriftzug

Claude · Commit `b8bcd6d`

### 2026-09-27 00:02 Uhr · Startseiten-Animation: Grundriss wächst in 3D zum Rohbau (#12)

onturkaltanakif · Commit `99ff8a6`

### 2026-09-26 23:55 Uhr · Großflächenausreißer aus Raumkataster filtern (#11)

onturkaltanakif · Commit `3bfa985`

### 2026-09-26 23:51 Uhr · Scroll-Animation durch realistischen Grundriss ersetzt (#10)

onturkaltanakif · Commit `657c1cf`

### 2026-09-26 23:45 Uhr · Merge pull request #9 from sulumsv/claude/relaxed-gauss-854c1k

Sulum · Commit `e40434b`

### 2026-09-26 21:45 Uhr · README von Grund auf neu: erklärt jetzt die App statt der create-next-app-Vorlage

Claude · Commit `086c6af`

### 2026-09-26 23:45 Uhr · Startseite neu gestaltet: klares Premium-Layout mit Massenauszug-Vorschau (#8)

onturkaltanakif · Commit `f7267c2`

### 2026-09-26 23:44 Uhr · Merge pull request #7 from sulumsv/claude/relaxed-gauss-854c1k

Sulum · Commit `3cf5659`

### 2026-09-26 21:43 Uhr · Automatisches Changelog aus den Commit-Messages einführen

Claude · Commit `9370ce5`

### 2026-09-26 23:43 Uhr · LB-HB 023 vollständig einbinden: 22.650 Positionen aus 59 Leistungsgruppen (#6)

onturkaltanakif · Commit `ce7dc17`

### 2026-09-26 23:25 Uhr · Startseite komplett neu gestaltet: dunkles Design nach BauKit-Vorbild (#5)

onturkaltanakif · Commit `583807a`

### 2026-09-26 23:21 Uhr · Scroll-Animation auf der Startseite: Grundriss baut sich zum Haus auf (#4)

onturkaltanakif · Commit `a1faf88`

### 2026-09-26 22:59 Uhr · Merge pull request #3 from sulumsv/claude/startseite-problem-feld-gruen-d3jznd

onturkaltanakif · Commit `860d6d7`

### 2026-09-26 20:58 Uhr · Workflow: nach jedem Commit automatisch auf main mergen

Claude · Commit `0b098ad`

### 2026-09-26 22:56 Uhr · Merge pull request #2 from sulumsv/claude/startseite-problem-feld-gruen-d3jznd

onturkaltanakif · Commit `51c82e2`

### 2026-09-26 20:37 Uhr · Maße im Raumbuch durch Klick editierbar machen

Claude · Commit `7e042d9`

### 2026-09-26 20:35 Uhr · umfangAusFlaeche exportieren für manuelle Raumkorrekturen

Claude · Commit `9827717`

### 2026-09-26 20:32 Uhr · Raumstempel auch finden, wenn der Name unterhalb der Fläche steht

Claude · Commit `e062e31`

### 2026-09-14 12:57 Uhr · Sagen, warum der kostenlose Weg nicht gereicht hat

Claude · Commit `635a482`

### 2026-09-14 12:24 Uhr · Textweg meldet die tatsächliche Seitenzahl

Claude · Commit `f9f6315`

### 2026-09-14 12:23 Uhr · Kosten der Auswertung im Ergebnis anzeigen

Claude · Commit `eba389d`

### 2026-09-14 12:20 Uhr · Auswertung liefert ihren Verbrauch mit

Claude · Commit `85948e0`

### 2026-09-14 12:20 Uhr · Kostenzähler für die API-Aufrufe einer Auswertung

Claude · Commit `e202bc2`

### 2026-09-14 12:06 Uhr · Textlesen: Fragmente zu Zeilen fügen und unsichere Ergebnisse verwerfen

Claude · Commit `ba36e94`

### 2026-09-14 11:51 Uhr · Plan aus der eigenen Textebene lesen, ohne Bilderkennung

Claude · Commit `bb85fcd`

### 2026-09-14 11:35 Uhr · Hinweis zum fehlenden Schlüssel nennt den richtigen Ort

Claude · Commit `f11b27f`

### 2026-09-14 11:31 Uhr · Plan im Browser in Seitenbilder umwandeln statt die PDF-Datei hochzuladen

Claude · Commit `d3c18db`

### 2026-09-14 11:23 Uhr · Befunde aus dem Code-Review behoben

Claude · Commit `d9feecc`

### 2026-09-14 11:14 Uhr · Auswertung gegen Zeitrahmen, Teilausfälle und Uploadgrenzen absichern

Claude · Commit `bdc2795`

### 2026-09-14 11:05 Uhr · Nachweise aus einer gemeinsamen Registry statt zweier getrennter Listen

Claude · Commit `0dbe9b7`

### 2026-09-14 11:00 Uhr · Zwei Darstellungsfehler behoben

Claude · Commit `2224772`

### 2026-09-14 10:56 Uhr · Startseite: Einheitspreise als erster Schritt im Ablauf

Claude · Commit `5d175f6`

### 2026-09-14 10:55 Uhr · Kostenspalten in der Ansicht und Download als eigenständige HTML-Datei

Claude · Commit `967f0dd`

### 2026-09-14 10:50 Uhr · Einheitspreise des Betriebs eingebbar und in der Auswertung wirksam

Claude · Commit `8a7783d`

### 2026-09-14 10:49 Uhr · Massenauszug um fehlende Gewerke erweitert und bepreist

Claude · Commit `06c8c9b`

### 2026-09-14 10:45 Uhr · Einheitspreis-Katalog als Grundlage der Kostenschätzung

Claude · Commit `bdbdc90`

### 2026-08-27 07:56 Uhr · Fehler in Konfidenzkennzeichnung, Annahmen und Randfällen behoben

Claude · Commit `8888024`

### 2026-08-26 22:27 Uhr · Massenauszug in der Oberfläche: Raumbuch, Abschnitte, Annahmen, Prüfpunkte

Claude · Commit `4bd92d0`

### 2026-08-26 22:23 Uhr · Prüflauf aus dem Next.js Typescope nehmen

Claude · Commit `89e34cb`

### 2026-08-26 22:22 Uhr · Ableitung: aus Räumen und Plankontext den vollständigen Massenauszug rechnen

Claude · Commit `edfbf25`

### 2026-08-26 20:11 Uhr · Ergebnisansicht: Herkunft, Material und Plankontext anzeigen

Claude · Commit `56bed3f`

### 2026-08-26 20:09 Uhr · Planauswertung: Kontextdurchgang, Structured Outputs, Opus 5

Claude · Commit `9b3b6cb`

### 2026-08-26 20:07 Uhr · LB-HB Leistungskatalog als Datendatei statt hartcodierter Zuordnung

Claude · Commit `513d6b0`

### 2026-08-26 19:22 Uhr · PDF-Verarbeitung von externem pdftoppm-Binary auf pdf-to-img umgestellt

Claude · Commit `bcdcd49`

### 2026-08-26 15:42 Uhr · Startseite überarbeitet: professionelleres Design und ausführlichere Erklärungen

Claude · Commit `c720e80`

### 2026-08-26 15:38 Uhr · Verbleibende rote Fehleranzeigen (Login, Ergebnis-Fehler) auf Grün umstellen

Claude · Commit `178f039`

### 2026-08-26 17:31 Uhr · Startseite: "Das Problem"-Feld von Rot auf Grün ändern (#1)

onturkaltanakif · Commit `41510e1`

### 2026-08-26 16:57 Uhr · Initial commit

sulumsv · Commit `282f8c9`
