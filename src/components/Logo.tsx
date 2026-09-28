export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#231f1a" />
      <path
        d="M6 24V8h3.4l4.6 8.6L18.6 8H22v16h-3.2v-10.6L14.4 21h-1.8L8.2 13.4V24H6Z"
        fill="#fbf8f3"
      />
      <path d="M24 8v16" stroke="#e07a52" strokeWidth="1.4" strokeDasharray="1.6 1.8" />
      <path d="M23 9h2M23 23h2" stroke="#e07a52" strokeWidth="1.4" />
    </svg>
  );
}

export function Logo({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-7 w-7 shrink-0" />
      <span className={`font-display font-semibold tracking-tight text-[1.2rem] ${dark ? "text-[#fbf8f3]" : "text-[#231f1a]"}`}>
        Mengen<span className="text-[#c2562f]">Werk</span>
      </span>
    </span>
  );
}
