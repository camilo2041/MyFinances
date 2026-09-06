"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Resumen", icon: "📊" },
  { href: "/movimientos", label: "Movimientos", icon: "💵" },
  { href: "/fijos", label: "Gastos fijos", icon: "🔁" },
  { href: "/deudas", label: "Deudas", icon: "🏦" },
  { href: "/presupuesto", label: "Presupuesto y metas", icon: "🎯" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-white/80 p-1.5 shadow-sm ring-1 ring-black/5 backdrop-blur">
      {links.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              active
                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <span>{l.icon}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
