import { storage } from './storage';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://myfinances.barcam.site/api';
const TOKEN_KEY = 'myfinces_token';

let token: string | null = null;
export const loadToken = async () => (token = await storage.get(TOKEN_KEY));
export async function setToken(t: string | null) {
  token = t;
  if (t) await storage.set(TOKEN_KEY, t);
  else await storage.del(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new Error('Sin conexión con el servidor');
  }

  if (res.status === 401 && token) {
    await setToken(null);
    onUnauthorized?.();
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const j = await res.json();
      if (typeof j.detail === 'string') detail = j.detail;
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Invalidación global: tras cualquier mutación, todas las vistas recargan ──
let version = 0;
const listeners = new Set<() => void>();
export function invalidate() {
  version++;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
const getVersion = () => version;

// Caché en memoria para pintar al instante al volver a una pantalla.
const cache = new Map<string, unknown>();

export function useApi<T>(path: string | null) {
  const v = useSyncExternalStore(subscribe, getVersion);
  const [data, setData] = useState<T | null>(() => (path ? ((cache.get(path) as T) ?? null) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const d = await api<T>(path);
      cache.set(path, d);
      if (alive.current) {
        setData(d);
        setError(null);
      }
    } catch (e: any) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    if (path && cache.has(path)) setData(cache.get(path) as T);
    load();
    return () => {
      alive.current = false;
    };
  }, [load, v, path]);

  return { data, error, loading, reload: load };
}

export const clearCache = () => cache.clear();

// ── Tipos (espejo de backend/app/schemas.py) ──
export type Kind = 'ingreso' | 'egreso';
export type User = { id: number; email: string; name: string; role: 'admin' | 'user' };
export type Category = { id: number; name: string; kind: Kind; color: string; icon: string };
export type Tx = {
  id: number;
  date: string;
  amount: number;
  kind: Kind;
  category_id: number | null;
  category: Category | null;
  note: string;
  source_type: string | null;
};
export type Recurring = {
  id: number;
  name: string;
  amount: number;
  category: Category | null;
  due_day: number;
  active: boolean;
  paid_this_period: boolean;
};
export type Debt = {
  id: number;
  name: string;
  lender: string;
  total_installments: number;
  paid_installments: number;
  installment_amount: number;
  due_day: number;
  active: boolean;
  annual_rate: number;
  remaining_installments: number;
  remaining_balance: number;
  progress: number;
  paid_this_period: boolean;
  overdue: boolean;
  days_overdue: number;
  deferrals: number;
};
export type Goal = {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  progress: number;
  remaining: number;
};
export type Budget = { id: number; category: Category; amount: number; spent: number; remaining: number; pct: number };
export type Dashboard = {
  period: string;
  income: number;
  expense: number;
  balance: number;
  fixed_expenses_total: number;
  fixed_expenses_pending: number;
  debt_installments_total: number;
  debt_remaining_balance: number;
  savings_target_total: number;
  savings_current_total: number;
  expense_by_category: { category_id: number | null; name: string; total: number }[];
  recent: Tx[];
};
export type TrendPoint = { period: string; income: number; expense: number; balance: number };
