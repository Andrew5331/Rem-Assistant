import uuid
from datetime import datetime
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY

_client: Client | None = None
_in_memory_db = {
    "todos": [
        {"id": "1", "title": "Estudiar para el examen de Algoritmos", "due_date": "2026-09-20", "priority": "High", "status": "pending", "created_at": datetime.now().isoformat()},
        {"id": "2", "title": "Revisar código del proyecto Rem", "due_date": "2026-09-19", "priority": "Medium", "status": "pending", "created_at": datetime.now().isoformat()},
    ],
    "transactions": [
        {"id": "1", "amount": 150000, "category": "alimentación", "merchant": "Supermercado Éxito", "transaction_type": "expense", "source": "manual", "occurred_at": datetime.now().isoformat(), "created_at": datetime.now().isoformat()},
        {"id": "2", "amount": 2500000, "category": "salario", "merchant": "Depósito Trabajo", "transaction_type": "income", "source": "manual", "occurred_at": datetime.now().isoformat(), "created_at": datetime.now().isoformat()},
    ],
    "savings_goals": [
        {"id": "1", "name": "Fondo de Emergencia", "target_amount": 5000000, "current_amount": 4250000, "progress_pct": 85},
        {"id": "2", "name": "Nuevo Equipo Laptop", "target_amount": 3000000, "current_amount": 1800000, "progress_pct": 60},
    ],
    "credit_cards": [
        {"id": "1", "name": "Visa Signature", "credit_limit": 6000000, "balance": 1800000, "available_credit": 4200000, "cut_off_day": 15, "payment_due_day": 5},
        {"id": "2", "name": "Mastercard Black", "credit_limit": 10000000, "balance": 1500000, "available_credit": 8500000, "cut_off_day": 28, "payment_due_day": 18},
    ],
    "conversation_log": [],
    "email_drafts": [],
}


class MockQuery:
    def __init__(self, table_name):
        self.table_name = table_name
        self._data = _in_memory_db.get(table_name, [])

    def select(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def limit(self, count):
        if isinstance(self._data, list):
            self._data = self._data[:count]
        return self

    def single(self):
        if isinstance(self._data, list):
            self._data = self._data[0] if self._data else None
        return self

    def eq(self, field, value):
        if isinstance(self._data, list):
            self._data = [item for item in self._data if str(item.get(field)) == str(value)]
        elif isinstance(self._data, dict):
            if str(self._data.get(field)) != str(value):
                self._data = None
        return self

    def insert(self, row):
        new_row = {"id": str(uuid.uuid4()), "status": "pending", "created_at": datetime.now().isoformat(), **row}
        if self.table_name not in _in_memory_db:
            _in_memory_db[self.table_name] = []
        _in_memory_db[self.table_name].insert(0, new_row)
        self.data = [new_row]
        return self

    def update(self, payload):
        if isinstance(self._data, list):
            for item in self._data:
                item.update(payload)
        elif isinstance(self._data, dict):
            self._data.update(payload)
        self.data = self._data
        return self

    def execute(self):
        return type("MockResponse", (), {"data": self._data})()


class MockSupabaseClient:
    def table(self, table_name):
        return MockQuery(table_name)


def get_db():
    global _client
    if _client is not None:
        return _client

    if SUPABASE_URL and SUPABASE_KEY and SUPABASE_KEY.startswith("eyJ"):
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_KEY)
            return _client
        except Exception:
            pass

    # Usar mock en memoria si Supabase no está configurado o la clave es de prueba
    return MockSupabaseClient()

