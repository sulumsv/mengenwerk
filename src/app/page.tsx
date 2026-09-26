import Link from "next/link";
import { HausBauAnimation } from "@/components/HausBauAnimation";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import {
  IconArea,
  IconCheck,
  IconConcrete,
  IconCross,
  IconDoor,
  IconGroup,
  IconSpeed,
  IconTiles,
  IconTrace,
  IconWall,
  IconWindow,
} from "@/components/Icons";

const ERKENNT = [
  { titel: "Fenster", text: "Maße, Stückzahl und Öffnungsart je Ansicht.", Icon: IconWindow },
  { titel: "Türen", text: "Lichte Maße und Zuordnung zum jeweiligen Raum.", Icon: IconDoor },
  { titel: "Wände", text: "Längen und Stärken für Rohbau- und Ausbauwände.", Icon: IconWall },
  { titel: "Flächen", text: "Boden-, Wand- und Deckenflächen je Raum.", Icon: IconArea },
  { titel: "Beton", text: "Kubaturen für Fundament, Decke und Stützen.", Icon: IconConcrete },
  { titel: "Fliesen", text: "Verlegeflächen inklusive Verschnittzuschlag.", Icon: IconTiles },
];

const VORTEILE = [
  {
    titel: "Nachvollziehbar",
    text: "Jede Menge zeigt, aus welchen Maßen sie berechnet wurde. Du prüfst in Sekunden gegen, statt der Zahl blind zu vertrauen.",
    Icon: IconTrace,
  },
  {
    titel: "Zeit gespart",
    text: "Was sonst zeilenweise von Hand ausgemessen wird, liegt nach dem Hochladen als fertige Stückliste vor.",
    Icon: IconSpeed,
  },
  {
    titel: "Sofort einsetzbar",
    text: "Ergebnisse sind nach LB HB Leistungsgruppen gruppiert und lassen sich direkt in Angebot oder Bestellung übernehmen.",
    Icon: IconGroup,
  },
];

const STATS = [
  { wert: "Minuten", label: "Plan → Massenauszug" },
  { wert: "22.650+", label: "Positionen nach LB-HB 023" },
  { wert: "100 %", label: "Jede Menge mit Rechenweg" },
  { wert: "Kein Abo", label: "Sofort nutzbar" },
];

