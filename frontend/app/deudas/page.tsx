"use client";

import { useState } from "react";
import { api, useApi } from "@/lib/api";
import { usePeriod } from "@/components/Period";
import PageHeader from "@/components/PageHeader";
import { Modal, Empty, Progress, ErrorBox } from "@/components/ui";
import { RescuePlan } from "@/components/RescuePlan";
import { useToast } from "@/components/Toast";
import { celebrate } from "@/lib/confetti";
import { IconPlus, IconPencil, IconTrash, IconDeudas } from "@/components/icons";
import { fmtCOP, todayISO } from "@/lib/format";

const num = (n: number) => fmtCOP(n).replace("$", "").trim();

const emptyForm = {
  name: "", lender: "", principal: "", annual_rate: "0",
  total_installments: "12", paid_installments: "0", installment_amount: "",
  due_day: "1", start_date: todayISO(), active: true, note: "",
};

export default function Deudas() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const list = useApi<any[]>("/debts");
  const plan = useApi<any>(`/debts/plan?period=${period}`);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<any>(null);
  const [payForm, setPayForm] = useState({ date: todayISO(), amount: "", note: "", register_transaction: true });
  const [planOpen, setPlanOpen] = useState(false);
  const [deferConfirm, setDeferConfirm] = useState<any>(null);
  const [deferBusy, setDeferBusy] = useState<number | null>(null);
  const [goalBusy, setGoalBusy] = useState(false);

  const reloadAll = () => {
    list.reload();
    plan.reload();
  };

  const doDefer = async (d: any) => {
    setDeferBusy(d.id);
    try {
      const res: any = await api(`/debts/${d.id}/defer`, { method: "POST", body: JSON.stringify({}) });
      toast(`Cuota de «${d.name}» aplazada · ahora ${res.total_installments} cuotas`);
      setDeferConfirm(null);
      reloadAll();
    } catch (e: any) {
      toast(e.message, "err");
    } finally {
      setDeferBusy(null);
    }
  };

  const createCatchupGoal = async () => {
    if (!plan.data?.catchup) return;
    setGoalBusy(true);
    try {
      await api("/goals", {
        method: "POST",
        body: JSON.stringify({
          name: "Ponerse al día",
          target_amount: Math.round(plan.data.catchup.needed),
          current_amount: 0,
          note: `Faltante del mes · aportar ${fmtCOP(plan.data.catchup.monthly)}/mes`,
        }),
      });
      toast("Meta «Ponerse al día» creada · revísala en Presupuesto y metas");
    } catch (e: any) {
      toast(e.message, "err");
    } finally {
      setGoalBusy(false);
    }
  };

  const rows = list.data || [];
  const totalDebt = rows.filter((d) => d.active).reduce((s, d) => s + d.remaining_balance, 0);
  const totalMonthly = rows.filter((d) => d.active).reduce((s, d) => s + d.installment_amount, 0);
  const totalPrincipal = rows.filter((d) => d.active).reduce((s, d) => s + d.principal, 0);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setErr(null);
    setOpen(true);
  };
  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      name: d.name, lender: d.lender, principal: String(d.principal), annual_rate: String(d.annual_rate),
      total_installments: String(d.total_installments), paid_installments: String(d.paid_installments),
      installment_amount: String(d.installment_amount), due_day: String(d.due_day),
      start_date: d.start_date, active: d.active, note: d.note,
    });
    setErr(null);
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        name: form.name, lender: form.lender, principal: Number(form.principal), annual_rate: Number(form.annual_rate),
        total_installments: Number(form.total_installments), paid_installments: Number(form.paid_installments),
        installment_amount: Number(form.installment_amount), due_day: Number(form.due_day),
        start_date: form.start_date, active: form.active, note: form.note,
      };
      if (editing) await api(`/debts/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/debts", { method: "POST", body: JSON.stringify(body) });
      setOpen(false);
      toast(editing ? "Deuda actualizada" : "Deuda creada");
      reloadAll();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (d: any) => {
    if (!confirm(`¿Eliminar la deuda "${d.name}"?`)) return;
    await api(`/debts/${d.id}`, { method: "DELETE" });
    toast("Deuda eliminada");
    reloadAll();
  };

  const submitPay = async () => {
    try {
      const res: any = await api(`/debts/${payFor.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          date: payForm.date,
          amount: payForm.amount ? Number(payForm.amount) : null,
          note: payForm.note,
          register_transaction: payForm.register_transaction,
        }),
      });
      setPayFor(null);
      if (res.remaining_installments === 0) {
        celebrate(1.5);
        toast(`Saldaste ${res.name}`);
      } else {
        toast(`Cuota ${res.paid_installments}/${res.total_installments} registrada`);
      }
      reloadAll();
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  return (
    <>
      <PageHeader
        kicker="Operación"
        title="Deudas"
        actions={
          <>
            {rows.length > 0 && (
              <button className="btn-outline" onClick={() => setPlanOpen((v) => !v)}>
                {planOpen ? "Ocultar plan" : "No puedo pagar este mes"}
              </button>
            )}
            <button className="btn-primary" onClick={openNew}>
              <IconPlus /> Nueva deuda
            </button>
          </>
        }
      />
      <div className="flex-1 space-y-4 px-5 py-6 md:px-8">
        {list.error ? (
          <ErrorBox error={list.error} />
        ) : rows.length === 0 ? (
          <Empty
            icon={<IconDeudas />}
            title="Sin deudas registradas"
            text="Si tienes créditos o tarjetas, agrégalos para seguir su avance cuota a cuota."
            action={
              <button className="btn-primary" onClick={openNew}>
                <IconPlus /> Nueva deuda
              </button>
            }
          />
        ) : (
          <>
            {plan.data && (plan.data.shortfall > 0 || rows.some((d) => d.overdue)) && !planOpen && (
              <button
                onClick={() => setPlanOpen(true)}
                className="flex w-full items-center justify-between rounded-[12px] border border-debit/30 bg-tint-debit px-4 py-3 text-left text-[12.5px] text-debit"
              >
                <span>
                  <b>Este mes no alcanza para tus cuotas.</b>{" "}
                  {plan.data.shortfall > 0 && `Te faltan ${fmtCOP(plan.data.shortfall)}. `}
                  {rows.some((d) => d.overdue) && "Tienes una cuota vencida. "}
                </span>
                <span className="shrink-0 font-semibold underline">Ver plan de rescate</span>
              </button>
            )}

            {planOpen && (
              <RescuePlan
                plan={plan.data}
                debts={rows}
                onDefer={(d) => setDeferConfirm(d)}
                onCreateGoal={createCatchupGoal}
                deferBusy={deferBusy}
                goalBusy={goalBusy}
              />
            )}

            <div className="grid grid-cols-3 gap-3.5">
              <div className="card card-hover reveal p-4" style={{ animationDelay: ".04s", background: "var(--tint-debit)" }}>
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-debit">
                  <span className="h-2.5 w-2.5 rounded-full bg-debit" /> Saldo total
                </div>
                <div className="mono mt-2 text-[22px] font-medium text-debit">{fmtCOP(totalDebt)}</div>
              </div>
              <div className="card card-hover reveal p-4" style={{ animationDelay: ".1s", background: "var(--tint-navy)" }}>
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-navy-mid">
                  <span className="h-2.5 w-2.5 rounded-full bg-navy" /> Cuotas / mes
                </div>
                <div className="mono mt-2 text-[22px] font-medium">{fmtCOP(totalMonthly)}</div>
              </div>
              <div className="card card-hover reveal p-4" style={{ animationDelay: ".16s", background: "var(--tint-gold)" }}>
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-gold">
                  <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Capital original
                </div>
                <div className="mono mt-2 text-[22px] font-medium text-ink-soft">{fmtCOP(totalPrincipal)}</div>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((d, i) => (
                <div key={d.id} className={`card reveal p-5 ${!d.active ? "opacity-50" : ""}`} style={{ animationDelay: `${0.18 + i * 0.06}s` }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px]">{d.name}</h3>
                        {d.overdue && (
                          <span className="pill pill-alert">
                            Cuota vencida {d.days_overdue > 0 ? `hace ${d.days_overdue} d` : ""}
                          </span>
                        )}
                        {(d.deferrals ?? 0) > 0 && (
                          <span className="pill pill-due">{d.deferrals} mes(es) libre(s)</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-ink-mute">
                        {d.lender || "—"} · <span className="mono">{d.annual_rate}%</span> E.A. · vence día {d.due_day}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mono text-[18px] font-medium text-debit">{fmtCOP(d.remaining_balance)}</div>
                      <div className="text-[10.5px] uppercase tracking-[0.1em] text-ink-mute">saldo pendiente</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-[11.5px] text-ink-soft">
                      <span>
                        Cuota <span className="mono">{d.paid_installments}/{d.total_installments}</span> ·{" "}
                        <span className="mono">{num(d.installment_amount)}</span> c/u
                      </span>
                      <span className="mono">{d.progress}%</span>
                    </div>
                    <Progress pct={d.progress} tone="navy" />
                  </div>

                  {d.note && <p className="mt-2.5 text-[11.5px] text-ink-mute">{d.note}</p>}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="btn-primary flex-1"
                      onClick={() => {
                        setPayFor(d);
                        setPayForm({ date: todayISO(), amount: "", note: "", register_transaction: true });
                      }}
                      disabled={d.remaining_installments === 0}
                    >
                      {d.remaining_installments === 0 ? "Saldada" : "Registrar cuota"}
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => setDeferConfirm(d)}
                      disabled={
                        d.remaining_installments === 0 ||
                        d.paid_this_period ||
                        (d.deferrals ?? 0) >= 6
                      }
                      title="Aplazar la cuota de este mes (mes libre)"
                    >
                      Mes libre
                    </button>
                    <button className="btn-ghost !px-3" onClick={() => openEdit(d)} aria-label="Editar">
                      <IconPencil />
                    </button>
                    <button className="btn-danger !px-3" onClick={() => remove(d)} aria-label="Eliminar">
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar deuda" : "Nueva deuda"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Acreedor</label>
              <input className="input" value={form.lender} onChange={(e) => setForm({ ...form, lender: e.target.value })} placeholder="Banco, persona…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Capital original</label>
              <input className="input mono" type="number" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} />
            </div>
            <div>
              <label className="label">Tasa % E.A.</label>
              <input className="input mono" type="number" value={form.annual_rate} onChange={(e) => setForm({ ...form, annual_rate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label"># cuotas</label>
              <input className="input mono" type="number" value={form.total_installments} onChange={(e) => setForm({ ...form, total_installments: e.target.value })} />
            </div>
            <div>
              <label className="label">Pagadas</label>
              <input className="input mono" type="number" value={form.paid_installments} onChange={(e) => setForm({ ...form, paid_installments: e.target.value })} />
            </div>
            <div>
              <label className="label">Día pago</label>
              <input className="input mono" type="number" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor cuota</label>
              <input className="input mono" type="number" value={form.installment_amount} onChange={(e) => setForm({ ...form, installment_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Inicio</label>
              <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Nota</label>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Activa
          </label>
          {err && <p className="text-sm text-debit">{err}</p>}
          <button
            className="btn-primary w-full"
            onClick={save}
            disabled={busy || !form.name || !form.principal || !form.installment_amount}
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </Modal>

      <Modal open={!!payFor} onClose={() => setPayFor(null)} title={`Registrar cuota · ${payFor?.name ?? ""}`}>
        <div className="space-y-3">
          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Monto {payFor && `(vacío = ${fmtCOP(payFor.installment_amount)})`}</label>
            <input
              className="input mono"
              type="number"
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              placeholder={payFor ? String(payFor.installment_amount) : ""}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={payForm.register_transaction}
              onChange={(e) => setPayForm({ ...payForm, register_transaction: e.target.checked })}
            />
            Registrar también como gasto del mes
          </label>
          <button className="btn-primary w-full" onClick={submitPay}>Confirmar pago</button>
        </div>
      </Modal>

      <Modal
        open={!!deferConfirm}
        onClose={() => setDeferConfirm(null)}
        title={`Mes libre · ${deferConfirm?.name ?? ""}`}
      >
        <div className="space-y-3 text-[13px] text-ink-soft">
          <p>
            Aplazas la cuota de este mes. La deuda pasa de{" "}
            <b className="mono">{deferConfirm?.total_installments}</b> a{" "}
            <b className="mono">{(deferConfirm?.total_installments ?? 0) + 1}</b> cuotas y la fecha de
            fin se corre un mes.
          </p>
          <div className="rounded-[10px] border border-line bg-paper p-3">
            <div className="flex justify-between">
              <span>Libera este mes</span>
              <span className="mono font-semibold text-credit">
                {fmtCOP(deferConfirm?.installment_amount ?? 0)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Interés estimado que se acumula</span>
              <span className="mono font-semibold text-debit">
                +{fmtCOP(deferConfirm?.monthly_interest ?? 0)}
              </span>
            </div>
          </div>
          <p className="text-[11.5px] text-ink-mute">
            Úsalo solo si de verdad no puedes pagar: cada mes libre encarece la deuda.
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => doDefer(deferConfirm)}
            disabled={deferBusy === deferConfirm?.id}
          >
            {deferBusy === deferConfirm?.id ? "Aplazando…" : "Confirmar mes libre"}
          </button>
        </div>
      </Modal>
    </>
  );
}
