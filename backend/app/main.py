import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, papers
from app.core.config import settings
from app.core.database import init_indexes
from app.services.papers import fail_interrupted

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_):
    await init_indexes()
    await fail_interrupted()
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


@app.get("/health")
def health():
    return {"ok": True}
