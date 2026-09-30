import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { TabBar } from '@/components/TabBar';
import { invalidate, useApi, type Debt, type Recurring } from '@/lib/api';
import { bioAvailable, bioLabel, getCreds, isBioEnabled, markAsked, setBioEnabled, verify, wasAsked } from '@/lib/biometric';
import { ask, toast } from '@/lib/dialog';
import { ensurePermission, syncReminders } from '@/lib/notify';
import { C } from '@/lib/theme';

export default function TabsLayout() {
  const recurring = useApi<Recurring[]>('/recurring-expenses');
  const debts = useApi<Debt[]>('/debts');

  // Primera vez: pedir permiso de notificaciones y ofrecer huella / rostro.
  useEffect(() => {
    (async () => {
      await ensurePermission().catch(() => {});
      const kind = await bioAvailable();
      if (!kind || (await wasAsked()) || (await isBioEnabled()) || !(await getCreds())) return;
      await markAsked();
      const label = bioLabel(kind);
      ask({
        title: `¿Entrar con tu ${label}?`,
        message: `La próxima vez abres MyFinces con tu ${label}, sin escribir la contraseña. Puedes cambiarlo en Ajustes.`,
        icon: kind === 'face' ? 'face' : 'fingerprint',
        confirmText: 'Activar',
        cancelText: 'Ahora no',
        onConfirm: async () => {
          if (!(await verify(`Activa el ingreso con ${label}`))) throw new Error('No se pudo verificar. Inténtalo de nuevo.');
          await setBioEnabled(true);
          toast(`Ingreso con ${label} activado`, 'ok');
        },
      });
    })();
  }, []);

  // Cada vez que llegan datos frescos, reprogramar recordatorios.
  useEffect(() => {
    if (recurring.data && debts.data) syncReminders(recurring.data, debts.data).catch(() => {});
  }, [recurring.data, debts.data]);

  // Al volver a la app (p. ej. otro día), refrescar todo.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && invalidate());
    return () => sub.remove();
  }, []);

  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="movimientos" />
      <Tabs.Screen name="pagos" />
      <Tabs.Screen name="metas" />
    </Tabs>
  );
}
