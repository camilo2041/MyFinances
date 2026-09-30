const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** 1234567 → "1.234.567" (COP, sin decimales). */
export function num(n: number) {
  const s = Math.round(Math.abs(n)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function money(n: number, sign = false) {
  const pre = n < 0 ? '−' : sign && n > 0 ? '+' : '';
  return `${pre}$${num(n)}`;
}

/** Abreviado para espacios pequeños: 1,2 M · 850 k */
export function short(n: number) {
  const a = Math.abs(n);
  const pre = n < 0 ? '−' : '';
  if (a >= 1_000_000) return `${pre}$${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace('.', ',')} M`;
  if (a >= 1_000) return `${pre}$${Math.round(a / 1_000)} k`;
  return `${pre}$${Math.round(a)}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const currentPeriod = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function shiftPeriod(p: string, delta: number) {
  const [y, m] = p.split('-').map(Number);
  return currentPeriod(new Date(y, m - 1 + delta, 1));
}

export function periodLabel(p: string) {
  const [y, m] = p.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export const monthShort = (p: string) => MONTHS[Number(p.split('-')[1]) - 1].slice(0, 3);

/** "2026-09-29" → Date local (sin desfase UTC). */
export function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayLabel(s: string) {
  const d = parseDate(s);
  const today = new Date();
  const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** Próxima fecha (hoy incluido) en que cae un día de pago mensual. */
export function nextDue(dueDay: number, from = new Date()) {
  const clamp = (y: number, m: number) => Math.min(dueDay, new Date(y, m + 1, 0).getDate());
  const y = from.getFullYear();
  const m = from.getMonth();
  const today = new Date(y, m, from.getDate());
  const thisMonth = new Date(y, m, clamp(y, m));
  if (thisMonth >= today) return thisMonth;
  return new Date(y, m + 1, clamp(y, m + 1));
}

export function daysUntil(d: Date) {
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Estado de un pago mensual aún no hecho este mes: vencido o cuántos días faltan. */
export function dueInfo(dueDay: number) {
  const t = new Date();
  const day = Math.min(dueDay, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate());
  const date = new Date(t.getFullYear(), t.getMonth(), day);
  const days = day - t.getDate();
  return { date, days, overdue: days < 0 };
}

/** Próximo vencimiento de una cuota de deuda. El backend decide si está atrasada
 *  (tiene en cuenta la fecha de inicio); si no lo está y el día ya pasó, la
 *  cuota que sigue es la del mes siguiente. */
export function debtDue(dueDay: number, overdue: boolean, daysOverdue: number) {
  if (overdue) return { days: -daysOverdue, overdue: true };
  const { days } = dueInfo(dueDay);
  if (days >= 0) return { days, overdue: false };
  return { days: daysUntil(nextDue(dueDay, addDaysLocal(new Date(), 1))), overdue: false };
}

const addDaysLocal = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
