from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..common import current_period
from ..database import get_db

router = APIRouter(prefix="/recurring-expenses", tags=["recurring"])


def _to_out(obj: models.RecurringExpense) -> schemas.RecurringOut:
    out = schemas.RecurringOut.model_validate(obj)
    out.paid_this_period = obj.last_paid_period == current_period()
    return out


def _owned(db: Session, user: models.User, rid: int) -> models.RecurringExpense:
    obj = db.get(models.RecurringExpense, rid)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, "Gasto fijo no encontrado")
    return obj


@router.get("", response_model=list[schemas.RecurringOut])
def list_recurring(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.execute(
            select(models.RecurringExpense)
            .where(models.RecurringExpense.user_id == user.id)
            .order_by(models.RecurringExpense.due_day)
        )
        .scalars()
        .all()
    )
    return [_to_out(r) for r in rows]


@router.post("", response_model=schemas.RecurringOut, status_code=201)
def create_recurring(
    payload: schemas.RecurringIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = models.RecurringExpense(user_id=user.id, **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.put("/{rid}", response_model=schemas.RecurringOut)
def update_recurring(
    rid: int,
    payload: schemas.RecurringIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = _owned(db, user, rid)
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.delete("/{rid}", status_code=204)
def delete_recurring(
    rid: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = db.get(models.RecurringExpense, rid)
    if obj and obj.user_id == user.id:
        db.delete(obj)
        db.commit()


@router.post("/{rid}/pay", response_model=schemas.TransactionOut)
def pay_recurring(
    rid: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = _owned(db, user, rid)
    period = current_period()
    if obj.last_paid_period == period:
        raise HTTPException(400, "Este gasto ya fue pagado este mes")
    tx = models.Transaction(
        user_id=user.id,
        amount=obj.amount,
        kind="egreso",
        category_id=obj.category_id,
        note=f"Gasto fijo: {obj.name}",
        source_type="fijo",
        source_id=obj.id,
    )
    obj.last_paid_period = period
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx
