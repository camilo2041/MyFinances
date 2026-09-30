from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..common import ensure_category, period_bounds
from ..database import get_db

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[schemas.TransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    period: Optional[str] = Query(None, description="YYYY-MM"),
    kind: Optional[str] = None,
    category_id: Optional[int] = None,
    limit: int = 500,
):
    stmt = (
        select(models.Transaction)
        .where(models.Transaction.user_id == user.id)
        .order_by(models.Transaction.date.desc(), models.Transaction.id.desc())
    )
    if period:
        start, end = period_bounds(period)
        stmt = stmt.where(models.Transaction.date >= start, models.Transaction.date < end)
    if kind:
        stmt = stmt.where(models.Transaction.kind == kind)
    if category_id:
        stmt = stmt.where(models.Transaction.category_id == category_id)
    return db.execute(stmt.limit(limit)).scalars().all()


@router.post("", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(
    payload: schemas.TransactionIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["category_id"] = ensure_category(db, user.id, data["kind"], data["category_id"])
    obj = models.Transaction(user_id=user.id, **data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def _owned(db: Session, user: models.User, tx_id: int) -> models.Transaction:
    obj = db.get(models.Transaction, tx_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, "Movimiento no encontrado")
    return obj


@router.put("/{tx_id}", response_model=schemas.TransactionOut)
def update_transaction(
    tx_id: int,
    payload: schemas.TransactionIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = _owned(db, user, tx_id)
    data = payload.model_dump()
    data["category_id"] = ensure_category(db, user.id, data["kind"], data["category_id"])
    for k, v in data.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = db.get(models.Transaction, tx_id)
    if obj and obj.user_id == user.id:
        db.delete(obj)
        db.commit()
