from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PaperStatus = Literal["queued", "downloading", "parsing", "embedding", "analyzing", "ready", "failed"]


class PaperLinkIn(BaseModel):
    url: str = Field(min_length=4, max_length=2000)


class PaperOut(BaseModel):
    id: str
    title: str
    source: str
    url: str | None = None
    status: PaperStatus
    error: str | None = None
    page_count: int | None = None
    analysis: dict | None = None
    created_at: datetime


def paper_out(doc: dict) -> PaperOut:
    return PaperOut(id=str(doc["_id"]), **{k: doc.get(k) for k in PaperOut.model_fields if k != "id"})
