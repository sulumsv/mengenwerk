import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Abschnitt, AbschnittKopf, CtaBand, Karte, SeitenHero } from "@/components/Marketing";

const WERTE = [
  { titel: "Österreich zuerst", text: "Gebaut für österreichische Betriebe und den LB-HB 023 Katalog. Keine angepasste Lösung aus dem Ausland." },
  { titel: "Nachvollziehbar statt Blackbox", text: "Keine Zahl ohne Rechenweg. Jede Annahme wird offengelegt. So kann man dem Ergebnis vertrauen." },
  { titel: "Aus der Praxis", text: "Entwickelt an echten Einreichplänen, für die Zahlen, die man für Angebot und Bestellung wirklich braucht." },
];

export default function UeberUnsPage() {
  return (
    <main className="flex-1 bg-[#ffffff]">
      <SiteNav />
      <SeitenHero
        eyebrow="Über uns"
        titel="Mengenermittlung verdient bessere Werkzeuge."
        text="MengenWerk ist entstanden, weil viele kleine Baubetriebe Mengen noch immer von Hand aus Bauplänen herausrechnen."
      />
      <Abschnitt>
        <div className="max-w-2xl mx-auto space-y-5 text-[15px] text-[#5d6b78] leading-relaxed">
          <p>
            Die vorhandenen Werkzeuge sind entweder auf große Baufirmen zugeschnitten oder auf Spezialgewerke
            beschränkt. Für den Baumeister, der abends noch ein Angebot rechnen muss, passt beides nicht.
          </p>
          <p>
            Wir bauen ein schlankes Werkzeug, das genau die Zahlen liefert, die man für eine Bestellung oder ein Angebot
            braucht. Mit sichtbarem Rechenweg und passend zum österreichischen LB-HB Katalog.
          </p>
        </div>
      </Abschnitt>
      <Abschnitt ton="grau">
        <AbschnittKopf eyebrow="Wofür wir stehen" titel="Drei Überzeugungen, die MengenWerk prägen." />
        <div className="grid md:grid-cols-3 gap-4">
          {WERTE.map((w) => (
            <Karte key={w.titel} titel={w.titel}>
              {w.text}
            </Karte>
          ))}
        </div>
      </Abschnitt>
      <CtaBand titel="Sehen Sie MengenWerk an Ihrem eigenen Plan." />
      <SiteFooter />
    </main>
  );
}
