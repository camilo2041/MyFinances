import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { CategoryPicker, Choice, DayPicker, Field, FormScreen, MoneyField, Stepper, Summary, SwitchField } from '@/components/form';
import { T, success, warn } from '@/components/ui';
import { api, invalidate, useApi, type Budget, type Category, type Debt, type Goal, type Kind, type Recurring } from '@/lib/api';
import { catIcon } from '@/lib/catIcon';
import { ask, toast } from '@/lib/dialog';
import { goEdit } from '@/lib/nav';
import { currentPeriod, isoDate, money, parseDate, short } from '@/lib/format';
import { C } from '@/lib/theme';

// Crear / editar: meta, presupuesto, gasto fijo, deuda y categoría.
// /editar/meta · /editar/meta?id=3 · /editar/categoria?kind=ingreso …

type Tipo = 'meta' | 'presupuesto' | 'fijo' | 'deuda' | 'categoria';

const ENDPOINT: Record<Tipo, string> = {
  meta: '/goals',
  presupuesto: '/budgets',
  fijo: '/recurring-expenses',
  deuda: '/debts',
  categoria: '/categories',
};

/** Guarda (POST o PUT), refresca todo, cierra y avisa. */
async function persist(tipo: Tipo, id: string | undefined, body: unknown, msg: string) {
  try {
    await api(id ? `${ENDPOINT[tipo]}/${id}` : ENDPOINT[tipo], { method: id ? 'PUT' : 'POST', body });
    success();
    invalidate();
    router.back();
    toast(msg, 'ok');
  } catch (e: any) {
    warn();
    toast(e.message === 'Error 422' ? 'Revisa los datos del formulario' : e.message, 'error');
    throw e;
  }
}

function confirmDelete(tipo: Tipo, id: string, title: string, message: string, done: string) {
  ask({
    title,
    message,
    tone: 'danger',
    icon: 'trash',
    confirmText: 'Eliminar',
    onConfirm: async () => {
      await api(`${ENDPOINT[tipo]}/${id}`, { method: 'DELETE' });
      invalidate();
      router.back();
      toast(done, 'ok');
    },
  });
}

/** Maneja el estado "guardando" alrededor de persist(). */
function useSaver() {
  const [saving, setSaving] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    try {
      await fn();
    } catch {
      setSaving(false);
    }
  };
  return { saving, run };
}

export default function Editar() {
  const { tipo, id, kind } = useLocalSearchParams<{ tipo: Tipo; id?: string; kind?: Kind }>();
  const list = useApi<any[]>(id ? ENDPOINT[tipo] : null);
  const item = id ? list.data?.find((x) => String(x.id) === String(id)) : undefined;

  if (id && !item) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        {list.error ? <T color={C.expense}>{list.error}</T> : <ActivityIndicator color={C.glow} />}
      </View>
    );
  }

  switch (tipo) {
    case 'meta':
      return <MetaForm id={id} item={item} />;
    case 'presupuesto':
      return <PresupuestoForm id={id} item={item} />;
    case 'fijo':
      return <FijoForm id={id} item={item} />;
    case 'deuda':
      return <DeudaForm id={id} item={item} />;
    case 'categoria':
      return <CategoriaForm id={id} item={item} kind={kind} />;
    default:
      return null;
  }
}

/* ─────────────── Meta de ahorro ─────────────── */

const addMonths = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return isoDate(d);
};

