import type { Metadata } from "next";
import { baueMassenauszug } from "@/lib/ableitung";
import { MassenauszugAnsicht } from "@/components/Massenauszug";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { KnopfPrimaer, SeitenHero } from "@/components/Marketing";
import { BEISPIEL_ELEMENTE, BEISPIEL_KONTEXT, BEISPIEL_RAEUME } from "@/lib/beispiel";

export const metadata: Metadata = {
  title: "Beispielauswertung | MengenWerk",
  description: "So sieht ein Massenauszug aus, den MengenWerk aus einem Einreichplan erstellt.",
};

export default function VorschauPage() {
  // Nachweise, die Erdarbeiten, Spengler und PV erst ableitbar machen.
  const kontext = {
    ...BEISPIEL_KONTEXT,
    nachweise: {
      ...BEISPIEL_KONTEXT.nachweise,
      "Traufenlänge (m)": 14.26,
      "Photovoltaik Modulfläche (m2)": 19.6,
      "Unterkante Bodenplatte (m)": -0.955,
    },
  };
  const auszug = baueMassenauszug(BEISPIEL_RAEUME, BEISPIEL_ELEMENTE, kontext);

  return (
    <main className="flex-1">
      <SiteNav />
      <SeitenHero
        eyebrow="Beispielauswertung"
        titel="Massenauszug eines Einreichplans."
        text="Das Ergebnis einer Planauswertung an einem Einfamilienhaus. Jede Menge zeigt ihren Rechenweg und ihre Herkunft: beschriftet im Plan, daraus gerechnet oder angenommen."
      >
        <KnopfPrimaer href="/app">Eigenen Plan analysieren →</KnopfPrimaer>
      </SeitenHero>
      <section className="px-6 md:px-10 py-14 max-w-7xl mx-auto">
        <MassenauszugAnsicht auszug={auszug} titel="Massenauszug Beispielhaus" />
      </section>
      <SiteFooter />
    </main>
  );
}
