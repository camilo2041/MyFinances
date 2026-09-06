from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..seed import seed_categories

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.execute(
            select(models.Category)
            .where(models.Category.user_id == user.id)
            .order_by(models.Category.name)
        )
        .scalars()
        .all()
    )
    # Todo usuario arranca con el juego de categorías por defecto.
    if not rows:
        try:
            seed_categories(db, user)
            db.commit()
        except Exception:
            db.rollback()  # otra petición sembró primero
        rows = (
            db.execute(
                select(models.Category)
                .where(models.Category.user_id == user.id)
                .order_by(models.Category.name)
            )
            .scalars()
            .all()
        )
    return rows


@router.post("", response_model=schemas.CategoryOut, status_code=201)
def create_category(
    payload: schemas.CategoryIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = models.Category(user_id=user.id, **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def _owned(db: Session, user: models.User, cat_id: int) -> models.Category:
    obj = db.get(models.Category, cat_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(404, "Categoría no encontrada")
    return obj


@router.put("/{cat_id}", response_model=schemas.CategoryOut)
def update_category(
    cat_id: int,
    payload: schemas.CategoryIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = _owned(db, user, cat_id)
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{cat_id}", status_code=204)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    obj = db.get(models.Category, cat_id)
    if obj and obj.user_id == user.id:
        db.delete(obj)
        db.commit()
