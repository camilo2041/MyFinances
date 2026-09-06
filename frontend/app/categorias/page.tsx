"use client";

import { useState } from "react";
import { api, useApi } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Modal, Empty, ErrorBox } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconPlus, IconPencil, IconTrash, IconTag } from "@/components/icons";
import { CAT_PALETTE, catColor } from "@/lib/format";

const emptyForm = { name: "", kind: "egreso" as "egreso" | "ingreso", color: CAT_PALETTE[0] };

export default function Categorias() {
  const { toast } = useToast();
  const cats = useApi<any[]>("/categories");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rows = cats.data || [];
  const ingresos = rows.filter((c) => c.kind === "ingreso");
  const egresos = rows.filter((c) => c.kind === "egreso");

  const openNew = (kind: "egreso" | "ingreso" = "egreso") => {
    setEditing(null);
    setForm({ ...emptyForm, kind });
    setErr(null);
    setOpen(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, kind: c.kind, color: c.color || CAT_PALETTE[0] });
    setErr(null);
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const body = { name: form.name.trim(), kind: form.kind, color: form.color, icon: "•" };
      if (editing) await api(`/categories/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/categories", { method: "POST", body: JSON.stringify(body) });
      setOpen(false);
      toast(editing ? "Categoría actualizada" : "Categoría creada");
      cats.reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: any) => {
    if (!confirm(`¿Eliminar la categoría "${c.name}"? Los movimientos que la usan quedarán sin categoría.`)) return;
    await api(`/categories/${c.id}`, { method: "DELETE" });
    toast("Categoría eliminada");
    cats.reload();
  };

  const Section = ({ title, list, kind }: { title: string; list: any[]; kind: "egreso" | "ingreso" }) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px]">{title}</h2>
        <button className="btn-outline" onClick={() => openNew(kind)}>
          <IconPlus /> Añadir
        </button>
      </div>
      {list.length === 0 ? (
        <div className="card p-4 text-sm text-ink-mute">Aún no hay categorías de {kind === "ingreso" ? "ingreso" : "gasto"}.</div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-line-soft">
            {list.map((c, i) => (
              <li key={c.id} className="group flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2.5">
                  <span className="dot" style={{ background: catColor(c.id ?? i, c.color) }} />
                  {c.name}
                </span>
                <span className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="text-ink-mute hover:text-navy" onClick={() => openEdit(c)} aria-label="Editar">
                    <IconPencil />
                  </button>
                  <button className="text-ink-mute hover:text-debit" onClick={() => remove(c)} aria-label="Eliminar">
                    <IconTrash />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );

  return (
    <>
      <PageHeader
        kicker="Operación"
        title="Categorías"
        actions={
          <button className="btn-primary" onClick={() => openNew()}>
            <IconPlus /> Nueva categoría
          </button>
        }
      />
      <div className="flex-1 space-y-6 px-5 py-6 md:px-8">
        {cats.error ? (
          <ErrorBox error={cats.error} />
        ) : rows.length === 0 && !cats.loading ? (
          <Empty
            icon={<IconTag />}
            title="Sin categorías"
            text="Crea categorías para clasificar tus ingresos y gastos."
            action={
              <button className="btn-primary" onClick={() => openNew()}>
                <IconPlus /> Nueva categoría
              </button>
            }
          />
        ) : (
          <>
            <p className="text-[12.5px] text-ink-soft">
              Con estas categorías clasificas cada movimiento. Se usan en el resumen, el presupuesto y el
              consejero.
            </p>
            <Section title="Gastos" list={egresos} kind="egreso" />
            <Section title="Ingresos" list={ingresos} kind="ingreso" />
          </>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar categoría" : "Nueva categoría"}>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["egreso", "ingreso"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setForm((f) => ({ ...f, kind: k }))}
                className={`flex-1 rounded-[10px] border px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] ${
                  form.kind === k
                    ? k === "ingreso"
                      ? "border-credit bg-credit text-white"
                      : "border-debit bg-debit text-white"
                    : "border-line bg-line-soft text-ink-soft"
                }`}
              >
                {k === "ingreso" ? "Ingreso" : "Gasto"}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mercado, Salario, Gimnasio…"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {CAT_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  aria-label={c}
                  className="h-7 w-7 rounded-full transition"
                  style={{
                    background: c,
                    outline: form.color === c ? "2px solid #1c1b2e" : "2px solid transparent",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>
          {err && <p className="text-sm text-debit">{err}</p>}
          <button className="btn-primary w-full" onClick={save} disabled={busy || !form.name.trim()}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </Modal>
    </>
  );
}
