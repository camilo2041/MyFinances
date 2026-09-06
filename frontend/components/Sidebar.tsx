"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PeriodStepper } from "@/components/Period";
import { useAuth } from "@/lib/auth";
import {
  IconLogo,
  IconResumen,
  IconMovimientos,
  IconFijos,
  IconDeudas,
  IconPresupuesto,
  IconConsejero,
  IconTag,
  IconUsers,
  IconLogout,
} from "@/components/icons";

const baseGroups = [
  {
    label: "Operación",
    items: [
      { href: "/", label: "Resumen", Icon: IconResumen },
      { href: "/movimientos", label: "Movimientos", Icon: IconMovimientos },
      { href: "/fijos", label: "Gastos fijos", Icon: IconFijos },
      { href: "/deudas", label: "Deudas", Icon: IconDeudas },
      { href: "/presupuesto", label: "Presupuesto", Icon: IconPresupuesto },
      { href: "/categorias", label: "Categorías", Icon: IconTag },
    ],
  },
  {
    label: "Asesoría",
    items: [{ href: "/consejero", label: "Consejero", Icon: IconConsejero, tag: "IA" }],
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const groups =
    user?.role === "admin"
      ? [
          ...baseGroups,
          {
            label: "Administración",
            items: [{ href: "/usuarios", label: "Usuarios", Icon: IconUsers, tag: "ADMIN" }],
          },
        ]
      : baseGroups;

  return (
    <aside className="flex w-[64px] shrink-0 flex-col bg-navy-dark text-white lg:w-60">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5 lg:px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gold text-navy-dark">
          <IconLogo size={18} />
        </span>
        <span className="wordmark hidden text-[17px] lg:block">
          MYFINCES<span className="text-gold">+</span>
        </span>
      </div>

      <nav className="flex-1 px-2 py-3 lg:px-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-1">
            <div className="hidden px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30 lg:block">
              {g.label}
            </div>
            {g.items.map(({ href, label, Icon, tag }: any) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition-all ${
                    active
                      ? "bg-gold/15 text-white"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 origin-top rounded-full bg-gold"
                      style={{ animation: "drawY .5s .1s cubic-bezier(.22,1,.36,1) both" }}
                    />
                  )}
                  <Icon className="shrink-0" />
                  <span className="hidden flex-1 lg:block">{label}</span>
                  {tag && (
                    <span className="hidden rounded-full border border-gold/40 bg-gold/10 px-1.5 text-[9px] font-semibold tracking-[0.08em] text-gold lg:inline">
                      {tag}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-3 lg:px-5">
        <div className="mb-3 hidden lg:block">
          <PeriodStepper />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-mid text-[11px] font-semibold">
            {initials(user?.name || "")}
          </span>
          <div className="hidden min-w-0 flex-1 lg:block">
            <div className="truncate text-[12.5px] font-medium">{user?.name}</div>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-[11px] text-white/45 hover:text-white/80"
            >
              <IconLogout /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
