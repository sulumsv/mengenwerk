import { SiteNav, SiteFooter } from "@/components/SiteNav";

export default function DatenschutzPage() {
  return (
    <main className="flex-1">
      <SiteNav />
      <section className="px-6 md:px-10 pt-16 pb-20 max-w-3xl mx-auto">
        <h1 className="font-display font-black uppercase text-3xl mb-4">Datenschutz</h1>
        <p className="mb-10 rounded-md border border-accent/40 bg-accent/10 p-4 text-sm text-fg">
          Dieser Entwurf beschreibt den aktuellen technischen Stand des Prototyps. Er ersetzt keine rechtliche
          Prüfung und sollte vor dem echten Betrieb von einer Fachperson gegengelesen werden.
        </p>

        <div className="space-y-8 text-fg-muted leading-relaxed">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Verantwortlicher</p>
            <p>
              Sulumbek Masuev, Frauenfelderstraße 7/13, 1170 Wien. Kontakt siehe{" "}
              <a href="mailto:office@msv-digital.com" className="text-fg hover:text-accent">office@msv-digital.com</a>.
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Hochgeladene Pläne</p>
            <p>
              Ein hochgeladener Plan wird zur Erkennung von Maßen und Bauteilen an Anthropic als
              Verarbeitungsdienstleister für die Bilderkennung übermittelt. Die Datei wird für die Analyse
              verwendet und danach nicht dauerhaft auf unseren Servern gespeichert.
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Zugangsschutz</p>
            <p>
              Der Zugang zum Tool ist mit einem Passwort geschützt. Nach erfolgreicher Anmeldung wird ein
              technisch notwendiges Cookie gesetzt, das die Anmeldung für dreißig Tage speichert. Dieses Cookie
              enthält keine personenbezogenen Daten, sondern nur einen technischen Prüfwert.
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Hosting</p>
            <p>Die Website wird bei Vercel gehostet. Beim Aufruf werden technisch bedingt Zugriffsdaten wie IP Adresse und Zeitpunkt verarbeitet.</p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Rechte</p>
            <p>
              Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung können jederzeit per Mail an{" "}
              <a href="mailto:office@msv-digital.com" className="text-fg hover:text-accent">office@msv-digital.com</a>{" "}
              angefragt werden.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
