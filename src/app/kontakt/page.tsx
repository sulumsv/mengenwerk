import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Abschnitt, KnopfPrimaer, SeitenHero } from "@/components/Marketing";

export default function KontaktPage() {
  return (
    <main className="flex-1 bg-[#ffffff]">
      <SiteNav />
      <SeitenHero
        eyebrow="Kontakt"
        titel="Sprechen Sie mit uns."
        text="Fragen zum Tool, zu Preisen oder ein Testplan, den wir gemeinsam durchrechnen sollen? Schreiben Sie uns."
      >
        <KnopfPrimaer href="/demo">Demo anfragen →</KnopfPrimaer>
      </SeitenHero>
      <Abschnitt>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl">
          <div className="rounded-xl border border-[#e6e8ec] bg-white p-7">
            <p className="text-sm font-semibold text-[#1f2a44] mb-3">E-Mail</p>
            <a href="mailto:office@msv-digital.com" className="text-lg font-medium text-[#111827] hover:underline">
              office@msv-digital.com
            </a>
          </div>
          <div className="rounded-xl border border-[#e6e8ec] bg-white p-7">
            <p className="text-sm font-semibold text-[#1f2a44] mb-3">Anschrift</p>
            <p className="text-lg leading-relaxed text-[#111827]">
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
