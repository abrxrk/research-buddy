"""Runs the Q&A graph and streams Server-Sent Events: sources -> answer tokens -> done."""
import json
import logging
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from app.agents.qa_graph import qa_graph
from app.core.database import chats

log = logging.getLogger(__name__)
# Previous messages (user + assistant) sent with each question: 6 = the last ~3 question/answer pairs.
# Kept small on purpose: we run on free OpenRouter models, whose context windows (and rate limits) are tight,
# and every turn already carries 5 retrieved passages. For a production agent on a paid LLM API we'd keep the
# full conversation instead, summarising older turns (rolling/hierarchical summaries) and retrieving relevant
# past exchanges, rather than simply dropping everything beyond this window.
HISTORY_TURNS = 6


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def history(paper_id: str, limit: int = 200) -> list[dict]:
    cursor = chats.find({"paper_id": paper_id}, {"_id": 0, "paper_id": 0}).sort("created_at", 1).limit(limit)
    return [m async for m in cursor]


async def stream_answer(paper_id: str, question: str) -> AsyncIterator[str]:
    past = (await history(paper_id))[-HISTORY_TURNS:]
    state = {"paper_id": paper_id, "question": question, "history": [{"role": m["role"], "content": m["content"]} for m in past]}
    answer, sources = "", []
    try:
        async for mode, payload in qa_graph.astream(state, stream_mode=["updates", "messages"]):
            if mode == "updates" and "retrieve" in payload:
                sources = payload["retrieve"]["sources"]
                yield _sse("sources", sources)
            elif mode == "messages":
                chunk, meta = payload
                if meta.get("langgraph_node") == "generate" and chunk.content:
                    answer += chunk.content
                    yield _sse("token", chunk.content)
    except Exception as e:
        log.exception("Q&A failed for paper %s", paper_id)
        rate_limited = "429" in str(e) or "rate limit" in str(e).lower()
        yield _sse("error", "The free AI models' daily limit has been reached. Please try again later."
                   if rate_limited else "The model failed to answer. Please try again.")
        return
    now = datetime.now(timezone.utc)
    await chats.insert_many([
        {"paper_id": paper_id, "role": "user", "content": question, "sources": [], "created_at": now},
        {"paper_id": paper_id, "role": "assistant", "content": answer, "sources": sources, "created_at": now},
    ])
    yield _sse("done", {})


async def clear(paper_id: str) -> None:
    await chats.delete_many({"paper_id": paper_id})
