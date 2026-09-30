import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Category } from '@/lib/api';
import { catIcon } from '@/lib/catIcon';
import { num } from '@/lib/format';
import { C, F, R } from '@/lib/theme';

import { Icon } from './Icon';
import { Button, Kicker, Press, T } from './ui';

// Piezas comunes de los formularios de creación/edición.

export function FormScreen({ title, subtitle, onDelete, onSave, saving, canSave, saveLabel, children }: {
  title: string;
  subtitle?: string;
  onDelete?: () => void;
  onSave: () => void;
  saving?: boolean;
  canSave: boolean;
  saveLabel: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Press onPress={() => router.back()} style={styles.round}>
          <Icon name="close" size={20} color={C.textDim} />
        </Press>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <T size={16} weight="semi" numberOfLines={1}>
            {title}
          </T>
          {subtitle && (
            <T size={11.5} color={C.textMute}>
              {subtitle}
            </T>
          )}
        </View>
        {onDelete ? (
          <Press onPress={onDelete} style={styles.round}>
            <Icon name="trash" size={19} color={C.expense} />
          </Press>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 18 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <Button title={saveLabel} onPress={onSave} loading={saving} disabled={!canSave} icon={<Icon name="check" size={18} strokeWidth={2.4} color={C.onAccent} />} />
      </View>
    </KeyboardAvoidingView>
  );
}

export const Label = ({ children, hint }: { children: ReactNode; hint?: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, paddingHorizontal: 2 }}>
    <Kicker>{children}</Kicker>
    {hint && (
      <T size={11.5} color={C.textMute}>
        {hint}
      </T>
    )}
  </View>
);

export function Field({ label, hint, value, onChange, placeholder, keyboardType, autoFocus, maxLength }: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <View>
      <Label hint={hint}>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textMute}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        maxLength={maxLength ?? 80}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[styles.input, focus && { borderColor: C.glow }]}
      />
    </View>
  );
}

/** Monto en pesos: solo dígitos, se muestra con puntos de miles. */
export function MoneyField({ label, hint, value, onChange, autoFocus }: { label: string; hint?: string; value: number; onChange: (v: number) => void; autoFocus?: boolean }) {
  const [focus, setFocus] = useState(false);
  return (
    <View>
      <Label hint={hint}>{label}</Label>
      <View style={[styles.input, styles.moneyWrap, focus && { borderColor: C.glow }]}>
        <T mono weight="bold" size={20} color={C.textMute}>
          $
        </T>
        <TextInput
          value={value ? num(value) : ''}
          onChangeText={(t) => onChange(Number(t.replace(/\D/g, '').slice(0, 12)) || 0)}
          placeholder="0"
          placeholderTextColor={C.textMute}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={styles.moneyInput}
        />
      </View>
    </View>
  );
}

/** Número pequeño con botones − / + (cuotas, etc.). */
export function Stepper({ label, hint, value, onChange, min = 0, max = 600 }: { label: string; hint?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <View>
      <Label hint={hint}>{label}</Label>
      <View style={styles.stepper}>
        <Press onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn}>
          <Icon name="minus" size={18} />
        </Press>
        <TextInput
          value={String(value)}
          onChangeText={(t) => onChange(Math.min(max, Math.max(min, Number(t.replace(/\D/g, '')) || 0)))}
          keyboardType="number-pad"
          style={styles.stepValue}
          maxLength={3}
        />
        <Press onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepBtn}>
          <Icon name="plus" size={18} />
        </Press>
      </View>
    </View>
  );
}

/** Día del mes (1–31) en cuadrícula. */
export function DayPicker({ label, value, onChange }: { label: string; value: number; onChange: (d: number) => void }) {
  return (
    <View>
      <Label hint={`Día ${value} de cada mes`}>{label}</Label>
      <View style={styles.days}>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
          const on = d === value;
          return (
            <Press key={d} onPress={() => onChange(d)} style={[styles.day, on && styles.dayOn]} scaleTo={0.9}>
              <T mono size={13} weight={on ? 'bold' : 'medium'} color={on ? C.onAccent : C.textDim}>
                {d}
              </T>
            </Press>
          );
        })}
      </View>
    </View>
  );
}

