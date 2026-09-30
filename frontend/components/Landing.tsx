"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SITE } from "@/lib/site";

// Página pública (marketing). Misma esencia que la app: noche índigo,
// morado de marca y detalles blancos.

const NAV = [
  ["#beneficios", "Beneficios"],
  ["#como-funciona", "Cómo funciona"],
  ["#app", "La app"],
  ["#planes", "Planes"],
];

/** Aparece suavemente al entrar en pantalla. */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const Logo = ({ className = "" }: { className?: string }) => (
  <span className={`flex items-center gap-2.5 ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/icon.png" alt="" className="h-9 w-9 rounded-[11px]" />
    <span className="text-[19px] font-extrabold tracking-tight text-white">
      MyFinces<span className="text-[#a5b4fc]">+</span>
    </span>
  </span>
);

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/* ─────────────── Teléfono de muestra ─────────────── */

function Phone() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* Resplandor */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-[#6d5dfc]/30 blur-[70px]" />
      <div className="rounded-[46px] border-[10px] border-[#07060f] bg-[#0e0c1c] p-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] ring-1 ring-white/10">
        <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-[#07060f]" />
        {/* Encabezado */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#6d5dfc] bg-white text-[13px] font-bold text-[#0e0c1c]">J</span>
          <div className="leading-tight">
            <div className="text-[9px] text-[#716c98]">Buenas tardes</div>
            <div className="text-[14px] font-bold text-white">Hola, Juan</div>
          </div>
        </div>
        {/* Tarjeta de saldo */}
        <div className="relative mt-3 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#5b4ee0] via-[#3a2fa6] to-[#241d63] p-4">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border-[18px] border-white/[.06]" />
          <div className="text-[9.5px] text-white/75">Te queda este mes</div>
          <div className="mt-1 font-mono text-[24px] font-bold tracking-tight text-white">
            <span className="text-[15px] text-white/60">$</span>3.673.000
          </div>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[8.5px] font-semibold text-[#0e0c1c]">
            ↑ +$753 k vs mes pasado
          </span>
          <div className="mt-3 flex gap-5 text-[9px] text-white/60">
            <div>
              Entró<div className="font-mono text-[11px] font-bold text-white">$3.800.000</div>
            </div>
            <div>
              Salió<div className="font-mono text-[11px] font-bold text-white">$127.000</div>
            </div>
          </div>
        </div>
        {/* Acciones */}
        <div className="mt-3 flex justify-between px-1">
          {["↓", "↑", "▦", "◎"].map((ic, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] ${i === 0 ? "bg-white text-[#0e0c1c]" : "border border-[#2c2850] bg-[#17142c] text-white"}`}>{ic}</span>
              <span className="text-[8px] text-[#a6a2c8]">{["Gasto", "Ingreso", "Pagar", "Metas"][i]}</span>
            </div>
          ))}
        </div>
        {/* Por pagar */}
        <div className="mt-3 text-[11px] font-bold text-white">Por pagar</div>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {[
            ["Arriendo", "$1.200.000", "En 3 días", "#d9a86a"],
            ["Tarjeta", "$310.000", "En 6 días", "#8b7dff"],
          ].map(([n, v, d, c]) => (
            <div key={n} className="rounded-[14px] border border-[#221e40] bg-[#17142c] p-2.5">
              <span className="block h-6 w-6 rounded-[8px]" style={{ background: `${c}33` }} />
              <div className="mt-1.5 text-[10px] font-semibold text-white">{n}</div>
              <div className="font-mono text-[9px] text-[#a6a2c8]">{v}</div>
              <div className="mt-1 text-[8.5px] font-semibold" style={{ color: c }}>
                {d}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-white/25" />
      </div>
    </div>
  );
}

/** Notificación flotante junto al teléfono. */
const Toast = ({ title, body, className }: { title: string; body: string; className: string }) => (
  <div className={`absolute z-10 w-[230px] rounded-2xl border border-white/10 bg-[#211d3d]/95 p-3 shadow-2xl backdrop-blur ${className}`}>
    <div className="flex items-center gap-2 text-[10px] text-[#a6a2c8]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="" className="h-4 w-4 rounded-[4px]" /> MyFinces · ahora
    </div>
    <div className="mt-1 text-[12.5px] font-semibold text-white">{title}</div>
    <div className="text-[11px] text-[#a6a2c8]">{body}</div>
  </div>
);

/* ─────────────── Página ─────────────── */

export default function Landing() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const wa = SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hola, quiero saber más de MyFinces")}` : "";

  return (
    <div className="min-h-screen scroll-smooth bg-[#0e0c1c] text-white antialiased [&_section]:scroll-mt-20">
      {/* ── Menú ── */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors ${scrolled || menu ? "border-b border-white/[.06] bg-[#0e0c1c]/85 backdrop-blur-md" : ""}`}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#inicio" aria-label="Inicio">
            <Logo />
          </a>
          <div className="hidden items-center gap-8 md:flex">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="text-[14px] font-medium text-[#a6a2c8] transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-full px-4 py-2 text-[14px] font-semibold text-white/85 transition-colors hover:text-white">
              Entrar
            </Link>
            <Link href="/registro" className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0e0c1c] transition-transform hover:-translate-y-0.5">
              Crear cuenta gratis
            </Link>
          </div>
          <button onClick={() => setMenu((m) => !m)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 md:hidden" aria-label="Menú" aria-expanded={menu}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menu ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </nav>
        {menu && (
          <div className="border-t border-white/[.06] px-4 pb-5 md:hidden">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenu(false)} className="block border-b border-white/[.05] py-3.5 text-[15px] text-[#d9d6f2]">
                {label}
              </a>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/login" className="rounded-full border border-white/15 py-3 text-center text-[14px] font-semibold">
                Entrar
              </Link>
              <Link href="/registro" className="rounded-full bg-white py-3 text-center text-[14px] font-semibold text-[#0e0c1c]">
                Crear cuenta
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section id="inicio" className="relative overflow-hidden pt-28 sm:pt-32">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 80% 10%, rgba(109,93,252,.35), transparent 70%), radial-gradient(50% 40% at 0% 60%, rgba(99,102,241,.18), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:pb-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#6d5dfc]/40 bg-[#6d5dfc]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#c4b5fd]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a5b4fc]" /> Finanzas personales, sin enredos
            </span>
            <h1 className="mt-6 text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[60px]">
              Tu plata, <span className="bg-gradient-to-r from-[#a5b4fc] to-[#8b7dff] bg-clip-text text-transparent">en claro.</span>
              <br />
              Tus pagos, <span className="text-[#a5b4fc]">a tiempo.</span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-[#a6a2c8]">
              MyFinces organiza lo que entra, lo que sale y lo que viene. Te avisa antes de cada cuota y cada gasto fijo, y
              te muestra cuánto te queda de verdad para el resto del mes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/registro" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[15px] font-bold text-[#0e0c1c] shadow-[0_12px_40px_-12px_rgba(255,255,255,.5)] transition-transform hover:-translate-y-0.5">
                Empieza gratis
                <span aria-hidden>→</span>
              </Link>
              {SITE.apkUrl && (
                <a href="#app" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-4 text-[15px] font-semibold transition-colors hover:border-white/40">
                  <AndroidIcon /> Descargar para Android
                </a>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#8e89b8]">
              {["Gratis", "Sin tarjeta de crédito", "Con huella o Face ID"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span className="text-[#a5b4fc]">
                    <Check />
                  </span>
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150} className="relative py-6">
            <Toast title="Faltan 3 días: Arriendo" body="Gasto fijo · $1.200.000 · vence el 5 oct." className="-left-2 top-10 hidden sm:block lg:-left-24" />
            <Toast title="Gasto registrado" body="Mercado · $45.000 — te quedan $3.628.000" className="-right-2 bottom-16 hidden sm:block lg:-right-16" />
            <Phone />
          </Reveal>
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section id="beneficios" className="border-t border-white/[.05] bg-[#110f22] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Kicker>Beneficios</Kicker>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[42px]">Menos estrés, más control</h2>
            <p className="mt-4 text-[16px] text-[#a6a2c8]">Todo lo que necesitas para que tus cuentas cuadren, sin hojas de cálculo.</p>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 90}>
                <div className="group h-full rounded-[24px] border border-[#221e40] bg-[#17142c] p-6 transition-all hover:-translate-y-1 hover:border-[#6d5dfc]/50">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6d5dfc]/15 text-[#a5b4fc] transition-colors group-hover:bg-white group-hover:text-[#0e0c1c]">
                    {b.icon}
                  </span>
                  <h3 className="mt-5 font-sans text-[18px] font-bold text-white">{b.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#a6a2c8]">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Kicker>Cómo funciona</Kicker>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[42px]">Tres pasos y listo</h2>
          </Reveal>
          <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
            <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-[#6d5dfc]/60 to-transparent md:block" />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120} className="relative text-center">
                <span className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[20px] font-extrabold ${i === 1 ? "bg-white text-[#0e0c1c]" : "border border-[#6d5dfc]/60 bg-[#17142c] text-white"}`}>
                  {i + 1}
                </span>
                <h3 className="mt-6 font-sans text-[20px] font-bold text-white">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-relaxed text-[#a6a2c8]">{s.text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mx-auto mt-16 max-w-xl rounded-full border border-white/10 bg-[#17142c] px-6 py-4 text-center text-[15px] text-[#d9d6f2]">
            Tú vives tu vida; <span className="font-semibold text-white">MyFinces te avisa antes de que algo se te pase.</span>
          </Reveal>
        </div>
      </section>

      {/* ── Todo incluido ── */}
      <section className="border-y border-white/[.05] bg-[#110f22] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Kicker>Todo incluido</Kicker>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[42px]">Hecho para el día a día</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FEATURES.map(([icon, title, text], i) => (
              <Reveal key={title} delay={(i % 4) * 70}>
                <div className="h-full rounded-[20px] border border-[#221e40] bg-[#17142c]/70 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6d5dfc]/15 text-[#a5b4fc]">
                    <I d={icon} />
                  </span>
                  <div className="mt-3 text-[15px] font-bold text-white">{title}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-[#8e89b8]">{text}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── La app ── */}
      <section id="app" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(50% 60% at 20% 50%, rgba(109,93,252,.22), transparent 70%)" }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <Phone />
          </Reveal>
          <Reveal delay={100} className="order-1 lg:order-2">
            <Kicker>La app</Kicker>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[44px]">Llévala en el bolsillo</h2>
            <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-[#a6a2c8]">
              Registra un gasto en 5 segundos con su calculadora, abre con tu huella y recibe los avisos de pago directo en tu teléfono.
              Tus datos se sincronizan con la web.
            </p>
            <ul className="mt-6 space-y-3 text-[15px] text-[#d9d6f2]">
              {["Notificaciones 7, 5 y 3 días antes de cada pago", "Resumen cada lunes de lo que pagas en la semana", "Ocultar montos con un toque cuando estás en público"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#0e0c1c]">
                    <Check />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {SITE.apkUrl && (
                <a href={SITE.apkUrl} className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-3.5 text-[#0e0c1c] transition-transform hover:-translate-y-0.5">
                  <AndroidIcon />
                  <span className="text-left leading-tight">
                    <span className="block text-[10.5px] font-medium opacity-70">Descarga directa</span>
                    <span className="block text-[15px] font-bold">Android (APK)</span>
                  </span>
                </a>
              )}
              <Link href="/registro" className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-3.5 text-[15px] font-semibold transition-colors hover:border-white/40">
                O úsala en la web →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Planes ── */}
      <section id="planes" className="border-t border-white/[.05] bg-[#110f22] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Kicker>Planes</Kicker>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[42px]">Empieza sin pagar nada</h2>
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
            <Reveal>
              <div className="relative h-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#5b4ee0] via-[#3a2fa6] to-[#241d63] p-8">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[26px] border-white/[.06]" />
                <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#0e0c1c]">Recomendado</span>
                <h3 className="mt-5 font-sans text-[24px] font-extrabold">Personal</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-[44px] font-bold">$0</span>
                  <span className="text-white/70">para siempre</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-[14.5px] text-white/90">
                  {["Web + app Android", "Movimientos, fijos, deudas y metas", "Avisos preventivos de pago", "Presupuestos y consejero financiero"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <Check /> {t}
                    </li>
                  ))}
                </ul>
                <Link href="/registro" className="mt-8 flex justify-center rounded-full bg-white py-3.5 text-[15px] font-bold text-[#0e0c1c]">
                  Crear mi cuenta
                </Link>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="flex h-full flex-col rounded-[28px] border border-[#2c2850] bg-[#17142c] p-8">
                <h3 className="font-sans text-[24px] font-extrabold">Familias y negocios</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#a6a2c8]">
                  ¿Varias personas, un pequeño negocio o necesitas acompañamiento para salir de deudas? Cuéntanos y armamos algo a tu medida.
                </p>
                <div className="flex-1" />
                {wa || SITE.contactEmail ? (
                  <a
                    href={wa || `mailto:${SITE.contactEmail}`}
                    className="mt-8 flex justify-center rounded-full border border-white/20 py-3.5 text-[15px] font-semibold transition-colors hover:border-white/50"
                  >
                    {wa ? "Escríbenos por WhatsApp" : "Escríbenos"}
                  </a>
                ) : (
                  <Link href="/registro" className="mt-8 flex justify-center rounded-full border border-white/20 py-3.5 text-[15px] font-semibold transition-colors hover:border-white/50">
                    Empieza con el plan Personal
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Llamado final ── */}
      <section className="py-24">
        <Reveal className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-[#3a3285] bg-gradient-to-br from-[#2e2775] to-[#17142c] px-6 py-14 text-center sm:px-12">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#6d5dfc]/25 blur-3xl" />
            <h2 className="relative text-[32px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[44px]">Que este sea el mes en que tus cuentas cuadren</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-[16px] text-[#c9c5e8]">Crea tu cuenta en menos de un minuto. Sin tarjeta, sin letra pequeña.</p>
            <Link href="/registro" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[15px] font-bold text-[#0e0c1c] transition-transform hover:-translate-y-0.5">
              Empieza gratis hoy <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Pie ── */}
      <footer id="contacto" className="border-t border-white/[.06] py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[14px] text-[#8e89b8]">Tu aliado para tener la plata clara y los pagos a tiempo.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-[14px]">
            <div className="space-y-2.5">
              <div className="font-semibold text-white">Producto</div>
              {NAV.map(([href, label]) => (
                <a key={href} href={href} className="block text-[#8e89b8] hover:text-white">
                  {label}
                </a>
              ))}
            </div>
            <div className="space-y-2.5">
              <div className="font-semibold text-white">Cuenta</div>
              <Link href="/login" className="block text-[#8e89b8] hover:text-white">
                Entrar
              </Link>
              <Link href="/registro" className="block text-[#8e89b8] hover:text-white">
                Crear cuenta
              </Link>
              {SITE.contactEmail && (
                <a href={`mailto:${SITE.contactEmail}`} className="block text-[#8e89b8] hover:text-white">
                  {SITE.contactEmail}
                </a>
              )}
              {wa && (
                <a href={wa} className="block text-[#8e89b8] hover:text-white">
                  WhatsApp
                </a>
              )}
              {SITE.instagram && (
                <a href={`https://instagram.com/${SITE.instagram}`} className="block text-[#8e89b8] hover:text-white">
                  @{SITE.instagram}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl px-4 text-[12.5px] text-[#6f6a98] sm:px-6">© {new Date().getFullYear()} MyFinces. Todos los derechos reservados.</div>
      </footer>
    </div>
  );
}

const Kicker = ({ children }: { children: ReactNode }) => (
  <span className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#8b7dff]">{children}</span>
);

const AndroidIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.6 9.48 19.44 6.3a.38.38 0 0 0-.66-.38l-1.87 3.23a11.4 11.4 0 0 0-9.82 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
  </svg>
);

const I = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const BENEFITS = [
  { title: "Sabes cuánto te queda", text: "Tu saldo real del mes, descontando lo que ya gastaste y lo que viene.", icon: <I d="M3 12h4l3 8 4-16 3 8h4" /> },
  { title: "Ningún pago se te pasa", text: "Avisos días antes de cada cuota y gasto fijo, y un resumen cada lunes.", icon: <I d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" /> },
  { title: "Sal de deudas con plan", text: "Ve cuánto debes, qué pagar primero y usa un mes libre cuando lo necesites.", icon: <I d="M3.5 9.5 12 4.5l8.5 5zM5.5 10v7.5M9.8 10v7.5M14.2 10v7.5M18.5 10v7.5M3.5 20h17" /> },
  { title: "Metas que sí se cumplen", text: "Ahorra para lo que quieres y mira tu progreso crecer mes a mes.", icon: <I d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z" /> },
];

const STEPS = [
  { title: "Crea tu cuenta", text: "Gratis y en menos de un minuto. Llegas con tus categorías listas." },
  { title: "Anota en segundos", text: "Gasto o ingreso con su calculadora integrada, categoría con un toque." },
  { title: "Decide con claridad", text: "Te avisamos antes de cada pago y te mostramos en qué se va tu plata." },
];

const FEATURES: [string, string, string][] = [
  ["M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01", "Libro de movimientos", "Todo lo que entra y sale, día por día."],
  ["M4 5.5h16v14.5H4zM4 10h16M8.5 3.5v4M15.5 3.5v4", "Gastos fijos", "Arriendo, servicios y suscripciones al día."],
  ["M3.5 9.5 12 4.5l8.5 5zM5.5 10v7.5M9.8 10v7.5M14.2 10v7.5M18.5 10v7.5M3.5 20h17", "Deudas y cuotas", "Saldo, cuotas pagadas y mes libre."],
  ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12.01V12", "Metas de ahorro", "Abona y mira el anillo llenarse."],
  ["M4 20V10M10 20V4M16 20v-7M21 20H3", "Presupuestos", "Alertas al 80 % y cuando te pasas."],
  ["M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z", "Consejero", "Índice de salud financiera y consejos."],
  ["M12 11v3.5a6 6 0 0 1-1.2 3.6M8.5 20a9 9 0 0 0 1.5-5.5V11a2 2 0 0 1 4 0v1.5M15.8 17.5c.3-1 .4-2 .4-3V11a4.2 4.2 0 0 0-8.4 0v3.5c0 1-.2 2-.7 2.8", "Huella y Face ID", "Entra sin contraseña, con bloqueo automático."],
  ["M6 3.5h12v17H6zM9 7.5h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01", "Calculadora", "Suma cuentas y divide gastos al anotar."],
];
