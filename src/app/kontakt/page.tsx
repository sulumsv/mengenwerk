import { SiteNav, SiteFooter } from "@/components/SiteNav";

export default function KontaktPage() {
  return (
    <main className="flex-1">
      <SiteNav />
      <section className="px-6 md:px-10 pt-16 pb-20 max-w-7xl mx-auto">
        <h1 className="font-display font-black uppercase leading-[0.95] tracking-tight text-[clamp(2rem,5vw,3.5rem)]">
          Kontakt
        </h1>
        <p className="mt-4 text-lg text-fg-muted max-w-xl leading-relaxed">
          Fragen zum Tool, zu Preisen oder ein Testplan, den wir gemeinsam durchrechnen sollen. Schreib uns.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-3xl">
          <div className="rounded-lg border border-line bg-surface-2 p-8">
            <p className="font-mono text-xs uppercase tracking-wide text-fg-muted mb-2">Mail</p>
            <a href="mailto:office@msv-digital.com" className="text-lg font-medium hover:text-accent">
              office@msv-digital.com
            </a>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-8">
            <p className="font-mono text-xs uppercase tracking-wide text-fg-muted mb-2">Anschrift</p>
            <p className="text-lg leading-relaxed">
              Sulumbek Masuev
              <br />
              Frauenfelderstraße 7/13
              <br />
              1170 Wien
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
