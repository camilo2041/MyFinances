import type { IconName } from '@/components/Icon';

// Ícono por nombre de categoría (funciona también con las que cree el usuario).
const RULES: [RegExp, IconName][] = [
  [/salario|sueldo|n[oó]mina|trabajo/, 'briefcase'],
  [/negocio|freelance|factura|honorario/, 'receipt'],
  [/venta/, 'bag'],
  [/pr[eé]stamo|efectivo/, 'cash'],
  [/regalo/, 'gift'],
  [/capricho|antojo|gusto/, 'sparkle'],
  [/arriendo|vivienda|casa|hogar|necesidad/, 'home'],
  [/servicio|luz|agua|gas|energ/, 'bolt'],
  [/mercado|super|compra/, 'cart'],
  [/transporte|bus|taxi|gasolina|carro|moto/, 'bus'],
  [/salud|m[eé]dic|farmacia|droguer/, 'heart'],
  [/educaci|colegio|curso|universidad|libro/, 'book'],
  [/ocio|restaurante|comida|almuerzo|caf[eé]/, 'food'],
  [/suscripci|streaming|netflix|spotify/, 'tv'],
  [/deuda|cr[eé]dito|banco|tarjeta/, 'bank'],
  [/ahorro|inversi/, 'piggy'],
  [/otro/, 'dots'],
];

export function catIcon(name?: string | null): IconName {
  const n = (name ?? '').toLowerCase();
  return RULES.find(([re]) => re.test(n))?.[1] ?? 'tag';
}
