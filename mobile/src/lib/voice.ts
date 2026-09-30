import type { Kind } from './api';
import { norm } from './guess';

// Convierte lo que el usuario dice en movimientos:
//   "acabo de comprar unas papas y fueron 3.500"        → gasto $3.500 · Papas
//   "me pagaron el salario, 2 millones"                  → ingreso $2.000.000 · Salario
//   "ayer gasté veinte mil en taxi"                      → gasto $20.000 · Taxi · ayer
//   "compré pan por 4 mil y una gaseosa por 3.500"       → dos gastos

export type VoiceItem = { kind: Kind; amount: number; note: string; dayOffset: number; text: string };

const UNITS: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400,
  quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700,
  ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900,
};
const TENS = new Set(['treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']);
const THOUSAND = new Set(['mil', 'lucas', 'luca', 'k']);
const MILLION = new Set(['millon', 'millones', 'palo', 'palos', 'melon', 'melones']);
const CURRENCY = new Set(['pesos', 'peso', 'cop', 'plata']);

const INCOME = ['me pagaron', 'me pago', 'pagaron', 'recibi', 'me llego', 'me llegaron', 'me consignaron', 'consignaron', 'gane', 'cobre', 'vendi', 'me dieron', 'me regalaron', 'me devolvieron', 'me transfirieron', 'ingreso', 'ingresaron', 'entraron', 'entro', 'salario', 'sueldo', 'quincena', 'nomina', 'prima'];
const EXPENSE = ['compre', 'gaste', 'pague', 'me gaste', 'fueron', 'costo', 'costaron', 'valio', 'valieron', 'salio', 'salieron', 'gasto', 'invite', 'di ', 'preste', 'tanquee', 'almorce', 'desayune', 'cene'];

/** Palabras que no aportan a la nota del movimiento. */
const FILLER = new Set(
  (
    'acabo acabe de del la el los las un una unos unas y o que me mi mis te se lo le les al a en por para con sin ' +
    'compre comprar compra compro compramos gaste gastar gasto gastado pague pagar pago pagado pagaron fueron fue era ' +
    'costo costaron cuesta valio valieron vale salio salieron total hoy ayer antier anteayer recien ahora ahorita ' +
    'registra registrar registre anota anotar anote agrega agregar agregue pon poner ponle ingresa ingresar ' +
    'recibi llego llegaron consignaron gane cobre me dieron transfirieron ingreso ingresaron entraron entro ' +
    'movimiento egreso salida entrada pesos peso plata cop mil lucas luca millon millones palo palos k de nuevo otro otra tambien ademas luego despues casi como aprox aproximadamente mas menos'
  ).split(' '),
);

const isNumWord = (t: string) => t in UNITS || THOUSAND.has(t) || MILLION.has(t) || t === 'medio' || /^\d/.test(t);

/** "3.500" → 3500 · "1,5" → 1.5 · "20k" → 20000. */
function digitValue(raw: string): number {
  let t = raw.replace(/^\$/, '').toLowerCase();
  let mult = 1;
  if (t.endsWith('k')) {
    mult = 1000;
    t = t.slice(0, -1);
  }
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) return Number(t.replace(/[.,]/g, '')) * mult; // separadores de miles
  return Number(t.replace(',', '.')) * mult; // entero o decimal
}

type Tok = { raw: string; n: string };

/** Lee un número (en cifras y/o palabras) empezando en i. Devuelve valor y fin. */
function readNumber(toks: Tok[], i: number): { value: number; end: number } | null {
  let total = 0;
  let current = 0;
  let seen = false;
  let j = i;
  for (; j < toks.length; j++) {
    const t = toks[j].n;
    const prevNum = seen;
    if (/^\$?\d/.test(toks[j].raw)) {
      if (seen && current >= 1 && !THOUSAND.has(t) && !MILLION.has(t)) break; // dos cifras seguidas = dos montos
      current += digitValue(toks[j].raw);
    } else if (t in UNITS) {
      current += UNITS[t];
    } else if (THOUSAND.has(t) && prevNum) {
      current = (current || 1) * 1000;
      total += current;
      current = 0;
    } else if (MILLION.has(t) && prevNum) {
      total += (current || 1) * 1_000_000;
      current = 0;
    } else if (t === 'medio' && prevNum) {
      // "millón y medio", "dos mil y medio"
      const last = total >= 1_000_000 ? 500_000 : total >= 1000 ? 500 : 0.5;
      total += last;
    } else if (t === 'y' && prevNum && j + 1 < toks.length && (toks[j + 1].n === 'medio' || (TENS.has(toks[j - 1].n) && toks[j + 1].n in UNITS && UNITS[toks[j + 1].n] < 10))) {
      continue; // "treinta y cinco", "millón y medio" (pero no "4 mil y una gaseosa")
    } else if ((t === 'de' || CURRENCY.has(t)) && prevNum) {
      if (t === 'de' && j + 1 < toks.length && isNumWord(toks[j + 1].n)) break;
      j++; // "2 millones de pesos": consume y termina
      break;
    } else {
      break;
    }
    seen = true;
  }
  if (!seen) return null;
  return { value: Math.round(total + current), end: j };
}

