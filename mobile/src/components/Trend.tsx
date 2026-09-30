import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { TrendPoint } from '@/lib/api';
import { monthShort, short } from '@/lib/format';
import { C } from '@/lib/theme';

import { Press, T } from './ui';

/** Pares de barras entró/salió por mes; tocar un mes muestra su ahorro. */
export function Trend({ data }: { data: TrendPoint[] }) {
  const [sel, setSel] = useState(data.length - 1);
  const H = 110;
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const cur = data[sel] ?? data[data.length - 1];

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <T size={13} color={C.textDim}>
          {cur ? `Ahorro en ${monthShort(cur.period)}` : ''}
        </T>
        {cur && (
          <T mono weight="bold" size={16} color={cur.balance >= 0 ? C.income : C.expense}>
            {cur.balance >= 0 ? '+' : ''}
            {short(cur.balance)}
          </T>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {data.map((d, i) => {
          const hi = Math.max(3, (d.income / max) * H);
          const he = Math.max(3, (d.expense / max) * H);
          const on = i === sel;
          return (
            <Press key={d.period} onPress={() => setSel(i)} style={{ alignItems: 'center', gap: 8 }} scaleTo={0.94}>
              <Svg width={26} height={H}>
                <Rect x={0} y={H - hi} width={11} height={hi} rx={4} fill={on ? C.income : C.income + '38'} />
                <Rect x={15} y={H - he} width={11} height={he} rx={4} fill={on ? C.expense : C.expenseSoft} />
              </Svg>
              <T size={11} weight={on ? 'semi' : 'regular'} color={on ? C.text : C.textMute}>
                {monthShort(d.period)}
              </T>
            </Press>
          );
        })}
      </View>
    </View>
  );
}
