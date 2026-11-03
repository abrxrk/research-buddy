"""Hybrid retrieval: dense (nomic + Chroma) + sparse (BM25), fused with RRF, then cross-encoder rerank."""
import asyncio
from functools import lru_cache

from rank_bm25 import BM25Okapi

from app.ai.rag.embeddings import embed_query
from app.ai.rag.reranker import rerank
from app.ai.rag.text import tokenize
from app.ai.rag.vectorstore import chunks as collection

CANDIDATES = 20  # top-k from each retriever and after fusion
FINAL_K = 5  # chunks sent to the LLM
RRF_K = 60


def where(paper_ids) -> dict:
    ids = sorted(set(paper_ids))
    return {"paper_id": ids[0]} if len(ids) == 1 else {"paper_id": {"$in": ids}}


@lru_cache(maxsize=32)
def _bm25_index(paper_ids: tuple):
    # ponytail: one in-memory BM25 per set of papers (a whole library for dashboard chat), rebuilt on any
    # paper change; persist or shard it if libraries get large.
    res = collection.get(where=where(paper_ids), include=["documents", "metadatas"])
    if not res["ids"]:
        return None, [], [], []
    return BM25Okapi([tokenize(d) for d in res["documents"]]), res["ids"], res["documents"], res["metadatas"]


def forget_paper(paper_id: str) -> None:
    _bm25_index.cache_clear()


def _dense(paper_ids: tuple, query: str) -> list[str]:
    res = collection.query(query_embeddings=[embed_query(query)], n_results=CANDIDATES, where=where(paper_ids))
    return res["ids"][0]


def _sparse(paper_ids: tuple, query: str) -> list[str]:
    bm25, ids, _, _ = _bm25_index(paper_ids)
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


def retrieve(paper_ids: list[str], query: str, top_k: int = FINAL_K) -> list[dict]:
    """Top_k most relevant chunks across the given papers: {id, paper_id, text, page, pages, section, score}."""
    if not paper_ids:
        return []
    key = tuple(sorted(set(paper_ids)))
    _, ids, docs, metas = _bm25_index(key)
    if not ids:
        return []
    by_id = {cid: (d, m) for cid, d, m in zip(ids, docs, metas)}
    fused = rrf(_dense(key, query), _sparse(key, query))
    # Drop identical chunks (e.g. the same paper uploaded twice) so copies can't fill every candidate slot.
    fused = list({by_id[c][0]: c for c in reversed(fused)}.values())[::-1][:CANDIDATES]
    scores = rerank(query, [by_id[c][0] for c in fused])
    best = sorted(zip(fused, scores), key=lambda x: x[1], reverse=True)[:top_k]
    return [
        {"id": cid, "paper_id": by_id[cid][1]["paper_id"], "text": by_id[cid][0], "score": round(s, 4),
         "page": by_id[cid][1]["page"], "pages": by_id[cid][1]["pages"], "section": by_id[cid][1]["section"]}
        for cid, s in best
    ]


async def build_context(paper_id: str, queries: list[str], k: int = 5) -> str:
    """Run several queries against one paper, dedupe the chunks and format them for an LLM prompt."""
    hits = await asyncio.gather(*(asyncio.to_thread(retrieve, [paper_id], q, k) for q in queries))
    seen, parts = set(), []
    for chunk in (c for group in hits for c in group):
        if chunk["id"] not in seen:
            seen.add(chunk["id"])
            parts.append(f"[page {chunk['pages']} | {chunk['section'] or 'n/a'}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


if __name__ == "__main__":
    assert rrf(["a", "b", "c"], ["c", "a"])[:2] == ["a", "c"]
    assert where(["a", "a"]) == {"paper_id": "a"}
    assert where(["b", "a"]) == {"paper_id": {"$in": ["a", "b"]}}
    print("rrf + where ok")
