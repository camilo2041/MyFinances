import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from .database import Base, SessionLocal, engine
from .routers import (
    auth,
    budgets,
    categories,
    dashboard,
    debts,
    goals,
    recurring,
    transactions,
    users,
)
from .seed import ensure_bootstrap

app = FastAPI(title="MyFinces API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    for attempt in range(15):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError:
            if attempt == 14:
                raise
            time.sleep(2)

    db = SessionLocal()
    try:
        ensure_bootstrap(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


for r in (auth, users, categories, transactions, recurring, debts, budgets, goals, dashboard):
    app.include_router(r.router)
