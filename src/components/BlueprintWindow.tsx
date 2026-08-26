export function BlueprintWindow() {
  return (
    <svg viewBox="0 0 480 360" fill="none" className="w-full h-auto" role="img" aria-label="Technische Zeichnung eines Fensters mit Maßketten">
      <rect x="60" y="40" width="280" height="240" fill="var(--accent)" fillOpacity="0.12" stroke="var(--line-strong)" strokeWidth="2" />
      <line x1="200" y1="40" x2="200" y2="280" stroke="var(--line-strong)" strokeWidth="1" opacity="0.4" />
      <line x1="60" y1="160" x2="340" y2="160" stroke="var(--line-strong)" strokeWidth="1" opacity="0.4" />

      <line x1="60" y1="300" x2="340" y2="300" stroke="var(--fg-muted)" strokeWidth="1" />
      <line x1="60" y1="294" x2="60" y2="306" stroke="var(--fg-muted)" strokeWidth="1" />
      <line x1="340" y1="294" x2="340" y2="306" stroke="var(--fg-muted)" strokeWidth="1" />
      <text x="200" y="320" fill="var(--fg)" fontFamily="var(--font-mono)" fontSize="13" textAnchor="middle">2.00 m</text>

      <line x1="380" y1="40" x2="380" y2="280" stroke="var(--fg-muted)" strokeWidth="1" />
      <line x1="374" y1="40" x2="386" y2="40" stroke="var(--fg-muted)" strokeWidth="1" />
      <line x1="374" y1="280" x2="386" y2="280" stroke="var(--fg-muted)" strokeWidth="1" />
      <text x="400" y="164" fill="var(--fg)" fontFamily="var(--font-mono)" fontSize="13" textAnchor="middle" transform="rotate(90 400 164)">1.60 m</text>

      <circle cx="60" cy="40" r="4" fill="var(--accent)" stroke="var(--line-strong)" />
      <circle cx="340" cy="40" r="4" fill="var(--accent)" stroke="var(--line-strong)" />
      <circle cx="60" cy="280" r="4" fill="var(--accent)" stroke="var(--line-strong)" />
      <circle cx="340" cy="280" r="4" fill="var(--accent)" stroke="var(--line-strong)" />
    </svg>
  );
}
