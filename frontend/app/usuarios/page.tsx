"use client";

import { useState } from "react";
import { api, useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Modal, Empty, ErrorBox } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconPlus, IconPencil, IconTrash, IconUsers } from "@/components/icons";
import { fmtDate } from "@/lib/format";

const emptyNew = { email: "", name: "", password: "", role: "user" as "user" | "admin" };

export default function Usuarios() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const users = useApi<any[]>(me?.role === "admin" ? "/users" : null);

  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState(emptyNew);
  const [editing, setEditing] = useState<any>(null);
  const [eForm, setEForm] = useState({ name: "", role: "user", is_active: true, password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (me && me.role !== "admin") {
    return (
      <>
        <PageHeader kicker="Administración" title="Usuarios" />
        <div className="flex-1 px-5 py-6 md:px-8">
          <div className="card p-6 text-sm text-ink-soft">
            Esta sección es solo para administradores.
          </div>
        </div>
      </>
    );
  }

  const create = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setNewOpen(false);
      setForm(emptyNew);
      toast("Usuario creado");
      users.reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setEForm({ name: u.name, role: u.role, is_active: u.is_active, password: "" });
    setErr(null);
  };

  const saveEdit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const body: any = { name: eForm.name, role: eForm.role, is_active: eForm.is_active };
      if (eForm.password) body.password = eForm.password;
      await api(`/users/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setEditing(null);
      toast("Usuario actualizado");
      users.reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u: any) => {
    if (!confirm(`Eliminar a ${u.name} y todos sus datos financieros. ¿Continuar?`)) return;
    try {
      await api(`/users/${u.id}`, { method: "DELETE" });
      toast("Usuario eliminado");
      users.reload();
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  return (
    <>
      <PageHeader
        kicker="Administración"
        title="Usuarios"
        actions={
          <button className="btn-primary" onClick={() => setNewOpen(true)}>
            <IconPlus /> Nuevo usuario
          </button>
        }
      />
      <div className="flex-1 space-y-4 px-5 py-6 md:px-8">
        {users.error ? (
          <ErrorBox error={users.error} />
        ) : (users.data || []).length === 0 ? (
          <Empty icon={<IconUsers />} title="Sin usuarios" text="Crea el primer usuario que manejará sus finanzas." />
        ) : (
          <div className="card overflow-x-auto px-1 py-3">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th className="w-[70px]" />
                </tr>
              </thead>
              <tbody>
                {(users.data || []).map((u, i) => (
                  <tr key={u.id} className="row-post group" style={{ animationDelay: `${i * 0.04}s` }}>
                    <td className="font-medium">
                      {u.name}
                      {me?.id === u.id && <span className="ml-2 text-[10px] text-ink-mute">(tú)</span>}
                    </td>
                    <td className="text-ink-soft">{u.email}</td>
                    <td>
                      <span className={`pill ${u.role === "admin" ? "pill-due" : ""}`}>
                        {u.role === "admin" ? "Administrador" : "Usuario"}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${u.is_active ? "pill-paid" : "pill-alert"}`}>
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="mono text-ink-mute">{fmtDate(u.created_at.slice(0, 10))}</td>
                    <td className="text-right">
                      <span className="inline-flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="text-ink-mute hover:text-navy" onClick={() => openEdit(u)} aria-label="Editar">
                          <IconPencil />
                        </button>
                        {me?.id !== u.id && (
                          <button className="text-ink-mute hover:text-debit" onClick={() => remove(u)} aria-label="Eliminar">
                            <IconTrash />
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nuevo usuario">
        <div className="space-y-3">
          <div>
            <label className="label">Nombre completo</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Contraseña temporal</label>
            <input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="10+ con mayúscula, minúscula, número y símbolo" />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
              <option value="user">Usuario — maneja sus propias finanzas</option>
              <option value="admin">Administrador — gestiona usuarios</option>
            </select>
          </div>
          {err && <p className="text-sm text-debit">{err}</p>}
          <button
            className="btn-primary w-full"
            onClick={create}
            disabled={busy || !form.name || !form.email || form.password.length < 6}
          >
            {busy ? "Creando…" : "Crear usuario"}
          </button>
          <p className="text-[11px] text-ink-mute">
            El usuario arranca con un juego de categorías propio y sin movimientos.
          </p>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Editar · ${editing?.name ?? ""}`}>
        <div className="space-y-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={eForm.name} onChange={(e) => setEForm({ ...eForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Rol</label>
            <select
              className="input"
              value={eForm.role}
              disabled={me?.id === editing?.id}
              onChange={(e) => setEForm({ ...eForm, role: e.target.value })}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={eForm.is_active}
              disabled={me?.id === editing?.id}
              onChange={(e) => setEForm({ ...eForm, is_active: e.target.checked })}
            />
            Cuenta activa
          </label>
          <div>
            <label className="label">Nueva contraseña (opcional)</label>
            <input
              className="input"
              value={eForm.password}
              onChange={(e) => setEForm({ ...eForm, password: e.target.value })}
              placeholder="Dejar en blanco para no cambiar"
            />
          </div>
          {err && <p className="text-sm text-debit">{err}</p>}
          <button className="btn-primary w-full" onClick={saveEdit} disabled={busy || !eForm.name}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </Modal>
    </>
  );
}
