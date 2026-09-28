import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Abschnitt, CtaBand, KnopfSekundaer, SeitenHero } from "@/components/Marketing";
import Link from "next/link";

const PLAENE = [
  {
    eyebrow: "Einzelplan",
    preis: "9 €",
    zusatz: "pro Plan",
    hinweis: "Vorläufiger Richtwert in der Prototypphase.",
    merkmale: ["Eine vollständige Planauswertung", "Massenauszug nach LB-HB 023", "Rechenweg zu jeder Position", "Export als PDF und Excel"],
    hervorgehoben: true,
    cta: { href: "/app", label: "Plan analysieren →" },
  },
  {
    eyebrow: "Betrieb",
    preis: "79 €",
    zusatz: "pro Monat",
    hinweis: "Für Betriebe mit laufenden Angeboten.",
    merkmale: ["Bis zu 30 Pläne im Monat", "Eigene Einheitspreise", "Verlauf aller Auswertungen", "Persönliches Onboarding"],
    cta: { href: "/demo", label: "Demo anfragen →" },
  },
  {
    eyebrow: "Mehrere Standorte",
    preis: "Auf Anfrage",
    zusatz: "",
    hinweis: "Für Unternehmen mit mehreren Teams.",
    merkmale: ["Unbegrenzte Pläne", "Mehrere Nutzerkonten", "Eigene Vorlagen je Standort"],
    cta: { href: "/kontakt", label: "Angebot anfragen →" },
  },
];

export default function PreisePage() {
  return (
    <main className="flex-1 bg-[#fbf8f3]">
      <SiteNav />
      <SeitenHero
        eyebrow="Preise"
        titel="Was eine Analyse kostet."
        text="Vorläufige Richtwerte für die Prototypphase. Kein Abo, keine Mindestlaufzeit. Die endgültige Preisstruktur steht noch nicht fest."
      />
      <Abschnitt>
        <div className="grid md:grid-cols-3 gap-5">
          {PLAENE.map((p) => (
            <div
              key={p.eyebrow}
              className={`rounded-2xl border p-7 flex flex-col ${
                p.hervorgehoben ? "border-[#231f1a] border-2 bg-[#f8ece4]" : "border-[#e8e0d2] bg-white"
              }`}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#c2562f]">{p.eyebrow}</p>
              <p className="mt-4 font-display font-extrabold tracking-tight text-[2.5rem] leading-none text-[#231f1a]">
                {p.preis}
                {p.zusatz && <span className="ml-2 font-body font-normal text-sm text-[#6e665b]">{p.zusatz}</span>}
              </p>
              <p className="mt-3 text-xs text-[#9a9184]">{p.hinweis}</p>
              <ul className="mt-6 space-y-2.5 flex-1 text-sm text-[#3f3a33]">
                {p.merkmale.map((m) => (
                  <li key={m} className="flex gap-2.5">
                    <span className="text-[#c2562f]">✓</span>
                    {m}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {p.hervorgehoben ? (
                  <Link
                    href={p.cta.href}
                    className="inline-flex rounded-full bg-[#c2562f] text-white font-semibold text-sm px-6 py-3 hover:bg-[#a8461f] transition"
                  >
                    {p.cta.label}
                  </Link>
                ) : (
                  <KnopfSekundaer href={p.cta.href} ton="hell">{p.cta.label}</KnopfSekundaer>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-sm text-[#6e665b] leading-relaxed">
          Zum Vergleich: Das Aufmaß für ein Einfamilienhaus dauert von Hand leicht einen ganzen Arbeitstag. Mit
          MengenWerk bleibt die Kontrolle der Ergebnisse.
        </p>
      </Abschnitt>
      <CtaBand titel="Neugierig, was MengenWerk für Sie rechnet?" text="Schicken Sie uns einen Plan, den Sie schon kalkuliert haben, und vergleichen Sie Position für Position." />
      <SiteFooter />
    </main>
  );
}
