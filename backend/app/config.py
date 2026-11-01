from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

    openrouter_api_key: str
    llm_model: str = "openrouter/free"
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
