import { fmtCOP, monthLabel } from "@/lib/format";

type Trend = { period: string; income: number; expense: number; balance: number }[];

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const monthsFromNow = (n: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + Math.max(0, Math.round(n)));
  return monthLabel(d.toISOString().slice(0, 7));
};

export type Finding = { n: string; title: string; body: string; tone: "good" | "watch" | "risk" };
export type Rec = { text: string; detail?: string; impact: "Alto" | "Medio" | "Bajo" };
export type Advice = {
  score: number;
  label: string;
  sub: { liquidez: number; endeudamiento: number; ahorro: number };
  avgSaving: number;
  findings: Finding[];
  recs: Rec[];
  projections: { label: string; value: string }[];
};

export function buildAdvice(input: {
  dashboard: any;
  trend: Trend;
  debts: any[];
  goals: any[];
  budgets: any[];
}): Advice {
  const { dashboard: d, trend, debts = [], goals = [], budgets = [] } = input;
  const active = debts.filter((x) => x.active);

  const withIncome = trend.filter((t) => t.income > 0);
  const withActivity = trend.filter((t) => t.income > 0 || t.expense > 0);
  const avgIncome = mean(withIncome.map((t) => t.income)) || d?.income || 0;
  const avgExpense = mean(withActivity.map((t) => t.expense)) || d?.expense || 1;
  const avgSaving = mean(withActivity.map((t) => t.balance));

  const savingsRate = avgIncome ? avgSaving / avgIncome : 0;
  const fixedTotal = d?.fixed_expenses_total || 0;
  const debtInstallments = d?.debt_installments_total || 0;
  const committedRatio = avgIncome ? (fixedTotal + debtInstallments) / avgIncome : 0;
  const dti = avgIncome ? debtInstallments / avgIncome : 0;
  const debtRemaining = d?.debt_remaining_balance || 0;
  const emCurrent = d?.savings_current_total || 0;
  const emCoverage = avgExpense ? emCurrent / avgExpense : 0;
  const emTarget = 3 * avgExpense;
  const emShort = Math.max(0, emTarget - emCurrent);

  const liquidez = Math.round(clamp(20 + (emCoverage / 3) * 65, 5, 100));
  const endeudamiento = active.length ? Math.round(clamp(100 - dti * 180, 12, 100)) : 100;
  const ahorro = Math.round(clamp(20 + savingsRate * 190, 5, 100));
  const score = Math.round(0.34 * ahorro + 0.33 * liquidez + 0.33 * endeudamiento);
  const label =
    score >= 80 ? "Sólida" : score >= 65 ? "Estable" : score >= 50 ? "Ajustada" : "En riesgo";

  // ---------- findings ----------
  const findings: Finding[] = [];

  if (savingsRate >= 0.12 && avgSaving > 0) {
    findings.push({
      n: "01",
      title: "Capacidad de ahorro sólida",
      body: `Promedio de ${fmtCOP(Math.round(avgSaving))}/mes ahorrado en los últimos meses, cerca del ${Math.round(
        savingsRate * 100
      )}% del ingreso. Es tu mayor fortaleza.`,
      tone: "good",
    });
  } else if (avgSaving <= 0) {
    findings.push({
      n: "01",
      title: "No estás ahorrando",
      body: `En promedio gastas ${fmtCOP(Math.round(-avgSaving))}/mes más de lo que ingresa. Prioriza cerrar esa brecha.`,
      tone: "risk",
    });
  }

  if (active.length) {
    const top = [...active].sort((a, b) => b.remaining_balance - a.remaining_balance)[0];
    const totalRem = active.reduce((s, x) => s + x.remaining_balance, 0) || 1;
    const conc = top.remaining_balance / totalRem;
    const payoff = monthsFromNow(top.remaining_installments);
    findings.push({
      n: String(findings.length + 1).padStart(2, "0"),
      title: conc > 0.7 ? "Deuda concentrada en un crédito" : "Carga de deuda moderada",
      body: `${active.length === 1 ? "Único pasivo" : `${active.length} pasivos`}: ${
        top.name
      } al ${top.annual_rate}% E.A., saldo ${fmtCOP(top.remaining_balance)}, cuota ${fmtCOP(
        top.installment_amount
      )} (${Math.round(dti * 100)}% del ingreso). Fin estimado: ${payoff}.`,
      tone: dti > 0.3 ? "risk" : "watch",
    });
  }

  if (committedRatio > 0.5 || fixedTotal / (avgIncome || 1) > 0.35) {
    findings.push({
      n: String(findings.length + 1).padStart(2, "0"),
      title: "Gastos fijos en el límite alto",
      body: `Gastos fijos + cuotas comprometen el ${Math.round(
        committedRatio * 100
      )}% de tu ingreso (${fmtCOP(Math.round(fixedTotal + debtInstallments))}/mes). El rango recomendado es ≤ 50%.`,
      tone: committedRatio > 0.65 ? "risk" : "watch",
    });
  }

  if (emCoverage < 3) {
    findings.push({
      n: String(findings.length + 1).padStart(2, "0"),
      title: "Fondo de emergencia incompleto",
      body: `Cubres ${emCoverage.toFixed(1)} de 3 meses de gastos. Faltan ${fmtCOP(Math.round(emShort))}.`,
      tone: emCoverage < 1 ? "risk" : "watch",
    });
  }

  const over = budgets.filter((b) => b.pct > 100);
  if (over.length) {
    findings.push({
      n: String(findings.length + 1).padStart(2, "0"),
      title: `Presupuesto excedido en ${over.length} ${over.length === 1 ? "categoría" : "categorías"}`,
      body: over
        .slice(0, 3)
        .map((b) => `${b.category.name} (${Math.round(b.pct)}%)`)
        .join(" · "),
      tone: "watch",
    });
  }

  if (!findings.length) {
    findings.push({
      n: "01",
      title: "Situación equilibrada",
      body: "No se detectan desajustes relevantes con la información disponible. Mantén el registro al día.",
      tone: "good",
    });
  }

  // ---------- recommendations ----------
  const recs: Rec[] = [];

  if (emShort > 0 && avgSaving > 0) {
    const monthly = Math.max(100000, Math.round((avgSaving * 0.4) / 50000) * 50000);
    const when = monthsFromNow(emShort / monthly);
    recs.push({
      text: `Redirige ${fmtCOP(monthly)}/mes del excedente al fondo de emergencia.`,
      detail: `Lo completas hacia ${when}.`,
      impact: "Alto",
    });
  }

  if (active.length) {
    const top = [...active].sort((a, b) => b.remaining_balance - a.remaining_balance)[0];
    const extra = Math.min(top.remaining_balance, Math.max(500000, Math.round(avgSaving * 0.5)));
    const cuotas = Math.floor(extra / (top.installment_amount || 1));
    recs.push({
      text: `Abono extraordinario de ${fmtCOP(extra)} a ${top.name} este trimestre.`,
      detail: `Adelantas ~${cuotas} ${cuotas === 1 ? "cuota" : "cuotas"} y reduces intereses.`,
      impact: "Medio",
    });
  }

  if (committedRatio > 0.5) {
    recs.push({
      text: "Renegocia o sustituye el gasto fijo más grande (arriendo, servicios o suscripciones).",
      detail: "Bajar 5 puntos el ratio de gastos fijos libera flujo para ahorro o deuda.",
      impact: "Medio",
    });
  }

  const noBudgetTop = (d?.expense_by_category || []).find(
    (c: any) => c.category_id && !budgets.some((b) => b.category_id === c.category_id)
  );
  if (noBudgetTop && recs.length < 4) {
    recs.push({
      text: `Fija un tope mensual para ${noBudgetTop.name}.`,
      detail: `Este mes llevas ${fmtCOP(noBudgetTop.total)} sin límite definido.`,
      impact: "Bajo",
    });
  }

  if (!recs.length) {
    recs.push({
      text: "Mantén el ritmo actual de registro y ahorro.",
      detail: "Revisa este panel cada fin de mes para ajustar.",
      impact: "Bajo",
    });
  }

  // ---------- projections ----------
  const maxInst = active.length ? Math.max(...active.map((x) => x.remaining_installments)) : 0;
  const projections = [
    {
      label: "Fondo de emergencia completo",
      value:
        emShort <= 0
          ? "Ya cubierto"
          : avgSaving > 0
          ? monthsFromNow(emShort / Math.max(1, avgSaving * 0.4))
          : "Sin ahorro actual",
    },
    {
      label: "Deuda saldada",
      value: active.length ? monthsFromNow(maxInst) : "Sin deudas",
    },
    {
      label: "Patrimonio neto (+12 m)",
      value: (avgSaving * 12 >= 0 ? "+" : "") + fmtCOP(Math.round(avgSaving * 12)),
    },
    {
      label: "Tasa de ahorro sostenible",
      value:
        savingsRate > 0
          ? `${Math.round(savingsRate * 100 * 0.8)}–${Math.round(savingsRate * 100)}%`
          : "0%",
    },
  ];

  return {
    score,
    label,
    sub: { liquidez, endeudamiento, ahorro },
    avgSaving,
    findings: findings.slice(0, 4),
    recs: recs.slice(0, 4),
    projections,
  };
}
