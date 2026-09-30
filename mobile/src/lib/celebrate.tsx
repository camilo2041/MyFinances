import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { T } from '@/components/ui';

import { C, CAT } from './theme';

// Lluvia de destellos índigo para los logros (deuda saldada, meta cumplida…).
let emit: ((msg: string) => void) | null = null;
export const celebrate = (msg: string) => emit?.(msg);

const { width: W, height: H } = Dimensions.get('window');

function Spark({ i }: { i: number }) {
  const y = useSharedValue(-40);
  const x0 = Math.random() * W;
  const drift = (Math.random() - 0.5) * 140;
  const size = 6 + Math.random() * 8;
  const rot = Math.random() * 360;
  useEffect(() => {
    y.value = withDelay(i * 25, withTiming(H + 40, { duration: 1600 + Math.random() * 900, easing: Easing.in(Easing.quad) }));
  }, [i, y]);
  const a = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { translateX: x0 + (drift * y.value) / H }, { rotate: `${rot + y.value / 2}deg` }],
  }));
  return <Animated.View style={[styles.spark, { width: size, height: size * 0.45, backgroundColor: CAT[i % CAT.length] }, a]} />;
}

export function CelebrateLayer() {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null);
  useEffect(() => {
    emit = (text) => setMsg({ text, id: Date.now() });
    return () => {
      emit = null;
    };
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} key={msg.id}>
      {Array.from({ length: 36 }, (_, i) => (
        <Spark key={i} i={i} />
      ))}
      <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut} style={styles.toast}>
        <T weight="bold" size={17}>
          {msg.text}
        </T>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  spark: { position: 'absolute', top: 0, left: 0, borderRadius: 2 },
  toast: {
    position: 'absolute',
    top: H * 0.38,
    alignSelf: 'center',
    backgroundColor: C.raised,
    borderColor: C.accent,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
  },
});
