import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { press } from '@/lib/calc';
import { C, R } from '@/lib/theme';

import { Icon } from './Icon';
import { Press, T } from './ui';

// Teclado-calculadora: dígitos a la izquierda, operadores a la derecha.
const ROWS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['000', '0', 'del', '+'],
];
const OP_KEYS = new Set(['÷', '×', '−', '+']);

/** Teclado numérico propio con calculadora: más rápido que el del sistema para montos en pesos. */
export function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const tapKey = (k: string) => {
    Haptics.impactAsync(OP_KEYS.has(k) ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange(press(value, k));
  };
  return (
    <View style={styles.grid}>
      {ROWS.map((row) => (
        <View key={row.join()} style={styles.row}>
          {row.map((k) => {
            const op = OP_KEYS.has(k);
            return (
              <Press
                key={k}
                haptic={false}
                scaleTo={0.9}
                onPress={() => tapKey(k)}
                onLongPress={k === 'del' ? () => onChange('') : undefined}
                style={[styles.key, op && styles.opKey]}>
                {k === 'del' ? (
                  <Icon name="backspace" size={24} color={C.textDim} />
                ) : (
                  <T mono weight="semi" size={op ? 26 : k === '000' ? 20 : 26} color={op ? C.glow : C.text}>
                    {k}
                  </T>
                )}
              </Press>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 52, borderRadius: R.md, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  opKey: { flex: 0.8, backgroundColor: C.accentSoft },
});
