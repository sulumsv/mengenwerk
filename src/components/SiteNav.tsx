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
    <header className="sticky top-0 z-50 bg-[#f6f9fa]/90 backdrop-blur border-b border-[#dde6ea]">
      <nav className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-6 text-[#16202a]">
        <Link href="/" aria-label="MengenWerk Startseite">
          <Logo />
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative text-[13px] text-[#5d6b78] hover:text-[#16202a] transition after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-[#0f5c78] after:transition-all hover:after:w-full"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="whitespace-nowrap text-[13px] font-medium text-[#16202a] hover:text-[#0f5c78] transition">
            Login
          </Link>
          <Link
            href="/demo"
            className="whitespace-nowrap rounded-lg bg-[#16202a] text-[#f6f9fa] px-4 py-2 text-[13px] font-medium hover:bg-[#0f5c78] transition"
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
  { href: "/login", label: "Login" },
];

const WERKZEUGE = [
  { href: "/app", label: "Plan analysieren" },
  { href: "/einheitspreise", label: "Einheitspreise" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#e9eff2] text-[#16202a]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 grid md:grid-cols-[1.6fr_1fr_1fr] gap-12">
        <div>
          <Logo />
          <p className="mt-5 text-sm text-[#5d6b78] leading-relaxed max-w-sm">
            KI-gestützte Mengenermittlung für österreichische Baubetriebe. Vom Einreichplan zum Massenauszug nach
            LB-HB 023, mit sichtbarem Rechenweg.
          </p>
          <a href="mailto:office@msv-digital.com" className="mt-5 inline-block text-sm font-medium text-[#0f5c78] hover:underline">
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
            <Link href={l.href} className="text-sm text-[#34424f] hover:text-[#0f5c78]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
