import type { Category, Kind } from './api';

// Adivina la categoría a partir del texto ("papas" → Mercado, "taxi" → Transporte).
// Funciona con las categorías por defecto y con las que cree el usuario
// (si el texto menciona el nombre de la categoría, gana esa).

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Palabra clave → fragmento del nombre de la categoría por defecto. */
const HINTS: { kind: Kind; cat: string; words: string[] }[] = [
  // Solo aplica si el usuario tiene una categoría "Mascotas"; si no, sigue buscando.
  { kind: 'egreso', cat: 'mascota', words: ['perro', 'perra', 'gato', 'gata', 'mascota', 'mascotas', 'veterinario', 'veterinaria', 'concentrado', 'cuido', 'arena para gato'] },
  {
    kind: 'egreso',
    cat: 'mercado',
    words: ['mercado', 'supermercado', 'super', 'tienda', 'papa', 'papas', 'arroz', 'leche', 'huevo', 'huevos', 'pan', 'fruta', 'frutas', 'verdura', 'verduras', 'carne', 'pollo', 'queso', 'aceite', 'azucar', 'cafe molido', 'granos', 'd1', 'ara', 'exito', 'jumbo', 'olimpica', 'carulla', 'aseo', 'jabon', 'detergente', 'papel higienico', 'gaseosa', 'agua en botella', 'mecato', 'galletas'],
  },
  {
    kind: 'egreso',
    cat: 'ocio',
    words: ['almuerzo', 'almorce', 'almorzar', 'desayuno', 'desayune', 'cena', 'cene', 'comida', 'comi', 'restaurante', 'pizza', 'hamburguesa', 'perro caliente', 'empanada', 'empanadas', 'arepa', 'cine', 'pelicula', 'cerveza', 'cervezas', 'trago', 'tragos', 'rumba', 'bar', 'discoteca', 'domicilio', 'domicilios', 'rappi', 'ifood', 'cafe', 'tinto', 'helado', 'postre', 'salida', 'paseo', 'concierto', 'juego', 'juegos'],
  },
  {
    kind: 'egreso',
    cat: 'transporte',
    words: ['taxi', 'uber', 'didi', 'cabify', 'indriver', 'bus', 'buseta', 'transmilenio', 'metro', 'sitp', 'pasaje', 'pasajes', 'gasolina', 'tanqueo', 'tanquear', 'peaje', 'parqueadero', 'parqueo', 'moto', 'carro', 'llanta', 'mecanico', 'soat', 'tecnomecanica', 'vuelo', 'tiquete'],
  },
  {
    kind: 'egreso',
    cat: 'servicios',
    words: ['luz', 'agua', 'gas', 'energia', 'internet', 'wifi', 'celular', 'plan', 'minutos', 'datos', 'recarga', 'recibo', 'factura', 'claro', 'movistar', 'tigo', 'etb', 'epm', 'codensa', 'enel'],
  },
  {
    kind: 'egreso',
    cat: 'salud',
    words: ['drogueria', 'farmacia', 'medicina', 'medicamento', 'medicamentos', 'pastilla', 'pastillas', 'medico', 'doctor', 'cita', 'eps', 'odontologo', 'dentista', 'examen', 'examenes', 'laboratorio', 'gafas', 'optica', 'terapia', 'gimnasio', 'gym'],
  },
  {
    kind: 'egreso',
    cat: 'educacion',
    words: ['libro', 'libros', 'curso', 'cursos', 'colegio', 'universidad', 'matricula', 'semestre', 'clase', 'clases', 'cuaderno', 'cuadernos', 'utiles', 'pension', 'udemy', 'platzi'],
  },
  {
    kind: 'egreso',
    cat: 'suscripciones',
    words: ['netflix', 'spotify', 'disney', 'youtube', 'prime', 'amazon prime', 'hbo', 'max', 'star', 'apple', 'icloud', 'google one', 'suscripcion', 'membresia', 'chatgpt', 'xbox', 'playstation'],
  },
  { kind: 'egreso', cat: 'arriendo', words: ['arriendo', 'renta', 'alquiler', 'administracion', 'hipoteca', 'casa', 'apartamento'] },
  { kind: 'egreso', cat: 'deudas', words: ['cuota', 'tarjeta', 'credito', 'prestamo', 'deuda', 'abono a la deuda', 'banco'] },
  { kind: 'egreso', cat: 'ahorro', words: ['ahorro', 'ahorre', 'ahorrar', 'alcancia', 'cdt', 'inversion', 'invertir'] },
  { kind: 'ingreso', cat: 'salario', words: ['salario', 'sueldo', 'quincena', 'nomina', 'prima', 'me pagaron', 'pago del trabajo', 'trabajo'] },
  { kind: 'ingreso', cat: 'negocio', words: ['venta', 'ventas', 'vendi', 'cliente', 'clientes', 'freelance', 'proyecto', 'factura', 'honorarios', 'negocio', 'emprendimiento', 'comision'] },
  { kind: 'ingreso', cat: 'otros', words: ['regalo', 'me regalaron', 'me dieron', 'devolucion', 'reembolso', 'me devolvieron', 'intereses', 'rendimientos', 'bono'] },
];

const has = (text: string, word: string) => new RegExp(`(^| )${word}( |$)`).test(text);

/** Categoría sugerida para el texto, o null si no hay pistas. */
export function guessCategory(text: string, kind: Kind, categories: Category[]): Category | null {
  const t = norm(text);
  if (!t) return null;
  const mine = categories.filter((c) => c.kind === kind);

  // 1) El texto nombra una categoría del usuario ("mascotas", "gimnasio"…).
  for (const c of mine) {
    const words = norm(c.name).split(' ').filter((w) => w.length > 3);
    if (words.some((w) => has(t, w) || has(t, w.replace(/s$/, '')))) return c;
  }
  // 2) Palabras clave → categoría por defecto.
  for (const h of HINTS) {
    if (h.kind !== kind || !h.words.some((w) => has(t, w))) continue;
    const c = mine.find((c) => norm(c.name).includes(h.cat));
    if (c) return c;
  }
  return null;
}

/** "Otros gastos" / "Otros ingresos" (o la primera del tipo) como último recurso. */
export function fallbackCategory(kind: Kind, categories: Category[]): Category | null {
  const mine = categories.filter((c) => c.kind === kind);
  return mine.find((c) => norm(c.name).startsWith('otros')) ?? mine[0] ?? null;
}
