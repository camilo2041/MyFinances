import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { bioAvailable, bioLabel, skipNextAutoPrompt, type BioKind } from '@/lib/biometric';
import { C } from '@/lib/theme';

import { Icon } from './Icon';
import { Kicker, Press, T } from './ui';

/** Cubre la app hasta que el usuario verifica huella / rostro. */
export function LockScreen() {
  const { user, unlock, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<BioKind>('fingerprint');
  const pulse = useSharedValue(1);

  useEffect(() => {
    bioAvailable().then((k) => k && setKind(k));
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
    // Pide la huella apenas aparece.
    const t = setTimeout(() => unlock(), 350);
    return () => clearTimeout(t);
  }, [pulse, unlock]);

  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2 - pulse.value * 1.4 }));

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(250)} style={[StyleSheet.absoluteFill, styles.root]}>
      <LinearGradient colors={[C.loginGlow, C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0.3, y: 0 }} end={{ x: 0.5, y: 0.7 }} />
      <View style={[styles.body, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 32 }]}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Kicker color={C.glow}>MyFinces</Kicker>
          <T size={28} weight="bold" style={{ letterSpacing: -0.8 }}>
            Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </T>
          <T color={C.textDim}>Tu sesión está protegida</T>
        </View>

        <Press onPress={() => unlock()} style={styles.bioWrap} scaleTo={0.92}>
          <Animated.View style={[styles.ring, ring]} />
          <View style={styles.bio}>
            <Icon name={kind === 'face' ? 'face' : 'fingerprint'} size={46} color={C.text} strokeWidth={1.6} />
          </View>
        </Press>

        <View style={{ alignItems: 'center', gap: 18 }}>
          <T size={15} weight="medium" color={C.textDim}>
            Toca para usar tu {bioLabel(kind)}
          </T>
          <Press
            onPress={() => {
              skipNextAutoPrompt();
              logout();
            }}
            style={{ padding: 8 }}>
            <T size={14} weight="semi" color={C.glow}>
              Entrar con contraseña
            </T>
          </Press>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: C.bg, zIndex: 50 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  bioWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: C.brand },
  bio: { width: 110, height: 110, borderRadius: 38, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
});