function MetaForm({ id, item }: { id?: string; item?: Goal }) {
  const { saving, run } = useSaver();
  const [name, setName] = useState(item?.name ?? '');
  const [target, setTarget] = useState(item?.target_amount ?? 0);
  const [current, setCurrent] = useState(item?.current_amount ?? 0);
  const [when, setWhen] = useState<string>(item?.target_date ? 'keep' : 'none');
  const date = when === 'none' ? null : when === 'keep' ? item!.target_date : addMonths(Number(when));

  const months = date ? Math.max(1, Math.round((parseDate(date).getTime() - Date.now()) / (30.4 * 86400000))) : 0;
  const perMonth = date && target > current ? (target - current) / months : 0;

  const opts = [
    { key: 'none', label: 'Sin fecha' },
    ...(item?.target_date ? [{ key: 'keep', label: `Hasta ${item.target_date}` }] : []),
    { key: '3', label: '3 meses' },
    { key: '6', label: '6 meses' },
    { key: '12', label: '1 año' },
    { key: '24', label: '2 años' },
  ];

  return (
    <FormScreen
      title={id ? 'Editar meta' : 'Nueva meta de ahorro'}
      onDelete={id ? () => confirmDelete('meta', id, 'Eliminar meta', `Se borra "${item!.name}" y sus abonos.`, 'Meta eliminada') : undefined}
      canSave={name.trim().length > 0 && target > 0}
      saving={saving}
      saveLabel={id ? 'Guardar cambios' : 'Crear meta'}
      onSave={() =>
        run(() =>
          persist('meta', id, { name: name.trim(), target_amount: target, current_amount: current, target_date: date, note: item?.note ?? '' }, id ? 'Meta actualizada' : 'Meta creada'),
        )
      }>
      <Field label="¿Para qué ahorras?" value={name} onChange={setName} placeholder="Fondo de emergencia, viaje, moto…" autoFocus={!id} />
      <MoneyField label="¿Cuánto necesitas?" value={target} onChange={setTarget} />
      <MoneyField label="Ya tengo ahorrado" hint={id ? 'Para sumar, usa "Abonar"' : 'Opcional'} value={current} onChange={setCurrent} />
      <Choice label="¿Para cuándo?" value={when} options={opts} onChange={setWhen} />
      {perMonth > 0 && (
        <Summary>
          <T size={13} color={C.textDim}>
            Para llegar a tiempo
          </T>
          <T size={18} weight="bold">
            Ahorra {short(perMonth)} al mes
          </T>
        </Summary>
      )}
    </FormScreen>
  );
}

/* ─────────────── Presupuesto ─────────────── */

