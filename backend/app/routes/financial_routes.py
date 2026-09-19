from fastapi import APIRouter
from pydantic import BaseModel
from ..agents import financial

router = APIRouter(prefix="/financial", tags=["financial"])


@router.get("/cash-flow")
def cash_flow():
    return financial.get_cash_flow()


@router.get("/transactions")
def transactions(limit: int = 20):
    return financial.list_transactions(limit)


class TransactionIn(BaseModel):
    amount: float
    category: str = "otro"
    merchant: str = ""
    payment_method: str = ""
    transaction_type: str = "expense"
    currency: str = "COP"


@router.post("/transactions")
def create_transaction(payload: TransactionIn):
    return financial.add_transaction(**payload.model_dump())


@router.get("/credit-cards")
def credit_cards():
    return financial.credit_card_status()


class CreditCardIn(BaseModel):
    name: str
    credit_limit: float
    cut_off_day: int
    payment_due_day: int


@router.post("/credit-cards")
def create_credit_card(payload: CreditCardIn):
    return financial.add_credit_card(**payload.model_dump())


@router.get("/savings-goals")
def savings_goals():
    return financial.savings_goal_status()


class SavingsGoalIn(BaseModel):
    name: str
    target_amount: float


@router.post("/savings-goals")
def create_savings_goal(payload: SavingsGoalIn):
    return financial.add_savings_goal(**payload.model_dump())


class SavingsUpdateIn(BaseModel):
    amount_delta: float


@router.post("/savings-goals/{goal_id}/update")
def update_savings_goal(goal_id: str, payload: SavingsUpdateIn):
    return financial.update_savings_goal(goal_id, payload.amount_delta)
