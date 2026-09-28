import Link from "next/link";
import { Logo, LogoMark } from "./Logo";

type Icon = "haus" | "upload" | "dokument" | "raster" | "euro" | "info" | "brief" | "person" | "pfeil";

function Symbol({ name }: { name: Icon }) {
  const p = {
    haus: "M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1Z",
    upload: "M12 16V5m0 0-4 4m4-4 4 4M5 19h14",
    dokument: "M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5",
    raster: "M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z",
    euro: "M17 7.5A6 6 0 1 0 17 16.5M5 10.5h8M5 13.5h8",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
    brief: "M4 6h16v12H4ZM4 7l8 6 8-6",
    person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0",
    pfeil: "M7 17 17 7M9 7h8v8",
  }[name];
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}

const MENUE: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Start", icon: "haus" },
  { href: "/app", label: "Plan analysieren", icon: "upload" },
  { href: "/vorschau", label: "Beispielauswertung", icon: "dokument" },
  { href: "/einheitspreise", label: "Einheitspreise", icon: "raster" },
  { href: "/preise", label: "Preise", icon: "euro" },
  { href: "/ueber-uns", label: "Über uns", icon: "info" },
  { href: "/kontakt", label: "Kontakt", icon: "brief" },
];

function RailKnopf({ href, label, icon, hell = false }: { href: string; label: string; icon: Icon; hell?: boolean }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-full transition ${
        hell ? "bg-[#16202a] text-white hover:bg-[#3a8fc2]" : "bg-[#f3f6f8] text-[#34424f] hover:bg-[#dcedf7] hover:text-[#2f78a6]"
      }`}
    >
      <Symbol name={icon} />
      <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg bg-[#16202a] px-2.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

export function SiteNav() {
  return (
    <>
      <aside className="seitenleiste hidden lg:flex fixed left-5 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-3">
        <Link href="/" aria-label="MengenWerk Startseite" className="mb-1">
          <LogoMark className="h-11 w-11" />
        </Link>
        <nav className="flex flex-col gap-2 rounded-full bg-white p-1.5 shadow-[0_10px_30px_-12px_rgba(22,32,42,0.25)] border border-[#e8eef2]">
          {MENUE.map((m) => (
            <RailKnopf key={m.href} {...m} />
          ))}
        </nav>
        <div className="flex flex-col gap-2 rounded-full bg-white p-1.5 shadow-[0_10px_30px_-12px_rgba(22,32,42,0.25)] border border-[#e8eef2]">
          <RailKnopf href="/login" label="Login" icon="person" />
          <RailKnopf href="/demo" label="Demo anfragen" icon="pfeil" hell />
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#e8eef2]">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" aria-label="MengenWerk Startseite">
            <Logo />
          </Link>
          <Link href="/demo" className="whitespace-nowrap rounded-full bg-[#16202a] text-white px-4 py-2 text-[13px] font-medium">
            Demo anfragen
          </Link>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 text-[13px]">
          {[...MENUE, { href: "/login", label: "Login", icon: "person" as Icon }].map((m) => (
            <Link key={m.href} href={m.href} className="whitespace-nowrap rounded-full bg-[#f3f6f8] px-3 py-1.5 text-[#34424f]">
              {m.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}

const NAVIGATION = [
  { href: "/#ablauf", label: "Produkt" },
  { href: "/#funktionen", label: "Funktionen" },
  { href: "/preise", label: "Preise" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/demo", label: "Demo anfragen" },
  { href: "/vorschau", label: "Beispielauswertung" },
  { href: "/login", label: "Login" },
];

const WERKZEUGE = [
  { href: "/app", label: "Plan analysieren" },
  { href: "/einheitspreise", label: "Einheitspreise" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#f5f8fa] text-[#16202a]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 grid md:grid-cols-[1.6fr_1fr_1fr] gap-12">
        <div>
          <Logo />
          <p className="mt-5 text-sm text-[#5d6b78] leading-relaxed max-w-sm">
            KI-gestützte Mengenermittlung für österreichische Baubetriebe. Vom Einreichplan zum Massenauszug nach
            LB-HB 023, mit sichtbarem Rechenweg.
          </p>
          <a href="mailto:office@msv-digital.com" className="mt-5 inline-block text-sm font-medium text-[#3a8fc2] hover:underline">
            office@msv-digital.com
          </a>
        </div>
        <FooterSpalte titel="Navigation" links={NAVIGATION} />
        <FooterSpalte titel="Werkzeuge" links={WERKZEUGE} />
      </div>
      <div className="border-t border-[#dde6ea]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row gap-3 sm:justify-between text-xs text-[#8b98a4]">
          <p>© {new Date().getFullYear()} MengenWerk · Gebaut für Baubetriebe in Österreich</p>
          <div className="flex gap-5">
            <Link href="/impressum" className="hover:text-[#16202a]">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-[#16202a]">Datenschutz</Link>
            <Link href="/kontakt" className="hover:text-[#16202a]">Kontakt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSpalte({ titel, links }: { titel: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#8b98a4] mb-4">{titel}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-[#34424f] hover:text-[#3a8fc2]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
