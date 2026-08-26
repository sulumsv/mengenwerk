import Link from "next/link";

const LINKS = [
  { href: "/", label: "Start" },
  { href: "/vorschau", label: "Beispiel" },
  { href: "/preise", label: "Preise" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteNav() {
  return (
    <nav className="border-b border-line px-6 md:px-10 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <Link href="/" className="font-display font-black tracking-tight text-lg">
        MENGENWERK
      </Link>
      <div className="flex items-center gap-6">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="font-mono text-xs uppercase tracking-wide text-fg-muted hover:text-fg">
            {l.label}
          </Link>
        ))}
        <Link
          href="/app"
          className="font-mono text-xs uppercase tracking-wide bg-line-strong text-surface px-3 py-1.5 rounded-md"
        >
          Zum Tool
        </Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-6 md:px-10 py-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="font-mono text-xs text-fg-muted uppercase tracking-wide">MengenWerk. Gebaut für kleine Baubetriebe.</p>
        <div className="flex items-center gap-6">
          <Link href="/impressum" className="font-mono text-xs text-fg-muted uppercase tracking-wide hover:text-fg">
            Impressum
          </Link>
          <Link href="/datenschutz" className="font-mono text-xs text-fg-muted uppercase tracking-wide hover:text-fg">
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}
