import { router, type Href } from 'expo-router';

import type { Kind } from './api';

export type EditTipo = 'meta' | 'presupuesto' | 'fijo' | 'deuda' | 'categoria';

/** Abre el formulario de crear (sin id) o editar (con id). */
export function goEdit(tipo: EditTipo, opts: { id?: number; kind?: Kind } = {}) {
  const q = new URLSearchParams();
  if (opts.id) q.set('id', String(opts.id));
  if (opts.kind) q.set('kind', opts.kind);
  const qs = q.toString();
  router.push(`/editar/${tipo}${qs ? `?${qs}` : ''}` as Href);
}
