import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Keypad } from '@/components/Keypad';
import { Button, Kicker, Press, T, success } from '@/components/ui';
import { api, invalidate, type Goal } from '@/lib/api';
import { celebrate } from '@/lib/celebrate';
import { toast } from '@/lib/dialog';
import { evaluate, hasOp, pretty } from '@/lib/calc';
import { num, short } from '@/lib/format';
import { C, R } from '@/lib/theme';

/** Hoja inferior para abonar a una meta de ahorro. */
export default function Abonar() {
  const { goal, name, remaining } = useLocalSearchParams<{ goal: string; name: string; remaining: string }>();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const rem = Math.round(Number(remaining || 0));
  const value = evaluate(amount);

  const save = async () => {
    setSaving(true);
    try {
      const g = await api<Goal>(`/goals/${goal}/contribute`, { method: 'POST', body: { amount: value } });
      success();
      invalidate();
      router.back();
      if (g.progress >= 100) celebrate(`¡Meta "${g.name}" cumplida!`);
      else toast(`Abonaste $${num(value)} a ${g.name}`, 'ok');
    } catch (e: any) {
      toast(e.message, 'error');
      setSaving(false);
    }
  };

  const quick = [rem > 0 ? Math.min(rem, 50_000) : 50_000, 100_000, rem].filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Animated.View entering={FadeIn} style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim }]} onPress={() => router.back()} />
      </Animated.View>
      <Animated.View entering={SlideInDown.springify().damping(18)} style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grip} />
        <Kicker color={C.glow}>Abonar a</Kicker>
        <T size={22} weight="bold" numberOfLines={1} style={{ marginTop: 2 }}>
          {name}
        </T>
        <T size={13} color={C.textMute} style={{ marginTop: 2 }}>
          Faltan {short(rem)}
        </T>

        <Press onPress={() => hasOp(amount) && setAmount(value ? String(value) : '')} haptic={hasOp(amount)} style={styles.expr}>
          <T mono size={14} color={C.textDim} numberOfLines={1}>
            {hasOp(amount) ? `${pretty(amount)}  =` : ' '}
          </T>
        </Press>
        <View style={styles.amountRow}>
          <T mono weight="bold" size={24} color={C.textMute}>
            $
          </T>
          <T mono weight="bold" size={44} color={value ? C.text : C.textMute} style={{ letterSpacing: -1.5 }}>
            {value ? num(value) : '0'}
          </T>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
          {quick.map((q) => (
            <Press key={q} onPress={() => setAmount(String(q))} style={styles.quick}>
              <T size={12} weight="semi" color={C.textDim}>
                {q === rem ? `Todo · ${short(q)}` : short(q)}
              </T>
            </Press>
          ))}
        </View>

        <Keypad value={amount} onChange={setAmount} />
        <Button title="Abonar" onPress={save} loading={saving} disabled={!value} style={{ marginTop: 12 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingHorizontal: 16, paddingTop: 10, borderWidth: 1, borderColor: C.line },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, marginBottom: 14 },
  expr: { alignSelf: 'center', marginTop: 14, height: 20, justifyContent: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2, marginBottom: 18 },
  quick: { paddingHorizontal: 12, height: 32, borderRadius: R.full, backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineSoft, justifyContent: 'center' },
});
