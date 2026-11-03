"""Chat endpoints. All three share one Q&A pipeline; they differ only in which papers are searched
and where history is kept: one paper, the user's whole library, or a comparison's papers."""
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.ai.chat import service as qa
from app.ai.chat.schemas import ChatIn, ChatMessage
from app.api.deps import current_user
from app.api.routes.comparisons import owned_comparison
from app.api.routes.papers import owned_paper
from app.core.database import papers

router = APIRouter(tags=["chat"])
CHATTABLE = ("analyzing", "ready")  # chunks exist from 'analyzing' on


def _stream(scope: str, titles: dict[str, str], question: str) -> StreamingResponse:
    return StreamingResponse(
        qa.stream_answer(scope, titles, question),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


async def _titles(query: dict) -> dict[str, str]:
    return {str(d["_id"]): d["title"] async for d in papers.find({**query, "status": {"$in": CHATTABLE}}, {"title": 1})}


# --- single paper ---
@router.get("/papers/{paper_id}/chat", response_model=list[ChatMessage])
async def paper_history(paper: dict = Depends(owned_paper)):
    return await qa.history(str(paper["_id"]))


@router.post("/papers/{paper_id}/chat")
async def paper_ask(body: ChatIn, paper: dict = Depends(owned_paper)):
    if paper["status"] not in CHATTABLE:
        raise HTTPException(409, "Paper is still being processed")
    pid = str(paper["_id"])
    return _stream(pid, {pid: paper["title"]}, body.question)


@router.delete("/papers/{paper_id}/chat", status_code=204)
async def paper_clear(paper: dict = Depends(owned_paper)):
    await qa.clear(str(paper["_id"]))


# --- whole library (dashboard) ---
@router.get("/library/chat", response_model=list[ChatMessage])
async def library_history(user: dict = Depends(current_user)):
    return await qa.history(qa.library_scope(user["_id"]))


@router.post("/library/chat")
async def library_ask(body: ChatIn, user: dict = Depends(current_user)):
    titles = await _titles({"user_id": user["_id"]})
    if not titles:
        raise HTTPException(409, "Add a paper and wait for it to be indexed first")
    return _stream(qa.library_scope(user["_id"]), titles, body.question)


@router.delete("/library/chat", status_code=204)
async def library_clear(user: dict = Depends(current_user)):
    await qa.clear(qa.library_scope(user["_id"]))


# --- comparison ---
@router.get("/comparisons/{comparison_id}/chat", response_model=list[ChatMessage])
async def comparison_history(doc: dict = Depends(owned_comparison)):
    return await qa.history(qa.comparison_scope(doc["_id"]))


@router.post("/comparisons/{comparison_id}/chat")
async def comparison_ask(body: ChatIn, doc: dict = Depends(owned_comparison)):
    titles = await _titles({"_id": {"$in": [ObjectId(p) for p in doc["paper_ids"]]}, "user_id": doc["user_id"]})
    if not titles:
        raise HTTPException(409, "The papers in this comparison were deleted")
    return _stream(qa.comparison_scope(doc["_id"]), titles, body.question)


@router.delete("/comparisons/{comparison_id}/chat", status_code=204)
async def comparison_clear(doc: dict = Depends(owned_comparison)):
    await qa.clear(qa.comparison_scope(doc["_id"]))
