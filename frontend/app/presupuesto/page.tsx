"use client";

import { useState } from "react";
import { api, useApi } from "@/lib/api";
import { usePeriod } from "@/components/Period";
import PageHeader from "@/components/PageHeader";
import { Modal, Empty, Progress, ErrorBox } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { celebrate } from "@/lib/confetti";
import { IconPlus, IconPencil, IconTrash, IconPresupuesto } from "@/components/icons";
import { fmtCOP, todayISO, catColor } from "@/lib/format";

export default function Presupuesto() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const cats = useApi<any[]>("/categories");
  const budgets = useApi<any[]>(`/budgets?period=${period}`);
  const goals = useApi<any[]>("/goals");

  const [bOpen, setBOpen] = useState(false);
  const [bForm, setBForm] = useState({ category_id: "", amount: "" });
  const [gOpen, setGOpen] = useState(false);
  const [gEditing, setGEditing] = useState<any>(null);
  const [gForm, setGForm] = useState({ name: "", target_amount: "", current_amount: "0", target_date: "", note: "" });
  const [contribFor, setContribFor] = useState<any>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const saveBudget = async () => {
    setErr(null);
    try {
      await api("/budgets", {
        method: "POST",
        body: JSON.stringify({ category_id: Number(bForm.category_id), amount: Number(bForm.amount), period: null }),
      });
      setBOpen(false);
      setBForm({ category_id: "", amount: "" });
      toast("Límite guardado");
      budgets.reload();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const deleteBudget = async (b: any) => {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    await api(`/budgets/${b.id}`, { method: "DELETE" });
    toast("Límite eliminado");
    budgets.reload();
  };

  const openGoalNew = () => {
    setGEditing(null);
    setGForm({ name: "", target_amount: "", current_amount: "0", target_date: "", note: "" });
    setErr(null);
    setGOpen(true);
  };
  const openGoalEdit = (g: any) => {
    setGEditing(g);
    setGForm({
      name: g.name,
      target_amount: String(g.target_amount),
      current_amount: String(g.current_amount),
      target_date: g.target_date || "",
      note: g.note,
    });
    setErr(null);
    setGOpen(true);
  };

  const saveGoal = async () => {
    setErr(null);
    try {
      const body = {
        name: gForm.name,
        target_amount: Number(gForm.target_amount),
        current_amount: Number(gForm.current_amount),
        target_date: gForm.target_date || null,
        note: gForm.note,
      };
      if (gEditing) await api(`/goals/${gEditing.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/goals", { method: "POST", body: JSON.stringify(body) });
      setGOpen(false);
      toast(gEditing ? "Meta actualizada" : "Meta creada");
      goals.reload();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const deleteGoal = async (g: any) => {
    if (!confirm(`¿Eliminar la meta "${g.name}"?`)) return;
    await api(`/goals/${g.id}`, { method: "DELETE" });
    toast("Meta eliminada");
    goals.reload();
  };

  const submitContrib = async () => {
    try {
      const res: any = await api(`/goals/${contribFor.id}/contribute`, {
        method: "POST",
        body: JSON.stringify({ date: todayISO(), amount: Number(contribAmount) }),
      });
      setContribFor(null);
      setContribAmount("");
      if (res.progress >= 100) {
        celebrate(1.5);
        toast(`Meta "${res.name}" cumplida`);
      } else {
        toast(`Aporte registrado · ${res.progress}%`);
      }
      goals.reload();
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const usedCatIds = new Set((budgets.data || []).map((b) => b.category_id));
  const availableCats = (cats.data || []).filter((c) => c.kind === "egreso" && !usedCatIds.has(c.id));

  return (
    <>
      <PageHeader kicker="Operación" title="Presupuesto y metas" />
      <div className="flex-1 space-y-6 px-5 py-6 md:px-8">
        {budgets.error ? (
          <ErrorBox error={budgets.error} />
        ) : (
          <>
            {/* PRESUPUESTO */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px]">Presupuesto por categoría</h2>
                <button className="btn-outline" onClick={() => setBOpen(true)} disabled={availableCats.length === 0}>
                  <IconPlus /> Añadir límite
                </button>
              </div>
              {(budgets.data || []).length === 0 ? (
                <Empty
                  icon={<IconPresupuesto />}
                  title="Sin límites definidos"
                  text="Define cuánto quieres gastar como máximo en cada categoría y vigila el consumo real."
                />
              ) : (
                <div className="card overflow-x-auto px-1 py-3">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th>Categoría</th>
                        <th className="text-right">Ejecutado</th>
                        <th className="text-right">Límite</th>
                        <th className="text-right">Disponible</th>
                        <th className="w-[140px]">Consumo</th>
                        <th className="w-[40px]" />
                      </tr>
                    </thead>
                    <tbody>
                      {(budgets.data || []).map((b, i) => (
                        <tr key={b.id} className="row-post group" style={{ animationDelay: `${i * 0.04}s` }}>
                          <td className="font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="dot" style={{ background: catColor(b.category_id, b.category.color) }} />
                              {b.category.name}
                            </span>
                          </td>
                          <td className="n">{fmtCOP(b.spent).replace("$", "").trim()}</td>
                          <td className="n text-ink-soft">{fmtCOP(b.amount).replace("$", "").trim()}</td>
                          <td className="n" style={{ color: b.remaining < 0 ? "#c0392b" : "#4338ca" }}>
                            {b.remaining < 0 ? "−" : ""}
                            {fmtCOP(Math.abs(b.remaining)).replace("$", "").trim()}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Progress pct={b.pct} />
                              <span className="mono w-9 shrink-0 text-right text-[11px] text-ink-soft">{Math.round(b.pct)}%</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <button
                              className="text-ink-mute opacity-0 transition-opacity hover:text-debit group-hover:opacity-100"
                              onClick={() => deleteBudget(b)}
                              aria-label="Eliminar"
                            >
                              <IconTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* METAS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px]">Metas de ahorro</h2>
                <button className="btn-outline" onClick={openGoalNew}>
                  <IconPlus /> Nueva meta
                </button>
              </div>
              {(goals.data || []).length === 0 ? (
                <Empty
                  icon={<IconPresupuesto />}
                  title="Sin metas de ahorro"
                  text="Fondo de emergencia, un viaje, la cuota inicial… ponle nombre y sigue su avance."
                  action={
                    <button className="btn-primary" onClick={openGoalNew}>
                      <IconPlus /> Nueva meta
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(goals.data || []).map((g, i) => (
                    <div key={g.id} className="card reveal p-[18px]" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-[15px]">{g.name}</h3>
                          {g.target_date && <div className="text-[11px] text-ink-mute">objetivo {g.target_date}</div>}
                        </div>
                        <div className="flex gap-1.5">
                          <button className="text-ink-mute hover:text-navy" onClick={() => openGoalEdit(g)} aria-label="Editar">
                            <IconPencil />
                          </button>
                          <button className="text-ink-mute hover:text-debit" onClick={() => deleteGoal(g)} aria-label="Eliminar">
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                      <div className="my-2.5 flex justify-between text-[11.5px] text-ink-soft">
                        <span>
                          <span className="mono">{fmtCOP(g.current_amount)}</span> de{" "}
                          <span className="mono">{fmtCOP(g.target_amount)}</span>
                        </span>
                        <span className="mono">{g.progress}%</span>
                      </div>
                      <Progress pct={g.progress} tone="navy" />
                      {g.note && <p className="mt-2 text-[11.5px] text-ink-mute">{g.note}</p>}
                      <button
                        className="btn-outline mt-3 w-full"
                        onClick={() => {
                          setContribFor(g);
                          setContribAmount("");
                        }}
                      >
                        <IconPlus /> Registrar aporte
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Modal open={bOpen} onClose={() => setBOpen(false)} title="Nuevo límite de gasto">
        <div className="space-y-3">
          <div>
            <label className="label">Categoría</label>
            <select className="input" value={bForm.category_id} onChange={(e) => setBForm({ ...bForm, category_id: e.target.value })}>
              <option value="">Elige…</option>
              {availableCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Límite mensual (COP)</label>
            <input className="input mono" type="number" value={bForm.amount} onChange={(e) => setBForm({ ...bForm, amount: e.target.value })} />
          </div>
          {err && <p className="text-sm text-debit">{err}</p>}
          <button className="btn-primary w-full" onClick={saveBudget} disabled={!bForm.category_id || !bForm.amount}>
            Guardar
          </button>
        </div>
      </Modal>

      <Modal open={gOpen} onClose={() => setGOpen(false)} title={gEditing ? "Editar meta" : "Nueva meta de ahorro"}>
        <div className="space-y-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={gForm.name} onChange={(e) => setGForm({ ...gForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Meta (COP)</label>
              <input className="input mono" type="number" value={gForm.target_amount} onChange={(e) => setGForm({ ...gForm, target_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Ya ahorrado</label>
              <input className="input mono" type="number" value={gForm.current_amount} onChange={(e) => setGForm({ ...gForm, current_amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Fecha objetivo (opcional)</label>
            <input className="input" type="date" value={gForm.target_date} onChange={(e) => setGForm({ ...gForm, target_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Nota</label>
            <input className="input" value={gForm.note} onChange={(e) => setGForm({ ...gForm, note: e.target.value })} />
          </div>
          {err && <p className="text-sm text-debit">{err}</p>}
          <button className="btn-primary w-full" onClick={saveGoal} disabled={!gForm.name || !gForm.target_amount}>
            Guardar
          </button>
        </div>
      </Modal>

      <Modal open={!!contribFor} onClose={() => setContribFor(null)} title={`Aporte · ${contribFor?.name ?? ""}`}>
        <div className="space-y-3">
          <div>
            <label className="label">Monto del aporte (COP)</label>
            <input
              className="input mono"
              type="number"
              autoFocus
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full" onClick={submitContrib} disabled={!contribAmount}>
            Registrar aporte
          </button>
        </div>
      </Modal>
    </>
  );
}
