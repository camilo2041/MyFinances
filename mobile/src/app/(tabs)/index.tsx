import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Trend } from '@/components/Trend';
import { openTx, TxRow } from '@/components/TxRow';
import { Card, CountUp, Empty, ErrorLine, Kicker, Money, Press, Ring, T } from '@/components/ui';
import { invalidate, useApi, type Dashboard, type Debt, type Goal, type Recurring, type TrendPoint } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { catIcon } from '@/lib/catIcon';
import { currentPeriod, debtDue, dueInfo, greeting, periodLabel, short } from '@/lib/format';
import { storage } from '@/lib/storage';
import { C, catColor, R } from '@/lib/theme';

type Upcoming = { key: string; name: string; amount: number; days: number; overdue?: boolean; kind: 'fijo' | 'deuda'; icon: IconName };

const HIDE_KEY = 'myfinces_hide_amounts';

const ACTIONS: { label: string; icon: IconName; go: () => void; primary?: boolean }[] = [
  { label: 'Gasto', icon: 'arrowDown', go: () => router.push({ pathname: '/nuevo', params: { kind: 'egreso' } }), primary: true },
  { label: 'Voz', icon: 'mic', go: () => router.push({ pathname: '/nuevo', params: { voz: '1' } }) },
  { label: 'Ingreso', icon: 'arrowUp', go: () => router.push({ pathname: '/nuevo', params: { kind: 'ingreso' } }) },
  { label: 'Pagar', icon: 'calendar', go: () => router.navigate('/pagos') },
  { label: 'Metas', icon: 'piggy', go: () => router.navigate('/metas') },
];

