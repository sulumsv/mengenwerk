type IconProps = {
  className?: string;
};

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconWindow({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
      <path d="M12 3.5v17M3.5 12h17" />
    </svg>
  );
}

export function IconDoor({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <rect x="5.5" y="2.5" width="13" height="19" rx="0.5" />
      <circle cx="15" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconWall({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="16" rx="1" />
      <path d="M2.5 9.5h19M2.5 14.5h19M8.5 4v5.5M15.5 9.5V14.5M8.5 14.5V20" />
    </svg>
  );
}

export function IconArea({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <path d="M4 4h6M4 4v6M20 20h-6M20 20v-6" />
      <rect x="8" y="8" width="8" height="8" strokeDasharray="2.2 2.2" />
    </svg>
  );
}

export function IconConcrete({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
      <path d="M3.5 7 12 11.5l8.5-4.5M12 11.5v10" />
    </svg>
  );
}

export function IconTiles({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="0.5" />
      <rect x="13" y="3" width="8" height="8" rx="0.5" />
      <rect x="3" y="13" width="8" height="8" rx="0.5" />
      <rect x="13" y="13" width="8" height="8" rx="0.5" />
    </svg>
  );
}

export function IconTrace({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <path d="M4 6h11a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h13" />
      <circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="20" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSpeed({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13 15.5 9M12 5v1.2M4.5 13H3M21 13h-1.5" />
    </svg>
  );
}

export function IconGroup({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <rect x="3" y="4" width="7" height="7" rx="0.5" />
      <rect x="14" y="4" width="7" height="4.5" rx="0.5" />
      <rect x="14" y="11.5" width="7" height="4.5" rx="0.5" />
      <rect x="3" y="14.5" width="7" height="5.5" rx="0.5" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <path d="M4 12.5 9.5 18 20 6" />
    </svg>
  );
}

export function IconCross({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
