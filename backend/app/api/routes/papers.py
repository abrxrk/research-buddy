from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.api.deps import current_user
from app.core.database import papers
from app.models.paper import PaperLinkIn, PaperOut, paper_out
from app.services import papers as paper_service
from app.services.downloader import MAX_BYTES, PaperDownloader

router = APIRouter(prefix="/papers", tags=["papers"])


async def owned_paper(paper_id: str, user: dict = Depends(current_user)) -> dict:
    try:
        doc = await papers.find_one({"_id": ObjectId(paper_id), "user_id": user["_id"]}, {"markdown": 0})
    except InvalidId:
        doc = None
    if not doc:
        raise HTTPException(404, "Paper not found")
    return doc


@router.post("/upload", response_model=PaperOut, status_code=201)
async def upload(bg: BackgroundTasks, file: UploadFile = File(...), user: dict = Depends(current_user)):
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "PDF is larger than 50MB")
    if not data.startswith(b"%PDF"):
        raise HTTPException(400, "File is not a PDF")
    title = (file.filename or "Untitled").removesuffix(".pdf")
    doc = await paper_service.create_paper(user["_id"], title, "upload")
    paper_service.pdf_path(str(doc["_id"])).write_bytes(data)
    bg.add_task(paper_service.process_paper, str(doc["_id"]))
    return paper_out(doc)


@router.post("/link", response_model=PaperOut, status_code=201)
async def from_link(body: PaperLinkIn, bg: BackgroundTasks, user: dict = Depends(current_user)):
    source, _ = PaperDownloader.resolve(body.url)
    doc = await paper_service.create_paper(user["_id"], body.url.strip(), source, body.url.strip())
    bg.add_task(paper_service.process_paper, str(doc["_id"]), body.url)
    return paper_out(doc)


@router.get("", response_model=list[PaperOut])
async def list_papers(user: dict = Depends(current_user)):
    cursor = papers.find({"user_id": user["_id"]}, {"markdown": 0, "analysis": 0}).sort("created_at", -1)
    return [paper_out(d) async for d in cursor]


@router.get("/{paper_id}", response_model=PaperOut)
async def get_paper(paper: dict = Depends(owned_paper)):
    return paper_out(paper)


@router.delete("/{paper_id}", status_code=204)
async def delete(paper: dict = Depends(owned_paper)):
    if paper["status"] not in ("ready", "failed"):
        raise HTTPException(409, "Paper is still processing")
    await paper_service.delete_paper(str(paper["_id"]))


@router.get("/{paper_id}/pdf")
async def get_pdf(paper: dict = Depends(owned_paper)):
    path = paper_service.pdf_path(str(paper["_id"]))
    if not path.exists():
        raise HTTPException(404, "PDF not available yet")
    return FileResponse(path, media_type="application/pdf", filename=f"{paper['title'][:80]}.pdf", content_disposition_type="inline")


@router.post("/{paper_id}/retry", response_model=PaperOut)
async def retry(bg: BackgroundTasks, paper: dict = Depends(owned_paper)):
    if paper["status"] != "failed":
        raise HTTPException(409, "Only failed papers can be retried")
    pid = str(paper["_id"])
    has_pdf = paper_service.pdf_path(pid).exists()
    if not has_pdf and not paper.get("url"):
        raise HTTPException(409, "Original file is missing; please upload it again")
    await paper_service.reset_for_retry(pid)
    bg.add_task(paper_service.process_paper, pid, None if has_pdf else paper["url"])
    return paper_out({**paper, "status": "queued", "error": None})