export default function Home() {
  const { user } = useAuth();
  const dash = useApi<Dashboard>('/dashboard');
  const trend = useApi<TrendPoint[]>('/dashboard/trend?months=6');
  const recurring = useApi<Recurring[]>('/recurring-expenses');
  const debts = useApi<Debt[]>('/debts');
  const goals = useApi<Goal[]>('/goals');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    storage.get(HIDE_KEY).then((v) => setHidden(v === '1')).catch(() => {});
  }, []);
  const toggleHidden = () => {
    setHidden((h) => {
      storage.set(HIDE_KEY, h ? '0' : '1').catch(() => {});
      return !h;
    });
  };

  const upcoming = useMemo<Upcoming[]>(() => {
    const out: Upcoming[] = [];
    for (const r of recurring.data ?? []) {
      if (!r.active || r.paid_this_period) continue;
      const { days, overdue } = dueInfo(r.due_day);
      out.push({ key: `r${r.id}`, name: r.name, amount: r.amount, days, overdue, kind: 'fijo', icon: catIcon(r.category?.name ?? r.name) });
    }
    for (const d of debts.data ?? []) {
      if (!d.active || d.remaining_installments <= 0 || d.paid_this_period) continue;
      const due = debtDue(d.due_day, d.overdue, d.days_overdue);
      out.push({ key: `d${d.id}`, name: d.name, amount: d.installment_amount, days: due.days, overdue: due.overdue, kind: 'deuda', icon: 'bank' });
    }
    return out.sort((a, b) => a.days - b.days);
  }, [recurring.data, debts.data]);

  const d = dash.data;
  const firstName = user?.name?.split(' ')[0] ?? '';
  const pending = upcoming.reduce((s, u) => s + u.amount, 0);

  // Comparación con el mes pasado (píldora de la tarjeta).
  const prev = trend.data && trend.data.length >= 2 ? trend.data[trend.data.length - 2] : null;
  const delta = d && prev ? d.balance - prev.balance : null;

  // Meta principal: la más avanzada sin cumplir (o la primera).
  const goal = useMemo(() => {
    const list = goals.data ?? [];
    return [...list].filter((g) => g.progress < 100).sort((a, b) => b.progress - a.progress)[0] ?? list[0] ?? null;
  }, [goals.data]);

  const cats = (d?.expense_by_category ?? []).slice(0, 4);

  return (
    <Screen
      title=""
      refreshing={dash.loading && !!d}
      onRefresh={invalidate}
      header={
        <View style={styles.header}>
          <View style={styles.avatar}>
            <T size={18} weight="bold" color={C.onAccent}>
              {(firstName || '?').slice(0, 1).toUpperCase()}
            </T>
          </View>
          <View style={{ flex: 1 }}>
            <T size={12} color={C.textMute}>
              {greeting()} · {periodLabel(d?.period ?? currentPeriod())}
            </T>
            <T size={21} weight="bold" style={{ letterSpacing: -0.5 }} numberOfLines={1}>
              Hola{firstName ? `, ${firstName}` : ''}
            </T>
          </View>
          <Press onPress={() => router.push('/ajustes')} style={styles.iconBtn}>
            <Icon name="settings" size={20} color={C.textDim} />
          </Press>
        </View>
      }>
      {dash.error && !d && <ErrorLine msg={dash.error} onRetry={dash.reload} />}

      {/* ── Tarjeta de saldo ── */}
      <Animated.View entering={FadeInDown.duration(450)}>
        <LinearGradient colors={['#5b4ee0', '#3a2fa6', '#241d63']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          {/* Aros decorativos */}
          <View style={[styles.hoop, { width: 260, height: 260, right: -110, top: -120 }]} />
          <View style={[styles.hoop, { width: 180, height: 180, right: -40, bottom: -110 }]} />

          <View style={styles.cardTop}>
            <Press onPress={toggleHidden} style={styles.eyeRow} scaleTo={0.97}>
              <T size={13} weight="medium" color="rgba(255,255,255,0.75)">
                Te queda este mes
              </T>
              <Icon name={hidden ? 'eyeOff' : 'eye'} size={16} color="rgba(255,255,255,0.75)" />
            </Press>
            <View style={styles.brandMark}>
              <T size={13} weight="bold" color="#fff">
                m<T size={13} weight="bold" color="#c4b5fd">+</T>
              </T>
            </View>
          </View>

          <View style={{ marginTop: 6 }}>
            <CountUp value={d?.balance ?? 0} size={36} color={(d?.balance ?? 0) < 0 ? '#ffb4ab' : '#fff'} hidden={hidden} />
          </View>

          {delta !== null && !hidden && (
            <View style={styles.deltaPill}>
              <Icon name={delta >= 0 ? 'arrowUp' : 'arrowDown'} size={12} color={C.onAccent} strokeWidth={2.6} />
              <T size={11.5} weight="semi" color={C.onAccent}>
                {delta >= 0 ? '+' : '−'}
                {short(Math.abs(delta))} vs mes pasado
              </T>
            </View>
          )}

          <View style={styles.cardBottom}>
            <View style={{ gap: 2 }}>
              <T size={11} color="rgba(255,255,255,0.6)">
                Entró
              </T>
              <Money value={d?.income ?? 0} size={15} color="#fff" dim="rgba(255,255,255,0.55)" hidden={hidden} />
            </View>
            <View style={{ gap: 2 }}>
              <T size={11} color="rgba(255,255,255,0.6)">
                Salió
              </T>
              <Money value={d?.expense ?? 0} size={15} color="#fff" dim="rgba(255,255,255,0.55)" hidden={hidden} />
            </View>
            <T mono size={12} color="rgba(255,255,255,0.55)" style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
              •••• {(d?.period ?? currentPeriod()).replace('-', '/')}
            </T>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── Acciones rápidas ── */}
      <Animated.View entering={FadeInDown.delay(60).duration(450)} style={styles.actions}>
        {ACTIONS.map((a) => (
          <Press key={a.label} onPress={a.go} style={styles.action} scaleTo={0.92}>
            <View style={[styles.actionIcon, a.primary && styles.actionPrimary]}>
              <Icon name={a.icon} size={21} color={a.primary ? C.onAccent : C.text} strokeWidth={2} />
            </View>
            <T size={12} weight="medium" color={C.textDim}>
              {a.label}
            </T>
          </Press>
        ))}
      </Animated.View>

      {/* ── Por pagar ── */}
      <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.section}>
        <View style={styles.sectionHead}>
          <T size={17} weight="bold">
            Por pagar
          </T>
          <Press onPress={() => router.navigate('/pagos')}>
            <T size={13} weight="semi" color={C.glow}>
              {pending > 0 && !hidden ? `${short(pending)} · Ver todo` : 'Ver todo'}
            </T>
          </Press>
        </View>
        {upcoming.length === 0 ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.billIcon, { backgroundColor: C.income + '22' }]}>
              <Icon name="check" size={18} color={C.income} strokeWidth={2.4} />
            </View>
            <T color={C.textDim} style={{ flex: 1 }}>
              Estás al día con fijos y cuotas este mes.
            </T>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16 }}>
            {upcoming.map((u) => {
              const col = u.overdue ? C.expense : u.days <= 3 ? C.warn : C.glow;
              return (
                <Press key={u.key} onPress={() => router.navigate('/pagos')} style={styles.bill} scaleTo={0.96}>
                  <View style={[styles.billIcon, { backgroundColor: col + '22' }]}>
                    <Icon name={u.icon} size={19} color={col} strokeWidth={1.9} />
                  </View>
                  <T size={13} weight="semi" numberOfLines={1} style={{ marginTop: 10 }}>
                    {u.name}
                  </T>
                  <Money value={u.amount} size={13} color={C.textDim} hidden={hidden} />
                  <T size={11} weight="semi" color={col} style={{ marginTop: 6 }}>
                    {u.overdue ? `${-u.days} d tarde` : u.days === 0 ? 'Hoy' : u.days === 1 ? 'Mañana' : `En ${u.days} días`}
                  </T>
                </Press>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {/* ── Meta + En qué se va ── */}
      <Animated.View entering={FadeInDown.delay(180).duration(450)} style={[styles.section, styles.split]}>
        <Press onPress={() => router.navigate('/metas')} style={{ flex: 1 }} scaleTo={0.97}>
          <LinearGradient colors={[C.heroFrom, C.surface]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.goalCard}>
            <Kicker color={C.glow}>Meta de ahorro</Kicker>
            {goal ? (
              <>
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                  <Ring pct={goal.progress / 100} size={84} stroke={9} track={C.hairline}>
                    <T mono weight="bold" size={17}>
                      {Math.round(goal.progress)}%
                    </T>
                  </Ring>
                </View>
                <T weight="semi" numberOfLines={1}>
                  {goal.name}
                </T>
                <T size={11.5} color={C.textMute} numberOfLines={1}>
                  {hidden ? '••••' : short(goal.current_amount)} de {hidden ? '••••' : short(goal.target_amount)}
                </T>
              </>
            ) : (
              <T size={13} color={C.textDim} style={{ marginTop: 12 }}>
                Aún no tienes metas. Créalas en la web y abónales desde aquí.
              </T>
            )}
          </LinearGradient>
        </Press>

        <View style={styles.spendCard}>
          <Kicker>En qué se va</Kicker>
          {cats.length === 0 ? (
            <T size={13} color={C.textDim} style={{ marginTop: 12 }}>
              Sin gastos este mes.
            </T>
          ) : (
            <View style={styles.grid}>
              {cats.map((c) => {
                const col = catColor(c.category_id);
                return (
                  <View key={c.name} style={styles.gridItem}>
                    <View style={[styles.gridIcon, { backgroundColor: col + '24' }]}>
                      <Icon name={catIcon(c.name)} size={18} color={col} strokeWidth={1.9} />
                    </View>
                    <T size={11} weight="medium" color={C.textDim} numberOfLines={1}>
                      {c.name.split(' /')[0]}
                    </T>
                    <T mono size={11}>
                      {d && d.expense > 0 ? `${Math.round((c.total / d.expense) * 100)}%` : ''}
                    </T>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── Recientes ── */}
      <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.section}>
        <View style={styles.sectionHead}>
          <T size={17} weight="bold">
            Movimientos recientes
          </T>
          <Press onPress={() => router.navigate('/movimientos')}>
            <T size={13} weight="semi" color={C.glow}>
              Ver todo
            </T>
          </Press>
        </View>
        <Card style={{ paddingVertical: 4 }}>
          {d && d.recent.length === 0 && <Empty title="Aún no hay movimientos" hint="Toca + para registrar el primero." />}
          {d?.recent.slice(0, 5).map((tx, i) => (
            <View key={tx.id} style={i > 0 ? styles.divider : undefined}>
              <TxRow tx={tx} onPress={() => openTx(tx)} />
            </View>
          ))}
        </Card>
      </Animated.View>

      {/* ── Tendencia ── */}
      {trend.data && trend.data.length > 0 && (
        <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.section}>
          <View style={styles.sectionHead}>
            <T size={17} weight="bold">
              Seis meses
            </T>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Legend color={C.income} label="entró" />
              <Legend color={C.expense} label="salió" />
            </View>
          </View>
          <Card>
            <Trend data={trend.data} />
          </Card>
        </Animated.View>
      )}
    </Screen>
  );
}

const Legend = ({ color, label }: { color: string; label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }} />
    <T size={12} color={C.textMute}>
      {label}
    </T>
  </View>
);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.brand },
  iconBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineSoft, alignItems: 'center', justifyContent: 'center' },

  card: { borderRadius: R.xl, padding: 20, overflow: 'hidden', minHeight: 196 },
  hoop: { position: 'absolute', borderRadius: 999, borderWidth: 26, borderColor: 'rgba(255,255,255,0.06)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  brandMark: { width: 34, height: 26, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full, marginTop: 10 },
  cardBottom: { flexDirection: 'row', gap: 22, marginTop: 20 },

  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 2 },
  action: { alignItems: 'center', gap: 7, width: 62 },
  actionIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: C.accent, borderColor: C.accent },

  section: { marginTop: 26 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bill: { width: 126, backgroundColor: C.surface, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.lineSoft, gap: 2 },
  billIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  split: { flexDirection: 'row', gap: 10 },
  goalCard: { borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.heroBorder, minHeight: 210 },
  spendCard: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.lineSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 12 },
  gridItem: { width: '50%', alignItems: 'center', gap: 4 },
  gridIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  divider: { borderTopWidth: 1, borderTopColor: C.lineSoft },
});
