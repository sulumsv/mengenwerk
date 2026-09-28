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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#e3e8f0] text-[#0f172a]">
      <nav className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-6">
        <Link href="/" aria-label="MengenWerk Startseite">
          <Logo />
        </Link>
        <div className="hidden lg:flex items-center gap-7">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13px] text-[#56627a] hover:text-[#0f172a] transition">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/vorschau"
            className="hidden md:inline text-[13px] text-[#56627a] hover:text-[#0f172a] mr-2"
          >
            ↓ Beispielauswertung
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[#d6dde8] px-4 py-2 text-[13px] font-medium hover:border-[#a9b3c3] transition"
          >
            Login
          </Link>
          <Link
            href="/demo"
            className="rounded-full bg-[#2f5fd0] text-white px-4 py-2 text-[13px] font-medium hover:bg-[#274fb0] transition"
          >
            Demo anfragen
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
  { href: "/login", label: "Login ↗" },
];

const WERKZEUGE = [
  { href: "/app", label: "Plan analysieren" },
  { href: "/einheitspreise", label: "Einheitspreise" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#2f5fd0] text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 grid md:grid-cols-[1.6fr_1fr_1fr] gap-12">
        <div>
          <Logo dark />
          <p className="mt-5 text-sm text-white/55 leading-relaxed max-w-sm">
            KI-gestützte Mengenermittlung für österreichische Baubetriebe. Vom Einreichplan zum Massenauszug nach
            LB-HB 023 — mit sichtbarem Rechenweg.
          </p>
          <a href="mailto:office@msv-digital.com" className="mt-5 inline-block text-sm text-[#b6e36b] hover:underline">
            office@msv-digital.com
          </a>
        </div>
        <FooterSpalte titel="Navigation" links={NAVIGATION} />
        <FooterSpalte titel="Werkzeuge" links={WERKZEUGE} />
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row gap-3 sm:justify-between text-xs text-white/40">
          <p>© {new Date().getFullYear()} MengenWerk · Gebaut für Baubetriebe in Österreich</p>
          <div className="flex gap-5">
            <Link href="/impressum" className="hover:text-white/70">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white/70">Datenschutz</Link>
            <Link href="/kontakt" className="hover:text-white/70">Kontakt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSpalte({ titel, links }: { titel: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#b6e36b] mb-4">{titel}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-white/65 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
