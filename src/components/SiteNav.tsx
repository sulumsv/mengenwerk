import Link from "next/link";
import { Logo } from "./Logo";
import { Navigation } from "./Navigation";

export function SiteNav() {
  return <Navigation />;
}

const NAVIGATION = [
  { href: "/#ablauf", label: "Produkt" },
  { href: "/#umfang", label: "Funktionen" },
  { href: "/preise", label: "Preise" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/demo", label: "Demo anfragen" },
  { href: "/vorschau", label: "Beispielauswertung" },
  { href: "/login", label: "Login" },
];

const WERKZEUGE = [
  { href: "/einheitspreise", label: "Einheitspreise" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#eef0f3] bg-[#f8f9fb] text-[#111827]">
      <div className="max-w-[1120px] mx-auto px-5 md:px-8 py-14 grid md:grid-cols-[1.6fr_1fr_1fr] gap-12">
        <div>
          <Logo />
          <p className="mt-5 text-sm text-[#5d6b78] leading-relaxed max-w-sm">
            KI-gestützte Mengenermittlung für österreichische Baubetriebe. Vom Einreichplan zum Massenauszug nach
            LB-HB 023, mit sichtbarem Rechenweg.
          </p>
          <a href="mailto:office@msv-digital.com" className="mt-5 inline-block text-sm font-medium text-[#1f2a44] hover:underline">
            office@msv-digital.com
          </a>
        </div>
        <FooterSpalte titel="Navigation" links={NAVIGATION} />
        <FooterSpalte titel="Werkzeuge" links={WERKZEUGE} />
      </div>
      <div className="border-t border-[#e6e8ec]">
        <div className="max-w-[1120px] mx-auto px-5 md:px-8 py-6 flex flex-col sm:flex-row gap-3 sm:justify-between text-xs text-[#8b98a4]">
          <p>© {new Date().getFullYear()} MengenWerk · Gebaut für Baubetriebe in Österreich</p>
          <div className="flex gap-5">
            <Link href="/impressum" className="hover:text-[#2b2d33]">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-[#2b2d33]">Datenschutz</Link>
            <Link href="/kontakt" className="hover:text-[#2b2d33]">Kontakt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSpalte({ titel, links }: { titel: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#111827] mb-4">{titel}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[15px] text-[#5b6472] hover:text-[#111827]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
