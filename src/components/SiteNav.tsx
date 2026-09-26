import Link from "next/link";

const LINKS = [
  { href: "/vorschau", label: "Beispiel" },
  { href: "/einheitspreise", label: "Einheitspreise" },
  { href: "/preise", label: "Preise" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteNav({ dark = true }: { dark?: boolean }) {
  return (
    <nav
      className={`px-6 md:px-10 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        dark
          ? "border-b border-white/10"
          : "border-b border-line"
      }`}
    >
      <Link
        href="/"
        className={`font-display font-black tracking-tight text-lg ${dark ? "text-fg" : "text-fg"}`}
      >
        MENGENWERK
      </Link>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`font-mono text-xs uppercase tracking-wide ${
              dark ? "text-fg/50 hover:text-fg" : "text-fg-muted hover:text-fg"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/app"
          className={`font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-md ${
            dark
              ? "bg-accent text-accent-fg font-bold"
              : "bg-line-strong text-surface"
          }`}
        >
          Plan analysieren →
        </Link>
      </div>
    </nav>
  );
}

export function SiteFooter({ dark = true }: { dark?: boolean }) {
  return (
    <footer
      className={`px-6 md:px-10 py-14 ${dark ? "bg-surface border-t border-white/10" : "border-t border-line"}`}
    >
      <div className="max-w-7xl mx-auto grid sm:grid-cols-3 gap-10">
        <div>
          <p className={`font-display font-black text-lg mb-3 ${dark ? "text-fg" : "text-fg"}`}>MENGENWERK</p>
          <p className={`text-sm leading-relaxed max-w-xs ${dark ? "text-fg/50" : "text-fg-muted"}`}>
            KI-gestützte Mengenermittlung für österreichische Baubetriebe. Vom Einreichplan zum bepreisten LV.
          </p>
        </div>
        <div>
          <p className={`font-mono text-xs uppercase tracking-widest mb-4 ${dark ? "text-accent" : "text-highlight"}`}>
            Produkt
          </p>
          <div className="flex flex-col gap-2">
            {[
              { href: "/app", label: "Plan analysieren" },
              { href: "/vorschau", label: "Beispielauswertung" },
              { href: "/einheitspreise", label: "Einheitspreise" },
              { href: "/preise", label: "Preise" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm ${dark ? "text-fg/60 hover:text-fg" : "text-fg-muted hover:text-fg"}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className={`font-mono text-xs uppercase tracking-widest mb-4 ${dark ? "text-accent" : "text-highlight"}`}>
            Unternehmen
          </p>
          <div className="flex flex-col gap-2">
            {[
              { href: "/ueber-uns", label: "Über uns" },
              { href: "/kontakt", label: "Kontakt" },
              { href: "/impressum", label: "Impressum" },
              { href: "/datenschutz", label: "Datenschutz" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm ${dark ? "text-fg/60 hover:text-fg" : "text-fg-muted hover:text-fg"}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className={`max-w-7xl mx-auto mt-10 pt-6 border-t ${dark ? "border-white/10" : "border-line"}`}>
        <p className={`font-mono text-xs uppercase tracking-wide ${dark ? "text-fg/30" : "text-fg-muted"}`}>
          © 2025 MengenWerk · Gebaut für kleine Baubetriebe in Österreich
        </p>
      </div>
    </footer>
  );
}
