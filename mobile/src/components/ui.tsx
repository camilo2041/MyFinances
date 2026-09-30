import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { num } from '@/lib/format';
import { C, F, R } from '@/lib/theme';

export const tap = () => Haptics.selectionAsync().catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const warn = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

export function T({ children, style, size = 15, weight = 'regular', color = C.text, mono, numberOfLines }: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  size?: number;
  weight?: 'regular' | 'medium' | 'semi' | 'bold';
  color?: string;
  mono?: boolean;
  numberOfLines?: number;
}) {
  const fontFamily = mono ? (weight === 'bold' || weight === 'semi' ? F.monoBold : F.mono) : F[weight];
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily, fontSize: size, color, letterSpacing: mono ? -0.3 : 0 }, style]}>
      {children}
    </Text>
  );
}

/** Rótulo pequeño en mayúsculas espaciadas. */
export const Kicker = ({ children, color = C.textMute }: { children: ReactNode; color?: string }) => (
  <T size={11} weight="semi" color={color} style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}>
    {children}
  </T>
);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Botón con rebote al presionar + háptica. */
export function Press({ children, style, onPress, haptic = true, scaleTo = 0.96, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; haptic?: boolean; scaleTo?: number; children: ReactNode }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      style={[style, a]}
      onPressIn={() => (s.value = withSpring(scaleTo, { damping: 15, stiffness: 400 }))}
      onPressOut={() => (s.value = withSpring(1, { damping: 12, stiffness: 300 }))}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}>
      {children}
    </AnimatedPressable>
  );
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? C.accent : variant === 'danger' ? C.expenseSoft : C.raised;
  const fg = variant === 'danger' ? C.expense : variant === 'primary' ? C.onAccent : C.text;
  return (
    <Press onPress={disabled || loading ? undefined : onPress} style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, style]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <T weight="semi" color={fg} size={15}>
            {title}
          </T>
        </>
      )}
    </Press>
  );
}

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[styles.card, style]}>{children}</View>;

/** Cifra en mono con el signo y "$" atenuados: la cantidad es la protagonista. */
export function Money({ value, size = 17, color = C.text, sign, dim = C.textMute, hidden }: { value: number; size?: number; color?: string; sign?: boolean; dim?: string; hidden?: boolean }) {
  const pre = hidden ? '' : value < 0 ? '−' : sign && value > 0 ? '+' : '';
  return (
    <Text style={{ fontFamily: F.monoBold, fontSize: size, color, letterSpacing: -0.5 }}>
      <Text style={{ color: dim, fontSize: size * 0.72 }}>{pre}$</Text>
      {hidden ? '••••••' : num(value)}
    </Text>
  );
}

/** Contador animado (cuenta hasta el valor al montar / cambiar). */
export function CountUp({ value, size = 44, color = C.text, hidden }: { value: number; size?: number; color?: string; hidden?: boolean }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const from = shown;
    const start = Date.now();
    const dur = 700;
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * e);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <Money value={Math.round(shown)} size={size} color={color} hidden={hidden} dim={C.textDim} />;
}

/** Anillo de progreso con degradado índigo. */
export function Ring({ pct, size = 64, stroke = 7, color = C.brand, track = C.lineSoft, children }: { pct: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.glow} />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {p > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color === C.brand ? 'url(#rg)' : color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - p)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

/** Barra de progreso que crece al montar. */
export function Bar({ pct, color = C.brand, height = 6 }: { pct: number; color?: string; height?: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(1, pct)), { duration: 650 });
  }, [pct, w]);
  const a = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: C.lineSoft, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, a]} />
    </View>
  );
}

export function Segmented<K extends string>({ value, options, onChange }: { value: K; options: { key: K; label: string }[]; onChange: (k: K) => void }) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Press key={o.key} onPress={() => onChange(o.key)} style={[styles.segItem, on && { backgroundColor: C.raised }]} scaleTo={0.98}>
            <T weight={on ? 'semi' : 'medium'} size={14} color={on ? C.text : C.textDim}>
              {o.label}
            </T>
          </Press>
        );
      })}
    </View>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, gap: 6 }}>
      <View style={styles.emptyDot} />
      <T weight="semi" color={C.textDim}>
        {title}
      </T>
      {hint && (
        <T size={13} color={C.textMute} style={{ textAlign: 'center', maxWidth: 260 }}>
          {hint}
        </T>
      )}
    </View>
  );
}

export function ErrorLine({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return (
    <Press onPress={onRetry} style={styles.err}>
      <T size={13} color={C.expense}>
        {msg}
        {onRetry ? ' · Reintentar' : ''}
      </T>
    </Press>
  );
}

const styles = StyleSheet.create({
  btn: { height: 54, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: 16, borderWidth: 1, borderColor: C.lineSoft },
  seg: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.md, padding: 4, borderWidth: 1, borderColor: C.lineSoft },
  segItem: { flex: 1, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyDot: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: C.line, borderStyle: 'dashed', marginBottom: 6 },
  err: { backgroundColor: C.expenseSoft, borderRadius: R.sm, padding: 12, marginBottom: 12 },
});
