import os
from datetime import date, timedelta

from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session

from . import models
from .auth import hash_password
from .database import engine


DEFAULT_CATEGORIES = [
    ("Salario", "ingreso", "#15803d", "💼"),
    ("Negocio / Freelance", "ingreso", "#0e7490", "🧾"),
    ("Otros ingresos", "ingreso", "#4d7c0f", "➕"),
    ("Arriendo / Vivienda", "egreso", "#4338ca", "🏠"),
    ("Servicios públicos", "egreso", "#0369a1", "💡"),
    ("Mercado", "egreso", "#b45309", "🛒"),
    ("Transporte", "egreso", "#6d28d9", "🚌"),
    ("Salud", "egreso", "#0e7490", "💊"),
    ("Educación", "egreso", "#4338ca", "📚"),
    ("Ocio / Restaurantes", "egreso", "#9d174d", "🍔"),
    ("Suscripciones", "egreso", "#6d28d9", "📺"),
    ("Deudas", "egreso", "#be123c", "🏦"),
    ("Ahorro", "egreso", "#0369a1", "🐖"),
    ("Otros gastos", "egreso", "#918fa8", "💸"),
]

_TABLES_WITH_USER = ["categories", "transactions", "recurring_expenses", "debts", "budgets", "savings_goals"]


_EXTRA_COLUMNS = [
    ("debts", "deferrals", "INTEGER DEFAULT 0"),
    ("debt_payments", "kind", "VARCHAR(10) DEFAULT 'pago'"),
]
# (categories gana una constraint UNIQUE(user_id, name) en _add_user_columns)


def _add_user_columns() -> None:
    """Migración ligera sin Alembic: añade columnas nuevas a tablas ya existentes."""
    insp = inspect(engine)
    existing = set(insp.get_table_names())
    with engine.begin() as conn:
        for tbl in _TABLES_WITH_USER:
            if tbl not in existing:
                continue
            cols = {c["name"] for c in insp.get_columns(tbl)}
            if "user_id" not in cols:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN user_id INTEGER"))
        for tbl, col, decl in _EXTRA_COLUMNS:
            if tbl not in existing:
                continue
            cols = {c["name"] for c in insp.get_columns(tbl)}
            if col not in cols:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col} {decl}"))
        if "categories" in existing:
            uqs = {u["name"] for u in insp.get_unique_constraints("categories")}
            if "uq_cat_user_name" not in uqs:
                try:
                    conn.execute(
                        text(
                            "ALTER TABLE categories ADD CONSTRAINT uq_cat_user_name "
                            "UNIQUE (user_id, name)"
                        )
                    )
                except Exception:
                    pass


def seed_categories(db: Session, user: models.User) -> dict:
    existing = {
        c.name: c
        for c in db.execute(
            select(models.Category).where(models.Category.user_id == user.id)
        ).scalars().all()
    }
    for name, kind, color, icon in DEFAULT_CATEGORIES:
        if name in existing:
            continue
        c = models.Category(user_id=user.id, name=name, kind=kind, color=color, icon=icon)
        db.add(c)
        existing[name] = c
    db.flush()
    return existing