function detectKind(text: string, fallback: Kind): Kind {
  const inc = INCOME.some((w) => text.includes(w));
  const exp = EXPENSE.some((w) => text.includes(w));
  if (inc && !exp) return 'ingreso';
  if (exp && !inc) return 'egreso';
  if (inc && exp) return /\b(me pagaron|recibi|me llego|me consignaron|vendi|cobre)\b/.test(text) ? 'ingreso' : 'egreso';
  return fallback;
}

function detectDay(text: string): number {
  if (/\b(anteayer|antier|ante ayer)\b/.test(text)) return 2;
  if (/\bayer\b/.test(text)) return 1;
  const m = text.match(/\bhace (\d+|un|una|dos|tres|cuatro|cinco|seis) dias?\b/);
  if (m) return Math.min(30, /^\d+$/.test(m[1]) ? Number(m[1]) : UNITS[m[1]] ?? 0);
  return 0;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Verbos que, solos, se vuelven sustantivo; acompañados, sobran ("tanqueé moto" → "moto"). */
const VERB_NOTE: Record<string, string> = {
  almorce: 'almuerzo', desayune: 'desayuno', cene: 'cena', tanquee: 'gasolina', regalaron: 'regalo', vendi: 'venta',
  invite: 'invitación', preste: 'préstamo', mercamos: 'mercado', merque: 'mercado', devolvieron: 'devolución',
};

/** Interpreta una frase. Devuelve uno o varios movimientos (vacío si no hay monto). */
export function parseSpeech(input: string, defaultKind: Kind = 'egreso'): VoiceItem[] {
  const toks: Tok[] = input
    .replace(/(\d)\s*[kK]\b/g, '$1k')
    .split(/\s+/)
    .map((raw) => raw.replace(/^[¿¡"'(]+|[?!"'),:;]+$/g, ''))
    .filter(Boolean)
    .map((raw) => ({ raw: raw.replace(/\.$/, ''), n: norm(raw).replace(/\s/g, '') || raw }));

  // 1) Ubicar los montos.
  const amounts: { start: number; end: number; value: number }[] = [];
  for (let i = 0; i < toks.length; ) {
    const r = isNumWord(toks[i].n) ? readNumber(toks, i) : null;
    if (r && r.value > 0) {
      amounts.push({ start: i, end: r.end, value: r.value });
      i = Math.max(r.end, i + 1);
    } else i++;
  }
  // Cantidades pequeñas sin moneda ("2 papas", "3 cervezas") no son montos si hay uno mayor.
  const big = amounts.filter((a) => a.value >= 100);
  const real = big.length ? big : amounts;
  if (!real.length) return [];

  // 2) Partir en segmentos: cada monto con las palabras que lo rodean.
  const segments: { from: number; to: number; amount: (typeof real)[number] }[] = [];
  let from = 0;
  real.forEach((a, k) => {
    const next = real[k + 1];
    let to = toks.length;
    if (next) {
      // El corte va en el último conector ("y", "tambien", ",") entre este monto y el siguiente.
      to = next.start;
      for (let j = next.start - 1; j >= a.end; j--) {
        if (['y', 'tambien', 'ademas', 'luego', 'despues', 'e'].includes(toks[j].n) || /[,.]$/.test(input.split(/\s+/)[j] ?? '')) {
          to = j;
          break;
        }
      }
    }
    segments.push({ from, to, amount: a });
    from = to;
  });

  // 3) Cada segmento → movimiento.
  const whole = norm(input);
  let lastKind = detectKind(whole, defaultKind);
  const day = detectDay(whole);
  return segments.map(({ from, to, amount }) => {
    const seg = toks.slice(from, to);
    const segText = norm(seg.map((t) => t.raw).join(' '));
    const kind = detectKind(segText, lastKind);
    lastKind = kind;
    const words = seg
      .filter((t, idx) => {
        const abs = from + idx;
        if (abs >= amount.start && abs < amount.end) return false;
        if (/^\$?\d/.test(t.raw) && amounts.some((a) => abs >= a.start && abs < a.end)) return false;
        return !FILLER.has(t.n) && !(t.n in UNITS && seg.length > 2 && amounts.some((a) => abs >= a.start && abs < a.end));
      })
      .map((t) => t.raw.toLowerCase());
    const content = words.filter((w) => !(norm(w) in VERB_NOTE));
    const note = content.length ? content : words.map((w) => VERB_NOTE[norm(w)] ?? w);
    return { kind, amount: amount.value, note: cap(note.join(' ').trim()).slice(0, 80), dayOffset: day, text: segText };
  });
}