export default function Home() {
  return (
    <main className="flex-1 bg-line-strong text-surface">
      {/* ── NAV ── */}
      <SiteNav dark />

      {/* ── HERO ── */}
      <section className="px-6 md:px-10 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
        <div>
          <span className="inline-block font-mono text-xs uppercase tracking-widest text-surface/50 border border-white/15 rounded-full px-3 py-1 mb-6">
            KI-Mengenermittlung · für Österreich
          </span>
          <h1 className="font-display font-black uppercase leading-[0.92] tracking-tight text-[clamp(2.6rem,6vw,4.8rem)]">
            Vom Einreichplan zur{" "}
            <span className="text-accent">belastbaren</span>
            {" "}Kalkulation.
          </h1>
          <p className="mt-6 text-lg text-surface/60 max-w-md leading-relaxed">
            MengenWerk liest Einreichpläne — als Vektor-PDF oder Scan — und erstellt automatisch eine strukturierte
            Mengenermittlung mit sichtbarem Rechenweg für jede Position.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/app"
              className="inline-block rounded-md bg-accent text-accent-fg font-display font-bold uppercase tracking-wide text-sm px-6 py-3 hover:opacity-90"
            >
              Plan analysieren →
            </Link>
            <Link
              href="/vorschau"
              className="inline-block rounded-md border border-white/20 text-surface font-display font-bold uppercase tracking-wide text-sm px-6 py-3 hover:bg-white/5"
            >
              Beispielauswertung
            </Link>
          </div>
        </div>

        {/* INPUT / OUTPUT card */}
        <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/10 overflow-hidden">
          <div className="px-6 pt-6 pb-5">
            <p className="font-mono text-xs uppercase tracking-widest text-surface/40 mb-3">Input</p>
            <p className="font-display font-bold text-lg mb-4">Einreichplan (PDF)</p>
            <ul className="space-y-2">
              {["Grundrisse", "Schnitte", "Ansichten", "Maßketten & Raumstempel"].map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-surface/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface/30 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 py-4 bg-accent/10 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <p className="font-mono text-xs uppercase tracking-widest text-accent">MengenWerk analysiert & kalkuliert</p>
          </div>

          <div className="px-6 pt-5 pb-6">
            <p className="font-mono text-xs uppercase tracking-widest text-surface/40 mb-3">Output</p>
            <p className="font-display font-bold text-lg mb-4">Massenauszug + bepreistes LV</p>
            <ul className="space-y-2">
              {[
                "Strukturierte Mengenermittlung mit Rechenweg",
                "Positionen nach LB HB Leistungsgruppen",
                "Kostenschätzung mit eigenen Einheitspreisen",
                "Manuelle Korrekturen jederzeit möglich",
              ].map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-surface/70">
                  <IconCheck className="w-3.5 h-3.5 shrink-0 text-highlight" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="border-y border-white/10 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {STATS.map(({ wert, label }) => (
            <div key={wert} className="py-6 px-6 first:pl-0">
              <p className="font-display font-black text-2xl md:text-3xl text-surface">{wert}</p>
              <p className="font-mono text-xs uppercase tracking-wide text-surface/40 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SCROLL ANIMATION ── */}
      <HausBauAnimation />

      {/* ── DAS PROBLEM ── */}
      <section className="px-6 md:px-10 py-20 max-w-7xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Das Problem</p>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <h2 className="font-display font-black uppercase text-[clamp(2rem,5vw,3.5rem)] leading-[0.95]">
            Mengenermittlung kostet Tage. Nicht Minuten.
          </h2>
          <div className="space-y-4 text-surface/60 leading-relaxed">
            <p>
              Kleine Baubetriebe rechnen Fensterlisten, Betonkubaturen und Flächen noch immer von Hand aus Excel-Tabellen zusammen.
              Jede Zeile ist ein manueller Messschritt, jede Zahl ein potenzieller Fehler.
            </p>
            <p>
              Niemand sieht dem Ergebnis an, wie es entstanden ist — und wer erst auf der Baustelle merkt, dass etwas fehlt,
              baut teuer um.
            </p>
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <p className="font-mono text-xs uppercase tracking-widest text-alert mb-2">⬤ &nbsp;Häufigste Fehlerquelle</p>
              <p className="text-sm text-surface/80">
                Falsche Geschosshöhe angesetzt, Verschnitt vergessen, Öffnungsabzüge nicht berücksichtigt —
                MengenWerk zeigt zu jeder Position den Rechenweg, damit du prüfst statt blind vertraust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VERGLEICH ── */}
      <section className="px-6 md:px-10 pb-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-px rounded-xl overflow-hidden border border-white/10">
          <div className="bg-white/5 p-8">
            <h3 className="font-display font-bold uppercase text-lg mb-6 text-surface/40">Ohne MengenWerk</h3>
            <ul className="space-y-4">
              {[
                "Zahlen einzeln aus dem Plan abmessen und in Excel übertragen",
                "Kein Nachweis, wie eine Menge zustande gekommen ist",
                "Fehler fallen erst beim Material oder auf der Baustelle auf",
              ].map((punkt) => (
                <li key={punkt} className="flex gap-3 text-sm text-surface/50 leading-relaxed">
                  <IconCross className="w-4 h-4 shrink-0 mt-0.5 text-alert" />
                  {punkt}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-accent/10 p-8">
            <h3 className="font-display font-bold uppercase text-lg mb-6 text-accent">Mit MengenWerk</h3>
            <ul className="space-y-4">
              {[
                "Plan hochladen, Mengen werden automatisch erkannt",
                "Jede Position zeigt ihren Rechenweg zum Nachprüfen",
                "Ergebnis direkt nach LB HB Leistungsgruppen sortiert",
              ].map((punkt) => (
                <li key={punkt} className="flex gap-3 text-sm text-surface/80 leading-relaxed">
                  <IconCheck className="w-4 h-4 shrink-0 mt-0.5 text-highlight" />
                  {punkt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── SO FUNKTIONIERT ES ── */}
      <section id="so-funktioniert-es" className="border-t border-white/10 px-6 md:px-10 py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">So funktioniert es</p>
          <h2 className="font-display font-black uppercase text-[clamp(2rem,4vw,3rem)] mb-12">
            Vier Schritte. Fertige Kalkulation.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px rounded-xl overflow-hidden border border-white/10">
            {[
              {
                titel: "Einheitspreise hinterlegen",
                text: "Einmalig die Preise des Betriebs je Leistungsgruppe eintragen. Leere Felder verwenden einen Richtwert.",
              },
              {
                titel: "Plan hochladen",
                text: "Vektor-PDF, gescannte Einreichung oder Foto. MengenWerk erkennt den Dateityp automatisch.",
              },
              {
                titel: "Massenauszug prüfen",
                text: "Von Erdaushub über Beton, Estrich und Fassade bis Dach — jede Menge mit Rechenweg und Herkunft.",
              },
              {
                titel: "Kostenschätzung übernehmen",
                text: "Aus Mengen und Einheitspreisen entsteht die Schätzung. Direkt weiterverwendbar.",
              },
            ].map((s, i) => (
              <div key={s.titel} className="bg-white/5 p-8 hover:bg-white/8 transition-colors">
                <span className="font-mono text-xs text-surface/30">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display font-bold uppercase text-base mt-3 mb-3 text-surface">{s.titel}</h3>
                <p className="text-sm text-surface/50 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/app"
              className="inline-block rounded-md bg-accent text-accent-fg font-display font-bold uppercase tracking-wide text-sm px-6 py-3"
            >
              Jetzt starten →
            </Link>
            <Link
              href="/einheitspreise"
              className="inline-block rounded-md border border-white/20 text-surface font-display font-bold uppercase tracking-wide text-sm px-6 py-3 hover:bg-white/5"
            >
              Einheitspreise hinterlegen
            </Link>
          </div>
        </div>
      </section>

      {/* ── WAS MENGENWERK ERKENNT ── */}
      <section className="border-t border-white/10 px-6 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Was erkannt wird</p>
          <h2 className="font-display font-black uppercase text-[clamp(2rem,4vw,3rem)] mb-4">
            Ein Baustein für jede Position.
          </h2>
          <p className="text-surface/50 max-w-2xl mb-12 leading-relaxed">
            Alles, was sonst von Hand ausgemessen wird — automatisch erkannt, berechnet und mit Rechenweg belegt.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ERKENNT.map(({ titel, text, Icon }) => (
              <div key={titel} className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-colors">
                <Icon className="w-6 h-6 text-accent" />
                <h3 className="font-display font-bold uppercase text-base mt-4 mb-2 text-surface">{titel}</h3>
                <p className="text-sm text-surface/50 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WARUM MENGENWERK ── */}
      <section className="border-t border-white/10 px-6 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Warum MengenWerk</p>
          <div className="grid md:grid-cols-3 gap-10">
            {VORTEILE.map(({ titel, text, Icon }) => (
              <div key={titel}>
                <Icon className="w-7 h-7 text-accent" />
                <h3 className="font-display font-bold uppercase text-lg mt-4 mb-2 text-surface">{titel}</h3>
                <p className="text-sm text-surface/50 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/10 px-6 md:px-10 py-24">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-display font-black uppercase text-[clamp(2.2rem,5vw,4rem)] leading-[0.95] mb-6">
            Sehen Sie MengenWerk an<br />Ihrem eigenen Plan.
          </h2>
          <p className="text-surface/50 max-w-xl mx-auto mb-10 leading-relaxed">
            Plan hochladen und in wenigen Minuten sehen, welche Mengen MengenWerk erkennt.
            Kein Abo, kein Vertrag — sofort loslegen.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/app"
              className="inline-block rounded-md bg-accent text-accent-fg font-display font-bold uppercase tracking-wide text-sm px-8 py-4 hover:opacity-90"
            >
              Plan analysieren →
            </Link>
            <Link
              href="/vorschau"
              className="inline-block rounded-md border border-white/20 text-surface font-display font-bold uppercase tracking-wide text-sm px-8 py-4 hover:bg-white/5"
            >
              Beispielauswertung ansehen
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter dark />
    </main>
  );
}
