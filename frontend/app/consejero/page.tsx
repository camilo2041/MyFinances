"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApi } from "@/lib/api";
import { usePeriod } from "@/components/Period";
import PageHeader from "@/components/PageHeader";
import { ErrorBox, CardSkeleton } from "@/components/ui";
import { useCountUp } from "@/lib/hooks";
import { buildAdvice } from "@/lib/advisor";
import { fmtCOP } from "@/lib/format";

function Num({ value }: { value: number }) {
  const v = useCountUp(value, 900);
  return <span className="mono">{Math.round(v)}</span>;
}

export default function Consejero() {
  const { period } = usePeriod();
  const d = useApi<any>(`/dashboard?period=${period}`);
  const trend = useApi<any[]>(`/dashboard/trend?months=6&period=${period}`);
  const debts = useApi<any[]>("/debts");
  const goals = useApi<any[]>("/goals");
  const budgets = useApi<any[]>(`/budgets?period=${period}`);
  const plan = useApi<any>(`/debts/plan?period=${period}`);

  const ready =
    !!d.data && !!trend.data && !!debts.data && !!goals.data && !!budgets.data;

  const advice = useMemo(() => {
    if (!ready) return null;
    return buildAdvice({
      dashboard: d.data,
      trend: trend.data!,
      debts: debts.data!,
      goals: goals.data!,
      budgets: budgets.data!,
    });
  }, [ready, d.data, trend.data, debts.data, goals.data, budgets.data]);

  const toneClass: Record<string, string> = {
    good: "bg-[#f0f6f2] text-[#1f5340]",
    watch: "bg-[#f8f2e6] text-[#6b5220]",
    risk: "bg-[#fbf0ef] text-[#7c2f29]",
  };

  return (
    <>
      <PageHeader
        kicker="Asesoría"
        title="Consejero"
        actions={
          <div className="text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-tint-teal px-2.5 py-1 text-[11.5px] font-semibold text-teal-dark">
              <span className="spinner" /> Análisis en vivo
            </div>
            <div className="mt-1 text-[11px] text-ink-mute">Base: movimientos de los últimos 6 meses</div>
          </div>
        }
      />
      <div className="flex-1 space-y-4 px-5 py-6 md:px-8">
        {plan.data && plan.data.shortfall > 0 && (
          <Link
            href="/deudas"
            className="flex items-center justify-between rounded-[12px] border border-debit/30 bg-tint-debit px-4 py-3 text-[12.5px] text-debit"
          >
            <span>
              <b>Este mes no alcanzas para cubrir cuotas + gastos fijos.</b> Te faltan{" "}
              {fmtCOP(plan.data.shortfall)}.
            </span>
            <span className="shrink-0 font-semibold underline">Ver plan de rescate →</span>
          </Link>
        )}
        {d.error ? (
          <ErrorBox error={d.error} />
        ) : !advice ? (
          <div className="space-y-4">
            <CardSkeleton h={110} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
              <CardSkeleton h={360} />
              <CardSkeleton h={360} />
            </div>
          </div>
        ) : (
          <>
            {/* HEALTH BAND */}
            <div className="card reveal flex flex-col gap-6 p-5 md:flex-row md:items-center md:gap-10" style={{ animationDelay: ".04s" }}>
              <div className="shrink-0">
                <div className="kicker">Índice de salud financiera</div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[34px] font-medium leading-none">
                    <Num value={advice.score} />
                  </span>
                  <span className="text-[12px] text-ink-mute">/ 100</span>
                  <span className="ml-1 text-[12px] font-semibold text-credit">{advice.label}</span>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  ["Liquidez", advice.sub.liquidez, "#4f46e5"],
                  ["Endeudamiento", advice.sub.endeudamiento, "#818cf8"],
                  ["Ahorro", advice.sub.ahorro, "#372f9e"],
                ].map(([label, val, color]: any) => (
                  <div key={label}>
                    <div className="mb-1.5 flex justify-between text-[11.5px]">
                      <span className="text-ink-soft">{label}</span>
                      <Num value={val} />
                    </div>
                    <div className="bar">
                      <i style={{ width: `${val}%`, background: color, animationDelay: ".45s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
              {/* Diagnóstico */}
              <div className="card reveal flex flex-col p-5 md:p-[22px]" style={{ animationDelay: ".1s" }}>
                <h3 className="text-[16px]">Diagnóstico</h3>
                <p className="mb-4 mt-0.5 text-[12px] text-ink-mute">
                  {advice.findings.length} {advice.findings.length === 1 ? "hallazgo" : "hallazgos"} ordenados por prioridad.
                </p>
                <div className="flex flex-col gap-3.5">
                  {advice.findings.map((f, i) => (
                    <div key={f.n}>
                      {i > 0 && <div className="mb-3.5 border-t border-line-soft" />}
                      <div className="flex gap-3.5 reveal" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                        <span
                          className="mono shrink-0 pt-0.5 text-[12px] text-gold"
                          style={{ animation: `pop .4s ${0.24 + i * 0.08}s cubic-bezier(.34,1.56,.64,1) both` }}
                        >
                          {f.n}
                        </span>
                        <div>
                          <div className="text-[13.5px] font-semibold">{f.title}</div>
                          <p className="mt-0.5 text-[12.5px] text-ink-soft">{f.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex gap-2 border-t border-line pt-4">
                  <input
                    className="input"
                    placeholder="Consulta a tu consejero… ej.: ¿adelanto cuotas del crédito o invierto ese dinero?"
                  />
                  <button className="btn-primary shrink-0">Enviar</button>
                </div>
                <p className="mt-2 text-[10.5px] text-ink-mute">
                  Se calcula con tus movimientos; no constituye asesoría financiera profesional.
                </p>
              </div>

              {/* Recomendaciones + Proyección */}
              <div className="flex flex-col gap-5">
                <div className="card reveal p-[18px]" style={{ animationDelay: ".16s" }}>
                  <h3 className="mb-3 text-[15px]">Recomendaciones</h3>
                  <div className="flex flex-col gap-3">
                    {advice.recs.map((r, i) => (
                      <div key={i} className="group flex gap-2.5">
                        <span className="relative mt-0.5 h-3.5 w-3.5 shrink-0 rounded-[2px] border border-[#c9c6da] transition-colors group-hover:border-gold">
                          <svg viewBox="0 0 16 16" className="rec-check absolute -inset-px" style={{ stroke: "#4f46e5", strokeWidth: 2.4, fill: "none" }}>
                            <path d="M3 8l3.5 3.5L13 4" />
                          </svg>
                        </span>
                        <div>
                          <div className="text-[12.5px] font-medium">
                            {r.text}{" "}
                            <span className={`pill ${r.impact === "Alto" ? "pill-alert" : r.impact === "Medio" ? "pill-due" : ""}`}>
                              Impacto {r.impact.toLowerCase()}
                            </span>
                          </div>
                          {r.detail && <p className="mt-0.5 text-[11.5px] text-ink-mute">{r.detail}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card reveal flex-1 p-[18px]" style={{ animationDelay: ".22s" }}>
                  <h3 className="mb-3 text-[15px]">Proyección a ritmo actual</h3>
                  <div className="flex flex-col">
                    {advice.projections.map((p, i, arr) => (
                      <div
                        key={p.label}
                        className={`flex items-center justify-between py-2 text-[12.5px] ${i < arr.length - 1 ? "border-b border-line-soft" : ""}`}
                      >
                        <span className="text-ink-soft">{p.label}</span>
                        <span className="mono" style={{ color: p.value.startsWith("+") ? "#4338ca" : undefined }}>
                          {p.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
