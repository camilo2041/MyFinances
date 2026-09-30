"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { IconArrowRight } from "@/components/icons";
import { isStrongPassword, PASSWORD_RULES } from "@/lib/password";

export default function RegistroPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(password)) return setErr("Tu contraseña aún no cumple todos los requisitos");
    setBusy(true);
    setErr(null);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (e: any) {
      setErr(e.message === "Unprocessable Entity" ? "Revisa tu nombre, correo y contraseña" : e.message || "No se pudo crear la cuenta");
      setBusy(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#0e0c1c] p-4 text-white"
      style={{ backgroundImage: "radial-gradient(60% 50% at 80% 0%, rgba(109,93,252,.3), transparent 70%)" }}
    >
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" className="h-10 w-10 rounded-[12px]" />
          <span className="text-[20px] font-extrabold tracking-tight">
            MyFinces<span className="text-[#a5b4fc]">+</span>
          </span>
        </Link>

        <form onSubmit={submit} className="rounded-[28px] border border-[#2c2850] bg-[#17142c] p-7 sm:p-8">
          <h1 className="font-sans text-[28px] font-extrabold tracking-[-0.03em]">Crea tu cuenta</h1>
          <p className="mt-1.5 text-[14px] text-[#a6a2c8]">Gratis. Llegas con tus categorías listas.</p>

          {[
            ["Tu nombre", name, setName, "text", "name", "Juan Pérez"],
            ["Correo electrónico", email, setEmail, "email", "email", "tucorreo@ejemplo.com"],
            ["Contraseña", password, setPassword, "password", "new-password", "Crea una contraseña segura"],
          ].map(([label, value, set, type, auto, ph]) => (
            <label key={label as string} className="mt-5 block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-[#c9c5e8]">{label as string}</span>
              <input
                className="w-full rounded-[14px] border border-[#2c2850] bg-[#0e0c1c] px-4 py-3.5 text-[15px] text-white outline-none transition-colors placeholder:text-[#716c98] focus:border-[#8b7dff]"
                type={type as string}
                autoComplete={auto as string}
                value={value as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
                placeholder={ph as string}
                required
              />
            </label>
          ))}

          {password && (
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {PASSWORD_RULES.map((r) => {
                const ok = r.test(password);
                return (
                  <li key={r.label} className={`flex items-center gap-1.5 text-[12.5px] ${ok ? "text-white" : "text-[#716c98]"}`}>
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${
                        ok ? "border-[#a5b4fc] bg-[#a5b4fc] text-[#0e0c1c]" : "border-[#2c2850]"
                      }`}
                    >
                      {ok ? "✓" : ""}
                    </span>
                    {r.label}
                  </li>
                );
              })}
            </ul>
          )}

          {err && <p className="mt-4 rounded-[12px] border border-[#e07a6f]/30 bg-[#e07a6f]/10 px-3.5 py-2.5 text-[13px] text-[#f0a79f]">{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-[15px] font-bold text-[#0e0c1c] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Creando tu cuenta…" : "Crear cuenta"}
            {!busy && <IconArrowRight />}
          </button>

          <p className="mt-5 text-center text-[13.5px] text-[#a6a2c8]">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-[#a5b4fc] hover:text-white">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
