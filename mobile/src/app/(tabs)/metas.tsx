import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { NewCard, SectionHead } from '@/components/Section';
import { Bar, Card, ErrorLine, Money, Press, Ring, T } from '@/components/ui';
import { invalidate, useApi, type Budget, type Goal } from '@/lib/api';
import { parseDate, short } from '@/lib/format';
import { goEdit } from '@/lib/nav';
import { C, R } from '@/lib/theme';

function monthsLeft(date: string | null) {
  if (!date) return null;
  const d = parseDate(date);
  const n = new Date();
  return Math.max(0, (d.getFullYear() - n.getFullYear()) * 12 + d.getMonth() - n.getMonth());
}

export default function Metas() {
  const goals = useApi<Goal[]>('/goals');
  const budgets = useApi<Budget[]>('/budgets');

  const saved = (goals.data ?? []).reduce((s, g) => s + g.current_amount, 0);
  const target = (goals.data ?? []).reduce((s, g) => s + g.target_amount, 0);
  const sortedBudgets = [...(budgets.data ?? [])].sort((a, b) => b.pct - a.pct);

  return (
    <Screen kicker="Ahorro y límites" title="Metas" refreshing={goals.loading && !!goals.data} onRefresh={invalidate}>
      {goals.error && !goals.data && <ErrorLine msg={goals.error} onRetry={invalidate} />}

      {target > 0 && (
        <Card style={styles.total}>
          <Ring pct={saved / target} size={70} stroke={8}>
            <T mono weight="bold" size={14}>
              {Math.round((saved / target) * 100)}%
            </T>
          </Ring>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={12} color={C.textMute}>
              Ahorrado en todas tus metas
            </T>
            <Money value={saved} size={24} />
            <T size={12} color={C.textDim}>
              de {short(target)}
            </T>
          </View>
        </Card>
      )}

      <SectionHead title="Metas de ahorro" action="Nueva meta" onPress={() => goEdit('meta')} first />
      <View style={{ gap: 10 }}>
        {goals.data && goals.data.length === 0 && (
          <NewCard title="Crea tu primera meta" hint="Un viaje, un fondo de emergencia, la moto… y ve abonándole." onPress={() => goEdit('meta')} />
        )}
        {(goals.data ?? []).map((g, i) => {
          const done = g.progress >= 100;
          const ml = monthsLeft(g.target_date);
          const perMonth = ml && !done ? g.remaining / Math.max(1, ml) : 0;
          return (
            <Animated.View key={g.id} entering={FadeInDown.delay(i * 50).duration(350)}>
              <Press onPress={() => goEdit('meta', { id: g.id })} haptic={false} scaleTo={0.98}>
              <Card style={[{ gap: 12 }, done && { borderColor: C.accent }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T weight="semi" size={16} numberOfLines={1}>
                      {g.name}
                    </T>
                    <T size={12} color={C.textMute}>
                      {done ? '¡Meta cumplida!' : perMonth ? `${short(perMonth)} / mes para llegar a tiempo` : `Faltan ${short(g.remaining)}`}
                    </T>
                  </View>
                  {!done && (
                    <Press onPress={() => router.push({ pathname: '/abonar', params: { goal: g.id, name: g.name, remaining: g.remaining } })} style={styles.add}>
                      <Icon name="plus" size={16} strokeWidth={2.4} />
                      <T size={13} weight="semi">
                        Abonar
                      </T>
                    </Press>
                  )}
                </View>
                <Bar pct={g.progress / 100} height={8} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Money value={g.current_amount} size={14} color={C.income} />
                  <T mono size={13} color={C.textMute}>
                    {short(g.target_amount)}
                  </T>
                </View>
              </Card>
              </Press>
            </Animated.View>
          );
        })}
      </View>

      <SectionHead title="Presupuestos del mes" action="Nuevo" onPress={() => goEdit('presupuesto')} />
      {budgets.data && sortedBudgets.length === 0 && (
        <NewCard title="Ponle límite a una categoría" hint="Te avisamos al llegar al 80 % y si te pasas." onPress={() => goEdit('presupuesto')} />
      )}
      {sortedBudgets.length > 0 && (
        <>
          <Card style={{ gap: 16 }}>
            {sortedBudgets.map((b) => {
              const over = b.pct >= 100;
              const near = b.pct >= 80;
              return (
                <Press key={b.id} onPress={() => goEdit('presupuesto', { id: b.id })} haptic={false} scaleTo={0.98} style={{ gap: 7 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <T weight="medium" size={14}>
                      {b.category.name}
                    </T>
                    <T mono size={12} color={over ? C.expense : near ? C.warn : C.textDim}>
                      {short(b.spent)} / {short(b.amount)}
                    </T>
                  </View>
                  <Bar pct={b.pct / 100} color={over ? C.expense : near ? C.warn : C.brand} />
                  <T size={11} color={over ? C.expense : C.textMute}>
                    {over ? `Te pasaste por ${short(-b.remaining)}` : `Quedan ${short(b.remaining)}`}
                  </T>
                </Press>
              );
            })}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent, paddingHorizontal: 12, height: 34, borderRadius: R.full },
});
