import Link from "next/link";
import { BlueprintWindow } from "@/components/BlueprintWindow";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

export default function Home() {
  return (
    <main className="flex-1">
      <SiteNav />

      <section className="px-6 md:px-10 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
        <div>
          <h1 className="font-display font-black uppercase leading-[0.95] tracking-tight text-[clamp(2.5rem,6vw,4.5rem)]">
            Pläne rein.
            <br />
            Mengen raus.
          </h1>
          <p className="mt-6 text-lg text-fg-muted max-w-md leading-relaxed">
            Lade einen Einreichplan hoch, egal ob Vektor PDF oder gescannt. MengenWerk erkennt Fenster, Türen, Wände
            und Flächen automatisch und rechnet Beton, Fliesen und Öffnungen mit sichtbarem Rechenweg.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-block rounded-md bg-line-strong text-surface font-display font-bold uppercase tracking-wide text-sm px-6 py-3"
          >
            Plan analysieren
          </Link>
        </div>
        <div className="relative rounded-lg border border-line bg-surface-2 p-6">
          <BlueprintWindow />
        </div>
      </section>

      <section className="bg-alert text-alert-fg px-6 md:px-10 py-14">
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
          ].map((s) => (
            <div key={s.titel} className="bg-surface p-8">
              <h3 className="font-display font-bold uppercase text-lg mb-3">{s.titel}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
