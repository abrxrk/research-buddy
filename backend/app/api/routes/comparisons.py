from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.ai.comparison import service
from app.ai.comparison.schemas import ComparisonIn, ComparisonOut, comparison_out
from app.api.deps import current_user
from app.core.database import comparisons

router = APIRouter(prefix="/comparisons", tags=["comparisons"])


async def owned_comparison(comparison_id: str, user: dict = Depends(current_user)) -> dict:
    try:
        doc = await comparisons.find_one({"_id": ObjectId(comparison_id), "user_id": user["_id"]})
    except InvalidId:
        doc = None
    if not doc:
        raise HTTPException(404, "Comparison not found")
    return doc


@router.post("", response_model=ComparisonOut, status_code=201)
async def create(body: ComparisonIn, bg: BackgroundTasks, user: dict = Depends(current_user)):
    doc = await service.create(user["_id"], body.paper_ids)
    bg.add_task(service.run, str(doc["_id"]))
    return comparison_out(doc)


@router.get("", response_model=list[ComparisonOut])
async def list_comparisons(user: dict = Depends(current_user)):
    cursor = comparisons.find({"user_id": user["_id"]}, {"result": 0}).sort("created_at", -1)
    return [comparison_out(d) async for d in cursor]


@router.get("/{comparison_id}", response_model=ComparisonOut)
async def get_comparison(doc: dict = Depends(owned_comparison)):
    return comparison_out(doc)


@router.delete("/{comparison_id}", status_code=204)
async def delete(doc: dict = Depends(owned_comparison)):
    if doc["status"] not in ("ready", "failed"):
        raise HTTPException(409, "Comparison is still running")
    await service.delete(str(doc["_id"]))


@router.post("/{comparison_id}/retry", response_model=ComparisonOut)
async def retry(bg: BackgroundTasks, doc: dict = Depends(owned_comparison)):
    if doc["status"] != "failed":
        raise HTTPException(409, "Only failed comparisons can be retried")
    await service.reset_for_retry(str(doc["_id"]))
    bg.add_task(service.run, str(doc["_id"]))
    return comparison_out({**doc, "status": "queued", "error": None, "result": None})
