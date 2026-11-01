"""Hybrid retrieval: dense (nomic + Chroma) + sparse (BM25), fused with RRF, then cross-encoder rerank."""
from functools import lru_cache

from rank_bm25 import BM25Okapi

from app.core.vectorstore import chunks as collection
from app.helpers.embeddings import embed_query
from app.helpers.reranker import rerank
from app.helpers.text import tokenize

CANDIDATES = 20  # top-k from each retriever and after fusion
FINAL_K = 5  # chunks sent to the LLM
RRF_K = 60


@lru_cache(maxsize=32)
def _bm25_index(paper_id: str):
    # ponytail: BM25 index built in memory per paper and cached; persist it if papers get huge.
    res = collection.get(where={"paper_id": paper_id}, include=["documents", "metadatas"])
    if not res["ids"]:
        return None, [], [], []
    return BM25Okapi([tokenize(d) for d in res["documents"]]), res["ids"], res["documents"], res["metadatas"]


def forget_paper(paper_id: str) -> None:
    _bm25_index.cache_clear()


def _dense(paper_id: str, query: str) -> list[str]:
    res = collection.query(query_embeddings=[embed_query(query)], n_results=CANDIDATES, where={"paper_id": paper_id})
    return res["ids"][0]


def _sparse(paper_id: str, query: str) -> list[str]:
    bm25, ids, _, _ = _bm25_index(paper_id)
    tokens = tokenize(query)
    if not bm25 or not tokens:
        return []
    scores = bm25.get_scores(tokens)
    ranked = sorted(range(len(ids)), key=lambda i: scores[i], reverse=True)
    return [ids[i] for i in ranked[:CANDIDATES] if scores[i] > 0]


def rrf(*rankings: list[str], k: int = RRF_K) -> list[str]:
    scores: dict[str, float] = {}
    for ranking in rankings:
        for rank, cid in enumerate(ranking):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores, key=scores.get, reverse=True)


def retrieve(paper_id: str, query: str, top_k: int = FINAL_K) -> list[dict]:
    """Return the top_k most relevant chunks: {id, text, page, pages, section, score}."""
    _, ids, docs, metas = _bm25_index(paper_id)
    if not ids:
        return []
    by_id = {cid: (d, m) for cid, d, m in zip(ids, docs, metas)}
    fused = rrf(_dense(paper_id, query), _sparse(paper_id, query))[:CANDIDATES]
    scores = rerank(query, [by_id[c][0] for c in fused])
    best = sorted(zip(fused, scores), key=lambda x: x[1], reverse=True)[:top_k]
    return [
        {"id": cid, "text": by_id[cid][0], "score": round(s, 4),
         "page": by_id[cid][1]["page"], "pages": by_id[cid][1]["pages"], "section": by_id[cid][1]["section"]}
        for cid, s in best
    ]


if __name__ == "__main__":
    assert rrf(["a", "b", "c"], ["c", "a"])[:2] == ["a", "c"]
    print("rrf ok")
