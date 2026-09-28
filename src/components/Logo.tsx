export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="#1f2a44" />
      <path
        d="M7 22V13.5L11.5 9l4.5 4.5L20.5 9l4.5 4.5V22"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 26h18M7 24.5v3M25 24.5v3" stroke="#d2a86e" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className={`font-display font-bold tracking-tight text-[1.15rem] ${dark ? "text-white" : "text-[#2b2d33]"}`}>
        mengen<span className="text-[#1f2a44]">werk</span>
      </span>
    </span>
  );
}
