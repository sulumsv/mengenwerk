"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo, LogoMark } from "./Logo";

const LINKS = [
  { href: "/", label: "Start" },
  { href: "/#ablauf", label: "So funktioniert’s" },
  { href: "/vorschau", label: "Beispiel" },
  { href: "/preise", label: "Preise" },
  { href: "/ueber-uns", label: "Über uns" },
];

const MEHR = [
  { href: "/app", label: "Plan analysieren" },
  { href: "/einheitspreise", label: "Einheitspreise" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/login", label: "Login" },
];

function Pfeil() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function IconKnopf({ href, label, d, hell }: { href: string; label: string; d: string; hell: boolean }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
        hell ? "border-white/50 text-white hover:bg-white/15" : "border-[#dfe3e8] text-[#34424f] hover:bg-[#f3f5f7]"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </Link>
  );
}

export function DemoPille({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/demo"
      className={`group inline-flex items-center gap-3 rounded-full bg-[#f2b233] py-1.5 pl-5 pr-1.5 text-[13px] font-semibold text-[#1f2a44] shadow-[0_8px_24px_-12px_rgba(22,32,42,0.35)] ${className}`}
    >
      Demo anfragen
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f2a44] text-white transition group-hover:bg-[#2b2d33]">
        <Pfeil />
      </span>
    </Link>
  );
}

export function Navigation({ variante = "standard" }: { variante?: "standard" | "buehne" }) {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);
  const hell = variante === "buehne";

  return (
    <header className={`relative z-40 ${hell ? "" : "bg-white border-b border-[#eceff2]"}`}>
      <div className={`flex items-center justify-between gap-4 ${hell ? "px-5 pt-5 md:px-7 md:pt-6" : "max-w-6xl mx-auto px-5 md:px-10 h-[4.5rem]"}`}>
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="MengenWerk Startseite" onClick={() => setOffen(false)}>
            {hell ? (
              <span className="inline-flex items-center gap-2.5">
                <LogoMark className="h-9 w-9" />
                <span className="hidden sm:inline font-bold tracking-tight text-[1.1rem] text-white">mengenwerk</span>
              </span>
            ) : (
              <Logo />
            )}
          </Link>
          <nav className="hidden lg:flex items-center gap-1.5">
            {LINKS.map((l) => {
              const aktiv = pfad === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full border px-4 py-1.5 text-[13px] transition ${
                    aktiv
                      ? hell
                        ? "border-white bg-white text-[#2b2d33] font-semibold"
                        : "border-[#2b2d33] bg-[#2b2d33] text-white font-semibold"
                      : hell
                        ? "border-white/45 text-white hover:bg-white/15"
                        : "border-[#dfe3e8] text-[#34424f] hover:border-[#2b2d33]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <IconKnopf href="/app" label="Plan analysieren" d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" hell={hell} />
            <IconKnopf href="/kontakt" label="Kontakt" d="M4 6h16v12H4ZM4 7l8 6 8-6" hell={hell} />
            <IconKnopf href="/login" label="Login" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0" hell={hell} />
          </div>
          <DemoPille className="hidden sm:inline-flex" />
          <button
            type="button"
            aria-label={offen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={offen}
            onClick={() => setOffen(!offen)}
            className={`lg:hidden flex h-10 w-10 items-center justify-center rounded-full border ${
              hell ? "border-white/50 text-white bg-white/10" : "border-[#dfe3e8] text-[#2b2d33]"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {offen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {offen && (
        <div className="lg:hidden absolute inset-x-3 top-full mt-2 rounded-3xl bg-white p-3 shadow-[0_24px_60px_-20px_rgba(22,32,42,0.45)]">
          {[...LINKS, ...MEHR].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOffen(false)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] ${
                pfad === l.href ? "bg-[#efe4d3] font-semibold text-[#2b2d33]" : "text-[#34424f] hover:bg-[#f5f6f8]"
              }`}
            >
              {l.label}
              <span className="text-[#9aa5b0]">
                <Pfeil />
              </span>
            </Link>
          ))}
          <Link
            href="/demo"
            onClick={() => setOffen(false)}
            className="mt-2 flex items-center justify-center rounded-2xl bg-[#2b2d33] px-4 py-3.5 text-[15px] font-semibold text-white"
          >
            Demo anfragen
          </Link>
        </div>
      )}
    </header>
  );
}