export function Choice<K extends string>({ label, hint, value, options, onChange }: {
  label: string;
  hint?: string;
  value: K;
  options: { key: K; label: string }[];
  onChange: (k: K) => void;
}) {
  return (
    <View>
      <Label hint={hint}>{label}</Label>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Press key={o.key} onPress={() => onChange(o.key)} style={[styles.chip, on && styles.chipOn]} scaleTo={0.95}>
              <T size={13.5} weight={on ? 'semi' : 'medium'} color={on ? C.onAccent : C.textDim}>
                {o.label}
              </T>
            </Press>
          );
        })}
      </View>
    </View>
  );
}

export function CategoryPicker({ label, categories, value, onChange, tint = C.glow, onCreate }: {
  label: string;
  categories: Category[];
  value: number | null;
  onChange: (id: number | null) => void;
  tint?: string;
  onCreate?: () => void;
}) {
  return (
    <View>
      <Label hint={categories.find((c) => c.id === value)?.name}>{label}</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
        {categories.map((c) => {
          const on = c.id === value;
          return (
            <Press key={c.id} onPress={() => onChange(on ? null : c.id)} style={[styles.tile, on && { backgroundColor: tint + '1a', borderColor: tint }]} scaleTo={0.93}>
              <View style={[styles.tileIcon, on && { backgroundColor: tint }]}>
                <Icon name={catIcon(c.name)} size={21} color={on ? C.bg : C.textDim} strokeWidth={1.9} />
              </View>
              <T size={11} weight={on ? 'semi' : 'medium'} color={on ? C.text : C.textDim} numberOfLines={2} style={styles.tileLabel}>
                {c.name}
              </T>
            </Press>
          );
        })}
        {onCreate && (
          <Press onPress={onCreate} style={styles.tile} scaleTo={0.93}>
            <View style={[styles.tileIcon, styles.tileNew]}>
              <Icon name="plus" size={20} color={C.glow} />
            </View>
            <T size={11} weight="medium" color={C.glow} style={styles.tileLabel}>
              Nueva
            </T>
          </Press>
        )}
        <View style={{ width: 16 }} />
      </ScrollView>
    </View>
  );
}

export function SwitchField({ title, hint, value, onChange }: { title: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <T weight="medium">{title}</T>
        {hint && (
          <T size={12} color={C.textMute}>
            {hint}
          </T>
        )}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: C.line, true: C.brand }} thumbColor={value ? '#fff' : C.textDim} />
    </View>
  );
}

/** Tarjeta de resumen (p. ej. "Te quedan 17 cuotas · $5,2 M"). */
export const Summary = ({ children }: { children: ReactNode }) => <View style={styles.summary}>{children}</View>;

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 6 },
  round: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 54, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, color: C.text, fontFamily: F.medium, fontSize: 16 },
  moneyWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moneyInput: { flex: 1, color: C.text, fontFamily: F.monoBold, fontSize: 22, paddingVertical: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 54, height: 54, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  stepValue: { flex: 1, height: 54, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, textAlign: 'center', color: C.text, fontFamily: F.monoBold, fontSize: 22 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  day: { width: '12.6%', height: 40, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: C.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, height: 42, borderRadius: R.full, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, justifyContent: 'center' },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  tile: { width: 78, paddingVertical: 10, paddingHorizontal: 4, borderRadius: R.lg, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center', gap: 7 },
  tileIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' },
  tileNew: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.glow, borderStyle: 'dashed' },
  tileLabel: { textAlign: 'center', lineHeight: 14, minHeight: 28 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: R.md, padding: 14, borderWidth: 1, borderColor: C.lineSoft },
  summary: { backgroundColor: C.accentSoft, borderRadius: R.md, padding: 14, borderWidth: 1, borderColor: C.heroBorder, gap: 4 },
});
