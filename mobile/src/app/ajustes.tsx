import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Card, Kicker, Press, T, tap } from '@/components/ui';
import { BASE, useApi, type Debt, type Recurring } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { bioAvailable, bioLabel, getCreds, isBioEnabled, setBioEnabled, verify, type BioKind } from '@/lib/biometric';
import { ask, toast } from '@/lib/dialog';
import { DEFAULT_PREFS, ensurePermission, getPrefs, savePrefs, syncReminders, type Prefs } from '@/lib/notify';
import { C, R } from '@/lib/theme';

const HOURS: [number, number][] = [
  [19, 0],
  [20, 30],
  [21, 30],
  [22, 30],
];
const LEADS = [7, 5, 3];
const hh = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

export default function Ajustes() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [scheduled, setScheduled] = useState(0);
  const [bioKind, setBioKind] = useState<BioKind>(null);
  const [bioOn, setBioOn] = useState(false);
  const rec = useApi<Recurring[]>('/recurring-expenses');
  const debts = useApi<Debt[]>('/debts');

  const refreshCount = () =>
    Platform.OS === 'web' ? Promise.resolve() : Notifications.getAllScheduledNotificationsAsync().then((l) => setScheduled(l.length));

  useEffect(() => {
    getPrefs().then(setPrefs);
    Notifications.getPermissionsAsync().then((p) => setGranted(p.granted));
    refreshCount();
    bioAvailable().then(setBioKind);
    isBioEnabled().then(setBioOn);
  }, []);

  const update = async (patch: Partial<Prefs>) => {
    tap();
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await savePrefs(next);
    if (rec.data && debts.data) await syncReminders(rec.data, debts.data);
    refreshCount();
  };

  const askPermission = async () => {
    const ok = await ensurePermission();
    setGranted(ok);
    if (ok && rec.data && debts.data) {
      await syncReminders(rec.data, debts.data);
      refreshCount();
    } else if (!ok) Linking.openSettings();
  };

  const test = async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Faltan 3 días: Arriendo', body: 'Gasto fijo · $1.200.000 · vence el 5 oct. Así se ven tus avisos.', data: { url: '/pagos' }, categoryIdentifier: 'pago', color: C.notify },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'pagos' },
    });
    toast('Llega en 3 segundos', 'info');
  };

  const toggleBio = async (on: boolean) => {
    tap();
    if (!bioKind) return;
    const label = bioLabel(bioKind);
    if (!on) {
      await setBioEnabled(false);
      setBioOn(false);
      return toast(`Ingreso con ${label} desactivado`, 'info');
    }
    if (!(await getCreds())) {
      return toast('Cierra sesión y entra una vez con tu contraseña para activarlo', 'info');
    }
    if (!(await verify(`Activa el ingreso con ${label}`))) return;
    await setBioEnabled(true);
    setBioOn(true);
    toast(`Ingreso con ${label} activado`, 'ok');
  };

  const confirmLogout = () =>
    ask({
      title: 'Cerrar sesión',
      message: 'Se borrarán los recordatorios programados en este teléfono.',
      tone: 'danger',
      icon: 'logout',
      confirmText: 'Salir',
      onConfirm: logout,
    });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}>
      <View style={styles.top}>
        <Press onPress={() => router.back()} style={styles.round}>
          <Icon name="chevronLeft" size={20} color={C.textDim} />
        </Press>
        <T size={17} weight="semi">
          Ajustes
        </T>
        <View style={{ width: 42 }} />
      </View>

      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <T size={20} weight="bold">
            {(user?.name ?? '?').slice(0, 1).toUpperCase()}
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T weight="semi" size={16}>
            {user?.name}
          </T>
          <T size={13} color={C.textMute}>
            {user?.email}
          </T>
        </View>
      </Card>

      <View style={styles.sectionHead}>
        <Kicker>Notificaciones</Kicker>
        {granted && (
          <T size={12} color={C.textMute}>
            {scheduled} programadas
          </T>
        )}
      </View>

      {granted === false && (
        <Card style={{ borderColor: C.warn, gap: 10, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="bell" size={20} color={C.warn} />
            <T style={{ flex: 1 }} color={C.textDim}>
              Las notificaciones están apagadas. Actívalas para no perderte un pago.
            </T>
          </View>
          <Button title="Activar notificaciones" onPress={askPermission} />
        </Card>
      )}

      <Card style={{ paddingVertical: 4 }}>
        <Row title="Cuotas de deudas" hint="Qué cuota vence, cuánto y cuándo" value={prefs.debts} onChange={(v) => update({ debts: v })} />
        <Row title="Gastos fijos" hint="Arriendo, servicios, suscripciones…" value={prefs.fixed} onChange={(v) => update({ fixed: v })} divider />
        {(prefs.debts || prefs.fixed) && (
          <View style={styles.leadBox}>
            <T weight="medium">Aviso anticipado</T>
            <T size={12} color={C.textMute}>
              Además de la víspera (7 p. m.) y el mismo día (8 a. m.). Puedes elegir varios.
            </T>
            <View style={styles.hours}>
              {LEADS.map((n) => {
                const on = prefs.leadDays.includes(n);
                return (
                  <Press
                    key={n}
                    onPress={() => update({ leadDays: on ? prefs.leadDays.filter((x) => x !== n) : [...prefs.leadDays, n] })}
                    style={[styles.hour, on && styles.hourOn]}>
                    <T size={13} weight={on ? 'semi' : 'regular'} color={on ? C.text : C.textMute}>
                      {n} días antes
                    </T>
                  </Press>
                );
              })}
            </View>
          </View>
        )}
        {(prefs.debts || prefs.fixed) && (
          <Row title="Lo que pagas esta semana" hint="Los lunes a las 7:30 a. m., con la lista de vencimientos" value={prefs.weekAhead} onChange={(v) => update({ weekAhead: v })} divider />
        )}
      </Card>

      <View style={styles.sectionHead}>
        <Kicker>Hábitos</Kicker>
      </View>
      <Card style={{ paddingVertical: 4 }}>
        <Row title="Recordatorio diario" hint="Para anotar lo que gastaste en el día" value={prefs.daily} onChange={(v) => update({ daily: v })} />
        {prefs.daily && (
          <View style={styles.hours}>
            {HOURS.map(([h, m]) => {
              const on = prefs.dailyHour === h && prefs.dailyMinute === m;
              return (
                <Press key={hh(h, m)} onPress={() => update({ dailyHour: h, dailyMinute: m })} style={[styles.hour, on && styles.hourOn]}>
                  <T mono size={13} weight={on ? 'semi' : 'regular'} color={on ? C.text : C.textMute}>
                    {hh(h, m)}
                  </T>
                </Press>
              );
            })}
          </View>
        )}
        <Row title="Tu semana en números" hint="Domingo a las 7 p. m." value={prefs.weekly} onChange={(v) => update({ weekly: v })} divider />
        <Row title="Alertas de presupuesto" hint="Al llegar al 80 % y al pasarte" value={prefs.budget} onChange={(v) => update({ budget: v })} divider />
      </Card>

      {granted && (
        <Press onPress={test} style={styles.testBtn}>
          <Icon name="bell" size={16} color={C.glow} />
          <T size={14} weight="semi" color={C.glow}>
            Enviar notificación de prueba
          </T>
        </Press>
      )}

      {bioKind && (
        <>
          <View style={styles.sectionHead}>
            <Kicker>Seguridad</Kicker>
          </View>
          <Card style={{ paddingVertical: 4 }}>
            <Row
              title={`Entrar con ${bioLabel(bioKind)}`}
              hint="Abre la app sin escribir la contraseña. Se bloquea tras 2 min fuera."
              value={bioOn}
              onChange={toggleBio}
            />
          </Card>
        </>
      )}

      <View style={styles.sectionHead}>
        <Kicker>Cuenta</Kicker>
      </View>
      <Button title="Cerrar sesión" variant="danger" onPress={confirmLogout} icon={<Icon name="logout" size={18} color={C.expense} />} />

      <T size={11} color={C.textMute} style={{ textAlign: 'center', marginTop: 24 }}>
        MyFinces {Constants.expoConfig?.version} · {BASE.replace(/^https?:\/\//, '')}
      </T>
    </ScrollView>
  );
}

function Row({ title, hint, value, onChange, divider }: { title: string; hint: string; value: boolean; onChange: (v: boolean) => void; divider?: boolean }) {
  return (
    <View style={[styles.row, divider && { borderTopWidth: 1, borderTopColor: C.lineSoft }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T weight="medium">{title}</T>
        <T size={12} color={C.textMute}>
          {hint}
        </T>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: C.line, true: '#5c5c5c' }} thumbColor={value ? C.glow : C.textDim} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  round: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 50, height: 50, borderRadius: 17, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 10, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  hours: { flexDirection: 'row', gap: 6, paddingBottom: 14 },
  leadBox: { borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: 14, gap: 4 },
  hour: { flex: 1, height: 34, borderRadius: R.sm, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' },
  hourOn: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, marginTop: 10 },
});
