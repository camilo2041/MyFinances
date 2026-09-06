"use client";

import { useState } from "react";
import { fmtCOP } from "@/lib/format";

type Row = { period: string; income: number; expense: number; balance: number };

const monthAbbr = (p: string) => {
  const [y, m] = p.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "short" }).replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function TrendChart({ data }: { data: Row[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data?.length) return null;

  const max = Math.max(1, ...data.map((d) => Math.abs(d.balance)));
  const avg = data.reduce((s, d) => s + d.balance, 0) / data.length;

  return (
    <div className="card reveal p-5" style={{ animationDelay: ".12s" }}>
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-[15px]">Ahorro por mes</h3>
        <span className="text-[11px] text-ink-mute">
          promedio <span className="mono font-medium text-ink-soft">{fmtCOP(Math.round(avg))}</span>
        </span>
      </div>

      <div className="relative mt-4 flex h-40 items-stretch gap-2">
        {data.map((d, i) => {
          const h = (Math.abs(d.balance) / max) * 100;
          const neg = d.balance < 0;
          const active = hover === i;
          return (
            <div
              key={d.period}
              className="group relative flex flex-1 cursor-default flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {active && (
                <div className="absolute bottom-full z-10 mb-2 w-40 rounded-[8px] border border-navy bg-navy-dark p-2.5 text-left text-[11px] text-white shadow-lg">
                  <div className="mb-1 font-semibold">{monthAbbr(d.period)} {d.period.slice(0, 4)}</div>
                  <div className="flex justify-between"><span className="text-white/60">Ingresos</span><span className="mono">{fmtCOP(d.income)}</span></div>
                  <div className="flex justify-between"><span className="text-white/60">Egresos</span><span className="mono">{fmtCOP(d.expense)}</span></div>
                  <div className="mt-1 flex justify-between border-t border-white/15 pt-1 font-semibold"><span>Ahorro</span><span className="mono">{fmtCOP(d.balance)}</span></div>
                </div>
              )}
              <div
                className="w-full max-w-[42px] rounded-lg transition-all duration-300"
                style={{
                  height: `${Math.max(h, 3)}%`,
                  background: neg
                    ? "#c0392b"
                    : active
                    ? "linear-gradient(180deg, #6366f1, #4338ca)"
                    : "linear-gradient(180deg, #a9b0f5, #6366f1)",
                  animation: `growY .7s ${0.15 + i * 0.06}s cubic-bezier(.22,1,.36,1) both`,
                  transformOrigin: "bottom",
                }}
              />
              <span className={`mt-2 text-[10px] font-medium ${active ? "text-ink" : "text-ink-mute"}`}>
                {monthAbbr(d.period)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
