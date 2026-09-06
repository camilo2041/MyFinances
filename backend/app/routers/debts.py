import math
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..common import current_period, debt_monthly_interest, enrich_debt, period_bounds
from ..database import get_db

router = APIRouter(prefix="/debts", tags=["debts"])

MAX_DEFERRALS = 6


def _owned(db: Session, user: models.User, did: int) -> models.Debt:
    obj = db.get(models.Debt, did)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, "Deuda no encontrada")
    return obj


@router.get("", response_model=list[schemas.DebtOut])
def list_debts(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.execute(
            select(models.Debt)
            .where(models.Debt.user_id == user.id)
            .order_by(models.Debt.active.desc(), models.Debt.name)
        )
        .scalars()
        .all()
    )
    return [enrich_debt(d) for d in rows]


@router.post("", response_model=schemas.DebtOut, status_code=201)
def create_debt(
    payload: schemas.DebtIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = models.Debt(user_id=user.id, **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return enrich_debt(obj)


@router.put("/{did}", response_model=schemas.DebtOut)
def update_debt(
    did: int,
    payload: schemas.DebtIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = _owned(db, user, did)
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return enrich_debt(obj)


@router.delete("/{did}", status_code=204)
def delete_debt(
    did: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = db.get(models.Debt, did)
    if obj and obj.user_id == user.id:
        db.delete(obj)
        db.commit()


@router.post("/{did}/pay", response_model=schemas.DebtOut)
def pay_installment(
    did: int,
    payload: schemas.DebtPaymentIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = _owned(db, user, did)
    if obj.paid_installments >= obj.total_installments:
        raise HTTPException(400, "La deuda ya está saldada")
    amount = payload.amount if payload.amount is not None else float(obj.installment_amount)
    pay = models.DebtPayment(debt_id=obj.id, date=payload.date, amount=amount, note=payload.note)
    obj.paid_installments += 1
    db.add(pay)
    if payload.register_transaction:
        db.add(
            models.Transaction(
                user_id=user.id,
                date=payload.date,
                amount=amount,
                kind="egreso",
                category_id=None,
                note=f"Cuota deuda: {obj.name} ({obj.paid_installments}/{obj.total_installments})",
                source_type="deuda",
                source_id=obj.id,
            )
        )
    db.commit()
    db.refresh(obj)
    return enrich_debt(obj)


@router.post("/{did}/defer", response_model=schemas.DebtOut)
def defer_installment(
    did: int,
    payload: schemas.DeferIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Mes libre: aplaza la cuota de este mes. Añade un mes de plazo y registra
    el interés estimado que se acumula por no pagar."""
    obj = _owned(db, user, did)
    if obj.paid_installments >= obj.total_installments:
        raise HTTPException(400, "La deuda ya está saldada")
    period = current_period()
    if any(p.date.strftime("%Y-%m") == period for p in obj.payments):
        raise HTTPException(400, "Ya registraste un pago o aplazamiento este mes")
    if (obj.deferrals or 0) >= MAX_DEFERRALS:
        raise HTTPException(400, f"Ya usaste {MAX_DEFERRALS} meses libres en esta deuda")

    remaining = max(obj.total_installments - obj.paid_installments, 0)
    remaining_balance = remaining * float(obj.installment_amount)
    interest = debt_monthly_interest(obj, remaining_balance)

    obj.total_installments += 1
    obj.deferrals = (obj.deferrals or 0) + 1
    db.add(
        models.DebtPayment(
            debt_id=obj.id,
            date=date.today(),
            amount=interest,
            kind="aplazada",
            note=payload.note or "Mes libre — cuota aplazada",
        )
    )
    db.commit()
    db.refresh(obj)
    return enrich_debt(obj)


def _money(n: float) -> str:
    return "$" + f"{round(n):,}".replace(",", ".")


def _month_label(y: int, m: int) -> str:
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ]
    return f"{meses[m - 1]} {y}"


@router.get("/plan", response_model=schemas.RescuePlanOut)
def rescue_plan(
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
    already_spent = _sum("egreso")
    available = income - already_spent

    fijos = db.execute(
        select(models.RecurringExpense).where(
            models.RecurringExpense.user_id == uid,
            models.RecurringExpense.active == True,  # noqa: E712
        )
    ).scalars().all()
    fijos_pending = sum(float(r.amount) for r in fijos if r.last_paid_period != period)

    debts = [
        enrich_debt(d)
        for d in db.execute(
            select(models.Debt).where(
                models.Debt.user_id == uid, models.Debt.active == True  # noqa: E712
            )
        ).scalars().all()
    ]
    active_open = [d for d in debts if d.remaining_installments > 0]
    cuotas_pending = sum(d.installment_amount for d in active_open if not d.paid_this_period)

    committed = round(fijos_pending + cuotas_pending, 2)
    shortfall = round(max(0.0, committed - available), 2)

    y, m = (int(x) for x in period.split("-"))
    balances = []
    for i in range(6):
        mm, yy = m - i, y
        while mm <= 0:
            mm += 12
            yy -= 1
        s, e = period_bounds(f"{yy:04d}-{mm:02d}")

        def _p(kind, s=s, e=e):
            return float(
                db.execute(
                    select(func.coalesce(func.sum(models.Transaction.amount), 0)).where(
                        models.Transaction.user_id == uid,
                        models.Transaction.kind == kind,
                        models.Transaction.date >= s,
                        models.Transaction.date < e,
                    )
                ).scalar_one()
            )

        balances.append(_p("ingreso") - _p("egreso"))
    avg_saving = round(sum(balances) / len(balances), 2) if balances else 0.0

    ranked = sorted(active_open, key=lambda d: (-d.annual_rate, -d.installment_amount))
    priority: list[schemas.PriorityDebt] = []
    for idx, d in enumerate(ranked):
        keep = idx < max(1, len(ranked) - 1) or shortfall == 0
        priority.append(
            schemas.PriorityDebt(
                debt_id=d.id,
                name=d.name,
                annual_rate=d.annual_rate,
                installment_amount=d.installment_amount,
                remaining_installments=d.remaining_installments,
                action="pagar" if keep else "aplazar",
                reason=(
                    "Mayor tasa: págala primero"
                    if idx == 0
                    else "Menor tasa: candidata a mes libre"
                    if not keep
                    else "Mantén el pago"
                ),
            )
        )

    defer_pool = [
        d for d in ranked if not d.paid_this_period and (d.deferrals or 0) < MAX_DEFERRALS
    ]
    cand = defer_pool[-1] if defer_pool else None
    defer_candidate_id = cand.id if cand else None
    defer_saves = cand.installment_amount if cand else 0.0
    defer_cost = cand.monthly_interest if cand else 0.0

    catchup = None
    notes: list[str] = []
    if shortfall > 0:
        base = avg_saving if avg_saving > 0 else max(50000.0, income * 0.05)
        target = min(base * 0.6, shortfall)
        monthly = max(50000.0, math.ceil(target / 10000) * 10000)
        months = max(1, math.ceil(shortfall / monthly))
        my, yy2 = m + months, y
        while my > 12:
            my -= 12
            yy2 += 1
        catchup = schemas.CatchUp(
            needed=shortfall, monthly=monthly, months=months, finish=_month_label(yy2, my)
        )
        notes.append(
            f"Este mes te faltan {_money(shortfall)} para cubrir cuotas y gastos fijos."
        )
        if cand:
            notes.append(
                f"Un mes libre en «{cand.name}» libera {_money(defer_saves)} ahora "
                f"(costo estimado: {_money(defer_cost)} en intereses y una cuota más de plazo)."
            )
    else:
        notes.append("Este mes alcanzas para cubrir tus compromisos. Vas al día.")

    return schemas.RescuePlanOut(
        period=period,
        income=round(income, 2),
        already_spent=round(already_spent, 2),
        committed=committed,
        available=round(available, 2),
        shortfall=shortfall,
        can_cover=shortfall == 0,
        avg_saving=avg_saving,
        priority=priority,
        defer_candidate_id=defer_candidate_id,
        defer_saves_this_month=round(defer_saves, 2),
        defer_extra_cost=round(defer_cost, 2),
        catchup=catchup,
        notes=notes,
    )
