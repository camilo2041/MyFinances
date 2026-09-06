export const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const fmtNum = (n: number) =>
  new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** Colores para categorías: apagados y distinguibles, armonizan con el índigo. */
export const CAT_PALETTE = [
  "#4338ca", "#0e7490", "#15803d", "#b45309",
  "#be123c", "#6d28d9", "#0369a1", "#4d7c0f",
  "#9d174d", "#918fa8",
];
export const catColor = (i: number, seed?: string | null) => {
  const s = (seed || "").toLowerCase();
  if (s && s !== "#64748b" && s !== "#94a3b8") return seed as string;
  return CAT_PALETTE[Math.abs(i) % CAT_PALETTE.length];
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const currentPeriod = () => new Date().toISOString().slice(0, 7);

export const monthLabel = (period: string) => {
  const [y, m] = period.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
