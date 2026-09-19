from fastapi import APIRouter
from pydantic import BaseModel
from ..orchestrator import route_and_respond

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    text: str


@router.post("")
async def chat_endpoint(payload: ChatRequest):
    result = await route_and_respond(payload.text)
    return result
