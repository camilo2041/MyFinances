import * as Notifications from 'expo-notifications';
import { storage } from './storage';
import { Platform } from 'react-native';

import type { Budget, Debt, Recurring } from './api';
import { money, short } from './format';
import { C } from './theme';

// Recordatorios 100% locales: se recalculan cada vez que la app trae datos
// frescos, así que siempre reflejan lo que ya pagaste.

export type Prefs = {
  debts: boolean; // vencimientos de cuotas de deuda
  fixed: boolean; // vencimientos de gastos fijos
  leadDays: number[]; // avisos preventivos: cuántos días antes (además de víspera y mismo día)
  weekAhead: boolean; // lunes: lo que pagas esta semana
  daily: boolean; // "¿anotaste tus gastos?"
  dailyHour: number;
  dailyMinute: number;
  weekly: boolean; // domingo, revisa tu semana
  budget: boolean; // alerta al pasar 80 % / 100 % de un presupuesto
};

export const DEFAULT_PREFS: Prefs = {
  debts: true,
  fixed: true,
  leadDays: [3],
  weekAhead: true,
  daily: true,
  dailyHour: 20,
  dailyMinute: 30,
  weekly: true,
  budget: true,
};
const PREFS_KEY = 'myfinces_prefs';

export async function getPrefs(): Promise<Prefs> {
  try {
    const raw = await storage.get(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const saved = JSON.parse(raw);
    // Versiones anteriores tenían un solo interruptor "bills".
    if (saved.bills === false && saved.debts === undefined) Object.assign(saved, { debts: false, fixed: false });
    return { ...DEFAULT_PREFS, ...saved };
  } catch {
    return DEFAULT_PREFS;
  }
}
export const savePrefs = (p: Prefs) => storage.set(PREFS_KEY, JSON.stringify(p));

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let setupDone = false;
export async function setupNotifications() {
  if (setupDone) return;
  setupDone = true;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pagos', {
      name: 'Vencimientos',
      description: 'Gastos fijos y cuotas de deuda que vencen',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 120, 80, 120],
      lightColor: C.notify,
    });
    await Notifications.setNotificationChannelAsync('alertas', {
      name: 'Alertas de presupuesto',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200],
      lightColor: C.expense,
    });
    await Notifications.setNotificationChannelAsync('habitos', {
      name: 'Hábitos',
      description: 'Recordatorio diario y resumen semanal',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.setNotificationCategoryAsync('pago', [
    { identifier: 'pay', buttonTitle: 'Ver y pagar', options: { opensAppToForeground: true } },
  ]);
  await Notifications.setNotificationCategoryAsync('log', [
    { identifier: 'log', buttonTitle: 'Anotar gasto', options: { opensAppToForeground: true } },
  ]);
}

export async function ensurePermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

export const clearReminders = () => Notifications.cancelAllScheduledNotificationsAsync();

type Due = { name: string; amount: number; kind: 'fijo' | 'deuda'; detail?: string };

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function at(d: Date, h: number, m = 0) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
}