function PresupuestoForm({ id, item }: { id?: string; item?: Budget }) {
  const { saving, run } = useSaver();
  const cats = useApi<Category[]>('/categories');
  const expenseCats = useMemo(() => (cats.data ?? []).filter((c) => c.kind === 'egreso'), [cats.data]);
  const [catId, setCatId] = useState<number | null>(item?.category_id ?? null);
  const [amount, setAmount] = useState(item?.amount ?? 0);
  const [scope, setScope] = useState<'siempre' | 'mes'>(item?.period ? 'mes' : 'siempre');

  return (
    <FormScreen
      title={id ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      subtitle="Un límite de gasto por categoría"
      onDelete={id ? () => confirmDelete('presupuesto', id, 'Eliminar presupuesto', `Deja de controlar ${item!.category.name}.`, 'Presupuesto eliminado') : undefined}
      canSave={!!catId && amount > 0}
      saving={saving}
      saveLabel={id ? 'Guardar cambios' : 'Crear presupuesto'}
      onSave={() =>
        run(() =>
          persist('presupuesto', id, { category_id: catId, amount, period: scope === 'mes' ? item?.period ?? currentPeriod() : null }, id ? 'Presupuesto actualizado' : 'Presupuesto creado'),
        )
      }>
      <CategoryPicker
        label="Categoría"
        categories={expenseCats}
        value={catId}
        onChange={setCatId}
        onCreate={() => goEdit('categoria', { kind: 'egreso' })}
      />
      <MoneyField label="Límite al mes" value={amount} onChange={setAmount} />
      <Choice
        label="¿Aplica a…?"
        value={scope}
        options={[
          { key: 'siempre', label: 'Todos los meses' },
          { key: 'mes', label: 'Solo este mes' },
        ]}
        onChange={setScope}
      />
      <Summary>
        <T size={13} color={C.textDim}>
          Te avisamos cuando llegues al 80 % y cuando te pases.
        </T>
      </Summary>
    </FormScreen>
  );
}

/* ─────────────── Gasto fijo ─────────────── */

function FijoForm({ id, item }: { id?: string; item?: Recurring }) {
  const { saving, run } = useSaver();
  const cats = useApi<Category[]>('/categories');
  const expenseCats = useMemo(() => (cats.data ?? []).filter((c) => c.kind === 'egreso'), [cats.data]);
  const [name, setName] = useState(item?.name ?? '');
  const [amount, setAmount] = useState(item?.amount ?? 0);
  const [catId, setCatId] = useState<number | null>(item?.category_id ?? null);
  const [day, setDay] = useState(item?.due_day ?? new Date().getDate());
  const [active, setActive] = useState(item?.active ?? true);

  return (
    <FormScreen
      title={id ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
      subtitle="Arriendo, servicios, suscripciones…"
      onDelete={id ? () => confirmDelete('fijo', id, 'Eliminar gasto fijo', `Deja de recordarte "${item!.name}". Los pagos ya hechos se conservan.`, 'Gasto fijo eliminado') : undefined}
      canSave={name.trim().length > 0 && amount > 0}
      saving={saving}
      saveLabel={id ? 'Guardar cambios' : 'Crear gasto fijo'}
      onSave={() =>
        run(() =>
          persist('fijo', id, { name: name.trim(), amount, category_id: catId, due_day: day, active, note: item?.note ?? '' }, id ? 'Gasto fijo actualizado' : 'Gasto fijo creado'),
        )
      }>
      <Field label="Nombre" value={name} onChange={setName} placeholder="Arriendo, internet, Netflix…" autoFocus={!id} />
      <MoneyField label="Valor mensual" value={amount} onChange={setAmount} />
      <CategoryPicker
        label="Categoría"
        categories={expenseCats}
        value={catId}
        onChange={setCatId}
        onCreate={() => goEdit('categoria', { kind: 'egreso' })}
      />
      <DayPicker label="Vence el día" value={day} onChange={setDay} />
      {id && <SwitchField title="Activo" hint="Si lo apagas, deja de contar y de avisarte" value={active} onChange={setActive} />}
    </FormScreen>
  );
}

/* ─────────────── Deuda ─────────────── */

function DeudaForm({ id, item }: { id?: string; item?: Debt }) {
  const { saving, run } = useSaver();
  const [name, setName] = useState(item?.name ?? '');
  const [lender, setLender] = useState(item?.lender ?? '');
  const [installment, setInstallment] = useState(item?.installment_amount ?? 0);
  const [total, setTotal] = useState(item?.total_installments ?? 12);
  const [paid, setPaid] = useState(item?.paid_installments ?? 0);
  const [day, setDay] = useState(item?.due_day ?? new Date().getDate());
  const [rate, setRate] = useState(item?.annual_rate ? String(item.annual_rate).replace('.', ',') : '');
  const [principal, setPrincipal] = useState(item?.principal ?? 0);
  const [active, setActive] = useState(item?.active ?? true);

  const remaining = Math.max(0, total - paid);
  const rateNum = Number(rate.replace(',', '.')) || 0;

  return (
    <FormScreen
      title={id ? 'Editar deuda' : 'Nueva deuda'}
      subtitle="Crédito, tarjeta, préstamo…"
      onDelete={id ? () => confirmDelete('deuda', id, 'Eliminar deuda', `Se borra "${item!.name}" y su historial de cuotas.`, 'Deuda eliminada') : undefined}
      canSave={name.trim().length > 0 && installment > 0 && total >= 1 && paid <= total}
      saving={saving}
      saveLabel={id ? 'Guardar cambios' : 'Crear deuda'}
      onSave={() =>
        run(() =>
          persist(
            'deuda',
            id,
            {
              name: name.trim(),
              lender: lender.trim(),
              principal: principal || installment * total,
              annual_rate: rateNum,
              total_installments: total,
              paid_installments: paid,
              installment_amount: installment,
              due_day: day,
              start_date: item?.start_date ?? isoDate(),
              active,
              note: item?.note ?? '',
            },
            id ? 'Deuda actualizada' : 'Deuda creada',
          ),
        )
      }>
      <Field label="Nombre" value={name} onChange={setName} placeholder="Moto, tarjeta, préstamo…" autoFocus={!id} />
      <Field label="¿Con quién?" hint="Opcional" value={lender} onChange={setLender} placeholder="Banco, persona…" />
      <MoneyField label="Valor de la cuota" value={installment} onChange={setInstallment} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Stepper label="Cuotas en total" value={total} onChange={(v) => (setTotal(v), paid > v && setPaid(v))} min={1} />
        </View>
        <View style={{ flex: 1 }}>
          <Stepper label="Ya pagadas" value={paid} onChange={setPaid} max={total} />
        </View>
      </View>
      <DayPicker label="Se paga el día" value={day} onChange={setDay} />
      <Field label="Interés anual (E.A.)" hint="Opcional · ej. 24,5" value={rate} onChange={(t) => setRate(t.replace(/[^\d,.]/g, ''))} placeholder="%" keyboardType="decimal-pad" maxLength={6} />
      <MoneyField label="Monto prestado" hint="Opcional" value={principal} onChange={setPrincipal} />
      {id && <SwitchField title="Activa" hint="Si la apagas, deja de avisarte y de contar" value={active} onChange={setActive} />}
      {installment > 0 && (
        <Summary>
          <T size={13} color={C.textDim}>
            {remaining === 0 ? '¡Esta deuda quedaría saldada!' : `Te quedan ${remaining} cuota${remaining === 1 ? '' : 's'}`}
          </T>
          {remaining > 0 && (
            <T size={18} weight="bold">
              {money(remaining * installment)} por pagar
            </T>
          )}
        </Summary>
      )}
    </FormScreen>
  );
}

/* ─────────────── Categoría ─────────────── */

function CategoriaForm({ id, item, kind: initialKind }: { id?: string; item?: Category; kind?: Kind }) {
  const { saving, run } = useSaver();
  const [name, setName] = useState(item?.name ?? '');
  const [kind, setKind] = useState<Kind>(item?.kind ?? initialKind ?? 'egreso');
  const tint = kind === 'egreso' ? C.expense : C.income;

  return (
    <FormScreen
      title={id ? 'Editar categoría' : 'Nueva categoría'}
      onDelete={
        id ? () => confirmDelete('categoria', id, 'Eliminar categoría', 'Sus movimientos quedan sin categoría y se borra su presupuesto.', 'Categoría eliminada') : undefined
      }
      canSave={name.trim().length > 0}
      saving={saving}
      saveLabel={id ? 'Guardar cambios' : 'Crear categoría'}
      onSave={() =>
        run(() =>
          persist('categoria', id, { name: name.trim(), kind, color: item?.color ?? '#8b7dff', icon: item?.icon ?? '💸' }, id ? 'Categoría actualizada' : 'Categoría creada'),
        )
      }>
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 6 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={catIcon(name)} size={32} color={C.bg} strokeWidth={1.9} />
        </View>
        <T size={12} color={C.textMute}>
          El ícono se elige según el nombre
        </T>
      </View>
      <Field label="Nombre" value={name} onChange={setName} placeholder="Mascotas, gimnasio, ventas…" autoFocus={!id} maxLength={40} />
      <Choice
        label="Tipo"
        value={kind}
        options={[
          { key: 'egreso', label: 'Gasto (sale)' },
          { key: 'ingreso', label: 'Ingreso (entra)' },
        ]}
        onChange={setKind}
      />
    </FormScreen>
  );
}
