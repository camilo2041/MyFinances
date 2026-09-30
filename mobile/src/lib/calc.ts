import { num } from './format';

// Calculadora del teclado de montos. La expresión se guarda como texto con
// los operadores + − × ÷ (p. ej. "35000+12500×2") y se evalúa en vivo con
// precedencia normal (× ÷ antes que + −). Siempre da pesos enteros ≥ 0.

export const OPS = ['+', '−', '×', '÷'] as const;
export type Op = (typeof OPS)[number];

const MAX_DIGITS = 12;
const MAX_LEN = 48;

export const isOp = (c: string): c is Op => (OPS as readonly string[]).includes(c);
export const hasOp = (s: string) => [...s].some(isOp);

/** Aplica una tecla (dígito, "000", operador o "del") a la expresión. */
export function press(expr: string, key: string): string {
  if (key === 'del') return expr.slice(0, -1);
  if (expr.length >= MAX_LEN) return expr;

  const last = expr.slice(-1);
  if (isOp(key)) {
    if (!expr) return ''; // no se empieza con operador
    return isOp(last) ? expr.slice(0, -1) + key : expr + key; // cambia el operador
  }

  // Dígitos: trabajamos sobre el número que se está escribiendo.
  const cut = Math.max(...OPS.map((o) => expr.lastIndexOf(o)));
  const head = expr.slice(0, cut + 1);
  const next = (expr.slice(cut + 1) + key).replace(/^0+/, '');
  if (next.length > MAX_DIGITS) return expr;
  return head + next;
}

/** Resultado de la expresión (ignora un operador suelto al final). */
export function evaluate(expr: string): number {
  const clean = isOp(expr.slice(-1)) ? expr.slice(0, -1) : expr;
  if (!clean) return 0;
  const tokens = clean.split(/([+−×÷])/).filter(Boolean);

  // Primera pasada: × y ÷.
  const terms: (number | string)[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '×' || t === '÷') {
      const a = Number(terms.pop());
      const b = Number(tokens[++i]);
      terms.push(t === '×' ? a * b : b === 0 ? 0 : a / b);
    } else terms.push(isOp(t) ? t : Number(t));
  }
  // Segunda pasada: + y −.
  let total = Number(terms[0]);
  for (let i = 1; i < terms.length; i += 2) {
    const b = Number(terms[i + 1]);
    total = terms[i] === '+' ? total + b : total - b;
  }
  return Math.max(0, Math.round(total));
}

/** "35000+12500" → "35.000 + 12.500" para mostrar. */
export const pretty = (expr: string) =>
  expr
    .split(/([+−×÷])/)
    .filter(Boolean)
    .map((t) => (isOp(t) ? ` ${t} ` : num(Number(t))))
    .join('');
