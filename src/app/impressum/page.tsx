import { SiteNav, SiteFooter } from "@/components/SiteNav";

export default function ImpressumPage() {
  return (
    <main className="flex-1">
      <SiteNav />
      <section className="px-6 md:px-10 pt-16 pb-20 max-w-3xl mx-auto">
        <h1 className="font-display font-black uppercase text-3xl mb-10">Impressum</h1>

        <div className="space-y-8 text-fg-muted leading-relaxed">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Angaben gemäß Paragraf 5 ECG</p>
            <p>
              Sulumbek Masuev
              <br />
              Frauenfelderstraße 7/13
              <br />
              1170 Wien
              <br />
              Österreich
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Kontakt</p>
            <p>
              Mail: <a href="mailto:office@msv-digital.com" className="text-fg hover:text-accent">office@msv-digital.com</a>
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Unternehmensgegenstand</p>
            <p>
              Gewerberechtlich: Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik.
            </p>
            <p className="mt-2">
              Im Konkreten: Konzeption und Entwicklung von Websites, Web und Desktop Anwendungen, technisches und
              semantisches SEO, sowie KI Workflows, Chatbots und Testautomatisierung.
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Aufsichtsbehörde</p>
            <p>Magistratisches Bezirksamt für den 9. und 17. Bezirk, Elterleinplatz 14, 1170 Wien.</p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">UID Nummer</p>
            <p>ATU79420618</p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">GISA Zahl</p>
            <p>36982943</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
