"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { currentPeriod, monthLabel } from "@/lib/format";
import { IconChevronL, IconChevronR } from "@/components/icons";

type Ctx = { period: string; setPeriod: (p: string) => void };
const PeriodCtx = createContext<Ctx>({ period: currentPeriod(), setPeriod: () => {} });

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState(currentPeriod());
  return <PeriodCtx.Provider value={{ period, setPeriod }}>{children}</PeriodCtx.Provider>;
}

export const usePeriod = () => useContext(PeriodCtx);

/** Compact month stepper for the sidebar footer (dark surface). */
export function PeriodStepper() {
  const { period, setPeriod } = usePeriod();
  const shift = (delta: number) => {
    const [y, m] = period.split("-").map(Number);
    setPeriod(new Date(y, m - 1 + delta, 1).toISOString().slice(0, 7));
  };
  const [y, m] = period.split("-").map(Number);
  const short = new Date(y, m - 1, 1)
    .toLocaleDateString("es-CO", { month: "short", year: "numeric" })
    .replace(".", "")
    .toUpperCase();

  return (
    <div className="flex items-center justify-between text-white/60">
      <button
        onClick={() => shift(-1)}
        aria-label="Mes anterior"
        className="rounded p-1 hover:bg-white/10 hover:text-white"
      >
        <IconChevronL />
      </button>
      <span className="mono text-xs font-medium text-white">{short}</span>
      <button
        onClick={() => shift(1)}
        aria-label="Mes siguiente"
        className="rounded p-1 hover:bg-white/10 hover:text-white"
      >
        <IconChevronR />
      </button>
    </div>
  );
}

/** Inline period label for page headers. */
export function PeriodLabel() {
  const { period } = usePeriod();
  return <span className="mono text-ink-soft">{monthLabel(period)}</span>;
}
