import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Card, ErrorLine, Press, Segmented, T } from '@/components/ui';
import { useApi, type Category, type Kind } from '@/lib/api';
import { catIcon } from '@/lib/catIcon';
import { goEdit } from '@/lib/nav';
import { C, R } from '@/lib/theme';

export default function Categorias() {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<Kind>('egreso');
  const cats = useApi<Category[]>('/categories');
  const list = (cats.data ?? []).filter((c) => c.kind === kind).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const tint = kind === 'egreso' ? C.expense : C.income;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Press onPress={() => router.back()} style={styles.round}>
          <Icon name="chevronLeft" size={20} color={C.textDim} />
        </Press>
        <T size={17} weight="semi">
          Categorías
        </T>
        <Press onPress={() => goEdit('categoria', { kind })} style={[styles.round, { backgroundColor: C.accent }]} accessibilityLabel="Nueva categoría">
          <Icon name="plus" size={20} color={C.onAccent} strokeWidth={2.4} />
        </Press>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 14 }}>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { key: 'egreso', label: 'Gastos' },
            { key: 'ingreso', label: 'Ingresos' },
          ]}
        />
        {cats.error && <ErrorLine msg={cats.error} onRetry={cats.reload} />}
        <Card style={{ paddingVertical: 4 }}>
          {list.map((c, i) => (
            <Press key={c.id} onPress={() => goEdit('categoria', { id: c.id })} haptic={false} scaleTo={0.98} style={[styles.row, i > 0 && styles.divider]}>
              <View style={[styles.icon, { backgroundColor: tint + '22' }]}>
                <Icon name={catIcon(c.name)} size={19} color={tint} strokeWidth={1.9} />
              </View>
              <T weight="medium" style={{ flex: 1 }} numberOfLines={1}>
                {c.name}
              </T>
              <Icon name="chevronRight" size={18} color={C.textMute} />
            </Press>
          ))}
          <Press onPress={() => goEdit('categoria', { kind })} haptic={false} scaleTo={0.98} style={[styles.row, list.length > 0 && styles.divider]}>
            <View style={[styles.icon, styles.newIcon]}>
              <Icon name="plus" size={18} color={C.glow} strokeWidth={2.2} />
            </View>
            <T weight="semi" color={C.glow}>
              Nueva categoría de {kind === 'egreso' ? 'gasto' : 'ingreso'}
            </T>
          </Press>
        </Card>
        <T size={12} color={C.textMute} style={{ textAlign: 'center' }}>
          Toca una categoría para cambiarle el nombre o eliminarla.
        </T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 4 },
  round: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  newIcon: { borderWidth: 1.5, borderColor: C.glow, borderStyle: 'dashed', borderRadius: R.full },
});
