from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/goals", tags=["goals"])


def _to_out(obj: models.SavingsGoal) -> schemas.GoalOut:
    out = schemas.GoalOut.model_validate(obj)
    target = float(obj.target_amount)
    out.progress = round(float(obj.current_amount) / target * 100, 1) if target else 0.0
    out.remaining = round(max(target - float(obj.current_amount), 0), 2)
    return out


def _owned(db: Session, user: models.User, gid: int) -> models.SavingsGoal:
    obj = db.get(models.SavingsGoal, gid)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, "Meta no encontrada")
    return obj


@router.get("", response_model=list[schemas.GoalOut])
def list_goals(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.execute(
            select(models.SavingsGoal)
            .where(models.SavingsGoal.user_id == user.id)
            .order_by(models.SavingsGoal.name)
        )
        .scalars()
        .all()
    )
    return [_to_out(g) for g in rows]


@router.post("", response_model=schemas.GoalOut, status_code=201)
def create_goal(
    payload: schemas.GoalIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = models.SavingsGoal(user_id=user.id, **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.put("/{gid}", response_model=schemas.GoalOut)
def update_goal(
    gid: int,
    payload: schemas.GoalIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = _owned(db, user, gid)
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.delete("/{gid}", status_code=204)
def delete_goal(
    gid: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = db.get(models.SavingsGoal, gid)
    if obj and obj.user_id == user.id:
        db.delete(obj)
        db.commit()


@router.post("/{gid}/contribute", response_model=schemas.GoalOut)
def contribute(
    gid: int,
    payload: schemas.GoalContributionIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = _owned(db, user, gid)
    obj.contributions.append(models.GoalContribution(date=payload.date, amount=payload.amount))
    obj.current_amount = float(obj.current_amount) + payload.amount
    db.commit()
    db.refresh(obj)
    return _to_out(obj)
