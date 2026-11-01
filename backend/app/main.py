from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth
from app.core.config import settings
from app.core.database import init_indexes


@asynccontextmanager
async def lifespan(_):
    await init_indexes()
    yield


app = FastAPI(title="Research Buddy", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)


@app.get("/health")
def health():
    return {"ok": True}
