import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

const PLAENE = [
  {
    name: "Einzelplan",
    preis: "9",
    einheit: "pro analysiertem Plan",
    merkmale: ["Eine Planauswertung", "Gruppierte Stückliste", "Rechenweg zu jeder Position", "LB HB Zuordnung"],
  },
  {
    name: "Betrieb",
    preis: "79",
    einheit: "pro Monat",
    merkmale: ["Bis zu 30 Pläne im Monat", "Alle Funktionen aus Einzelplan", "Export als PDF und Excel", "Verlauf aller Auswertungen"],
    hervorgehoben: true,
  },
  {
    name: "Mehrere Standorte",
    preis: "Auf Anfrage",
    einheit: "individuell",
    merkmale: ["Unbegrenzte Pläne", "Mehrere Nutzerkonten", "Eigene Vorlagen je Standort", "Persönliche Einrichtung"],
  },
];

export default function PreisePage() {
  return (
    <main className="flex-1">
      <SiteNav />
      <section className="px-6 md:px-10 pt-16 pb-8 max-w-7xl mx-auto">
        <h1 className="font-display font-black uppercase leading-[0.95] tracking-tight text-[clamp(2rem,5vw,3.5rem)]">
          Preise
        </h1>
        <p className="mt-4 text-lg text-fg-muted max-w-xl leading-relaxed">
          Vorläufige Richtwerte für die Prototypphase. Die endgültige Preisstruktur steht noch nicht fest.
        </p>
      </section>

      <section className="px-6 md:px-10 pb-20 max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        {PLAENE.map((p) => (
          <div
            key={p.name}
            className={`rounded-lg border p-8 flex flex-col ${p.hervorgehoben ? "border-line-strong bg-surface-2" : "border-line bg-surface-2"}`}
          >
            <h2 className="font-display font-bold uppercase text-xl">{p.name}</h2>
            <p className="mt-6 font-mono">
              <span className="text-4xl font-semibold">{p.preis}</span>
              {p.preis !== "Auf Anfrage" && <span className="text-lg"> EUR</span>}
            </p>
            <p className="font-mono text-xs text-fg-muted uppercase tracking-wide mt-1">{p.einheit}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {p.merkmale.map((m) => (
                <li key={m} className="text-sm text-fg-muted flex gap-2">
                  <span className="text-accent">•</span>
                  {m}
                </li>
              ))}
            </ul>
            <Link
              href="/kontakt"
              className={`mt-8 text-center rounded-md font-display font-bold uppercase tracking-wide text-sm px-6 py-3 ${
                p.hervorgehoben ? "bg-line-strong text-surface" : "border border-line-strong text-fg"
              }`}
            >
              Anfragen
            </Link>
          </div>
        ))}
      </section>

      <SiteFooter />
    </main>
  );
}
