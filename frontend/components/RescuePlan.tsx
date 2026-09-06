"use client";

import { fmtCOP } from "@/lib/format";
import { Progress } from "@/components/ui";
import { IconCheck, IconArrowRight } from "@/components/icons";

const num = (n: number) => fmtCOP(n).replace("$", "").trim();

type Plan = any;
type Debt = any;

export function RescuePlan({
  plan,
  debts,
  onDefer,
  onCreateGoal,
  deferBusy,
  goalBusy,
}: {
  plan: Plan;
  debts: Debt[];
  onDefer: (d: Debt) => void;
  onCreateGoal: () => void;
  deferBusy: number | null;
  goalBusy: boolean;
}) {
  if (!plan) return null;
  const usedPct = plan.committed > 0 ? Math.min(100, (plan.available / plan.committed) * 100) : 100;
  const byId = new Map(debts.map((d) => [d.id, d]));

  return (
    <div className="card reveal space-y-5 p-5 md:p-6">
      {/* Diagnóstico */}
      <div>
        <h3 className="text-[16px]">Plan cuando el mes no alcanza</h3>
        {plan.notes?.map((n: string, i: number) => (
          <p key={i} className="mt-1 text-[12.5px] text-ink-soft">
            {n}
          </p>
        ))}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Disponible este mes", plan.available, "credit"],
            ["Compromisos por cubrir", plan.committed, "navy"],
            [plan.shortfall > 0 ? "Te falta" : "Sobra", Math.abs(plan.available - plan.committed), plan.shortfall > 0 ? "debit" : "credit"],
            ["Ahorro promedio / mes", plan.avg_saving, "navy"],
          ].map(([label, val, tone]: any) => (
            <div key={label} className="rounded-[10px] border border-line bg-paper px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-mute">{label}</div>
              <div
                className="mono mt-1 text-[15px] font-medium"
                style={{ color: tone === "debit" ? "#c0392b" : tone === "credit" ? "#4338ca" : "#1c1b2e" }}
              >
                {fmtCOP(val)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Progress pct={usedPct} tone={plan.shortfall > 0 ? "gold" : "credit"} />
        </div>
      </div>

      {/* Plan de ahorro */}
      {plan.catchup && (
        <div className="rounded-[12px] border border-indigo-200 bg-tint-navy p-4">
          <div className="text-[13px] font-semibold text-navy">Plan de ahorro para ponerte al día</div>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            Aparta <b className="mono">{fmtCOP(plan.catchup.monthly)}</b>/mes durante{" "}
            <b>{plan.catchup.months} {plan.catchup.months === 1 ? "mes" : "meses"}</b> y cubres el faltante de{" "}
            <b className="mono">{fmtCOP(plan.catchup.needed)}</b> hacia <b className="capitalize">{plan.catchup.finish}</b>.
          </p>
          <button className="btn-primary mt-3" onClick={onCreateGoal} disabled={goalBusy}>
            {goalBusy ? "Creando…" : "Crear meta «Ponerse al día»"}
            {!goalBusy && <IconArrowRight />}
          </button>
        </div>
      )}

      {/* Orden de pago + mes libre */}
      <div>
        <div className="mb-2 text-[13px] font-semibold text-navy">Orden de pago (ataca primero la de mayor tasa)</div>
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Deuda</th>
                <th className="text-right">Tasa E.A.</th>
                <th className="text-right">Cuota</th>
                <th>Recomendación</th>
                <th className="w-[130px]" />
              </tr>
            </thead>
            <tbody>
              {plan.priority.map((p: any) => {
                const d = byId.get(p.debt_id);
                const canDefer =
                  d && !d.paid_this_period && d.remaining_installments > 0 && (d.deferrals ?? 0) < 6;
                return (
                  <tr key={p.debt_id} className="row-post">
                    <td className="font-medium">{p.name}</td>
                    <td className="n">{p.annual_rate}%</td>
                    <td className="n">{num(p.installment_amount)}</td>
                    <td>
                      <span className={`pill ${p.action === "pagar" ? "pill-paid" : "pill-due"}`}>
                        {p.action === "pagar" ? "Pagar" : "Mes libre"}
                      </span>
                      <span className="ml-2 text-[11px] text-ink-mute">{p.reason}</span>
                    </td>
                    <td className="text-right">
                      <button
                        className="btn-outline !px-2.5 !py-1 !text-[11px]"
                        onClick={() => d && onDefer(d)}
                        disabled={!canDefer || deferBusy === p.debt_id}
                      >
                        {d?.paid_this_period ? (
                          <>
                            <IconCheck size={12} /> Al día
                          </>
                        ) : deferBusy === p.debt_id ? (
                          "…"
                        ) : (
                          "Aplazar cuota"
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {plan.defer_candidate_id && (
          <p className="mt-2 text-[11.5px] text-ink-mute">
            Un mes libre en la deuda sugerida libera{" "}
            <span className="mono">{fmtCOP(plan.defer_saves_this_month)}</span> ahora; costo estimado{" "}
            <span className="mono">{fmtCOP(plan.defer_extra_cost)}</span> en intereses + una cuota más de plazo.
          </p>
        )}
      </div>
    </div>
  );
}
