from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models, schemas


def current_period() -> str:
    return date.today().strftime("%Y-%m")


def period_bounds(period: str) -> tuple[date, date]:
    year, month = (int(x) for x in period.split("-"))
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end


def debt_monthly_interest(debt: models.Debt, remaining_balance: float) -> float:
    """Interés estimado de un mes sobre el saldo pendiente (tasa E.A. -> mensual)."""
    rate = float(debt.annual_rate) / 100.0
    if rate <= 0:
        return 0.0
    monthly = (1 + rate) ** (1 / 12) - 1
    return round(remaining_balance * monthly, 2)


def enrich_debt(debt: models.Debt, today: date | None = None) -> schemas.DebtOut:
    today = today or date.today()
    remaining = max(debt.total_installments - debt.paid_installments, 0)
    total_paid = sum(float(p.amount) for p in debt.payments if p.kind == "pago")
    remaining_balance = round(remaining * float(debt.installment_amount), 2)
    progress = (
        round(debt.paid_installments / debt.total_installments * 100, 1)
        if debt.total_installments
        else 0.0
    )

    period = today.strftime("%Y-%m")
    handled_this_period = any(
        p.date.strftime("%Y-%m") == period for p in debt.payments
    )  # pago o aplazamiento en el mes
    overdue = bool(
        debt.active
        and remaining > 0
        and not handled_this_period
        and today.day > debt.due_day
    )
    days_overdue = (today.day - debt.due_day) if overdue else 0

    out = schemas.DebtOut.model_validate(debt)
    out.remaining_installments = remaining
    out.remaining_balance = remaining_balance
    out.total_paid = round(total_paid, 2)
    out.progress = progress
    out.monthly_interest = debt_monthly_interest(debt, remaining_balance)
    out.paid_this_period = handled_this_period
    out.overdue = overdue
    out.days_overdue = days_overdue
    return out


def budget_spent(db: Session, user_id: int, category_id: int, period: str) -> float:
    start, end = period_bounds(period)
    total = db.execute(
        select(func.coalesce(func.sum(models.Transaction.amount), 0)).where(
            models.Transaction.user_id == user_id,
            models.Transaction.category_id == category_id,
            models.Transaction.kind == "egreso",
            models.Transaction.date >= start,
            models.Transaction.date < end,
        )
    ).scalar_one()
    return float(total)
