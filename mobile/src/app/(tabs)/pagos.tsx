import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { NewCard } from '@/components/Section';
import { Bar, Card, ErrorLine, Money, Press, Segmented, T, success } from '@/components/ui';
import { api, invalidate, useApi, type Debt, type Recurring } from '@/lib/api';
import { celebrate } from '@/lib/celebrate';
import { ask, toast } from '@/lib/dialog';
import { debtDue, dueInfo, money, short } from '@/lib/format';
import { goEdit } from '@/lib/nav';
import { C, R } from '@/lib/theme';

type Tab = 'fijos' | 'deudas';

function dueText(dueDay: number, paid: boolean) {
  if (paid) return 'Pagado este mes';
  const { days } = dueInfo(dueDay);
  if (days < 0) return `Venció el ${dueDay} · hace ${-days} d`;
  return days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Vence el ${dueDay} · en ${days} días`;
}

function debtDueText(d: Debt) {
  const { days, overdue } = debtDue(d.due_day, d.overdue, d.days_overdue);
  if (overdue) return `Venció el ${d.due_day} · hace ${-days} d`;
  return days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Vence el ${d.due_day} · en ${days} días`;
}

export default function Pagos() {
  const [tab, setTab] = useState<Tab>('fijos');
  const rec = useApi<Recurring[]>('/recurring-expenses');
  const debts = useApi<Debt[]>('/debts');

  // Activos primero (pendientes antes que pagados); los pausados al final para poder reactivarlos.
  const allFixed = [...(rec.data ?? [])].sort((a, b) => Number(!a.active) - Number(!b.active) || Number(a.paid_this_period) - Number(b.paid_this_period) || a.due_day - b.due_day);
  const recurring = allFixed.filter((r) => r.active);
  const allDebts = (debts.data ?? []).filter((d) => d.remaining_installments > 0).sort((a, b) => Number(!a.active) - Number(!b.active) || Number(b.overdue) - Number(a.overdue) || a.due_day - b.due_day);
  const activeDebts = allDebts.filter((d) => d.active);

  const pendingFixed = recurring.filter((r) => !r.paid_this_period).reduce((s, r) => s + r.amount, 0);
  const paidFixed = recurring.filter((r) => r.paid_this_period).reduce((s, r) => s + r.amount, 0);
  const totalDebt = activeDebts.reduce((s, d) => s + d.remaining_balance, 0);
  const monthlyDebt = activeDebts.reduce((s, d) => s + d.installment_amount, 0);

  const done = (msg: string) => {
    success();
    invalidate();
    toast(msg, 'ok');
  };

  const payFixed = (r: Recurring) =>
    ask({
      title: `Pagar ${r.name}`,
      message: 'Se registra como gasto de hoy en tu libro.',
      icon: 'check',
      rows: [{ label: 'Monto', value: money(r.amount) }],
      confirmText: 'Pagar',
      onConfirm: async () => {
        await api(`/recurring-expenses/${r.id}/pay`, { method: 'POST' });
        done(`${r.name} pagado`);
        if (recurring.filter((x) => !x.paid_this_period).length === 1) celebrate('¡Fijos al día!');
      },
    });

  const payDebt = (d: Debt) =>
    ask({
      title: `Cuota de ${d.name}`,
      icon: 'check',
      rows: [
        { label: 'Cuota', value: `${d.paid_installments + 1} de ${d.total_installments}` },
        { label: 'Monto', value: money(d.installment_amount) },
        { label: 'Saldo después', value: money(Math.max(0, d.remaining_balance - d.installment_amount)) },
      ],
      confirmText: 'Pagar cuota',
      onConfirm: async () => {
        await api(`/debts/${d.id}/pay`, { method: 'POST', body: {} });
        done('Cuota registrada');
        if (d.remaining_installments === 1) celebrate(`¡${d.name} saldada!`);
      },
    });

  const defer = (d: Debt) =>
    ask({
      title: 'Mes libre',
      message: `No pagas la cuota de ${d.name} este mes. Se suma un mes al plazo y se acumula el interés.`,
      icon: 'pause',
      rows: [{ label: 'Te liberas este mes', value: money(d.installment_amount) }],
      confirmText: 'Aplazar cuota',
      onConfirm: async () => {
        await api(`/debts/${d.id}/defer`, { method: 'POST', body: {} });
        done('Cuota aplazada un mes');
      },
    });

  const error = rec.error || debts.error;

  return (
    <Screen
      kicker="Este mes"
      title="Pagos"
      refreshing={(rec.loading || debts.loading) && !!rec.data}
      onRefresh={invalidate}
      right={
        <Press onPress={() => goEdit(tab === 'fijos' ? 'fijo' : 'deuda')} style={styles.addBtn} accessibilityLabel={tab === 'fijos' ? 'Nuevo gasto fijo' : 'Nueva deuda'}>
          <Icon name="plus" size={16} strokeWidth={2.4} color={C.onAccent} />
          <T size={13} weight="semi" color={C.onAccent}>
            {tab === 'fijos' ? 'Fijo' : 'Deuda'}
          </T>
        </Press>
      }>
      {error && !rec.data && <ErrorLine msg={error} onRetry={invalidate} />}

      <View style={styles.summary}>
        {tab === 'fijos' ? (
          <>
            <Stat label="Pendiente" value={pendingFixed} color={pendingFixed > 0 ? C.text : C.income} />
            <Stat label="Ya pagado" value={paidFixed} color={C.income} />
          </>
        ) : (
          <>
            <Stat label="Saldo total" value={totalDebt} />
            <Stat label="Cuotas / mes" value={monthlyDebt} />
          </>
        )}
      </View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'fijos', label: `Fijos · ${recurring.filter((r) => !r.paid_this_period).length}` },
          { key: 'deudas', label: `Deudas · ${activeDebts.length}` },
        ]}
      />

      <View style={{ gap: 10, marginTop: 14 }}>
        {tab === 'fijos' &&
          (allFixed.length === 0 ? (
            <NewCard title="Agrega tu primer gasto fijo" hint="Arriendo, servicios, suscripciones… te avisamos antes de que venzan." onPress={() => goEdit('fijo')} />
          ) : (
            allFixed.map((r, i) => (
              <Animated.View key={r.id} entering={FadeInDown.delay(i * 40).duration(350)}>
                <Press onPress={() => goEdit('fijo', { id: r.id })} haptic={false} scaleTo={0.98}>
                <Card style={[styles.row, (r.paid_this_period || !r.active) && { opacity: 0.55 }]}>
                  <View style={[styles.day, r.paid_this_period && { backgroundColor: C.accentSoft }, !r.paid_this_period && dueInfo(r.due_day).overdue && { backgroundColor: C.expenseSoft }]}>
                    {r.paid_this_period ? (
                      <Icon name="check" size={18} color={C.income} strokeWidth={2.4} />
                    ) : (
                      <T mono weight="bold" size={17} color={dueInfo(r.due_day).overdue ? C.expense : C.text}>
                        {r.due_day}
                      </T>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T weight="semi" numberOfLines={1}>
                      {r.name}
                    </T>
                    <T size={12} color={C.textMute}>
                      {r.active ? dueText(r.due_day, r.paid_this_period) : 'Pausado · toca para reactivarlo'}
                    </T>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Money value={r.amount} size={15} />
                    {r.active && !r.paid_this_period && <SmallBtn label="Pagar" onPress={() => payFixed(r)} />}
                  </View>
                </Card>
                </Press>
              </Animated.View>
            ))
          ))}

        {tab === 'deudas' &&
          (allDebts.length === 0 ? (
            <NewCard title="Sin deudas activas" hint="¿Tienes un crédito, tarjeta o préstamo? Agrégalo y te avisamos de cada cuota." onPress={() => goEdit('deuda')} />
          ) : (
            allDebts.map((d, i) => (
              <Animated.View key={d.id} entering={FadeInDown.delay(i * 50).duration(350)}>
                <Press onPress={() => goEdit('deuda', { id: d.id })} haptic={false} scaleTo={0.98}>
                <Card style={[{ gap: 12 }, d.overdue && d.active && { borderColor: C.expense }, !d.active && { opacity: 0.55 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <T weight="semi" size={16} numberOfLines={1} style={{ flexShrink: 1 }}>
                          {d.name}
                        </T>
                        {d.overdue && (
                          <View style={styles.late}>
                            <T size={10} weight="bold" color={C.expense}>
                              {d.days_overdue} D TARDE
                            </T>
                          </View>
                        )}
                      </View>
                      <T size={12} color={C.textMute}>
                        {d.lender ? `${d.lender} · ` : ''}
                        {!d.active ? 'Pausada · toca para reactivarla' : d.paid_this_period ? 'Cuota del mes pagada' : debtDueText(d)}
                        {d.annual_rate ? ` · ${d.annual_rate}% EA` : ''}
                      </T>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Money value={d.remaining_balance} size={16} />
                      <T size={11} color={C.textMute}>
                        por pagar
                      </T>
                    </View>
                  </View>

                  <View style={{ gap: 6 }}>
                    <Bar pct={d.progress / 100} color={d.overdue ? C.expense : C.brand} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <T size={12} color={C.textDim}>
                        {d.paid_installments} de {d.total_installments} cuotas
                      </T>
                      <T mono size={12} color={C.textDim}>
                        {short(d.installment_amount)} / mes
                      </T>
                    </View>
                  </View>

                  {d.active && !d.paid_this_period && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Press onPress={() => payDebt(d)} style={[styles.action, { backgroundColor: C.accent, flex: 1 }]}>
                        <Icon name="check" size={16} strokeWidth={2.2} color={C.onAccent} />
                        <T weight="semi" size={14} color={C.onAccent}>
                          Pagar cuota
                        </T>
                      </Press>
                      <Press onPress={() => defer(d)} style={[styles.action, { backgroundColor: C.raised }]}>
                        <Icon name="pause" size={16} color={C.textDim} strokeWidth={2.2} />
                        <T weight="medium" size={14} color={C.textDim}>
                          Mes libre
                        </T>
                      </Press>
                    </View>
                  )}
                </Card>
                </Press>
              </Animated.View>
            ))
          ))}
      </View>
    </Screen>
  );
}

const Stat = ({ label, value, color = C.text }: { label: string; value: number; color?: string }) => (
  <View style={{ flex: 1, gap: 4 }}>
    <T size={12} color={C.textMute}>
      {label}
    </T>
    <Money value={value} size={20} color={color} />
  </View>
);

const SmallBtn = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Press onPress={onPress} style={styles.small}>
    <T size={12} weight="semi" color={C.onAccent}>
      {label}
    </T>
  </Press>
);

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 12, backgroundColor: C.surface, borderRadius: R.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.lineSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  day: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent, paddingHorizontal: 14, height: 38, borderRadius: R.full, marginBottom: 4 },
  small: { backgroundColor: C.accent, paddingHorizontal: 14, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  late: { backgroundColor: C.expenseSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  action: { height: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14 },
});
