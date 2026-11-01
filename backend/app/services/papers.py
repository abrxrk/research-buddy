"""Paper lifecycle: create record, then download -> parse -> chunk -> embed in the background."""
import asyncio
import logging
from datetime import datetime, timezone

from bson import ObjectId

from app.core.config import settings
from app.core.database import chats, papers
from app.services import ingestion, retrieval
from app.services.analysis import run_analysis
from app.services.downloader import DownloadError, PaperDownloader

log = logging.getLogger(__name__)
# ponytail: one ingestion at a time (docling + embeddings are RAM/CPU heavy); use a task queue if multi-user load grows.
_ingest_lock = asyncio.Semaphore(1)


def pdf_path(paper_id: str):
    return settings.upload_dir / f"{paper_id}.pdf"


async def create_paper(user_id: ObjectId, title: str, source: str, url: str | None = None) -> dict:
    doc = {
        "user_id": user_id,
        "title": title,
        "source": source,
        "url": url,
        "status": "queued",
        "created_at": datetime.now(timezone.utc),
    }
    doc["_id"] = (await papers.insert_one(doc)).inserted_id
    return doc


async def _set(paper_id: str, **fields):
    await papers.update_one({"_id": ObjectId(paper_id)}, {"$set": fields})


async def process_paper(paper_id: str, link: str | None = None) -> None:
    try:
        async with _ingest_lock:
            if link:
                await _set(paper_id, status="downloading")
                source = await PaperDownloader().download(link, pdf_path(paper_id))
                await _set(paper_id, source=source)
            await _set(paper_id, status="parsing")
            doc, markdown, pages = await asyncio.to_thread(ingestion.parse_pdf, pdf_path(paper_id))
            chunks = await asyncio.to_thread(ingestion.chunk_document, doc)
            if not chunks:
                raise ValueError("No text could be extracted from this PDF.")
            await _set(paper_id, status="embedding", markdown=markdown, page_count=pages)
            await asyncio.to_thread(ingestion.store_chunks, paper_id, chunks)
        await _set(paper_id, status="analyzing", chunk_count=len(chunks))
        await run_analysis(paper_id, markdown)
        await _set(paper_id, status="ready")
    except DownloadError as e:
        await _set(paper_id, status="failed", error=str(e))
    except Exception as e:
        log.exception("Processing failed for paper %s", paper_id)
        await _set(paper_id, status="failed", error=f"Processing failed: {e}")


async def delete_paper(paper_id: str) -> None:
    await asyncio.to_thread(ingestion.delete_chunks, paper_id)
    retrieval.forget_paper(paper_id)
    pdf_path(paper_id).unlink(missing_ok=True)
    await chats.delete_many({"paper_id": paper_id})
    await papers.delete_one({"_id": ObjectId(paper_id)})


async def fail_interrupted() -> None:
    """Papers mid-pipeline when the server stopped will never finish; mark them failed."""
    await papers.update_many(
        {"status": {"$nin": ["ready", "failed"]}},
        {"$set": {"status": "failed", "error": "Server restarted during processing. Please re-upload."}},
    )
