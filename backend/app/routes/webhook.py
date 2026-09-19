from fastapi import APIRouter
from pydantic import BaseModel
from ..agents import financial

router = APIRouter(prefix="/webhook", tags=["webhook"])


class BankNotificationIn(BaseModel):
    raw_text: str


@router.post("/bank-transaction")
async def bank_transaction_webhook(payload: BankNotificationIn):
    """
    Ingesta cero-fricción: recibe el texto crudo de una notificación o
    correo bancario (disparado por Apple Shortcuts, Tasker, MacroDroid,
    o un NotificationListener en Android) y registra la transacción
    automáticamente usando extracción estructurada por LLM.
    """
    result = await financial.parse_bank_notification(payload.raw_text)
    return result
