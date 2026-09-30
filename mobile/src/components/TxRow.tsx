import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Tx } from '@/lib/api';
import { catIcon } from '@/lib/catIcon';
import { C, catColor } from '@/lib/theme';

import { Icon } from './Icon';
import { Money, Press, T } from './ui';

export function TxRow({ tx, onPress, onLongPress, sub }: { tx: Tx; onPress?: () => void; onLongPress?: () => void; sub?: string }) {
  const inc = tx.kind === 'ingreso';
  const tint = inc ? C.income : catColor(tx.category_id);
  const title = tx.note || tx.category?.name || (inc ? 'Ingreso' : 'Gasto');
  const icon = tx.source_type === 'deuda' ? 'bank' : tx.category ? catIcon(tx.category.name) : inc ? 'cash' : 'tag';
  return (
    <Press onPress={onPress} onLongPress={onLongPress} haptic={!!onPress} scaleTo={0.98} style={styles.row}>
      <View style={[styles.badge, { backgroundColor: tint + '22', borderColor: tint + '55' }]}>
        <Icon name={icon} size={19} color={tint} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T weight="medium" numberOfLines={1}>
          {title}
        </T>
        <T size={12} color={C.textMute} numberOfLines={1}>
          {sub ?? (tx.note && tx.category ? tx.category.name : tx.source_type === 'fijo' ? 'Gasto fijo' : tx.source_type === 'deuda' ? 'Cuota' : inc ? 'Entra' : 'Sale')}
        </T>
      </View>
      <Money value={inc ? tx.amount : -tx.amount} sign size={15} color={inc ? C.income : C.text} />
    </Press>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  badge: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

/** Abre el registro rápido en modo edición con los datos del movimiento. */
export const openTx = (tx: Tx) =>
  router.push({
    pathname: '/nuevo',
    params: { id: tx.id, amount: tx.amount, kind: tx.kind, cat: tx.category_id ?? '', note: tx.note, date: tx.date },
  });
