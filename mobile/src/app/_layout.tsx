import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LockScreen } from '@/components/LockScreen';
import { AuthProvider, useAuth } from '@/lib/auth';
import { CelebrateLayer } from '@/lib/celebrate';
import { DialogLayer } from '@/lib/dialog';
import { setupNotifications } from '@/lib/notify';
import { C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, primary: C.accent, text: C.text, border: C.line },
};

function Root() {
  const { user, ready, locked } = useAuth();
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (ready && fontsLoaded) SplashScreen.hideAsync();
  }, [ready, fontsLoaded]);

  useEffect(() => {
    setupNotifications().catch(() => {});
  }, []);

  // Tocar una notificación (o su botón) lleva a la pantalla que corresponde,
  // también si la app estaba cerrada.
  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    const go = (r: Notifications.NotificationResponse | null) => {
      const url = r?.notification.request.content.data?.url;
      if (typeof url === 'string') setTimeout(() => router.push(url as any), 50);
    };
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (!r) return;
      go(r);
      Notifications.clearLastNotificationResponseAsync();
    });
    const sub = Notifications.addNotificationResponseReceivedListener(go);
    return () => sub.remove();
  }, [user]);

  if (!ready || !fontsLoaded) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'fade_from_bottom' }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="nuevo" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="abonar" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="ajustes" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="categorias" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="editar/[tipo]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      {user && locked && <LockScreen />}
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <ThemeProvider value={theme}>
        <AuthProvider>
          <StatusBar style="light" />
          <Root />
          <CelebrateLayer />
          <DialogLayer />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
