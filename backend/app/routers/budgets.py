from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..common import budget_spent, current_period
from ..database import get_db

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _to_out(db: Session, user_id: int, obj: models.Budget, period: str) -> schemas.BudgetOut:
    out = schemas.BudgetOut.model_validate(obj)
    spent = budget_spent(db, user_id, obj.category_id, period)
    out.spent = round(spent, 2)
    out.remaining = round(float(obj.amount) - spent, 2)
    out.pct = round(spent / float(obj.amount) * 100, 1) if obj.amount else 0.0
    return out


@router.get("", response_model=list[schemas.BudgetOut])
def list_budgets(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    period: Optional[str] = Query(None, description="YYYY-MM"),
):
    period = period or current_period()
    rows = (
        db.execute(select(models.Budget).where(models.Budget.user_id == user.id))
        .scalars()
        .all()
    )
    rows = [b for b in rows if b.period is None or b.period == period]
    return [_to_out(db, user.id, b, period) for b in rows]


@router.post("", response_model=schemas.BudgetOut, status_code=201)
def create_budget(
    payload: schemas.BudgetIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    cat = db.get(models.Category, payload.category_id)
    if not cat or cat.user_id != user.id:
        raise HTTPException(400, "Categoría inválida")
    obj = models.Budget(user_id=user.id, **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_out(db, user.id, obj, obj.period or current_period())


@router.put("/{bid}", response_model=schemas.BudgetOut)
def update_budget(
    bid: int,
    payload: schemas.BudgetIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = db.get(models.Budget, bid)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, "Presupuesto no encontrado")
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return _to_out(db, user.id, obj, obj.period or current_period())


@router.delete("/{bid}", status_code=204)
def delete_budget(
    bid: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = db.get(models.Budget, bid)
    if obj and obj.user_id == user.id:
        db.delete(obj)
        db.commit()
