import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Keypad } from '@/components/Keypad';
import { VoiceListener } from '@/components/VoiceListener';
import { Button, Kicker, Press, T, success, warn } from '@/components/ui';
import { api, invalidate, useApi, type Budget, type Category, type Kind } from '@/lib/api';
import { evaluate, hasOp, pretty } from '@/lib/calc';
import { catIcon } from '@/lib/catIcon';
import { goEdit } from '@/lib/nav';
import { isoDate, num } from '@/lib/format';
import { ask, toast } from '@/lib/dialog';
import { fallbackCategory, guessCategory } from '@/lib/guess';
import { budgetAlert } from '@/lib/notify';
import { storage } from '@/lib/storage';
import { parseSpeech, type VoiceItem } from '@/lib/voice';
import { C, F, R } from '@/lib/theme';

const DAY_OPTS = [
  { label: 'Hoy', offset: 0 },
  { label: 'Ayer', offset: 1 },
  { label: 'Anteayer', offset: 2 },
];
const LAST_CAT_KEY = (k: Kind) => `myfinces_lastcat_${k}`;
const dayName = (offset: number) => DAY_OPTS.find((o) => o.offset === offset)?.label ?? `Hace ${offset} días`;

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
  const p = useLocalSearchParams<{ id?: string; amount?: string; kind?: Kind; cat?: string; note?: string; date?: string; voz?: string }>();
  const editing = !!p.id;
  const insets = useSafeAreaInsets();
  const cats = useApi<Category[]>('/categories');

  const [kind, setKind] = useState<Kind>(p.kind ?? 'egreso');
  const [amount, setAmount] = useState(p.amount ? String(Math.round(Number(p.amount))) : '');
  const [catId, setCatId] = useState<number | null>(p.cat ? Number(p.cat) : null);
  const [note, setNote] = useState(p.note ?? '');
  const [date, setDate] = useState(p.date ?? dateFor(0));
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(p.voz === '1');
  const [lastCat, setLastCat] = useState<Partial<Record<Kind, number>>>({});
  // Mientras el usuario no toque una categoría, la elegimos por él (según la nota).
  const catTouched = useRef(!!p.cat);
  const tilesRef = useRef<ScrollView>(null);

  const list = useMemo(() => (cats.data ?? []).filter((c) => c.kind === kind), [cats.data, kind]);
  const cat = list.find((c) => c.id === catId);
  const tint = kind === 'egreso' ? C.expense : C.income;
  const value = evaluate(amount);
  const calculating = hasOp(amount);

  // Última categoría usada por tipo (para preseleccionarla).
  useEffect(() => {
    Promise.all([storage.get(LAST_CAT_KEY('egreso')), storage.get(LAST_CAT_KEY('ingreso'))])
      .then(([e, i]) => setLastCat({ egreso: e ? Number(e) : undefined, ingreso: i ? Number(i) : undefined }))
      .catch(() => {});
  }, []);

  /** Mejor categoría para un texto: la que sugiere → la última usada → "Otros". */
  const pick = (text: string, k: Kind) => {
    const all = cats.data ?? [];
    return guessCategory(text, k, all) ?? all.find((c) => c.id === lastCat[k] && c.kind === k) ?? fallbackCategory(k, all);
  };

  // Siempre hay una categoría elegida.
  useEffect(() => {
    if (!cats.data || (catId && list.some((c) => c.id === catId))) return;
    const c = pick(note, kind);
    if (c) setCatId(c.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats.data, kind, lastCat, list]);

  // Lleva a la vista la categoría elegida.
  useEffect(() => {
    const idx = list.findIndex((c) => c.id === catId);
    if (idx >= 0) tilesRef.current?.scrollTo({ x: Math.max(0, idx * 86 - 110), animated: true });
  }, [catId, list]);

  const onNote = (t: string) => {
    setNote(t);
    if (catTouched.current) return;
    const g = guessCategory(t, kind, cats.data ?? []);
    if (g) setCatId(g.id);
  };

  const chooseCat = (id: number) => {
    catTouched.current = true;
    setCatId(id);
  };

  const switchKind = (k: Kind) => {
    if (k === kind) return;
    catTouched.current = false;
    setKind(k);
    setCatId(pick(note, k)?.id ?? null);
  };

  const rememberCat = (k: Kind, id: number | null) => {
    if (id) storage.set(LAST_CAT_KEY(k), String(id)).catch(() => {});
  };

  /** Guarda uno o varios movimientos dictados de una vez. */
  const saveMany = async (items: (VoiceItem & { catId: number | null })[]) => {
    for (const it of items) {
      await api('/transactions', { method: 'POST', body: { amount: it.amount, kind: it.kind, category_id: it.catId, note: it.note, date: dateFor(it.dayOffset) } });
      rememberCat(it.kind, it.catId);
    }
    success();
    invalidate();
    router.back();
    toast(items.length === 1 ? (items[0].kind === 'egreso' ? 'Gasto registrado' : 'Ingreso registrado') : `${items.length} movimientos registrados`, 'ok');
  };

  /** Lo dictado → formulario lleno + confirmación para guardar de una. */
  const onVoice = (text: string) => {
    setListening(false);
    const items = parseSpeech(text, kind).map((it) => ({ ...it, catId: pick(`${it.note} ${it.text}`, it.kind)?.id ?? null }));
    if (!items.length) {
      warn();
      return toast('No escuché un monto. Prueba: "gasté 20 mil en taxi"', 'error');
    }
    const catName = (id: number | null) => (cats.data ?? []).find((c) => c.id === id)?.name ?? 'Sin categoría';
    if (items.length === 1) {
      const it = items[0];
      catTouched.current = false;
      setKind(it.kind);
      setAmount(String(it.amount));
      setNote(it.note);
      setDate(dateFor(it.dayOffset));
      setCatId(it.catId);
      return ask({
        title: it.kind === 'egreso' ? 'Registrar gasto' : 'Registrar ingreso',
        message: `"${text}"`,
        icon: 'mic',
        rows: [
          { label: 'Monto', value: `$${num(it.amount)}` },
          { label: 'Nota', value: it.note || '—' },
          { label: 'Categoría', value: catName(it.catId) },
          { label: 'Fecha', value: dayName(it.dayOffset) },
        ],
        confirmText: 'Guardar',
        cancelText: 'Corregir',
        onConfirm: () => saveMany(items),
      });
    }
    ask({
      title: `Registrar ${items.length} movimientos`,
      message: `"${text}"`,
      icon: 'mic',
      rows: items.map((it) => ({
        label: `${it.kind === 'egreso' ? '↓' : '↑'} ${it.note || catName(it.catId)} · ${catName(it.catId)}`,
        value: `$${num(it.amount)}`,
      })),
      confirmText: 'Guardar todos',
      onConfirm: () => saveMany(items),
    });
  };

  const save = async () => {
    if (!value) return warn();
    setSaving(true);
    try {
      const body = { amount: value, kind, category_id: catId, note: note.trim(), date };
      rememberCat(kind, catId);
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
          <Press onPress={() => setListening(true)} style={[styles.round, styles.micBtn]} accessibilityLabel="Registrar por voz">
            <Icon name="mic" size={20} color="#fff" strokeWidth={2} />
          </Press>
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
            onChangeText={onNote}
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
        <ScrollView ref={tilesRef} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.tiles}>
          {list.map((c) => {
            const on = c.id === catId;
            return (
              <Press key={c.id} onPress={() => chooseCat(c.id)} style={[styles.tile, on && { backgroundColor: tint + '1a', borderColor: tint }]} scaleTo={0.93}>
                <View style={[styles.tileIcon, on && { backgroundColor: tint }]}>
                  <Icon name={catIcon(c.name)} size={22} color={on ? C.bg : C.textDim} strokeWidth={1.9} />
                </View>
                <T size={11.5} weight={on ? 'semi' : 'medium'} color={on ? C.text : C.textDim} numberOfLines={2} style={styles.tileLabel}>
                  {c.name}
                </T>
              </Press>
            );
          })}
          <Press onPress={() => goEdit('categoria', { kind })} style={styles.tile} scaleTo={0.93}>
            <View style={[styles.tileIcon, styles.tileNew]}>
              <Icon name="plus" size={20} color={C.glow} />
            </View>
            <T size={11.5} weight="medium" color={C.glow} style={styles.tileLabel}>
              Nueva
            </T>
          </Press>
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
          disabled={!value || !catId}
          icon={<Icon name="check" size={18} strokeWidth={2.4} color={C.onAccent} />}
        />
      </View>
      {listening && <VoiceListener onResult={onVoice} onClose={() => setListening(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  micBtn: { backgroundColor: C.brand },
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
  tileNew: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.glow, borderStyle: 'dashed' },
  tileIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { textAlign: 'center', lineHeight: 14, minHeight: 28 },
  dates: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dateChip: { paddingHorizontal: 12, height: 30, borderRadius: R.full, alignItems: 'center', justifyContent: 'center' },
  dateOn: { backgroundColor: C.raised },
});
