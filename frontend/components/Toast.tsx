"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { IconCheck } from "@/components/icons";

type Toast = { id: number; msg: string; tone: "ok" | "err" };
type Ctx = { toast: (msg: string, tone?: "ok" | "err") => void };

const ToastCtx = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, msg, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className="reveal pointer-events-auto flex items-center gap-2 rounded-[3px] border px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg"
            style={{
              animationDuration: ".2s",
              background: t.tone === "ok" ? "#14324e" : "#a63a33",
              borderColor: t.tone === "ok" ? "#0c1f33" : "#8a2f29",
            }}
          >
            <IconCheck size={14} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
