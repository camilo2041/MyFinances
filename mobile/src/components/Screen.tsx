import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/lib/theme';

import { TAB_BAR_SPACE } from './TabBar';
import { Kicker, T } from './ui';

/** Contenedor de pestaña: cabecera grande + scroll con pull-to-refresh. */
export function Screen({ kicker, title, right, header, children, refreshing = false, onRefresh }: {
  kicker?: string;
  title?: string;
  /** Cabecera propia; reemplaza kicker/título. */
  header?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: TAB_BAR_SPACE + insets.bottom, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.glow} colors={[C.accent]} progressBackgroundColor={C.raised} /> : undefined}>
      {header ?? (
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            {kicker && <Kicker>{kicker}</Kicker>}
            <T size={32} weight="bold" style={{ letterSpacing: -1, marginTop: 2 }}>
              {title}
            </T>
          </View>
          {right}
        </View>
      )}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 18, gap: 12 },
});
