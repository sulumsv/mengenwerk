/**
 * Markenzeichen: ein Vermessungswinkel, der zum "M" wird — steht für das
 * Ausmessen ("Mengen") von Bauplänen. Als Icon (LogoMark) und als Lockup mit
 * Wortmarke (Logo) für Nav, Footer und Favicon nutzbar.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#14130f" />
      <path
        d="M6 24V8h3.4l4.6 8.6L18.6 8H22v16h-3.2v-10.6L14.4 21h-1.8L8.2 13.4V24H6Z"
        fill="#f4c400"
      />
      <path d="M24 8v16" stroke="#1f7a33" strokeWidth="1.4" strokeDasharray="1.6 1.8" />
      <path d="M23 9h2M23 23h2" stroke="#1f7a33" strokeWidth="1.4" />
    </svg>
  );
}

export function Logo({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-7 w-7 shrink-0" />
      <span className={`font-display font-black tracking-tight text-lg ${dark ? "text-surface" : "text-fg"}`}>
        MENGENWERK
      </span>
    </span>
  );
}
