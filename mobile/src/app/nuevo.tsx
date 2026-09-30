import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Keypad } from '@/components/Keypad';
import { Button, Kicker, Press, T, success, warn } from '@/components/ui';
import { api, invalidate, useApi, type Budget, type Category, type Kind } from '@/lib/api';
import { evaluate, hasOp, pretty } from '@/lib/calc';
import { catIcon } from '@/lib/catIcon';
import { isoDate, num } from '@/lib/format';
import { ask, toast } from '@/lib/dialog';
import { budgetAlert } from '@/lib/notify';
import { C, F, R } from '@/lib/theme';

const DAY_OPTS = [
  { label: 'Hoy', offset: 0 },
  { label: 'Ayer', offset: 1 },
  { label: 'Anteayer', offset: 2 },
];
const dateFor = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return isoDate(d);
};

function Caret({ color }: { color: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 })), -1);
  }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 3, height: 46, borderRadius: 2, backgroundColor: color, marginLeft: 4 }, a]} />;
}

export default function Nuevo() {
  const p = useLocalSearchParams<{ id?: string; amount?: string; kind?: Kind; cat?: string; note?: string; date?: string }>();
  const editing = !!p.id;
  const insets = useSafeAreaInsets();
  const cats = useApi<Category[]>('/categories');

  const [kind, setKind] = useState<Kind>(p.kind ?? 'egreso');
  const [amount, setAmount] = useState(p.amount ? String(Math.round(Number(p.amount))) : '');
  const [catId, setCatId] = useState<number | null>(p.cat ? Number(p.cat) : null);
  const [note, setNote] = useState(p.note ?? '');
  const [date, setDate] = useState(p.date ?? dateFor(0));
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => (cats.data ?? []).filter((c) => c.kind === kind), [cats.data, kind]);
  const cat = list.find((c) => c.id === catId);
  const tint = kind === 'egreso' ? C.expense : C.income;
  const value = evaluate(amount);
  const calculating = hasOp(amount);

  const switchKind = (k: Kind) => {
    if (k === kind) return;
    setKind(k);
    setCatId(null);
  };

  const save = async () => {
    if (!value) return warn();
    setSaving(true);
    try {
      const body = { amount: value, kind, category_id: catId, note: note.trim(), date };
      const before = kind === 'egreso' ? await api<Budget[]>('/budgets').catch(() => []) : [];
      if (editing) await api(`/transactions/${p.id}`, { method: 'PUT', body });
      else await api('/transactions', { method: 'POST', body });
      success();
      invalidate();
      if (kind === 'egreso' && before.length) {
        api<Budget[]>('/budgets')
          .then((after) => budgetAlert(before, after))
          .catch(() => {});
      }
      router.back();
      toast(editing ? 'Cambios guardados' : kind === 'egreso' ? 'Gasto registrado' : 'Ingreso registrado', 'ok');
    } catch (e: any) {
      warn();
      toast(e.message, 'error');
      setSaving(false);
    }
  };

  const remove = () =>
    ask({
      title: 'Eliminar movimiento',
      message: 'No se puede deshacer.',
      tone: 'danger',
      icon: 'trash',
      rows: [{ label: note || 'Monto', value: `$${num(value)}` }],
      confirmText: 'Eliminar',
      onConfirm: async () => {
        await api(`/transactions/${p.id}`, { method: 'DELETE' });
        invalidate();
        router.back();
        toast('Movimiento eliminado', 'ok');
      },
    });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      {/* Cabecera */}
      <View style={styles.top}>
        <Press onPress={() => router.back()} style={styles.round}>
          <Icon name="close" size={20} color={C.textDim} />
        </Press>
        <T size={16} weight="semi">
          {editing ? 'Editar movimiento' : 'Nuevo movimiento'}
        </T>
        {editing ? (
          <Press onPress={remove} style={styles.round}>
            <Icon name="trash" size={19} color={C.expense} />
          </Press>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      {/* Entró / Salió */}
      <View style={styles.kinds}>
        {(['ingreso', 'egreso'] as Kind[]).map((k) => {
          const on = kind === k;
          const col = k === 'egreso' ? C.expense : C.income;
          return (
            <Press key={k} onPress={() => switchKind(k)} style={[styles.kindCard, on && { backgroundColor: col + '1c', borderColor: col }]} scaleTo={0.97}>
              <View style={[styles.kindIcon, { backgroundColor: col + (on ? '30' : '1a') }]}>
                <Icon name={k === 'egreso' ? 'arrowDown' : 'arrowUp'} size={20} color={col} strokeWidth={2.4} />
              </View>
              <T size={17} weight="semi" color={on ? col : C.text}>
                {k === 'egreso' ? 'Salió' : 'Entró'}
              </T>
              {on && (
                <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.check, { backgroundColor: col }]}>
                  <Icon name="check" size={13} color={C.bg} strokeWidth={3} />
                </Animated.View>
              )}
            </Press>
          );
        })}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Monto */}
        <View style={styles.amountBox}>
          {/* Operación en curso: tocarla la resuelve */}
          <Press onPress={() => calculating && setAmount(value ? String(value) : '')} haptic={calculating} style={styles.expr}>
            <T mono size={15} color={C.textDim} numberOfLines={1}>
              {calculating ? `${pretty(amount)}  =` : ' '}
            </T>
          </Press>
          <View style={styles.amountRow}>
            <T mono weight="bold" size={30} color={C.textMute} style={{ marginRight: 4 }}>
              $
            </T>
            <T mono weight="bold" size={value >= 100_000_000 ? 40 : 50} color={value ? C.text : C.textMute} style={{ letterSpacing: -2 }}>
              {value ? num(value) : '0'}
            </T>
            <Caret color={tint} />
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={kind === 'egreso' ? '¿En qué? (almuerzo, taxi…)' : '¿De dónde? (salario, venta…)'}
            placeholderTextColor={C.textMute}
            style={styles.note}
            maxLength={120}
          />
        </View>

        {/* Categorías */}
        <View style={styles.sectionHead}>
          <Kicker>Categoría</Kicker>
          {cat && (
            <T size={12} color={tint}>
              {cat.name}
            </T>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.tiles}>
          {list.map((c) => {
            const on = c.id === catId;
            return (
              <Press key={c.id} onPress={() => setCatId(on ? null : c.id)} style={[styles.tile, on && { backgroundColor: tint + '1a', borderColor: tint }]} scaleTo={0.93}>
                <View style={[styles.tileIcon, on && { backgroundColor: tint }]}>
                  <Icon name={catIcon(c.name)} size={22} color={on ? C.bg : C.textDim} strokeWidth={1.9} />
                </View>
                <T size={11.5} weight={on ? 'semi' : 'medium'} color={on ? C.text : C.textDim} numberOfLines={2} style={styles.tileLabel}>
                  {c.name}
                </T>
              </Press>
            );
          })}
        </ScrollView>

        {/* Fecha */}
        <View style={styles.dates}>
          {DAY_OPTS.map((o) => {
            const d = dateFor(o.offset);
            const on = d === date;
            return (
              <Press key={o.label} onPress={() => setDate(d)} style={[styles.dateChip, on && styles.dateOn]} scaleTo={0.95}>
                <T size={12} weight={on ? 'semi' : 'regular'} color={on ? C.text : C.textMute}>
                  {o.label}
                </T>
              </Press>
            );
          })}
          {!DAY_OPTS.some((o) => dateFor(o.offset) === date) && (
            <View style={[styles.dateChip, styles.dateOn]}>
              <T size={12} weight="semi">
                {date}
              </T>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: 8 }}>
        <Keypad value={amount} onChange={setAmount} />
        <Button
          title={editing ? 'Guardar cambios' : kind === 'egreso' ? 'Guardar gasto' : 'Guardar ingreso'}
          onPress={save}
          loading={saving}
          disabled={!value}
          icon={<Icon name="check" size={18} strokeWidth={2.4} color={C.onAccent} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  round: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  kinds: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  kindCard: {
    flex: 1,
    height: 64,
    borderRadius: R.lg,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  kindIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  amountBox: { alignItems: 'center', paddingTop: 6, paddingBottom: 6, paddingHorizontal: 16 },
  expr: { marginTop: 6, height: 22, justifyContent: 'center', maxWidth: '100%' },
  amountRow: { flexDirection: 'row', alignItems: 'center', height: 62 },
  note: { marginTop: 4, color: C.text, fontFamily: F.medium, fontSize: 15, textAlign: 'center', minWidth: 240, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 14, marginBottom: 8 },
  tiles: { gap: 8, paddingHorizontal: 16 },
  tile: { width: 78, paddingVertical: 10, paddingHorizontal: 4, borderRadius: R.lg, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center', gap: 7 },
  tileIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { textAlign: 'center', lineHeight: 14, minHeight: 28 },
  dates: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dateChip: { paddingHorizontal: 12, height: 30, borderRadius: R.full, alignItems: 'center', justifyContent: 'center' },
  dateOn: { backgroundColor: C.raised },
});
