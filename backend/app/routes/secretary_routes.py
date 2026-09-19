from fastapi import APIRouter
from pydantic import BaseModel
from ..agents import secretary

router = APIRouter(prefix="/secretary", tags=["secretary"])


class TodoIn(BaseModel):
    title: str
    due_date: str | None = None
    priority: str = "Medium"


@router.get("/todos")
def get_todos(status: str | None = None):
    return secretary.list_todos(status)


@router.post("/todos")
def create_todo(payload: TodoIn):
    return secretary.add_todo(payload.title, payload.due_date, payload.priority)


@router.post("/todos/{todo_id}/complete")
def complete_todo(todo_id: str):
    return secretary.complete_todo(todo_id)


@router.get("/emails/unread")
def unread_emails(limit: int = 5):
    return secretary.list_unread_emails(limit)


class DraftIn(BaseModel):
    instruction: str


@router.post("/emails/draft")
async def draft_email(payload: DraftIn):
    return await secretary.draft_email(payload.instruction)
