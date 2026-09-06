"use client";

import { useState } from "react";
import { api, useApi } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Modal, Empty, ErrorBox } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { celebrate } from "@/lib/confetti";
import { IconPlus, IconPencil, IconTrash, IconFijos, IconCheck } from "@/components/icons";
import { fmtCOP, catColor } from "@/lib/format";

const num = (n: number) => fmtCOP(n).replace("$", "").trim();
const emptyForm = { name: "", amount: "", category_id: "", due_day: "1", active: true, note: "" };

export default function Fijos() {
  const { toast } = useToast();
  const cats = useApi<any[]>("/categories");
  const list = useApi<any[]>("/recurring-expenses");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rows = [...(list.data || [])].sort((a, b) => a.due_day - b.due_day);
  const total = rows.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => r.active && !r.paid_this_period).reduce((s, r) => s + r.amount, 0);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setErr(null);
    setOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      name: r.name,
      amount: String(r.amount),
      category_id: r.category_id ? String(r.category_id) : "",
      due_day: String(r.due_day),
      active: r.active,
      note: r.note,
    });
    setErr(null);
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        name: form.name,
        amount: Number(form.amount),
        category_id: form.category_id ? Number(form.category_id) : null,
        due_day: Number(form.due_day),
        active: form.active,
        note: form.note,
      };
      if (editing) await api(`/recurring-expenses/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/recurring-expenses", { method: "POST", body: JSON.stringify(body) });
      setOpen(false);
      toast(editing ? "Gasto fijo actualizado" : "Gasto fijo creado");
      list.reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const pay = async (r: any) => {
    try {
      const pendingBefore = rows.filter((x) => x.active && !x.paid_this_period);
      await api(`/recurring-expenses/${r.id}/pay`, { method: "POST" });
      if (pendingBefore.length === 1 && pendingBefore[0].id === r.id) {
        celebrate();
        toast("Todos los gastos fijos al día");
      } else {
        toast(`${r.name} marcado como pagado`);
      }
      list.reload();
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const remove = async (r: any) => {
    if (!confirm(`¿Eliminar el gasto fijo "${r.name}"?`)) return;
    await api(`/recurring-expenses/${r.id}`, { method: "DELETE" });
    toast("Gasto fijo eliminado");
    list.reload();
  };

  return (
    <>
      <PageHeader
        kicker="Operación"
        title="Gastos fijos"
        actions={
          <button className="btn-primary" onClick={openNew}>
            <IconPlus /> Nuevo gasto fijo
          </button>
        }
      />
      <div className="flex-1 space-y-4 px-5 py-6 md:px-8">
        {list.error ? (
          <ErrorBox error={list.error} />
        ) : rows.length === 0 ? (
          <Empty
            icon={<IconFijos />}
            title="Sin gastos fijos"
            text="Arriendo, servicios, suscripciones… Regístralos una vez y llévalos al día cada mes."
            action={
              <button className="btn-primary" onClick={openNew}>
                <IconPlus /> Nuevo gasto fijo
              </button>
            }
          />
        ) : (
          <>
            <div className="flex gap-2">
              <span className="pill">Total mensual {fmtCOP(total)}</span>
              <span className="pill pill-due">Pendiente {fmtCOP(pending)}</span>
            </div>

            <div className="card overflow-x-auto px-1 py-3">
              <table className="ledger">
                <thead>
                  <tr>
                    <th className="w-[44px]">Día</th>
                    <th>Concepto</th>
                    <th>Categoría</th>
                    <th className="text-right">Valor</th>
                    <th className="w-[96px]">Estado</th>
                    <th className="w-[150px]" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} className={`row-post group ${!r.active ? "opacity-45" : ""}`} style={{ animationDelay: `${i * 0.04}s` }}>
                      <td className="mono text-ink-mute">{String(r.due_day).padStart(2, "0")}</td>
                      <td className="font-medium">
                        {r.name}
                        {r.note && <span className="ml-2 text-[11px] text-ink-mute">{r.note}</span>}
                      </td>
                      <td className="text-ink-soft">
                        {r.category ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="dot" style={{ background: catColor(r.category.id, r.category.color) }} />
                            {r.category.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="n">{num(r.amount)}</td>
                      <td>
                        <span className={`pill ${r.paid_this_period ? "pill-paid" : "pill-due"}`}>
                          {r.paid_this_period ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="inline-flex items-center gap-2">
                          <button
                            className="btn-outline !px-2.5 !py-1 !text-[11px] disabled:opacity-30"
                            onClick={() => pay(r)}
                            disabled={r.paid_this_period || !r.active}
                          >
                            {r.paid_this_period ? <IconCheck size={13} /> : "Pagar"}
                          </button>
                          <span className="inline-flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button className="text-ink-mute hover:text-navy" onClick={() => openEdit(r)} aria-label="Editar">
                              <IconPencil />
                            </button>
                            <button className="text-ink-mute hover:text-debit" onClick={() => remove(r)} aria-label="Eliminar">
                              <IconTrash />
                            </button>
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar gasto fijo" : "Nuevo gasto fijo"}>
        <div className="space-y-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Arriendo, internet, gimnasio…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monto (COP)</label>
              <input className="input mono" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Día de pago</label>
              <input className="input mono" type="number" min={1} max={31} value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Sin categoría</option>
              {(cats.data || []).filter((c) => c.kind === "egreso").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nota</label>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Activo
          </label>
          {err && <p className="text-sm text-debit">{err}</p>}
          <button className="btn-primary w-full" onClick={save} disabled={busy || !form.name || !form.amount}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </Modal>
    </>
  );
}
