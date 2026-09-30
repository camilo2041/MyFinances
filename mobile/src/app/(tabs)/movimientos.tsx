import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { TAB_BAR_SPACE } from '@/components/TabBar';
import { openTx, TxRow } from '@/components/TxRow';
import { Empty, ErrorLine, Kicker, Money, Press, Segmented, T, warn } from '@/components/ui';
import { api, invalidate, useApi, type Tx } from '@/lib/api';
import { ask, toast } from '@/lib/dialog';
import { currentPeriod, dayLabel, money, num, periodLabel, shiftPeriod } from '@/lib/format';
import { C, R } from '@/lib/theme';

type Filter = 'all' | 'egreso' | 'ingreso';

export default function Movimientos() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState(currentPeriod());
  const [filter, setFilter] = useState<Filter>('all');
  const { data, error, loading, reload } = useApi<Tx[]>(`/transactions?period=${period}`);

  const rows = useMemo(() => (data ?? []).filter((t) => filter === 'all' || t.kind === filter), [data, filter]);
  const totals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of data ?? []) t.kind === 'ingreso' ? (inc += t.amount) : (exp += t.amount);
    return { inc, exp };
  }, [data]);

  const sections = useMemo(() => {
    const map = new Map<string, Tx[]>();
    for (const t of rows) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return [...map.entries()].map(([date, items]) => ({
      date,
      net: items.reduce((s, t) => s + (t.kind === 'ingreso' ? t.amount : -t.amount), 0),
      data: items,
    }));
  }, [rows]);

  const remove = (tx: Tx) => {
    warn();
    ask({
      title: 'Eliminar movimiento',
      message: 'No se puede deshacer.',
      tone: 'danger',
      icon: 'trash',
      rows: [
        { label: tx.note || tx.category?.name || 'Movimiento', value: money(tx.kind === 'ingreso' ? tx.amount : -tx.amount) },
        { label: 'Fecha', value: dayLabel(tx.date) },
      ],
      confirmText: 'Eliminar',
      onConfirm: async () => {
        await api(`/transactions/${tx.id}`, { method: 'DELETE' });
        invalidate();
        toast('Movimiento eliminado', 'ok');
      },
    });
  };

  const isCurrent = period === currentPeriod();

  const header = (
    <View style={{ paddingTop: insets.top + 14 }}>
      <Kicker>Libro</Kicker>
      <View style={styles.periodRow}>
        <Press onPress={() => setPeriod(shiftPeriod(period, -1))} style={styles.stepBtn}>
          <Icon name="chevronLeft" size={18} color={C.textDim} />
        </Press>
        <T size={28} weight="bold" style={{ flex: 1, textTransform: 'capitalize', letterSpacing: -0.8 }}>
          {periodLabel(period)}
        </T>
        <Press onPress={() => !isCurrent && setPeriod(shiftPeriod(period, 1))} style={[styles.stepBtn, isCurrent && { opacity: 0.3 }]}>
          <Icon name="chevronRight" size={18} color={C.textDim} />
        </Press>
      </View>

      <View style={styles.totals}>
        <View style={{ flex: 1 }}>
          <T size={12} color={C.textMute}>
            Entró
          </T>
          <Money value={totals.inc} size={17} color={C.income} />
        </View>
        <View style={{ flex: 1 }}>
          <T size={12} color={C.textMute}>
            Salió
          </T>
          <Money value={totals.exp} size={17} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <T size={12} color={C.textMute}>
            Neto
          </T>
          <Money value={totals.inc - totals.exp} size={17} sign color={totals.inc - totals.exp < 0 ? C.expense : C.text} />
        </View>
      </View>

      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'all', label: 'Todo' },
          { key: 'egreso', label: 'Gastos' },
          { key: 'ingreso', label: 'Ingresos' },
        ]}
      />
      {error && (
        <View style={{ marginTop: 12 }}>
          <ErrorLine msg={error} onRetry={reload} />
        </View>
      )}
      <View style={{ height: 8 }} />
    </View>
  );

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
      sections={sections}
      keyExtractor={(t) => String(t.id)}
      ListHeaderComponent={header}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      initialNumToRender={14}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={invalidate} tintColor={C.glow} colors={[C.accent]} progressBackgroundColor={C.raised} />}
      renderSectionHeader={({ section }) => (
        <View style={styles.dayHead}>
          <T size={13} weight="semi" color={C.textDim}>
            {dayLabel(section.date)}
          </T>
          <T mono size={12} color={section.net < 0 ? C.textMute : C.income}>
            {section.net > 0 ? '+' : section.net < 0 ? '−' : ''}${num(section.net)}
          </T>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <View style={[styles.item, index === 0 && styles.first, index === section.data.length - 1 && styles.last, index > 0 && styles.divider]}>
          <TxRow tx={item} onPress={() => openTx(item)} onLongPress={() => remove(item)} />
        </View>
      )}
      ListEmptyComponent={data ? <Empty title="Nada por aquí" hint={isCurrent ? 'Toca + para registrar un gasto o ingreso.' : 'No hubo movimientos este mes.'} /> : null}
      ListFooterComponent={
        rows.length > 0 ? (
          <T size={12} color={C.textMute} style={{ textAlign: 'center', marginTop: 18 }}>
            Mantén presionado un movimiento para eliminarlo
          </T>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 16 },
  stepBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  totals: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.lineSoft },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, paddingBottom: 8, paddingHorizontal: 4 },
  item: { backgroundColor: C.surface, paddingHorizontal: 14 },
  first: { borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg, paddingTop: 2 },
  last: { borderBottomLeftRadius: R.lg, borderBottomRightRadius: R.lg, paddingBottom: 2 },
  divider: { borderTopWidth: 1, borderTopColor: C.lineSoft },
});
