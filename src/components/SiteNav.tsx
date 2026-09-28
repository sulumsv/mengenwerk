import Link from "next/link";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/#ablauf", label: "Produkt" },
  { href: "/#funktionen", label: "Funktionen" },
  { href: "/einheitspreise", label: "Einheitspreise" },
  { href: "/preise", label: "Preise" },
  { href: "/ueber-uns", label: "Über uns" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="glas max-w-6xl mx-auto rounded-full h-14 pl-5 pr-2 flex items-center justify-between gap-6 text-[#1c1a33]">
        <Link href="/" aria-label="MengenWerk Startseite">
          <Logo />
        </Link>
        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] text-[#625f7d] hover:bg-[#efedf7] hover:text-[#1c1a33] transition"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-[13px] font-medium text-[#1c1a33] hover:bg-[#efedf7] transition"
          >
            Login
          </Link>
          <Link
            href="/demo"
            className="rounded-full bg-[#3a2f9e] text-white px-4 py-2 text-[13px] font-medium hover:bg-[#2f2585] transition"
          >
            Demo anfragen ↗
          </Link>
        </div>
      </nav>
    </header>
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
    <footer className="bg-[#efedf7] text-[#1c1a33]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 grid md:grid-cols-[1.6fr_1fr_1fr] gap-12">
        <div>
          <Logo />
          <p className="mt-5 text-sm text-[#625f7d] leading-relaxed max-w-sm">
            KI-gestützte Mengenermittlung für österreichische Baubetriebe. Vom Einreichplan zum Massenauszug nach
            LB-HB 023 — mit sichtbarem Rechenweg.
          </p>
          <a href="mailto:office@msv-digital.com" className="mt-5 inline-block text-sm font-medium text-[#3a2f9e] hover:underline">
            office@msv-digital.com
          </a>
        </div>
        <FooterSpalte titel="Navigation" links={NAVIGATION} />
        <FooterSpalte titel="Werkzeuge" links={WERKZEUGE} />
      </div>
      <div className="border-t border-[#e0dcec]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row gap-3 sm:justify-between text-xs text-[#8e8aa6]">
          <p>© {new Date().getFullYear()} MengenWerk · Gebaut für Baubetriebe in Österreich</p>
          <div className="flex gap-5">
            <Link href="/impressum" className="hover:text-[#1c1a33]">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-[#1c1a33]">Datenschutz</Link>
            <Link href="/kontakt" className="hover:text-[#1c1a33]">Kontakt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSpalte({ titel, links }: { titel: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#8e8aa6] mb-4">{titel}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-[#3b3857] hover:text-[#3a2f9e]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
