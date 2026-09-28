import Link from "next/link";

export function Eyebrow({ children }: { children: React.ReactNode; tone?: string }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#a8461f] mb-5">
      <span className="h-px w-8 bg-[#c2562f]" />
      {children}
    </p>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`max-w-6xl mx-auto px-6 md:px-10 ${className}`}>{children}</div>;
}

type Ton = "dunkel" | "hell" | "grau";

const TON: Record<Ton, string> = {
  dunkel: "bg-himmel text-[#231f1a] border-y border-[#e8e0d2]",
  hell: "bg-[#fbf8f3] text-[#231f1a]",
  grau: "bg-[#f3ede3] text-[#231f1a] border-y border-[#e8e0d2]",
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
    <section id={id} className={`${TON[ton]} py-20 md:py-28 scroll-mt-20 ${className}`}>
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
    <div className="max-w-2xl mb-14">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display font-medium tracking-tight text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.08]">{titel}</h2>
      {text && <p className="mt-5 text-[15px] leading-relaxed text-[#6e665b]">{text}</p>}
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
    <section className="bg-himmel text-[#231f1a] border-b border-[#e8e0d2]">
      <Container className="pt-20 pb-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display font-medium tracking-tight leading-[1.02] text-[clamp(2.5rem,5.5vw,4.2rem)] max-w-3xl">
          {titel}
        </h1>
        {text && <p className="mt-6 text-[1.05rem] text-[#6e665b] max-w-2xl leading-relaxed">{text}</p>}
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
    <div className="group relative rounded-xl border border-[#e8e0d2] bg-[#fffdf9] p-7 transition hover:border-[#c2562f]/50">
      <span className="absolute left-0 top-7 h-6 w-[3px] rounded-r bg-[#c2562f] opacity-0 transition group-hover:opacity-100" />
      {nummer && <p className="mb-6 text-sm font-semibold text-[#c2562f]">{nummer}</p>}
      <h3 className="font-display font-medium text-[1.2rem] mb-2">{titel}</h3>
      <div className="text-sm leading-relaxed text-[#6e665b]">{children}</div>
    </div>
  );
}

export function KnopfPrimaer({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg bg-[#c2562f] text-white font-medium text-sm px-6 py-3 hover:bg-[#a8461f] transition"
    >
      {children}
    </Link>
  );
}

export function KnopfSekundaer({ href, children }: { href: string; children: React.ReactNode; ton?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-[#231f1a]/80 text-[#231f1a] font-medium text-sm px-6 py-3 hover:bg-[#231f1a] hover:text-[#fbf8f3] transition"
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
    <section className="bg-[#fbf8f3] py-20">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-[#f6e2d7] px-8 py-16 md:px-16 text-[#231f1a]">
          <svg
            aria-hidden
            viewBox="0 0 300 200"
            className="pointer-events-none absolute -right-10 -bottom-10 w-[420px] text-[#c2562f] opacity-25 hidden md:block"
            fill="none"
            stroke="currentColor"
          >
            <rect x="30" y="30" width="220" height="140" strokeWidth="3" />
            <path d="M130 30v80M30 110h100M190 110v60" strokeWidth="1.5" />
            <path d="M30 188h220M30 182v12M250 182v12" strokeWidth="1" />
          </svg>
          <h2 className="relative font-display font-medium tracking-tight leading-[1.05] text-[clamp(2rem,4vw,3.2rem)] max-w-2xl">
            {titel}
          </h2>
          <p className="relative mt-5 text-[#6e665b] max-w-xl leading-relaxed">{text}</p>
          <div className="relative mt-9 flex flex-wrap gap-3">
            <KnopfPrimaer href="/demo">Demo anfragen →</KnopfPrimaer>
            <KnopfSekundaer href="/app">Eigenen Plan testen</KnopfSekundaer>
          </div>
        </div>
      </Container>
    </section>
  );
}
