"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { IconLogo, IconArrowRight } from "@/components/icons";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setErr(e.message || "No se pudo iniciar sesión");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Brand panel */}
      <div
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-navy-dark p-12 text-white md:flex"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 100% 0%, rgba(129,140,248,.28), transparent 55%), radial-gradient(90% 70% at 0% 100%, rgba(99,102,241,.20), transparent 50%), repeating-linear-gradient(90deg, transparent 0 47px, rgba(255,255,255,.04) 47px 48px)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gold text-navy-dark">
            <IconLogo size={18} />
          </span>
          <span className="wordmark text-[19px]">
            MYFINCES<span className="text-gold">+</span>
          </span>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
            Sistema de control financiero personal
          </div>
          <h1 className="display mt-4 max-w-[460px] text-[64px] leading-[0.86]">
            Cada peso
            <br />
            <span className="text-gold">registrado.</span>
            <br />
            Cada decisión
            <br />
            <span style={{ color: "#a9b0f5" }}>informada.</span>
          </h1>
          <p className="mt-5 max-w-[380px] text-[14px] text-white/60">
            Ingresos, egresos, gastos fijos, deudas y metas — conciliados en un solo libro.
          </p>
        </div>

        <div className="max-w-[400px] rounded-xl border border-white/15 p-5">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-white/40">
            Resumen del periodo
          </div>
          {[
            ["Ingresos", "3.920.000"],
            ["Egresos", "1.817.000"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2 py-1 text-[13px] text-white/70">
              <span>{k}</span>
              <span className="flex-1 -translate-y-[3px] border-b border-dotted border-white/25" />
              <span className="mono">{v}</span>
            </div>
          ))}
          <div className="my-2.5 border-t border-white/20" />
          <div className="flex items-baseline gap-2 text-[13px] font-semibold">
            <span>Balance</span>
            <span className="flex-1 -translate-y-[3px] border-b border-dotted border-white/40" />
            <span className="mono">2.103.000</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12px] tracking-[0.04em] text-white/40">
          <span className="live-dot" /> Sistema operativo · © 2026 MyFinces
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={submit} className="w-[360px]">
          <div className="kicker">Acceso</div>
          <h2 className="display mt-2 text-[38px] leading-[0.9]">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-ink-soft">Ingresa con tu cuenta para continuar.</p>

          <div className="mt-7">
            <label className="label">Correo electrónico</label>
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>
          <div className="mt-4">
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {err && (
            <p className="mt-3 rounded-[8px] border border-debit/30 bg-tint-debit px-3 py-2 text-[12.5px] text-debit">
              {err}
            </p>
          )}

          <button type="submit" className="btn-accent mt-6 w-full" disabled={busy}>
            {busy ? "Ingresando…" : "Ingresar"}
            {!busy && <IconArrowRight />}
          </button>

          <p className="mt-6 text-[11.5px] leading-relaxed text-ink-mute">
            ¿No tienes cuenta? Un administrador debe crearla. Contacta a quien
            administra MyFinces en tu organización.
          </p>
        </form>
      </div>
    </div>
  );
}
