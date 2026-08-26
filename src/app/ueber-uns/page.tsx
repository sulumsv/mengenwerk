import { SiteNav, SiteFooter } from "@/components/SiteNav";

export default function UeberUnsPage() {
  return (
    <main className="flex-1">
      <SiteNav />
      <section className="px-6 md:px-10 pt-16 pb-20 max-w-7xl mx-auto">
        <h1 className="font-display font-black uppercase leading-[0.95] tracking-tight text-[clamp(2rem,5vw,3.5rem)] max-w-3xl">
          Gebaut von Leuten, die Software wirklich einsetzen wollen
        </h1>
        <div className="mt-10 grid md:grid-cols-2 gap-12 max-w-4xl">
          <p className="text-lg text-fg-muted leading-relaxed">
            MengenWerk kommt aus der Beobachtung, dass viele kleine Baubetriebe Mengen noch immer von Hand aus
            Bauplänen herausrechnen. Die Werkzeuge dafür sind entweder auf große Baufirmen zugeschnitten oder auf
            Spezialgewerke beschränkt.
          </p>
          <p className="text-lg text-fg-muted leading-relaxed">
            Wir bauen ein schlankes Werkzeug, das genau die Zahlen liefert, die man für eine Bestellung oder ein
            Angebot braucht, mit sichtbarem Rechenweg statt einer Blackbox, und passend zum österreichischen
            LB HB Katalog.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
