"use client";

import { ReactNode, useEffect } from "react";
import { fmtCOP } from "@/lib/format";
import { useCountUp } from "@/lib/hooks";

/** Animated (count-up) currency figure in tabular mono. */
export function Money({
  value,
  className = "",
  sign = false,
}: {
  value: number;
  className?: string;
  sign?: boolean;
}) {
  const v = useCountUp(value);
  const n = Math.round(v);
  const s = sign && n > 0 ? "+" : "";
  return <span className={`mono ${className}`}>{s}{fmtCOP(n)}</span>;
}

export function Stat({
  label,
  value,
  hint,
  tone = "navy",
  delay = 0,
}: {
  label: string;
  value: number | string;
  hint?: ReactNode;
  tone?: "navy" | "credit" | "debit" | "gold" | "teal";
  delay?: number;
}) {
  const T: Record<string, { text: string; bg: string; kick: string; rule: string }> = {
    navy: { text: "#201d3d", bg: "var(--tint-navy)", kick: "#4b4680", rule: "#201d3d" },
    credit: { text: "#4338ca", bg: "var(--tint-credit)", kick: "#4338ca", rule: "#4338ca" },
    debit: { text: "#c0392b", bg: "var(--tint-debit)", kick: "#c0392b", rule: "#c0392b" },
    gold: { text: "#4338ca", bg: "var(--tint-gold)", kick: "#4338ca", rule: "#4f46e5" },
    teal: { text: "#2a2374", bg: "var(--tint-teal)", kick: "#2a2374", rule: "#372f9e" },
  };
  const t = T[tone];
  return (
    <div
      className="card card-hover reveal overflow-hidden p-4"
      style={{ animationDelay: `${delay}s`, background: t.bg }}
    >
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.rule }} />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.15em]" style={{ color: t.kick }}>
          {label}
        </span>
      </div>
      <div className="mono mt-2 text-[25px] font-medium" style={{ color: t.text }}>
        {typeof value === "number" ? <Money value={value} /> : value}
      </div>
      {hint != null && <div className="mt-1.5 text-[11px] text-ink-mute">{hint}</div>}
    </div>
  );
}

export function Progress({ pct, tone }: { pct: number; tone?: "navy" | "gold" | "credit" | "teal" }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const over = pct > 100;
  const bg = over
    ? "#c0392b"
    : tone === "navy"
    ? "#201d3d"
    : tone === "gold"
    ? "#4f46e5"
    : tone === "teal"
    ? "#372f9e"
    : pct > 90
    ? "#4f46e5"
    : "#4338ca";
  return (
    <div className="bar">
      <i style={{ width: `${clamped}%`, background: bg }} />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) {
      window.addEventListener("keydown", h);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-dark/40 p-4 pt-16"
      onClick={onClose}
    >
      <div
        className="card reveal w-full max-w-md p-6 shadow-xl"
        style={{ animationDuration: ".2s" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-line-soft pb-3">
          <h3 className="text-[17px]">{title}</h3>
          <button
            className="rounded p-1 text-ink-mute hover:bg-line-soft hover:text-ink"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[4px] border border-line bg-line-soft text-ink-soft">
        {icon}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">{title}</div>
      <p className="max-w-xs text-xs text-ink-mute">{text}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorBox({ error }: { error: string }) {
  return (
    <div className="card border-debit/30 bg-tint-debit p-4 text-sm text-debit">
      No se pudo cargar: {error}. ¿Está corriendo la API en el puerto 8010? (<code>docker compose up -d</code>)
    </div>
  );
}

export function CardSkeleton({ h = 120 }: { h?: number }) {
  return <div className="shimmer rounded-[4px]" style={{ height: h }} />;
}
