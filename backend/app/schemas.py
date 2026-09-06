import datetime as _dt
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

date = _dt.date  # alias para defaults; las anotaciones usan _dt.date

Kind = Literal["ingreso", "egreso"]
Role = Literal["admin", "user"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth / Users ----------
def _valid_email(v: str) -> str:
    v = v.strip().lower()
    if "@" not in v or "." not in v.split("@")[-1] or len(v) < 5:
        raise ValueError("Correo electrónico no válido")
    return v


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _e(cls, v: str) -> str:
        return v.strip().lower()


class UserOut(ORMModel):
    id: int
    email: str
    name: str
    role: Role
    is_active: bool
    created_at: _dt.datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserCreate(BaseModel):
    email: str
    name: str
    password: str = Field(min_length=6)
    role: Role = "user"

    @field_validator("email")
    @classmethod
    def _e(cls, v: str) -> str:
        return _valid_email(v)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)


# ---------- Category ----------
class CategoryIn(BaseModel):
    name: str
    kind: Kind
    color: str = "#64748b"
    icon: str = "💸"


class CategoryOut(ORMModel):
    id: int
    name: str
    kind: Kind
    color: str
    icon: str


# ---------- Transaction ----------
class TransactionIn(BaseModel):
    date: _dt.date = Field(default_factory=date.today)
    amount: float = Field(gt=0)
    kind: Kind
    category_id: Optional[int] = None
    note: str = ""


class TransactionOut(ORMModel):
    id: int
    date: _dt.date
    amount: float
    kind: Kind
    category_id: Optional[int]
    category: Optional[CategoryOut]
    note: str
    source_type: Optional[str]
    source_id: Optional[int]


# ---------- Recurring expense ----------
class RecurringIn(BaseModel):
    name: str
    amount: float = Field(gt=0)
    category_id: Optional[int] = None
    due_day: int = Field(ge=1, le=31, default=1)
    active: bool = True
    note: str = ""


class RecurringOut(ORMModel):
    id: int
    name: str
    amount: float
    category_id: Optional[int]
    category: Optional[CategoryOut]
    due_day: int
    active: bool
    note: str
    last_paid_period: Optional[str]
    paid_this_period: bool = False


# ---------- Debt ----------
class DebtIn(BaseModel):
    name: str
    lender: str = ""
    principal: float = Field(gt=0)
    annual_rate: float = 0
    total_installments: int = Field(ge=1, default=1)
    paid_installments: int = Field(ge=0, default=0)
    installment_amount: float = Field(gt=0)
    due_day: int = Field(ge=1, le=31, default=1)
    start_date: _dt.date = Field(default_factory=date.today)
    active: bool = True
    note: str = ""


class DebtPaymentIn(BaseModel):
    date: _dt.date = Field(default_factory=date.today)
    amount: Optional[float] = None  # si null, usa installment_amount
    note: str = ""
    register_transaction: bool = True


class DebtPaymentOut(ORMModel):
    id: int
    debt_id: int
    date: _dt.date
    amount: float
    note: str
    kind: str = "pago"


class DeferIn(BaseModel):
    note: str = ""


class DebtOut(ORMModel):
    id: int
    name: str
    lender: str
    principal: float
    annual_rate: float
    total_installments: int
    paid_installments: int
    installment_amount: float
    due_day: int
    start_date: _dt.date
    active: bool
    note: str
    deferrals: int = 0
    remaining_installments: int = 0
    remaining_balance: float = 0
    total_paid: float = 0
    progress: float = 0
    monthly_interest: float = 0        # interés estimado de un mes sobre el saldo
    paid_this_period: bool = False
    overdue: bool = False
    days_overdue: int = 0
    payments: list[DebtPaymentOut] = []


# ---------- Rescue plan ----------
class PriorityDebt(BaseModel):
    debt_id: int
    name: str
    annual_rate: float
    installment_amount: float
    remaining_installments: int
    action: str          # pagar | aplazar
    reason: str


class CatchUp(BaseModel):
    needed: float
    monthly: float
    months: int
    finish: str          # etiqueta de mes


class RescuePlanOut(BaseModel):
    period: str
    income: float
    already_spent: float
    committed: float          # fijos pendientes + cuotas de deuda no pagadas este mes
    available: float          # income - already_spent
    shortfall: float          # max(0, committed - available)
    can_cover: bool
    avg_saving: float
    priority: list[PriorityDebt]
    defer_candidate_id: Optional[int] = None
    defer_saves_this_month: float = 0
    defer_extra_cost: float = 0
    catchup: Optional[CatchUp] = None
    notes: list[str] = []


# ---------- Budget ----------
class BudgetIn(BaseModel):
    category_id: int
    amount: float = Field(gt=0)
    period: Optional[str] = None  # YYYY-MM


class BudgetOut(ORMModel):
    id: int
    category_id: int
    category: CategoryOut
    amount: float
    period: Optional[str]
    spent: float = 0
    remaining: float = 0
    pct: float = 0


# ---------- Savings goal ----------
class GoalIn(BaseModel):
    name: str
    target_amount: float = Field(gt=0)
    current_amount: float = Field(ge=0, default=0)
    target_date: Optional[_dt.date] = None
    note: str = ""


class GoalContributionIn(BaseModel):
    date: _dt.date = Field(default_factory=date.today)
    amount: float = Field(gt=0)


class GoalContributionOut(ORMModel):
    id: int
    goal_id: int
    date: _dt.date
    amount: float


class GoalOut(ORMModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: Optional[_dt.date]
    note: str
    progress: float = 0
    remaining: float = 0
    contributions: list[GoalContributionOut] = []


# ---------- Dashboard ----------
class CategoryBreakdown(BaseModel):
    category_id: Optional[int]
    name: str
    color: str
    icon: str
    total: float


class DashboardOut(BaseModel):
    period: str
    income: float
    expense: float
    balance: float
    fixed_expenses_total: float
    fixed_expenses_pending: float
    debt_installments_total: float
    debt_remaining_balance: float
    savings_target_total: float
    savings_current_total: float
    expense_by_category: list[CategoryBreakdown]
    recent: list[TransactionOut]
