"""
Orquestador Central (Intent Router).

Flujo:
1. Clasifica la intención del usuario con el LLM -> {agent, action, params}
2. Delega la ejecución al agente correspondiente (Secretaría / Financiero)
3. Le pide al LLM que redacte una respuesta final en lenguaje natural
   usando el resultado estructurado del agente.

Esto implementa "function calling" de forma explícita y portable: no
depende de que el modelo de Ollama soporte tool-calling nativo, por lo
que funciona igual con Llama 3.2, Mistral, o Google AI Studio.
"""

from .llm_client import chat, chat_json
from .agents import secretary, financial
from .database import get_db

ROUTER_SYSTEM_PROMPT = """
Eres el orquestador de un asistente personal con dos agentes especializados:

1. "secretary": agenda, tareas/pendientes (to-dos), lectura de correo,
   redacción de borradores de correo.
   Acciones válidas: add_todo, list_todos, complete_todo,
   list_unread_emails, summarize_email, draft_email

2. "financial": transacciones, flujo de caja, tarjetas de crédito,
   metas de ahorro.
   Acciones válidas: add_transaction, list_transactions, get_cash_flow,
   credit_card_status, add_credit_card, savings_goal_status,
   update_savings_goal, add_savings_goal

Dado el mensaje del usuario, responde SOLO con un JSON de esta forma:
{"agent": "secretary"|"financial"|"general", "action": "<una de las de arriba o null>", "params": {...}}

Usa "general" (sin acción) si el mensaje es una charla casual o no
encaja en ningún agente. Extrae los "params" necesarios directamente
del mensaje del usuario (por ejemplo title, amount, category, instruction, etc.).
Responde SOLO el JSON, sin texto adicional.
"""

SYNTH_SYSTEM_PROMPT = """
Eres Rem, un asistente personal en español, cálido, eficiente y directo. Recibiste
el resultado de una acción ejecutada por uno de tus agentes. Redacta una
respuesta breve (2-4 líneas) en lenguaje natural para el usuario, basada
ÚNICAMENTE en los datos que te doy. No inventes cifras ni datos que no
estén presentes.
"""


async def route_and_respond(user_text: str) -> dict:
    classification = await chat_json([
        {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ], default={"agent": "general", "action": None, "params": {}})

    agent_name = classification.get("agent", "general")
    action = classification.get("action")
    params = classification.get("params", {}) or {}

    if agent_name == "secretary" and action:
        agent_result = await secretary.handle(action, params)
    elif agent_name == "financial" and action:
        agent_result = await financial.handle(action, params)
    else:
        agent_result = None

    if agent_result is not None:
        final_reply = await chat([
            {"role": "system", "content": SYNTH_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"Mensaje original del usuario: {user_text}\n\n"
                f"Resultado del agente ({agent_name}.{action}):\n{agent_result}"
            )},
        ])
    else:
        # Charla general: responde directo, sin agente de por medio
        final_reply = await chat([
            {"role": "system", "content": "Eres Rem, un asistente personal inteligente en español, breve, fluido y cordial."},
            {"role": "user", "content": user_text},
        ])

    _log_conversation(user_text, agent_name, action, final_reply)

    return {
        "reply": final_reply,
        "routed_agent": agent_name,
        "action": action,
        "agent_result": agent_result,
    }


def _log_conversation(user_text, agent_name, action, reply_text):
    try:
        db = get_db()
        db.table("conversation_log").insert({
            "user_text": user_text,
            "routed_agent": agent_name,
            "agent_action": action,
            "reply_text": reply_text,
        }).execute()
    except Exception:
        # El log es informativo; si Supabase no está configurado aún,
        # no debe romper la respuesta al usuario.
        pass
