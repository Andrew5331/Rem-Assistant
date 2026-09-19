"""
Capa de inferencia LLM. Soporta dos proveedores intercambiables:
- "ollama": Llama 3.2 / Mistral corriendo localmente (por defecto)
- "google": Google AI Studio (API en la nube, capa gratuita)

Ambos exponen la misma función `chat(messages, json_mode=False)` para que
el resto del backend no le importe cuál está activo.
"""

import json
import httpx
from .config import (
    OLLAMA_BASE_URL, OLLAMA_MODEL, LLM_PROVIDER, GOOGLE_AI_API_KEY
)


async def _chat_ollama(messages, json_mode=False):
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }
    if json_mode:
        payload["format"] = "json"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("message", {}).get("content", "").strip()


async def _chat_google(messages, json_mode=False):
    # Convierte el formato de mensajes estilo OpenAI/Ollama a Gemini
    contents = []
    system_prompt = ""
    for m in messages:
        if m["role"] == "system":
            system_prompt += m["content"] + "\n"
        else:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})

    if system_prompt and contents:
        contents[0]["parts"][0]["text"] = system_prompt + "\n" + contents[0]["parts"][0]["text"]

    body = {"contents": contents}
    if json_mode:
        body["generationConfig"] = {"response_mime_type": "application/json"}

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={GOOGLE_AI_API_KEY}"
    )

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=body)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


async def chat(messages, json_mode=False):
    """Envía una conversación al LLM activo y devuelve el texto de respuesta."""
    if LLM_PROVIDER == "google":
        return await _chat_google(messages, json_mode=json_mode)
    return await _chat_ollama(messages, json_mode=json_mode)


async def chat_json(messages, default=None):
    """Como chat(), pero intenta parsear la respuesta como JSON."""
    raw = await chat(messages, json_mode=True)
    try:
        # Por si el modelo envuelve el JSON en ```json ... ```
        cleaned = raw.strip().strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        return default if default is not None else {}
