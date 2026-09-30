import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R } from '@/lib/theme';

import { Icon, type IconName } from './Icon';
import { Press, T } from './ui';

const TABS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Inicio' },
  movimientos: { icon: 'list', label: 'Libro' },
  pagos: { icon: 'calendar', label: 'Pagos' },
  metas: { icon: 'target', label: 'Metas' },
};

export const TAB_BAR_SPACE = 104;

// Cápsula flotante: la pestaña activa se expande y muestra su nombre;
// el botón central (+) abre el registro rápido.
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => TABS[r.name]);

  const item = (route: (typeof routes)[number]) => {
    const i = state.routes.indexOf(route);
    const on = state.index === i;
    const t = TABS[route.name];
    return (
      <Animated.View key={route.key} layout={LinearTransition.springify().damping(18)} style={{ flexGrow: on ? 1.6 : 1 }}>
        <Press
          onPress={() => {
            if (!on) navigation.navigate(route.name);
          }}
          style={[styles.tab, on && styles.tabOn]}>
          <Icon name={t.icon} size={21} color={on ? C.onAccent : C.textMute} />
          {on && (
            <Animated.View entering={FadeIn.duration(180)}>
              <T size={13} weight="semi" color={C.onAccent}>
                {t.label}
              </T>
            </Animated.View>
          )}
        </Press>
      </Animated.View>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {routes.slice(0, 2).map(item)}
        <Press onPress={() => router.push('/nuevo')} style={styles.fabWrap} scaleTo={0.9}>
          <LinearGradient colors={[C.brandGlow, C.brand, C.brandDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
            <Icon name="plus" size={26} strokeWidth={2.4} color="#fff" />
          </LinearGradient>
        </Press>
        {routes.slice(2).map(item)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.tabBar,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.line,
    padding: 6,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  tab: { height: 50, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  tabOn: { backgroundColor: C.accent },
  fabWrap: { marginHorizontal: 4 },
  fab: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '0deg' }] },
});
