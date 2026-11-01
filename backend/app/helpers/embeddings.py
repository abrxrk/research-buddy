"""Nomic embeddings (local). Nomic needs task prefixes on every input."""
from functools import lru_cache

EMBED_MODEL = "nomic-ai/nomic-embed-text-v1.5"
MAX_TOKENS = 512  # chunk size; nomic supports up to 8192, smaller chunks retrieve better


@lru_cache
def _model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(EMBED_MODEL, trust_remote_code=True)


def embed_documents(texts: list[str]) -> list[list[float]]:
    vecs = _model().encode([f"search_document: {t}" for t in texts], batch_size=16, normalize_embeddings=True)
    return vecs.tolist()


def embed_query(text: str) -> list[float]:
    return _model().encode(f"search_query: {text}", normalize_embeddings=True).tolist()