function dueDate(y: number, m: number, day: number) {
  return new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const total = (items: Due[]) => items.reduce((s, i) => s + i.amount, 0);

/** Título corto: el nombre si es uno solo, o "N pagos". */
const subject = (items: Due[]) => (items.length === 1 ? items[0].name : `${items.length} pagos`);

/** Cuerpo del aviso: detalle de la cuota o lista de pagos, y un consejo si hay deudas. */
function describe(items: Due[], date: Date) {
  const hasDebt = items.some((i) => i.kind === 'deuda');
  const tip = hasDebt ? ' Págala a tiempo y evita intereses de mora.' : '';
  if (items.length === 1) {
    const i = items[0];
    return `${i.detail ? `${i.detail} · ` : ''}${money(i.amount)} · vence el ${dayLabel(date)}.${tip}`;
  }
  return `Total ${money(total(items))}: ${items.map((i) => `${i.name} (${short(i.amount)})`).join(', ')}.${tip}`;
}

export async function syncReminders(recurring: Recurring[], debts: Debt[]) {
  const prefs = await getPrefs();
  await setupNotifications();
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  const jobs: Promise<string>[] = [];
  const schedule = (date: Date, title: string, body: string, channelId: string, url: string, category?: string) => {
    if (date <= now) return;
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title, body, data: { url }, categoryIdentifier: category, color: C.notify },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
      }),
    );
  };

  if (prefs.fixed || prefs.debts) {
    // Vencimientos de este mes y el siguiente, agrupados por día.
    const byDay = new Map<string, { date: Date; items: Due[] }>();
    const add = (date: Date, item: Due) => {
      const k = date.toDateString();
      if (!byDay.has(k)) byDay.set(k, { date, items: [] });
      byDay.get(k)!.items.push(item);
    };
    for (let offset = 0; offset < 2; offset++) {
      const y = now.getFullYear();
      const m = now.getMonth() + offset;
      if (prefs.fixed) {
        for (const r of recurring) {
          if (!r.active || (offset === 0 && r.paid_this_period)) continue;
          add(dueDate(y, m, r.due_day), { name: r.name, amount: r.amount, kind: 'fijo', detail: 'Gasto fijo' });
        }
      }
      if (prefs.debts) {
        for (const d of debts) {
          if (!d.active || d.remaining_installments <= 0) continue;
          if (offset === 0 && d.paid_this_period) continue;
          // Número de cuota que vence en ese mes.
          const n = d.paid_installments + 1 + (offset === 0 || d.paid_this_period ? 0 : offset);
          if (n > d.total_installments) continue;
          add(dueDate(y, m, d.due_day), { name: d.name, amount: d.installment_amount, kind: 'deuda', detail: `Cuota ${n} de ${d.total_installments}` });
        }
      }
    }

    // Avisos preventivos: N días antes (9 a. m.), víspera (7 p. m.) y el mismo día (8 a. m.).
    const leads = [...new Set(prefs.leadDays)].filter((n) => n >= 2).sort((a, b) => b - a);
    for (const { date, items } of byDay.values()) {
      for (const n of leads) {
        schedule(at(addDays(date, -n), 9), `Faltan ${n} días: ${subject(items)}`, describe(items, date), 'pagos', '/pagos');
      }
      schedule(at(addDays(date, -1), 19), `Mañana vence: ${subject(items)}`, describe(items, date), 'pagos', '/pagos');
      schedule(at(date, 8), `Hoy vence: ${subject(items)}`, describe(items, date), 'pagos', '/pagos', 'pago');
    }

    // Resumen del lunes: todo lo que vence esa semana.
    if (prefs.weekAhead) {
      const nextMonday = addDays(now, ((8 - now.getDay()) % 7) || 7);
      for (let w = 0; w < 5; w++) {
        const monday = addDays(nextMonday, w * 7);
        const sunday = addDays(monday, 6);
        const week = [...byDay.values()].filter(({ date }) => date >= monday && date <= sunday).sort((a, b) => a.date.getTime() - b.date.getTime());
        if (!week.length) continue;
        const items = week.flatMap((g) => g.items);
        schedule(
          at(monday, 7, 30),
          `Esta semana pagas ${short(total(items))}`,
          week.map((g) => `${WEEKDAYS[g.date.getDay()]} ${g.date.getDate()}: ${g.items.map((i) => i.name).join(', ')}`).join(' · '),
          'pagos',
          '/pagos',
        );
      }
    }

    // Atrasados: recordatorio al día siguiente.
    const today = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const overdue = [
      ...(prefs.debts ? debts.filter((d) => d.overdue && d.active).map((d) => `${d.name} (${d.days_overdue} d)`) : []),
      ...(prefs.fixed ? recurring.filter((r) => r.active && !r.paid_this_period && Math.min(r.due_day, lastDay) < today).map((r) => r.name) : []),
    ];
    if (overdue.length) {
      schedule(
        at(addDays(now, 1), 10),
        overdue.length === 1 ? 'Tienes un pago atrasado' : `Tienes ${overdue.length} pagos atrasados`,
        overdue.join(' · ') + '. Márcalos como pagados o ponte al día.',
        'pagos',
        '/pagos',
        'pago',
      );
    }

    // Inicio de mes: arrancar con plan.
    const first = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9);
    schedule(first, 'Arranca un mes nuevo', 'Revisa tus fijos y metas antes de empezar a gastar.', 'habitos', '/metas');
  }

  if (prefs.daily) {
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: '¿Cómo fue el día?',
          body: 'Anota lo que gastaste hoy: te toma 5 segundos.',
          data: { url: '/nuevo' },
          categoryIdentifier: 'log',
          color: C.notify,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.dailyHour,
          minute: prefs.dailyMinute,
          channelId: 'habitos',
        },
      }),
    );
  }

  if (prefs.weekly) {
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title: 'Tu semana en números', body: 'Mira cuánto entró, cuánto salió y cómo van tus metas.', data: { url: '/' }, color: C.notify },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 19, minute: 0, channelId: 'habitos' },
      }),
    );
  }

  await Promise.allSettled(jobs);
}

/** Tras registrar un gasto: avisa si una categoría cruzó el 80 % o el 100 %. */
export async function budgetAlert(before: Budget[], after: Budget[]) {
  const prefs = await getPrefs();
  if (!prefs.budget) return;
  for (const b of after) {
    const prev = before.find((x) => x.id === b.id);
    if (!prev) continue;
    const crossed = prev.pct < 100 && b.pct >= 100 ? 100 : prev.pct < 80 && b.pct >= 80 ? 80 : 0;
    if (!crossed) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: crossed === 100 ? `Te pasaste en ${b.category.name}` : `${b.category.name} al ${Math.round(b.pct)} %`,
        body:
          crossed === 100
            ? `Llevas ${money(b.spent)} de ${money(b.amount)} este mes.`
            : `Te quedan ${money(b.remaining)} para el resto del mes.`,
        data: { url: '/metas' },
        color: crossed === 100 ? C.expense : C.warn,
      },
      trigger: { channelId: 'alertas' },
    });
  }
}
