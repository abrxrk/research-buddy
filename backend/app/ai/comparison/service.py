"""Comparison lifecycle: validate papers, save a record, run the multi-agent graph in the background."""
import logging
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.ai.chat import service as qa
from app.ai.comparison.graph import compare_graph
from app.core.database import comparisons, papers

log = logging.getLogger(__name__)


async def create(user_id: ObjectId, paper_ids: list[str]) -> dict:
    try:
        oids = [ObjectId(p) for p in paper_ids]
    except InvalidId:
        raise HTTPException(404, "Paper not found")
    found = {d["_id"]: d async for d in papers.find({"_id": {"$in": oids}, "user_id": user_id}, {"title": 1, "status": 1})}
    if len(found) != len(oids):
        raise HTTPException(404, "Paper not found")
    if any(d["status"] != "ready" for d in found.values()):
        raise HTTPException(409, "All papers must finish processing before they can be compared")
    doc = {
        "user_id": user_id,
        "paper_ids": paper_ids,
        "titles": [found[o]["title"] for o in oids],  # snapshot: survives paper deletion
        "status": "queued",
        "created_at": datetime.now(timezone.utc),
    }
    doc["_id"] = (await comparisons.insert_one(doc)).inserted_id
    return doc


async def _set(cid: str, **fields):
    await comparisons.update_one({"_id": ObjectId(cid)}, {"$set": fields})


async def run(cid: str) -> None:
    try:
        doc = await comparisons.find_one({"_id": ObjectId(cid)})
        by_id = {str(p["_id"]): p async for p in papers.find({"_id": {"$in": [ObjectId(p) for p in doc["paper_ids"]]}})}
        tasks = [
            {"n": i + 1, "paper_id": pid, "title": by_id[pid]["title"], "analysis": by_id[pid].get("analysis") or {}}
            for i, pid in enumerate(doc["paper_ids"])
            if pid in by_id
        ]
        if len(tasks) < 2:
            raise ValueError("Some of these papers were deleted; at least two are needed.")
        await _set(cid, status="briefing")
        done, result = 0, None
        async for update in compare_graph.astream({"papers": tasks, "briefs": []}, stream_mode="updates"):
            if "brief" in update:
                done += 1
                if done == len(tasks):
                    await _set(cid, status="synthesizing")
            elif "synthesize" in update:
                result = update["synthesize"]["result"]
        await _set(cid, status="ready", result=result)
    except Exception as e:
        log.exception("Comparison %s failed", cid)
        rate_limited = "429" in str(e) or "rate limit" in str(e).lower()
        await _set(cid, status="failed", error="The free AI models' rate limit was hit. Please retry later."
                   if rate_limited else f"Comparison failed: {e}")


async def reset_for_retry(cid: str) -> None:
    await comparisons.update_one({"_id": ObjectId(cid)}, {"$set": {"status": "queued"}, "$unset": {"error": "", "result": ""}})


async def delete(cid: str) -> None:
    await qa.clear(qa.comparison_scope(cid))
    await comparisons.delete_one({"_id": ObjectId(cid)})


async def fail_interrupted() -> None:
    await comparisons.update_many(
        {"status": {"$nin": ["ready", "failed"]}},
        {"$set": {"status": "failed", "error": "Server restarted during the comparison. Please retry."}},
    )
