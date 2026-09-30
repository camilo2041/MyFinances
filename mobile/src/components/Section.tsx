import { StyleSheet, View } from 'react-native';

import { C, R } from '@/lib/theme';

import { Icon } from './Icon';
import { Press, T } from './ui';

/** Título de sección con botón "+ Nuevo". */
export function SectionHead({ title, action, onPress, first }: { title: string; action: string; onPress: () => void; first?: boolean }) {
  return (
    <View style={[styles.sectionHead, first && { marginTop: 4 }]}>
      <T size={18} weight="bold">
        {title}
      </T>
      <Press onPress={onPress} style={styles.newBtn}>
        <Icon name="plus" size={15} strokeWidth={2.4} color={C.onAccent} />
        <T size={13} weight="semi" color={C.onAccent}>
          {action}
        </T>
      </Press>
    </View>
  );
}

/** Tarjeta punteada para crear el primero. */
export function NewCard({ title, hint, onPress }: { title: string; hint: string; onPress: () => void }) {
  return (
    <Press onPress={onPress} style={styles.newCard} scaleTo={0.98}>
      <View style={styles.newIcon}>
        <Icon name="plus" size={22} color={C.glow} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T weight="semi">{title}</T>
        <T size={12.5} color={C.textMute}>
          {hint}
        </T>
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent, paddingHorizontal: 12, height: 32, borderRadius: R.full },
  newCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line },
  newIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
