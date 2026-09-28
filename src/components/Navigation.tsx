"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

type Icon = "haus" | "upload" | "dokument" | "raster" | "euro" | "info" | "brief" | "person";

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
  }[name];
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}

const GRUPPEN: { titel: string; links: { href: string; label: string; icon: Icon }[] }[] = [
  {
    titel: "Werkzeug",
    links: [
      { href: "/", label: "Startseite", icon: "haus" },
      { href: "/app", label: "Plan analysieren", icon: "upload" },
      { href: "/vorschau", label: "Beispielauswertung", icon: "dokument" },
      { href: "/einheitspreise", label: "Einheitspreise", icon: "raster" },
    ],
  },
  {
    titel: "Unternehmen",
    links: [
      { href: "/preise", label: "Preise", icon: "euro" },
      { href: "/ueber-uns", label: "Über uns", icon: "info" },
      { href: "/kontakt", label: "Kontakt", icon: "brief" },
    ],
  },
];

function Eintrag({ href, label, icon, aktiv, onClick }: { href: string; label: string; icon: Icon; aktiv: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition ${
        aktiv ? "bg-[#fbe9d2] text-[#16202a] font-semibold" : "text-[#5d6b78] hover:bg-[#f5f6f8] hover:text-[#16202a]"
      }`}
    >
      <span className={aktiv ? "text-[#b86a1c]" : ""}>
        <Symbol name={icon} />
      </span>
      {label}
    </Link>
  );
}

function Inhalt({ pfad, schliessen }: { pfad: string; schliessen?: () => void }) {
  return (
    <>
      <nav className="flex flex-col gap-6">
        {GRUPPEN.map((g) => (
          <div key={g.titel}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa5b0]">{g.titel}</p>
            <div className="flex flex-col gap-0.5">
              {g.links.map((l) => (
                <Eintrag key={l.href} {...l} aktiv={pfad === l.href} onClick={schliessen} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Eintrag href="/login" label="Login" icon="person" aktiv={pfad === "/login"} onClick={schliessen} />
        <Link
          href="/demo"
          onClick={schliessen}
          className="flex items-center justify-center rounded-xl bg-[#16202a] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#d9822b] transition"
        >
          Demo anfragen
        </Link>
      </div>
    </>
  );
}

export function Navigation() {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = offen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [offen]);

  return (
    <>
      <aside className="seitenleiste hidden lg:flex fixed inset-y-0 left-0 z-50 w-60 flex-col border-r border-[#eceff2] bg-white px-4 py-6">
        <Link href="/" aria-label="MengenWerk Startseite" className="px-3 mb-10">
          <Logo />
        </Link>
        <Inhalt pfad={pfad} />
      </aside>

      <header className="lg:hidden sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#eceff2]">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" aria-label="MengenWerk Startseite" onClick={() => setOffen(false)}>
            <Logo />
          </Link>
          <button
            type="button"
            aria-label={offen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={offen}
            onClick={() => setOffen(!offen)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f6f8] text-[#16202a]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {offen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
        {offen && (
          <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-y-auto bg-white px-4 pb-8 pt-4">
            <Inhalt pfad={pfad} schliessen={() => setOffen(false)} />
          </div>
        )}
      </header>
    </>
  );
}