def seed_demo_data(db: Session, user: models.User) -> None:
    """Datos de ejemplo para un usuario nuevo (o el usuario demo)."""
    cats = seed_categories(db, user)
    today = date.today()

    def month_start(offset: int) -> date:
        y, m = today.year, today.month - offset
        while m <= 0:
            m += 12
            y -= 1
        return date(y, m, 1)

    history = [
        (5, [(1, 3650000, "ingreso", "Salario", "Salario"), (4, 410000, "egreso", "Mercado", "Mercado del mes"),
             (9, 150000, "egreso", "Transporte", "Transporte"), (14, 220000, "egreso", "Ocio / Restaurantes", "Salidas"),
             (18, 130000, "egreso", "Salud", "Farmacia")]),
        (4, [(1, 3650000, "ingreso", "Salario", "Salario"), (2, 300000, "ingreso", "Negocio / Freelance", "Proyecto extra"),
             (5, 460000, "egreso", "Mercado", "Mercado del mes"), (10, 165000, "egreso", "Transporte", "Transporte"),
             (16, 90000, "egreso", "Ocio / Restaurantes", "Cine"), (22, 260000, "egreso", "Educación", "Curso online")]),
        (3, [(1, 3800000, "ingreso", "Salario", "Salario"), (6, 430000, "egreso", "Mercado", "Mercado del mes"),
             (11, 140000, "egreso", "Transporte", "Transporte"), (19, 310000, "egreso", "Ocio / Restaurantes", "Cumpleaños"),
             (25, 120000, "egreso", "Salud", "Consulta")]),
        (2, [(1, 3800000, "ingreso", "Salario", "Salario"), (3, 250000, "ingreso", "Otros ingresos", "Venta usados"),
             (7, 480000, "egreso", "Mercado", "Mercado del mes"), (12, 175000, "egreso", "Transporte", "Transporte"),
             (20, 140000, "egreso", "Ocio / Restaurantes", "Restaurante")]),
        (1, [(1, 3800000, "ingreso", "Salario", "Salario"), (5, 445000, "egreso", "Mercado", "Mercado del mes"),
             (13, 160000, "egreso", "Transporte", "Transporte"), (17, 95000, "egreso", "Ocio / Restaurantes", "Domicilios"),
             (24, 180000, "egreso", "Educación", "Libros")]),
    ]
    for offset, rows in history:
        base = month_start(offset)
        for day, amount, kind, cat, note in rows:
            db.add(models.Transaction(
                user_id=user.id, date=base.replace(day=min(day, 28)),
                amount=amount, kind=kind, category_id=cats[cat].id, note=note,
            ))

    db.add_all([
        models.Transaction(user_id=user.id, date=today.replace(day=1), amount=3800000,
                           kind="ingreso", category_id=cats["Salario"].id, note="Salario del mes"),
        models.Transaction(user_id=user.id, date=today - timedelta(days=3), amount=95000,
                           kind="egreso", category_id=cats["Mercado"].id, note="Mercado semanal"),
        models.Transaction(user_id=user.id, date=today - timedelta(days=1), amount=32000,
                           kind="egreso", category_id=cats["Transporte"].id, note="Recarga transporte"),
    ])

    db.add_all([
        models.RecurringExpense(user_id=user.id, name="Arriendo", amount=1200000, category_id=cats["Arriendo / Vivienda"].id, due_day=5),
        models.RecurringExpense(user_id=user.id, name="Energía + agua", amount=180000, category_id=cats["Servicios públicos"].id, due_day=15),
        models.RecurringExpense(user_id=user.id, name="Internet + celular", amount=110000, category_id=cats["Servicios públicos"].id, due_day=10),
        models.RecurringExpense(user_id=user.id, name="Streaming", amount=44000, category_id=cats["Suscripciones"].id, due_day=20),
    ])

    db.add(models.Debt(user_id=user.id, name="Crédito de libre inversión", lender="Banco", principal=6000000,
                       annual_rate=24.0, total_installments=24, paid_installments=7,
                       installment_amount=310000, due_day=8, start_date=today.replace(day=1)))

    db.add(models.SavingsGoal(user_id=user.id, name="Fondo de emergencia", target_amount=9000000,
                              current_amount=2500000, note="3 meses de gastos"))

    db.flush()
    db.add_all([
        models.Budget(user_id=user.id, category_id=cats["Mercado"].id, amount=500000),
        models.Budget(user_id=user.id, category_id=cats["Ocio / Restaurantes"].id, amount=250000),
        models.Budget(user_id=user.id, category_id=cats["Transporte"].id, amount=180000),
    ])
    db.commit()


def ensure_bootstrap(db: Session) -> None:
    _add_user_columns()

    admin_email = os.getenv("ADMIN_EMAIL", "admin@myfinces.local")
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin1234")
    demo_email = os.getenv("DEMO_EMAIL", "juan@myfinces.local")
    demo_pass = os.getenv("DEMO_PASSWORD", "demo1234")

    admin = db.execute(select(models.User).where(models.User.email == admin_email)).scalar_one_or_none()
    if not admin:
        admin = models.User(email=admin_email, name="Administrador",
                            hashed_password=hash_password(admin_pass), role="admin")
        db.add(admin)
        db.commit()

    demo = db.execute(select(models.User).where(models.User.email == demo_email)).scalar_one_or_none()
    if not demo:
        demo = models.User(email=demo_email, name="Juan Duarte",
                           hashed_password=hash_password(demo_pass), role="user")
        db.add(demo)
        db.commit()

    # Adopta filas huérfanas (de antes de la migración) para el usuario demo.
    with engine.begin() as conn:
        for tbl in _TABLES_WITH_USER:
            conn.execute(
                text(f"UPDATE {tbl} SET user_id = :uid WHERE user_id IS NULL"),
                {"uid": demo.id},
            )

    # Si el usuario demo quedó sin categorías, cárgale los datos de ejemplo.
    has_cats = db.execute(
        select(models.Category.id).where(models.Category.user_id == demo.id).limit(1)
    ).first()
    if not has_cats:
        seed_demo_data(db, demo)
