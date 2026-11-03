import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai.comparison import service as comparison_service
from app.api.routes import auth, chat, comparisons, papers
from app.core.config import settings
from app.core.database import init_indexes
from app.services.papers import fail_interrupted

logging.basicConfig(level=logging.INFO)


def _warm_models():
    """Load (and on first run, download) the embedding + reranker models so the first request isn't slow."""
    from app.ai.rag.embeddings import embed_query
    from app.ai.rag.reranker import rerank

    embed_query("warmup")  # goes through the helpers' locks, so an early request just waits
    rerank("warmup", ["warmup"])
    logging.info("Models warmed up")


@asynccontextmanager
async def lifespan(_):
    await init_indexes()
    await fail_interrupted()
    await comparison_service.fail_interrupted()
    threading.Thread(target=_warm_models, daemon=True).start()  # background: server is up immediately
    yield


app = FastAPI(title="Research Buddy", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(papers.router)
app.include_router(comparisons.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"ok": True}
