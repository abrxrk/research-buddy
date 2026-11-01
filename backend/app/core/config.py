from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

    openrouter_api_key: str
    # Free models with structured-output support, tried in order. Override with a JSON array in .env.
    llm_models: list[str] = [
        "nvidia/nemotron-3.5-super-vl:free",
        "dots-studio/dots-3-note-preview:free",
        "xingchen-agi/xing4.0-29b-a4b:free",
        "liquid/lfm-2.5-2.6b:free",
    ]
    llm_fallback_model: str = "openrouter/free"  # last resort: auto free router
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "research_buddy"
    jwt_secret: str
    chroma_dir: Path = Path("data/chroma")
    upload_dir: Path = Path("data/uploads")
    frontend_origin: str = "http://localhost:3000"

    @field_validator("chroma_dir", "upload_dir")
    @classmethod
    def _abs(cls, p: Path) -> Path:
        p = p if p.is_absolute() else BASE_DIR / p
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
