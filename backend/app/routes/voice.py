import tempfile
import os
from fastapi import APIRouter, UploadFile, File
from faster_whisper import WhisperModel
from ..orchestrator import route_and_respond

router = APIRouter(prefix="/voice", tags=["voice"])

# "small" es buen balance velocidad/precisión en CPU.
_model = WhisperModel("small", device="cpu", compute_type="int8")


@router.post("/query")
async def voice_query(audio: UploadFile = File(...)):
    """Recibe audio grabado desde la app móvil, lo transcribe (Whisper local)
    y lo envía al orquestador para obtener una respuesta del agente adecuado."""
    with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        segments, _ = _model.transcribe(tmp_path, language="es")
        transcript = " ".join(s.text.strip() for s in segments).strip()
    finally:
        os.remove(tmp_path)

    if not transcript:
        return {"transcript": "", "reply": "No entendí el audio, ¿puedes repetirlo?"}

    result = await route_and_respond(transcript)
    return {"transcript": transcript, **result}
