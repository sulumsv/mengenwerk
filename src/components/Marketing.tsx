import Link from "next/link";

/*
 * Gestaltungsregeln für alle öffentlichen Seiten:
 * Flächen weiß oder #f8f9fb, Linien #e6e8ec, Text #111827 bzw. #5b6472,
 * Aktionen Nachtblau #1f2a44, Safran #f2b233 nur für kleine Akzente.
 * Rundung 12 px, Abschnitte 96 px Abstand, Inhalte max. 1120 px breit.
 */

export function Eyebrow({ children }: { children: React.ReactNode; tone?: string }) {
  return <p className="mb-3 text-sm font-semibold text-[#1f2a44]">{children}</p>;
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1120px] px-5 md:px-8 ${className}`}>{children}</div>;
}

type Ton = "dunkel" | "hell" | "grau";

export function Abschnitt({
  ton = "hell",
  children,
  className = "",
  id,
}: {
  ton?: Ton;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const hintergrund = ton === "hell" ? "bg-white" : "bg-[#f8f9fb] border-y border-[#eef0f3]";
  return (
    <section id={id} className={`${hintergrund} py-20 md:py-24 scroll-mt-20 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function AbschnittKopf({
  eyebrow,
  titel,
  text,
  mittig = false,
}: {
  eyebrow: string;
  titel: React.ReactNode;
  text?: React.ReactNode;
  ton?: Ton;
  mittig?: boolean;
}) {
  return (
    <div className={`mb-12 max-w-2xl ${mittig ? "mx-auto text-center" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-tight text-[#111827]">{titel}</h2>
      {text && <p className="mt-4 text-[16px] leading-relaxed text-[#5b6472]">{text}</p>}
    </div>
  );
}

export function SeitenHero({
  eyebrow,
  titel,
  text,
  children,
}: {
  eyebrow: string;
  titel: React.ReactNode;
  text?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#eef0f3] bg-[#f8f9fb]">
      <Container className="py-16 md:py-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="max-w-3xl text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-[#111827]">
          {titel}
        </h1>
        {text && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[#5b6472]">{text}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </Container>
    </section>
  );
}

export function Karte({
  titel,
  children,
  nummer,
}: {
  titel: string;
  children: React.ReactNode;
  ton?: Ton;
  nummer?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e6e8ec] bg-white p-6">
      {nummer && (
        <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef1f6] text-sm font-semibold text-[#1f2a44]">
          {Number(nummer)}
        </span>
      )}
      <h3 className="mb-2 text-[17px] font-semibold text-[#111827]">{titel}</h3>
      <div className="text-[15px] leading-relaxed text-[#5b6472]">{children}</div>
    </div>
  );
}

export function KnopfPrimaer({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1f2a44] px-5 text-[15px] font-semibold text-white transition hover:bg-[#2c3a5c]"
    >
      {children}
    </Link>
  );
}

export function KnopfSekundaer({ href, children }: { href: string; children: React.ReactNode; ton?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d4d8df] bg-white px-5 text-[15px] font-semibold text-[#111827] transition hover:border-[#9aa3b0]"
    >
      {children}
    </Link>
  );
}

export function CtaBand({
  titel = "Testen Sie MengenWerk an Ihrem eigenen Plan.",
  text = "In einer kurzen Demo laden wir gemeinsam einen Ihrer Einreichpläne hoch und gehen den Massenauszug Schritt für Schritt durch.",
}: {
  titel?: string;
  text?: string;
}) {
  return (
    <section className="bg-white py-20">
      <Container>
        <div className="flex flex-col gap-8 rounded-2xl bg-[#1f2a44] px-8 py-12 text-white md:flex-row md:items-center md:justify-between md:px-12">
          <div className="max-w-xl">
            <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-tight tracking-tight">{titel}</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-white/75">{text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex h-11 items-center rounded-lg bg-[#f2b233] px-5 text-[15px] font-semibold text-[#1f2a44] transition hover:brightness-105"
            >
              Demo anfragen
            </Link>
            <Link
              href="/vorschau"
              className="inline-flex h-11 items-center rounded-lg border border-white/30 px-5 text-[15px] font-semibold text-white transition hover:bg-white/10"
            >
              Beispiel ansehen
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
