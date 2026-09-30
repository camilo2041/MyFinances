import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import create_token, get_current_user, hash_password, verify_password
from ..database import get_db
from ..seed import seed_categories

router = APIRouter(prefix="/auth", tags=["auth"])

# Registro público (app móvil). Se apaga con ALLOW_SIGNUP=false.
ALLOW_SIGNUP = os.getenv("ALLOW_SIGNUP", "true").strip().lower() in ("1", "true", "yes")


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.execute(
        select(models.User).where(models.User.email == payload.email.lower())
    ).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Correo o contraseña incorrectos")
    if not user.is_active:
        raise HTTPException(403, "Esta cuenta está inactiva")
    return schemas.TokenOut(access_token=create_token(user), user=user)


@router.post("/register", response_model=schemas.TokenOut, status_code=201)
def register(payload: schemas.RegisterIn, db: Session = Depends(get_db)):
    if not ALLOW_SIGNUP:
        raise HTTPException(403, "El registro está deshabilitado")
    if db.execute(select(models.User).where(models.User.email == payload.email)).scalar_one_or_none():
        raise HTTPException(400, "Ya existe una cuenta con ese correo")
    user = models.User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    seed_categories(db, user)
    db.commit()
    return schemas.TokenOut(access_token=create_token(user), user=user)


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user
