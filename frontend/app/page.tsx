"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApi } from "@/lib/api";
import { usePeriod } from "@/components/Period";
import PageHeader from "@/components/PageHeader";
import { Stat, ErrorBox, CardSkeleton } from "@/components/ui";
import { TrendChart } from "@/components/TrendChart";
import { IconExport, IconPlus } from "@/components/icons";
import { fmtCOP, catColor } from "@/lib/format";

const num = (n: number) => fmtCOP(n).replace("$", "").trim();

export default function Resumen() {
  const { period } = usePeriod();
  const d = useApi<any>(`/dashboard?period=${period}`);
  const trend = useApi<any[]>(`/dashboard/trend?months=6&period=${period}`);
  const txs = useApi<any[]>(`/transactions?period=${period}`);
  const fijos = useApi<any[]>("/recurring-expenses");

  const ledger = useMemo(() => {
    const rows = [...(txs.data || [])].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    let saldo = 0;
    return rows.map((t) => {
      saldo += t.kind === "ingreso" ? t.amount : -t.amount;
      return { ...t, saldo };
    });
  }, [txs.data]);

  const totals = useMemo(() => {
    const cargo = ledger.filter((t) => t.kind === "egreso").reduce((s, t) => s + t.amount, 0);
    const abono = ledger.filter((t) => t.kind === "ingreso").reduce((s, t) => s + t.amount, 0);
    return { cargo, abono, saldo: abono - cargo };
  }, [ledger]);

  const header = (
    <PageHeader
      kicker="Operación"
      title="Resumen"
      actions={
        <>
          <span className="hidden text-[12px] text-ink-mute sm:inline">
            Periodo: <span className="mono text-ink-soft">{period}</span>
          </span>
          <button
            className="btn-outline"
            onClick={() => typeof window !== "undefined" && window.print()}
          >
            <IconExport /> Exportar
          </button>
          <Link href="/movimientos" className="btn-primary">
            <IconPlus /> Registrar movimiento
          </Link>
        </>
      }
    />
  );

  let body: React.ReactNode;

  if (d.error) {
    body = <ErrorBox error={d.error} />;
  } else if (d.loading || !d.data) {
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <CardSkeleton h={200} />
        <CardSkeleton h={280} />
      </div>
    );
  } else {
    const data = d.data;
    const ratio = data.income > 0 ? Math.round((data.expense / data.income) * 100) : 0;
    const committedPct =
      data.income > 0
        ? Math.round(((data.fixed_expenses_total + data.debt_installments_total) / data.income) * 100)
        : 0;
    const maxCat = Math.max(1, ...data.expense_by_category.map((c: any) => c.total));
    const activeFijos = (fijos.data || []).filter((r) => r.active);

    body = (
      <>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <Stat
            label="Balance del mes"
            value={data.balance}
            tone={data.balance >= 0 ? "navy" : "debit"}
            delay={0.04}
            hint={`${ledger.length} movimientos`}
          />
          <Stat label="Ingresos" value={data.income} tone="credit" delay={0.1} hint="ingresos del periodo" />
          <Stat label="Egresos" value={data.expense} tone="debit" delay={0.16} hint={`${ratio}% del ingreso`} />
          <Stat
            label="Comprometido fijo"
            value={data.fixed_expenses_total}
            tone="gold"
            delay={0.22}
            hint={`${committedPct}% del ingreso · pend. ${fmtCOP(data.fixed_expenses_pending)}`}
          />
        </div>

        {trend.data && <TrendChart data={trend.data} />}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.62fr_1fr]">
          {/* Ledger */}
          <div className="card reveal flex flex-col" style={{ animationDelay: ".16s" }}>
            <div className="flex items-baseline justify-between px-4 pb-3 pt-4">
              <h3 className="text-[16px]">Libro de movimientos</h3>
              <Link href="/movimientos" className="text-[11.5px] font-semibold text-navy hover:text-gold">
                Ver todos →
              </Link>
            </div>
            {ledger.length === 0 ? (
              <p className="px-4 pb-8 pt-2 text-center text-sm text-ink-mute">Sin movimientos en este periodo.</p>
            ) : (
              <>
                <div className="overflow-x-auto px-1">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th className="w-[54px]">Fecha</th>
                        <th>Concepto</th>
                        <th>Categoría</th>
                        <th className="text-right">Gasto</th>
                        <th className="text-right">Ingreso</th>
                        <th className="text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.slice(-9).map((t, i) => (
                        <tr key={t.id} className="row-post" style={{ animationDelay: `${0.22 + i * 0.05}s` }}>
                          <td className="mono text-ink-mute">
                            {t.date.slice(8, 10)}/{t.date.slice(5, 7)}
                          </td>
                          <td>{t.note || t.category?.name || "Movimiento"}</td>
                          <td className="text-ink-soft">
                            {t.category ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="dot" style={{ background: catColor(t.category.id, t.category.color) }} />
                                {t.category.name}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="n" style={{ color: t.kind === "egreso" ? "#c0392b" : "#8c949f" }}>
                            {t.kind === "egreso" ? num(t.amount) : "—"}
                          </td>
                          <td className="n" style={{ color: t.kind === "ingreso" ? "#4338ca" : "#8c949f" }}>
                            {t.kind === "ingreso" ? num(t.amount) : "—"}
                          </td>
                          <td className="n">{num(t.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-ink px-4 py-2.5 text-[12px]">
                  <span className="font-semibold">Saldo del periodo</span>
                  <span className="flex flex-wrap gap-4">
                    <span className="text-ink-mute">Gastos <span className="mono text-debit">{fmtCOP(totals.cargo)}</span></span>
                    <span className="text-ink-mute">Ingresos <span className="mono text-credit">{fmtCOP(totals.abono)}</span></span>
                    <span className="mono font-semibold">{fmtCOP(totals.saldo)}</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <div className="card reveal p-[18px]" style={{ animationDelay: ".22s" }}>
              <h3 className="mb-3.5 text-[15px]">Distribución de egresos</h3>
              {data.expense_by_category.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-mute">Sin gastos este mes.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.expense_by_category.map((c: any, i: number) => (
                    <div key={c.category_id ?? "none"}>
                      <div className="mb-1 flex justify-between text-[12px]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="dot" style={{ background: catColor(c.category_id ?? i, c.color) }} />
                          {c.name}
                        </span>
                        <span className="mono text-ink-soft">
                          {num(c.total)} · {Math.round((c.total / (data.expense || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="bar">
                        <i
                          style={{
                            width: `${(c.total / maxCat) * 100}%`,
                            background: catColor(c.category_id ?? i, c.color),
                            animationDelay: `${0.5 + i * 0.07}s`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card reveal flex-1 p-[18px]" style={{ animationDelay: ".28s" }}>
              <h3 className="mb-3 text-[15px]">Compromisos del mes</h3>
              {activeFijos.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-mute">Sin gastos fijos registrados.</p>
              ) : (
                <div className="flex flex-col">
                  {activeFijos.map((r, i, arr) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between py-2 text-[12.5px] ${
                        i < arr.length - 1 ? "border-b border-line-soft" : ""
                      }`}
                    >
                      <span>
                        {r.name} <span className="text-ink-mute">· día {r.due_day}</span>
                      </span>
                      <span className="flex items-center gap-2.5">
                        <span className="mono text-[12px]">{num(r.amount)}</span>
                        <span className={`pill ${r.paid_this_period ? "pill-paid" : "pill-due"}`}>
                          {r.paid_this_period ? "Pagado" : "Pendiente"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between border-t border-line px-1 pt-3 text-[11px] text-ink-mute">
          <span>
            <span className="live-dot mr-1.5 inline-block align-[1px]" />
            Conciliación al día
          </span>
          <span>{ledger.length} movimientos en el periodo</span>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="flex-1 space-y-5 px-5 py-6 md:px-8">{body}</div>
    </>
  );
}
