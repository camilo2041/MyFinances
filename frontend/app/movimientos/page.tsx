"use client";

import { useMemo, useState } from "react";
import { api, useApi } from "@/lib/api";
import { usePeriod } from "@/components/Period";
import PageHeader from "@/components/PageHeader";
import { Modal, Empty, ErrorBox } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconPlus, IconPencil, IconTrash, IconMovimientos } from "@/components/icons";
import { fmtCOP, todayISO, catColor } from "@/lib/format";

const num = (n: number) => fmtCOP(n).replace("$", "").trim();
const emptyForm = { date: todayISO(), amount: "", kind: "egreso", category_id: "", note: "" };

export default function Movimientos() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const cats = useApi<any[]>("/categories");
  const txs = useApi<any[]>(`/transactions?period=${period}`);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [filter, setFilter] = useState<"todos" | "ingreso" | "egreso">("todos");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [newCat, setNewCat] = useState<string | null>(null);

  const createCat = async () => {
    const name = (newCat || "").trim();
    if (!name) return;
    try {
      const c: any = await api("/categories", {
        method: "POST",
        body: JSON.stringify({ name, kind: form.kind, icon: "•" }),
      });
      await cats.reload();
      setForm((f: any) => ({ ...f, category_id: String(c.id) }));
      setNewCat(null);
      toast("Categoría creada");
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const list = useMemo(
    () =>
      [...(txs.data || [])]
        .filter((t) => filter === "todos" || t.kind === filter)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    [txs.data, filter]
  );
  const totals = useMemo(() => {
    const inc = (txs.data || []).filter((t) => t.kind === "ingreso").reduce((s, t) => s + t.amount, 0);
    const exp = (txs.data || []).filter((t) => t.kind === "egreso").reduce((s, t) => s + t.amount, 0);
    return { inc, exp };
  }, [txs.data]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setErr(null);
    setOpen(true);
  };
  const openEdit = (t: any) => {
    setEditing(t);
    setForm({
      date: t.date,
      amount: String(t.amount),
      kind: t.kind,
      category_id: t.category_id ? String(t.category_id) : "",
      note: t.note,
    });
    setErr(null);
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        date: form.date,
        amount: Number(form.amount),
        kind: form.kind,
        category_id: form.category_id ? Number(form.category_id) : null,
        note: form.note,
      };
      if (editing) await api(`/transactions/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/transactions", { method: "POST", body: JSON.stringify(body) });
      setOpen(false);
      toast(editing ? "Movimiento actualizado" : "Movimiento guardado");
      txs.reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (t: any) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await api(`/transactions/${t.id}`, { method: "DELETE" });
    toast("Movimiento eliminado");
    txs.reload();
  };

  const catOptions = (cats.data || []).filter((c) => c.kind === form.kind);

  return (
    <>
      <PageHeader
        kicker="Operación"
        title="Movimientos"
        actions={
          <button className="btn-primary" onClick={openNew}>
            <IconPlus /> Nuevo movimiento
          </button>
        }
      />
      <div className="flex-1 space-y-4 px-5 py-6 md:px-8">
        {txs.error ? (
          <ErrorBox error={txs.error} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <span className="pill pill-paid">Ingresos {fmtCOP(totals.inc)}</span>
                <span className="pill pill-alert">Gastos {fmtCOP(totals.exp)}</span>
                <span className="pill">Neto {fmtCOP(totals.inc - totals.exp)}</span>
              </div>
              <div className="flex gap-1">
                {(["todos", "ingreso", "egreso"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                      filter === f
                        ? "border-navy bg-navy text-white"
                        : "border-line bg-white text-ink-soft hover:border-navy/40"
                    }`}
                  >
                    {f === "ingreso" ? "Ingresos" : f === "egreso" ? "Gastos" : "Todos"}
                  </button>
                ))}
              </div>
            </div>

            {list.length === 0 ? (
              <Empty
                icon={<IconMovimientos />}
                title="Sin movimientos este mes"
                text="Registra tus ingresos y gastos para ver aquí el libro del periodo."
                action={
                  <button className="btn-primary" onClick={openNew}>
                    <IconPlus /> Nuevo movimiento
                  </button>
                }
              />
            ) : (
              <div className="card overflow-x-auto px-1 py-3">
                <table className="ledger">
                  <thead>
                    <tr>
                      <th className="w-[60px]">Fecha</th>
                      <th>Concepto</th>
                      <th>Categoría</th>
                      <th>Origen</th>
                      <th className="text-right">Gasto</th>
                      <th className="text-right">Ingreso</th>
                      <th className="w-[70px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t, i) => (
                      <tr key={t.id} className="row-post group" style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
                        <td className="mono text-ink-mute">
                          {t.date.slice(8, 10)}/{t.date.slice(5, 7)}/{t.date.slice(2, 4)}
                        </td>
                        <td className="font-medium">{t.note || t.category?.name || "Movimiento"}</td>
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
                        <td className="text-ink-mute">{t.source_type || "manual"}</td>
                        <td className="n" style={{ color: t.kind === "egreso" ? "#c0392b" : "#cbc9db" }}>
                          {t.kind === "egreso" ? num(t.amount) : "—"}
                        </td>
                        <td className="n" style={{ color: t.kind === "ingreso" ? "#4338ca" : "#cbc9db" }}>
                          {t.kind === "ingreso" ? num(t.amount) : "—"}
                        </td>
                        <td className="n">
                          <span className="inline-flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button className="text-ink-mute hover:text-navy" onClick={() => openEdit(t)} aria-label="Editar">
                              <IconPencil />
                            </button>
                            <button className="text-ink-mute hover:text-debit" onClick={() => remove(t)} aria-label="Eliminar">
                              <IconTrash />
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar movimiento" : "Nuevo movimiento"}>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["egreso", "ingreso"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setForm((f: any) => ({ ...f, kind: k, category_id: "" }))}
                className={`flex-1 rounded-[10px] border px-3 py-2.5 text-[13px] font-semibold ${
                  form.kind === k
                    ? k === "ingreso"
                      ? "border-credit bg-credit text-white"
                      : "border-debit bg-debit text-white"
                    : "border-line bg-line-soft text-ink-soft"
                }`}
              >
                {k === "ingreso" ? "Ingreso (entra)" : "Gasto (sale)"}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Monto (COP)</label>
            <input
              className="input mono"
              type="number"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label !mb-0">Categoría</label>
              <button
                type="button"
                className="text-[11px] font-semibold text-navy hover:text-gold"
                onClick={() => setNewCat(newCat === null ? "" : null)}
              >
                {newCat === null ? "+ Crear categoría" : "Cancelar"}
              </button>
            </div>
            {newCat === null ? (
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Sin categoría</option>
                {catOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input"
                  autoFocus
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createCat())}
                  placeholder={`Nueva categoría de ${form.kind === "ingreso" ? "ingreso" : "gasto"}`}
                />
                <button type="button" className="btn-primary shrink-0" onClick={createCat} disabled={!newCat.trim()}>
                  Crear
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="label">Concepto</label>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Descripción" />
          </div>
          {err && <p className="text-sm text-debit">{err}</p>}
          <button className="btn-primary w-full" onClick={save} disabled={busy || !form.amount}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </Modal>
    </>
  );
}
