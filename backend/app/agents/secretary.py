"""
Agente de Secretaría: agenda, tareas/pendientes, correo (lectura + borradores).
"""

import imaplib
import email
from email.header import decode_header
from datetime import datetime

from ..database import get_db
from ..config import EMAIL_IMAP_HOST, EMAIL_ADDRESS, EMAIL_APP_PASSWORD
from ..llm_client import chat


# ---------- Tareas / Pendientes ----------

def add_todo(title: str, due_date: str | None = None, priority: str = "Medium"):
    db = get_db()
    row = {"title": title, "priority": priority}
    if due_date:
        row["due_date"] = due_date
    result = db.table("todos").insert(row).execute()
    return {"created": result.data}


def list_todos(status: str | None = None):
    db = get_db()
    query = db.table("todos").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return {"todos": result.data}


def complete_todo(todo_id: str):
    db = get_db()
    result = db.table("todos").update({"status": "done"}).eq("id", todo_id).execute()
    return {"updated": result.data}


# ---------- Correo (IMAP) ----------

def _connect_imap():
    if not EMAIL_ADDRESS or not EMAIL_APP_PASSWORD:
        raise RuntimeError(
            "Configura EMAIL_ADDRESS y EMAIL_APP_PASSWORD en el .env para leer correo."
        )
    conn = imaplib.IMAP4_SSL(EMAIL_IMAP_HOST)
    conn.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
    return conn


def list_unread_emails(limit: int = 5):
    conn = _connect_imap()
    conn.select("inbox")
    status, data = conn.search(None, "UNSEEN")
    ids = data[0].split()[-limit:]

    messages = []
    for eid in reversed(ids):
        status, msg_data = conn.fetch(eid, "(RFC822)")
        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)

        subject, encoding = decode_header(msg["Subject"])[0]
        if isinstance(subject, bytes):
            subject = subject.decode(encoding or "utf-8", errors="ignore")

        messages.append({"from": msg.get("From"), "subject": subject, "date": msg.get("Date")})

    conn.logout()
    return {"unread_emails": messages}


async def summarize_email(subject: str, body: str):
    reply = await chat([
        {"role": "system", "content": "Resume correos de forma breve y clara en español, en 2-3 líneas."},
        {"role": "user", "content": f"Asunto: {subject}\n\nCuerpo:\n{body}"},
    ])
    return {"summary": reply}


async def draft_email(instruction: str):
    """Genera un borrador de correo a partir de una instrucción por voz/texto."""
    reply = await chat([
        {"role": "system", "content": (
            "Eres un asistente que redacta correos formales en español a partir de "
            "instrucciones breves. Responde solo con el cuerpo del correo, sin explicaciones."
        )},
        {"role": "user", "content": instruction},
    ])

    db = get_db()
    db.table("email_drafts").insert({"body": reply, "subject": instruction[:80]}).execute()
    return {"draft": reply}


# ---------- Router de acciones del agente ----------

async def handle(action: str, params: dict):
    if action == "add_todo":
        return add_todo(params.get("title", ""), params.get("due_date"), params.get("priority", "Medium"))
    if action == "list_todos":
        return list_todos(params.get("status"))
    if action == "complete_todo":
        return complete_todo(params["todo_id"])
    if action == "list_unread_emails":
        return list_unread_emails(params.get("limit", 5))
    if action == "summarize_email":
        return await summarize_email(params.get("subject", ""), params.get("body", ""))
    if action == "draft_email":
        return await draft_email(params.get("instruction", ""))
    return {"error": f"Acción de secretaría desconocida: {action}"}
