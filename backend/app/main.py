from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import chat, voice, secretary_routes, financial_routes, webhook

app = FastAPI(title="Rem Multi-Agent Backend")

# CORS abierto para simplificar desarrollo (app móvil + Tailscale).
# En producción, restringe "allow_origins" a tu dominio/IP real.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(secretary_routes.router)
app.include_router(financial_routes.router)
app.include_router(webhook.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "rem-backend"}


@app.get("/")
def root():
    return {"message": "Rem Multi-Agent Backend corriendo. Ver /docs para la API interactiva."}

