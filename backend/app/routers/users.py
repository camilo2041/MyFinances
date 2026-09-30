from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import check_password_strength, get_current_user, hash_password, require_admin
from ..database import get_db
from ..seed import seed_categories

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    return db.execute(select(models.User).order_by(models.User.created_at)).scalars().all()


@router.post("", response_model=schemas.UserOut, status_code=201)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    email = payload.email.lower()
    if db.execute(select(models.User).where(models.User.email == email)).scalar_one_or_none():
        raise HTTPException(400, "Ya existe un usuario con ese correo")
    check_password_strength(payload.password)
    user = models.User(
        email=email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Cada usuario arranca con su propio juego de categorías.
    seed_categories(db, user)
    db.commit()
    return user


@router.patch("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        check_password_strength(data["password"])
        user.hashed_password = hash_password(data.pop("password"))
    else:
        data.pop("password", None)

    # No permitir que el admin se quite a sí mismo el rol o se desactive
    # si es el último admin activo.
    if user.id == admin.id and (data.get("role") == "user" or data.get("is_active") is False):
        raise HTTPException(400, "No puedes quitarte tu propio acceso de administrador")

    for k, v in data.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    user = db.get(models.User, user_id)
    if not user:
        return
    if user.id == admin.id:
        raise HTTPException(400, "No puedes eliminar tu propia cuenta")
    admins = db.execute(
        select(func.count()).select_from(models.User).where(models.User.role == "admin")
    ).scalar_one()
    if user.role == "admin" and admins <= 1:
        raise HTTPException(400, "Debe quedar al menos un administrador")
    db.delete(user)  # cascada borra todos sus datos
    db.commit()


@router.post("/{user_id}/reseed", response_model=schemas.UserOut)
def reseed_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Carga datos de ejemplo para un usuario que aún no tiene categorías."""
    from ..seed import seed_demo_data

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    has = db.execute(
        select(models.Category.id).where(models.Category.user_id == user.id).limit(1)
    ).first()
    if has:
        raise HTTPException(400, "El usuario ya tiene datos")
    seed_demo_data(db, user)
    return user
