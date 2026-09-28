import Link from "next/link";

export const FARBEN = {
  tinte: "#1c1a33",
  gedaempft: "#625f7d",
  indigo: "#3a2f9e",
  apricot: "#f08a5d",
};

export function Eyebrow({ children }: { children: React.ReactNode; tone?: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-[#3a2f9e] mb-4">
      <span className="h-1.5 w-1.5 rounded-full bg-[#f08a5d]" />
      {children}
    </p>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`max-w-6xl mx-auto px-6 md:px-10 ${className}`}>{children}</div>;
}

type Ton = "dunkel" | "hell" | "grau";

const TON: Record<Ton, string> = {
  dunkel: "bg-himmel text-[#1c1a33]",
  hell: "bg-[#f7f6fb] text-[#1c1a33]",
  grau: "bg-[#efedf7] text-[#1c1a33]",
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
    <section id={id} className={`${TON[ton]} py-20 md:py-28 scroll-mt-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function AbschnittKopf({
  eyebrow,
  titel,
  text,
}: {
  eyebrow: string;
  titel: React.ReactNode;
  text?: React.ReactNode;
  ton?: Ton;
}) {
  return (
    <div className="max-w-2xl mb-12">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display font-bold tracking-tight text-[clamp(1.7rem,3.2vw,2.5rem)] leading-[1.1]">{titel}</h2>
      {text && <p className="mt-4 text-[15px] leading-relaxed text-[#625f7d]">{text}</p>}
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
    <section className="bg-himmel text-[#1c1a33]">
      <Container className="pt-20 pb-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display font-bold tracking-tight leading-[1.05] text-[clamp(2.3rem,5vw,3.8rem)] max-w-3xl">
          {titel}
        </h1>
        {text && <p className="mt-6 text-[1.05rem] text-[#625f7d] max-w-2xl leading-relaxed">{text}</p>}
        {children && <div className="mt-9">{children}</div>}
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
    <div className="glas rounded-3xl p-7 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(58,47,158,0.35)]">
      {nummer && (
        <p className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fde9df] font-display font-bold text-[#d86f43]">
          {nummer}
        </p>
      )}
      <h3 className="font-semibold text-[16px] mb-2">{titel}</h3>
      <div className="text-sm leading-relaxed text-[#625f7d]">{children}</div>
    </div>
  );
}

export function KnopfPrimaer({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-[#3a2f9e] text-white font-medium text-sm px-6 py-3 shadow-[0_10px_24px_-10px_rgba(58,47,158,0.6)] hover:bg-[#2f2585] transition"
    >
      {children}
    </Link>
  );
}

export function KnopfSekundaer({ href, children }: { href: string; children: React.ReactNode; ton?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-[#e7e4f0] text-[#1c1a33] font-medium text-sm px-6 py-3 hover:bg-white transition"
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
    <section className="bg-[#f7f6fb] py-20">
      <Container>
        <div className="bg-himmel rounded-[2rem] border border-white px-8 py-16 md:px-16 text-[#1c1a33] shadow-[0_30px_60px_-40px_rgba(58,47,158,0.45)]">
          <h2 className="font-display font-bold tracking-tight leading-[1.08] text-[clamp(2rem,4vw,3rem)] max-w-2xl">
            {titel}
          </h2>
          <p className="mt-5 text-[#625f7d] max-w-xl leading-relaxed">{text}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <KnopfPrimaer href="/demo">Demo anfragen →</KnopfPrimaer>
            <KnopfSekundaer href="/app">Eigenen Plan testen</KnopfSekundaer>
          </div>
        </div>
      </Container>
    </section>
  );
}
