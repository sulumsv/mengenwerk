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
    cta: { href: "/demo", label: "Demo anfragen →" },
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
    <main className="flex-1 bg-[#ffffff]">
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
              className={`rounded-xl border p-7 flex flex-col ${
                p.hervorgehoben ? "border-[#1f2a44] border-2 bg-white shadow-[0_24px_48px_-32px_rgba(17,24,39,0.35)]" : "border-[#e6e8ec] bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-[#1f2a44]">{p.eyebrow}</p>
              <p className="mt-4 font-semibold tracking-tight text-[2.25rem] leading-none text-[#111827]">
                {p.preis}
                {p.zusatz && <span className="ml-2 font-body font-normal text-sm text-[#5b6472]">{p.zusatz}</span>}
              </p>
              <p className="mt-3 text-xs text-[#8b98a4]">{p.hinweis}</p>
              <ul className="mt-6 space-y-2.5 flex-1 text-sm text-[#34424f]">
                {p.merkmale.map((m) => (
                  <li key={m} className="flex gap-2.5">
                    <span className="text-[#1f2a44]">✓</span>
                    {m}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {p.hervorgehoben ? (
                  <Link
                    href={p.cta.href}
                    className="inline-flex rounded-lg bg-[#1f2a44] text-white font-semibold text-[15px] h-11 items-center px-5 hover:bg-[#2c3a5c] transition"
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
        <p className="mt-10 max-w-2xl text-sm text-[#5b6472] leading-relaxed">
          Zum Vergleich: Das Aufmaß für ein Einfamilienhaus dauert von Hand leicht einen ganzen Arbeitstag. Mit
          MengenWerk bleibt die Kontrolle der Ergebnisse.
        </p>
      </Abschnitt>
      <CtaBand titel="Neugierig, was MengenWerk für Sie rechnet?" text="Schicken Sie uns einen Plan, den Sie schon kalkuliert haben, und vergleichen Sie Position für Position." />
      <SiteFooter />
    </main>
  );
}
