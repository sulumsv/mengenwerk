import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Abschnitt, KnopfPrimaer, SeitenHero } from "@/components/Marketing";

export default function KontaktPage() {
  return (
    <main className="flex-1 bg-[#f7f6fb]">
      <SiteNav />
      <SeitenHero
        eyebrow="Kontakt"
        titel="Sprechen Sie mit uns."
        text="Fragen zum Tool, zu Preisen oder ein Testplan, den wir gemeinsam durchrechnen sollen — schreiben Sie uns."
      >
        <KnopfPrimaer href="/demo">Demo anfragen →</KnopfPrimaer>
      </SeitenHero>
      <Abschnitt>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl">
          <div className="rounded-xl border border-[#e7e4f0] bg-white p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#3a2f9e] mb-3">E-Mail</p>
            <a href="mailto:office@msv-digital.com" className="text-lg font-medium text-[#1c1a33] hover:underline">
              office@msv-digital.com
            </a>
          </div>
          <div className="rounded-xl border border-[#e7e4f0] bg-white p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#3a2f9e] mb-3">Anschrift</p>
            <p className="text-lg leading-relaxed text-[#1c1a33]">
              Sulumbek Masuev
              <br />
              Frauenfelderstraße 7/13
              <br />
              1170 Wien
            </p>
          </div>
        </div>
      </Abschnitt>
      <SiteFooter />
    </main>
  );
}
