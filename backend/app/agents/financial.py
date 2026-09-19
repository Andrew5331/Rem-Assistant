"""
Agente Financiero: transacciones, flujo de caja, tarjetas de crédito, metas de ahorro.
"""

import re
from datetime import datetime, date
from ..database import get_db
from ..llm_client import chat_json


# ---------- Transacciones ----------

def add_transaction(amount: float, category: str = "otro", merchant: str = "",
                     payment_method: str = "", transaction_type: str = "expense",
                     source: str = "manual", currency: str = "COP"):
    db = get_db()
    row = {
        "amount": amount,
        "category": category,
        "merchant": merchant,
        "payment_method": payment_method,
        "transaction_type": transaction_type,
        "source": source,
        "currency": currency,
    }
    result = db.table("transactions").insert(row).execute()
    return {"created": result.data}


def list_transactions(limit: int = 20):
    db = get_db()
    result = (
        db.table("transactions")
        .select("*")
        .order("occurred_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"transactions": result.data}


def get_cash_flow():
    db = get_db()
    result = db.table("transactions").select("amount, transaction_type").execute()
    rows = result.data or []

    income = sum(r["amount"] for r in rows if r["transaction_type"] == "income")
    expense = sum(r["amount"] for r in rows if r["transaction_type"] == "expense")

    return {
        "total_income": income,
        "total_expense": expense,
        "available_balance": income - expense,
    }


# ---------- Tarjetas de crédito ----------

def credit_card_status():
    db = get_db()
    result = db.table("credit_cards").select("*").execute()
    cards = []
    for c in result.data or []:
        credit_limit = c.get("credit_limit", 0)
        balance = c.get("balance", credit_limit - c.get("available_credit", 0))
        available = c.get("available_credit", credit_limit - balance)
        cards.append({**c, "credit_limit": credit_limit, "balance": balance, "available_credit": available})
    return {"credit_cards": cards}


def add_credit_card(name: str, credit_limit: float, cut_off_day: int, payment_due_day: int):
    db = get_db()
    row = {
        "name": name,
        "credit_limit": credit_limit,
        "cut_off_day": cut_off_day,
        "payment_due_day": payment_due_day,
    }
    result = db.table("credit_cards").insert(row).execute()
    return {"created": result.data}


# ---------- Metas de ahorro ----------

def savings_goal_status():
    db = get_db()
    result = db.table("savings_goals").select("*").execute()
    goals = []
    for g in result.data or []:
        pct = (g["current_amount"] / g["target_amount"] * 100) if g["target_amount"] else 0
        goals.append({**g, "progress_pct": round(pct, 1)})
    return {"savings_goals": goals}


def update_savings_goal(goal_id: str, amount_delta: float):
    db = get_db()
    current = db.table("savings_goals").select("current_amount").eq("id", goal_id).single().execute()
    new_amount = (current.data["current_amount"] if current.data else 0) + amount_delta
    result = db.table("savings_goals").update({"current_amount": new_amount}).eq("id", goal_id).execute()
    return {"updated": result.data}


def add_savings_goal(name: str, target_amount: float):
    db = get_db()
    result = db.table("savings_goals").insert({"name": name, "target_amount": target_amount}).execute()
    return {"created": result.data}


# ---------- Ingesta cero-fricción (webhook bancario) ----------

import re

async def parse_bank_notification(raw_text: str):
    """Usa el LLM para extraer monto/comercio/fecha desde el texto crudo de una
    notificación o correo bancario, y registra la transacción automáticamente."""
    extraction = await chat_json([
        {"role": "system", "content": (
            "Extrae datos de una notificación bancaria y responde SOLO con JSON "
            'con esta forma exacta: {"amount": number, "currency": "COP", '
            '"merchant": string, "payment_method": string, "transaction_type": '
            '"expense"|"income", "category": string}. category debe ser una de: '
            "alimentación, transporte, servicios, educación, ocio, otro."
        )},
        {"role": "user", "content": raw_text},
    ], default={})

    if not extraction or not isinstance(extraction, dict):
        extraction = {}

    # Regex fallback si el LLM no extrajo el monto o lo dejó en 0 por formato de miles ($45.000)
    if not extraction.get("amount"):
        match = re.search(r'\$\s*([\d\.]+)', raw_text)
        if match:
            num_str = match.group(1).replace(".", "")
            try:
                extraction["amount"] = float(num_str)
            except ValueError:
                pass

    if not extraction.get("amount"):
        return {"error": "No se pudo extraer una transacción del texto recibido.", "raw": raw_text}

    created = add_transaction(
        amount=extraction.get("amount", 0),
        category=extraction.get("category", "otro"),
        merchant=extraction.get("merchant", ""),
        payment_method=extraction.get("payment_method", ""),
        transaction_type=extraction.get("transaction_type", "expense"),
        source="webhook_bank",
        currency=extraction.get("currency", "COP"),
    )
    return {"extracted": extraction, "result": created}


# ---------- Router de acciones del agente ----------

async def handle(action: str, params: dict):
    if action == "add_transaction":
        return add_transaction(**{k: v for k, v in params.items() if k in (
            "amount", "category", "merchant", "payment_method", "transaction_type", "currency"
        )})
    if action == "list_transactions":
        return list_transactions(params.get("limit", 20))
    if action == "get_cash_flow":
        return get_cash_flow()
    if action == "credit_card_status":
        return credit_card_status()
    if action == "add_credit_card":
        return add_credit_card(
            params["name"], params["credit_limit"], params["cut_off_day"], params["payment_due_day"]
        )
    if action == "savings_goal_status":
        return savings_goal_status()
    if action == "update_savings_goal":
        return update_savings_goal(params["goal_id"], params["amount_delta"])
    if action == "add_savings_goal":
        return add_savings_goal(params["name"], params["target_amount"])
    return {"error": f"Acción financiera desconocida: {action}"}
