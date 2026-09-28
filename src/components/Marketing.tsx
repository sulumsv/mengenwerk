import Link from "next/link";

export function Eyebrow({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.22em] mb-4 ${
        tone === "dark" ? "text-[#b6e36b]" : "text-[#2f5fd0]"
      }`}
    >
      {children}
    </p>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`max-w-6xl mx-auto px-6 md:px-10 ${className}`}>{children}</div>;
}

type Ton = "dunkel" | "hell" | "grau";

const TON: Record<Ton, string> = {
  dunkel: "bg-[#121b30] text-white bg-raster",
  hell: "bg-[#f7f9fc] text-[#0f172a]",
  grau: "bg-[#eef2f7] text-[#0f172a]",
};

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
  return (
    <section id={id} className={`${TON[ton]} py-20 md:py-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function AbschnittKopf({
  eyebrow,
  titel,
  text,
  ton = "hell",
}: {
  eyebrow: string;
  titel: React.ReactNode;
  text?: React.ReactNode;
  ton?: Ton;
}) {
  const dunkel = ton === "dunkel";
  return (
    <div className="max-w-2xl mb-12">
      <Eyebrow tone={dunkel ? "dark" : "light"}>{eyebrow}</Eyebrow>
      <h2 className="font-display font-extrabold tracking-tight text-[clamp(1.6rem,3vw,2.25rem)] leading-[1.1]">
        {titel}
      </h2>
      {text && (
        <p className={`mt-4 text-[15px] leading-relaxed ${dunkel ? "text-white/55" : "text-[#56627a]"}`}>{text}</p>
      )}
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
    <section className="bg-[#121b30] text-white bg-raster">
      <Container className="pt-24 pb-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display font-extrabold tracking-tight leading-[1.05] text-[clamp(2.2rem,5vw,3.6rem)] max-w-3xl">
          {titel}
        </h1>
        {text && <p className="mt-6 text-[1.05rem] text-white/60 max-w-2xl leading-relaxed">{text}</p>}
        {children && <div className="mt-9">{children}</div>}
      </Container>
    </section>
  );
}

export function Karte({
  titel,
  children,
  ton = "hell",
  nummer,
}: {
  titel: string;
  children: React.ReactNode;
  ton?: Ton;
  nummer?: string;
}) {
  const dunkel = ton === "dunkel";
  return (
    <div
      className={`rounded-xl border p-6 ${
        dunkel ? "border-white/10 bg-white/[0.03]" : "border-[#e3e8f0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      }`}
    >
      {nummer && <p className="font-display font-extrabold text-2xl text-[#b6e36b] mb-3">{nummer}</p>}
      <h3 className="font-semibold text-[15px] mb-2">{titel}</h3>
      <div className={`text-sm leading-relaxed ${dunkel ? "text-white/50" : "text-[#5f6b80]"}`}>{children}</div>
    </div>
  );
}

export function KnopfPrimaer({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-[#b6e36b] text-[#121b30] font-semibold text-sm px-6 py-3 hover:brightness-105 transition"
    >
      {children}
    </Link>
  );
}

export function KnopfSekundaer({
  href,
  children,
  ton = "dunkel",
}: {
  href: string;
  children: React.ReactNode;
  ton?: "dunkel" | "hell";
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border font-semibold text-sm px-6 py-3 transition ${
        ton === "dunkel"
          ? "border-white/20 text-white hover:border-white/40"
          : "border-[#d6dde8] text-[#0f172a] bg-white hover:border-[#a9b3c3]"
      }`}
    >
      {children}
    </Link>
  );
}

export function CtaBand({
  titel = "Lassen Sie MengenWerk an Ihrem Plan rechnen.",
  text = "In der Demo laden wir gemeinsam einen Ihrer Einreichpläne hoch und gehen Schritt für Schritt durch den Massenauszug.",
}: {
  titel?: string;
  text?: string;
}) {
  return (
    <section className="bg-[#121b30] text-white bg-raster">
      <Container className="py-24">
        <h2 className="font-display font-extrabold tracking-tight leading-[1.08] text-[clamp(2rem,4vw,3rem)] max-w-2xl">
          {titel}
        </h2>
        <p className="mt-5 text-white/60 max-w-xl leading-relaxed">{text}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <KnopfPrimaer href="/demo">Demo anfragen →</KnopfPrimaer>
          <KnopfSekundaer href="/app">Eigenen Plan testen</KnopfSekundaer>
        </div>
      </Container>
    </section>
  );
}
