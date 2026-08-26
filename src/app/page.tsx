import Link from "next/link";
import { BlueprintWindow } from "@/components/BlueprintWindow";
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

const VERGLEICH = {
  ohne: [
    "Zahlen einzeln aus dem Plan abmessen und in Excel übertragen",
    "Kein Nachweis, wie eine Menge zustande gekommen ist",
    "Fehler fallen erst beim Material oder auf der Baustelle auf",
  ],
  mit: [
    "Plan hochladen, Mengen werden automatisch erkannt",
    "Jede Position zeigt ihren Rechenweg zum Nachprüfen",
    "Ergebnis direkt nach LB HB Leistungsgruppen sortiert",
  ],
};

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

export default function Home() {
  return (
    <main className="flex-1">
      <SiteNav />

      <section className="px-6 md:px-10 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
        <div>
          <span className="font-mono text-xs uppercase tracking-wide text-fg-muted border border-line rounded-full px-3 py-1">
            Mengenermittlung für kleine Baubetriebe
          </span>
          <h1 className="mt-6 font-display font-black uppercase leading-[0.95] tracking-tight text-[clamp(2.5rem,6vw,4.5rem)]">
            Pläne rein.
            <br />
            Mengen raus.
          </h1>
          <p className="mt-6 text-lg text-fg-muted max-w-md leading-relaxed">
            Lade einen Einreichplan hoch, egal ob Vektor PDF oder gescannt. MengenWerk erkennt Fenster, Türen, Wände
            und Flächen automatisch und rechnet Beton, Fliesen und Öffnungen mit sichtbarem Rechenweg.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/app"
              className="inline-block rounded-md bg-line-strong text-surface font-display font-bold uppercase tracking-wide text-sm px-6 py-3"
            >
              Plan analysieren
            </Link>
            <a
              href="#so-funktioniert-es"
              className="inline-block font-display font-bold uppercase tracking-wide text-sm px-2 py-3 text-fg hover:text-fg-muted"
            >
              So funktioniert es ↓
            </a>
          </div>
        </div>
        <div className="relative rounded-lg border border-line bg-surface-2 p-6">
          <BlueprintWindow />
          <p className="mt-4 font-mono text-xs text-fg-muted uppercase tracking-wide">
            Fig. 01 — automatisch erkanntes Fenstermaß
          </p>
        </div>
      </section>

      <section className="bg-highlight text-highlight-fg px-6 md:px-10 py-14">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_2fr] gap-8">
          <h2 className="font-display font-black uppercase text-3xl leading-tight">Das Problem</h2>
          <p className="text-lg leading-relaxed max-w-2xl">
            Kleine Baubetriebe rechnen Fensterlisten, Betonkubaturen und Flächen noch immer von Hand aus Excel
            Tabellen zusammen. Jede Zeile ist ein manueller Messschritt, jede Zahl ein potenzieller Fehler, und
            niemand sieht dem Ergebnis an, wie es entstanden ist.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-10 py-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-px bg-line rounded-lg overflow-hidden border border-line">
          <div className="bg-surface-2 p-8">
            <h3 className="font-display font-bold uppercase text-lg mb-5 text-fg-muted">Ohne MengenWerk</h3>
            <ul className="space-y-4">
              {VERGLEICH.ohne.map((punkt) => (
                <li key={punkt} className="flex gap-3 text-sm text-fg-muted leading-relaxed">
                  <IconCross className="w-4 h-4 shrink-0 mt-0.5 text-fg-muted" />
                  {punkt}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface-2 p-8">
            <h3 className="font-display font-bold uppercase text-lg mb-5">Mit MengenWerk</h3>
            <ul className="space-y-4">
              {VERGLEICH.mit.map((punkt) => (
                <li key={punkt} className="flex gap-3 text-sm leading-relaxed">
                  <IconCheck className="w-4 h-4 shrink-0 mt-0.5 text-highlight" />
                  {punkt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="so-funktioniert-es" className="px-6 md:px-10 py-16 max-w-7xl mx-auto scroll-mt-20">
        <h2 className="font-display font-black uppercase text-3xl mb-10">So funktioniert es</h2>
        <div className="grid md:grid-cols-3 gap-px bg-line rounded-lg overflow-hidden border border-line">
          {[
            {
              titel: "Plan hochladen",
              text: "Vektor PDF, gescannte Einreichung oder Foto. MengenWerk erkennt den Dateityp automatisch.",
            },
            {
              titel: "Erkennung prüfen",
              text: "Fenster, Türen, Wände und Flächen werden erkannt und mit Rechenweg dargestellt, damit du gegenrechnen kannst.",
            },
            {
              titel: "Mengen übernehmen",
              text: "Ergebnisse sind nach LB HB Leistungsgruppen sortiert und bereit für Angebot oder Bestellung.",
            },
          ].map((s, i) => (
            <div key={s.titel} className="bg-surface p-8">
              <span className="font-mono text-xs text-fg-muted">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display font-bold uppercase text-lg mt-2 mb-3">{s.titel}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-10 py-16 max-w-7xl mx-auto">
        <h2 className="font-display font-black uppercase text-3xl mb-2">Was MengenWerk erkennt</h2>
        <p className="text-fg-muted max-w-2xl mb-10">
          Ein Baustein für jede Position, die sonst von Hand ausgemessen wird.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {ERKENNT.map(({ titel, text, Icon }) => (
            <div key={titel} className="rounded-lg border border-line bg-surface-2 p-6">
              <Icon className="w-7 h-7 text-accent" />
              <h3 className="font-display font-bold uppercase text-base mt-4 mb-2">{titel}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-line-strong text-surface px-6 md:px-10 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-black uppercase text-3xl mb-10">Warum MengenWerk</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {VORTEILE.map(({ titel, text, Icon }) => (
              <div key={titel}>
                <Icon className="w-7 h-7 text-accent" />
                <h3 className="font-display font-bold uppercase text-lg mt-4 mb-2">{titel}</h3>
                <p className="text-sm text-surface/70 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 py-20 max-w-7xl mx-auto text-center">
        <h2 className="font-display font-black uppercase text-3xl md:text-4xl mb-4">
          Bereit für den ersten Plan?
        </h2>
        <p className="text-fg-muted max-w-xl mx-auto mb-8">
          Lade einen Plan hoch und sieh in wenigen Minuten, welche Mengen MengenWerk erkennt.
        </p>
        <Link
          href="/app"
          className="inline-block rounded-md bg-line-strong text-surface font-display font-bold uppercase tracking-wide text-sm px-8 py-3.5"
        >
          Plan analysieren
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
