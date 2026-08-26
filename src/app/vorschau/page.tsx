import type { Metadata } from "next";
import { baueMassenauszug } from "@/lib/ableitung";
import { MassenauszugAnsicht } from "@/components/Massenauszug";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { BEISPIEL_ELEMENTE, BEISPIEL_KONTEXT, BEISPIEL_RAEUME } from "@/lib/beispiel";

export const metadata: Metadata = {
  title: "Beispielauswertung — MengenWerk",
  description: "So sieht ein Massenauszug aus, den MengenWerk aus einem Einreichplan erstellt.",
};

export default function VorschauPage() {
  const auszug = baueMassenauszug(BEISPIEL_RAEUME, BEISPIEL_ELEMENTE, BEISPIEL_KONTEXT);

  return (
    <main className="flex-1">
      <SiteNav />
      <section className="px-6 md:px-10 pt-12 pb-6 max-w-7xl mx-auto">
        <span className="font-mono text-xs uppercase tracking-wide text-fg-muted border border-line rounded-full px-3 py-1">
          Beispielauswertung
        </span>
        <h1 className="mt-5 font-display font-black uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,4.5vw,3rem)]">
          Massenauszug
          <br />
          eines Einreichplans
        </h1>
        <p className="mt-5 text-lg text-fg-muted max-w-2xl leading-relaxed">
          Das Ergebnis einer Planauswertung an einem echten Einfamilienhaus. Jede Menge zeigt ihren Rechenweg und ihre
          Herkunft — beschriftet im Plan, daraus gerechnet oder angenommen. Ein eigener Plan wird unter{" "}
          <a href="/app" className="text-fg underline underline-offset-4">
            Plan analysieren
          </a>{" "}
          hochgeladen.
        </p>
      </section>
      <section className="px-6 md:px-10 pb-16 max-w-7xl mx-auto">
        <MassenauszugAnsicht auszug={auszug} />
      </section>
      <SiteFooter />
    </main>
  );
}
