"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/#ablauf", label: "So funktioniert’s" },
  { href: "/vorschau", label: "Beispiel" },
  { href: "/preise", label: "Preise" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Navigation(_: { variante?: string }) {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#eef0f3] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-6 px-5 md:px-8">
        <Link href="/" aria-label="MengenWerk Startseite" onClick={() => setOffen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[15px] transition ${pfad === l.href ? "font-semibold text-[#111827]" : "text-[#5b6472] hover:text-[#111827]"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden h-10 items-center px-3 text-[15px] font-medium text-[#111827] hover:text-[#1f2a44] sm:inline-flex">
            Anmelden
          </Link>
          <Link
            href="/demo"
            className="hidden h-10 items-center rounded-lg bg-[#1f2a44] px-4 text-[15px] font-semibold text-white transition hover:bg-[#2c3a5c] sm:inline-flex"
          >
            Demo anfragen
          </Link>
          <button
            type="button"
            aria-label={offen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={offen}
            onClick={() => setOffen(!offen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e6e8ec] text-[#111827] lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {offen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {offen && (
        <div className="border-t border-[#eef0f3] bg-white px-5 pb-5 pt-2 lg:hidden">
          <nav className="flex flex-col">
            {[...LINKS, { href: "/einheitspreise", label: "Einheitspreise" }].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOffen(false)}
                className="border-b border-[#f1f2f5] py-3.5 text-[16px] text-[#111827]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setOffen(false)}
              className="flex h-11 items-center justify-center rounded-lg border border-[#d4d8df] text-[15px] font-semibold text-[#111827]"
            >
              Anmelden
            </Link>
            <Link
              href="/demo"
              onClick={() => setOffen(false)}
              className="flex h-11 items-center justify-center rounded-lg bg-[#1f2a44] text-[15px] font-semibold text-white"
            >
              Demo anfragen
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
