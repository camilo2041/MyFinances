type P = { className?: string; size?: number };

const base = (size = 17) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconLogo = ({ className, size = 22 }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="1.5" />
    <line x1="8" y1="16" x2="8" y2="11" />
    <line x1="12" y1="16" x2="12" y2="8" />
    <line x1="16" y1="16" x2="16" y2="13" />
  </svg>
);

export const IconResumen = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
  </svg>
);

export const IconMovimientos = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 4L3 8l4 4" />
    <path d="M3 8h13" />
    <path d="M17 20l4-4-4-4" />
    <path d="M21 16H8" />
  </svg>
);

export const IconFijos = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

export const IconDeudas = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 21h18" />
    <path d="M4 10h16" />
    <path d="M5 21V10M12 21V10M19 21V10" />
    <path d="M12 3l8 5H4z" />
  </svg>
);

export const IconPresupuesto = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v9l6.5 3.5" />
  </svg>
);

export const IconConsejero = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <polygon points="16 8 13 13 8 16 11 11" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPlus = ({ className, size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconExport = ({ className, size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={1.7} className={className}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

export const IconArrowRight = ({ className, size = 15 }: P) => (
  <svg {...base(size)} strokeWidth={1.8} className={className}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export const IconChevronL = ({ className, size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const IconChevronR = ({ className, size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconPencil = ({ className, size = 15 }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const IconTrash = ({ className, size = 15 }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" />
  </svg>
);

export const IconLogout = ({ className, size = 13 }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const IconCheck = ({ className, size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={2.2} className={className}>
    <path d="M4 12l5 5L20 6" />
  </svg>
);

export const IconTag = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-6.4-6.4A2 2 0 0 1 3.6 12.8V6a2.4 2.4 0 0 1 2.4-2.4h6.8a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.8Z" />
    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const IconUsers = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
