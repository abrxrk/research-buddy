"""Runs the Q&A graph and streams Server-Sent Events: sources -> answer tokens -> done."""
import json
import logging
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from app.ai.chat.graph import qa_graph
from app.core.database import chats

log = logging.getLogger(__name__)
# Previous messages (user + assistant) sent with each question: 6 = the last ~3 question/answer pairs.
# Kept small on purpose: we run on free OpenRouter models, whose context windows (and rate limits) are tight,
# and every turn already carries 5 retrieved passages. For a production agent on a paid LLM API we'd keep the
# full conversation instead, summarising older turns (rolling/hierarchical summaries) and retrieving relevant
# past exchanges, rather than simply dropping everything beyond this window.
HISTORY_TURNS = 6

# A chat "scope" is the history key: a paper id, "library:<user_id>" or "comparison:<id>".
# ponytail: stored in the chats' existing `paper_id` field to avoid a migration; rename to `scope` if it confuses.


def library_scope(user_id) -> str:
    return f"library:{user_id}"


def comparison_scope(comparison_id) -> str:
    return f"comparison:{comparison_id}"


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def history(scope: str, limit: int = 200) -> list[dict]:
    cursor = chats.find({"paper_id": scope}, {"_id": 0, "paper_id": 0}).sort("created_at", 1).limit(limit)
    return [m async for m in cursor]


async def stream_answer(scope: str, titles: dict[str, str], question: str) -> AsyncIterator[str]:
    """titles: {paper_id: title} of the papers to search."""
    past = (await history(scope))[-HISTORY_TURNS:]
    state = {
        "paper_ids": list(titles), "titles": titles, "question": question,
        "history": [{"role": m["role"], "content": m["content"]} for m in past],
    }
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
        log.exception("Q&A failed for %s", scope)
        rate_limited = "429" in str(e) or "rate limit" in str(e).lower()
        yield _sse("error", "The free AI models' daily limit has been reached. Please try again later."
                   if rate_limited else "The model failed to answer. Please try again.")
        return
    now = datetime.now(timezone.utc)
    await chats.insert_many([
        {"paper_id": scope, "role": "user", "content": question, "sources": [], "created_at": now},
        {"paper_id": scope, "role": "assistant", "content": answer, "sources": sources, "created_at": now},
    ])
    yield _sse("done", {})


async def clear(scope: str) -> None:
    await chats.delete_many({"paper_id": scope})
