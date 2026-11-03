from bson import ObjectId

from app.ai.analysis.graph import analyze_paper
from app.core.database import papers


async def run_analysis(paper_id: str, markdown: str) -> None:
    """Generate insights and store them on the paper; uses the extracted title if found."""
    results, errors = await analyze_paper(paper_id, markdown)
    update = {"analysis": results, "analysis_errors": errors}
    if title := results.get("overview", {}).get("title", "").strip():
        update["title"] = title
    await papers.update_one({"_id": ObjectId(paper_id)}, {"$set": update})
