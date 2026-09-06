from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..common import current_period, period_bounds
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/trend")
def trend(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    months: int = Query(6, ge=1, le=24),
    period: Optional[str] = Query(None, description="mes final YYYY-MM"),
):
    period = period or current_period()
    y, m = (int(x) for x in period.split("-"))
    out = []
    for i in range(months - 1, -1, -1):
        mm = m - i
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        p = f"{yy:04d}-{mm:02d}"
        start, end = period_bounds(p)

        def _sum(kind: str) -> float:
            return float(
                db.execute(
                    select(func.coalesce(func.sum(models.Transaction.amount), 0)).where(
                        models.Transaction.user_id == user.id,
                        models.Transaction.kind == kind,
                        models.Transaction.date >= start,
                        models.Transaction.date < end,
                    )
                ).scalar_one()
            )

        inc = _sum("ingreso")
        exp = _sum("egreso")
        out.append(
            {"period": p, "income": round(inc, 2), "expense": round(exp, 2), "balance": round(inc - exp, 2)}
        )
    return out


@router.get("", response_model=schemas.DashboardOut)
def dashboard(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    period: Optional[str] = Query(None, description="YYYY-MM"),
):
    period = period or current_period()
    start, end = period_bounds(period)
    uid = user.id

    def _sum(kind: str) -> float:
        return float(
            db.execute(
                select(func.coalesce(func.sum(models.Transaction.amount), 0)).where(
                    models.Transaction.user_id == uid,
                    models.Transaction.kind == kind,
                    models.Transaction.date >= start,
                    models.Transaction.date < end,
                )
            ).scalar_one()
        )

    income = _sum("ingreso")
    expense = _sum("egreso")

    recurring = db.execute(
        select(models.RecurringExpense).where(
            models.RecurringExpense.user_id == uid,
            models.RecurringExpense.active == True,  # noqa: E712
        )
    ).scalars().all()
    fixed_total = sum(float(r.amount) for r in recurring)
    fixed_pending = sum(float(r.amount) for r in recurring if r.last_paid_period != period)

    debts = db.execute(
        select(models.Debt).where(
            models.Debt.user_id == uid, models.Debt.active == True  # noqa: E712
        )
    ).scalars().all()
    debt_installments_total = sum(float(d.installment_amount) for d in debts)
    debt_remaining = sum(
        max(d.total_installments - d.paid_installments, 0) * float(d.installment_amount)
        for d in debts
    )

    goals = db.execute(
        select(models.SavingsGoal).where(models.SavingsGoal.user_id == uid)
    ).scalars().all()
    savings_target = sum(float(g.target_amount) for g in goals)
    savings_current = sum(float(g.current_amount) for g in goals)

    rows = db.execute(
        select(
            models.Transaction.category_id,
            func.coalesce(func.sum(models.Transaction.amount), 0),
        )
        .where(
            models.Transaction.user_id == uid,
            models.Transaction.kind == "egreso",
            models.Transaction.date >= start,
            models.Transaction.date < end,
        )
        .group_by(models.Transaction.category_id)
    ).all()
    cats = {
        c.id: c
        for c in db.execute(
            select(models.Category).where(models.Category.user_id == uid)
        ).scalars().all()
    }
    breakdown = []
    for cat_id, total in rows:
        c = cats.get(cat_id)
        breakdown.append(
            schemas.CategoryBreakdown(
                category_id=cat_id,
                name=c.name if c else "Sin categoría",
                color=c.color if c else "#94a3b8",
                icon=c.icon if c else "❓",
                total=float(total),
            )
        )
    breakdown.sort(key=lambda x: x.total, reverse=True)

    recent = db.execute(
        select(models.Transaction)
        .where(models.Transaction.user_id == uid)
        .order_by(models.Transaction.date.desc(), models.Transaction.id.desc())
        .limit(8)
    ).scalars().all()

    return schemas.DashboardOut(
        period=period,
        income=round(income, 2),
        expense=round(expense, 2),
        balance=round(income - expense, 2),
        fixed_expenses_total=round(fixed_total, 2),
        fixed_expenses_pending=round(fixed_pending, 2),
        debt_installments_total=round(debt_installments_total, 2),
        debt_remaining_balance=round(debt_remaining, 2),
        savings_target_total=round(savings_target, 2),
        savings_current_total=round(savings_current, 2),
        expense_by_category=breakdown,
        recent=recent,
    )
