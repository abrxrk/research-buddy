from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatIn(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class Source(BaseModel):
    n: int  # citation number used in the answer, e.g. [1]
    page: int
    pages: str
    section: str
    text: str
    paper_id: str | None = None  # set on new messages; older ones predate multi-paper chat
    paper_title: str | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    sources: list[Source] = []
    created_at: datetime
