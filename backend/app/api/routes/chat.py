from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.routes.papers import owned_paper
from app.models.chat import ChatIn, ChatMessage
from app.services import qa

router = APIRouter(prefix="/papers/{paper_id}/chat", tags=["chat"])


@router.get("", response_model=list[ChatMessage])
async def get_history(paper: dict = Depends(owned_paper)):
    return await qa.history(str(paper["_id"]))


@router.post("")
async def ask(body: ChatIn, paper: dict = Depends(owned_paper)):
    if paper["status"] not in ("analyzing", "ready"):  # chunks exist from 'analyzing' on
        raise HTTPException(409, "Paper is still being processed")
    return StreamingResponse(
        qa.stream_answer(str(paper["_id"]), body.question),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.delete("", status_code=204)
async def clear_history(paper: dict = Depends(owned_paper)):
    await qa.clear(str(paper["_id"]))
