import threading
from functools import lru_cache

RERANK_MODEL = "BAAI/bge-reranker-base"
_lock = threading.Lock()  # concurrent first calls would load the model twice and crash


@lru_cache
def _model():
    from sentence_transformers import CrossEncoder

    return CrossEncoder(RERANK_MODEL)


def rerank(query: str, texts: list[str]) -> list[float]:
    """Cross-encoder relevance score per text (query and passage attend to each other jointly)."""
    if not texts:
        return []
    with _lock:
        return _model().predict([(query, t) for t in texts]).tolist()
