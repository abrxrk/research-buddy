"""PDF -> Docling -> HybridChunker -> nomic embeddings -> Chroma."""
from functools import lru_cache
from pathlib import Path

from app.core.vectorstore import chunks as collection
from app.helpers.embeddings import EMBED_MODEL, MAX_TOKENS, embed_documents


@lru_cache
def _converter():
    from docling.document_converter import DocumentConverter

    return DocumentConverter()


@lru_cache
def _chunker():
    from docling.chunking import HybridChunker
    from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer

    return HybridChunker(tokenizer=HuggingFaceTokenizer.from_pretrained(EMBED_MODEL, max_tokens=MAX_TOKENS))


def parse_pdf(path: Path):
    """Returns (DoclingDocument, markdown, page_count)."""
    doc = _converter().convert(path).document
    return doc, doc.export_to_markdown(), len(doc.pages)


def chunk_document(doc) -> list[dict]:
    chunker = _chunker()
    out = []
    for i, ch in enumerate(chunker.chunk(doc)):
        pages = sorted({p.page_no for item in ch.meta.doc_items for p in item.prov})
        text = chunker.contextualize(ch)  # prepends section headings for better embeddings
        if not text.strip():
            continue
        out.append({
            "text": text,
            "page": pages[0] if pages else 0,
            "pages": ",".join(map(str, pages)),
            "section": " > ".join(ch.meta.headings or []),
            "chunk_idx": i,
        })
    return out


def store_chunks(paper_id: str, items: list[dict]) -> None:
    vectors = embed_documents([c["text"] for c in items])
    for start in range(0, len(items), 500):
        batch = items[start:start + 500]
        collection.add(
            ids=[f"{paper_id}:{c['chunk_idx']}" for c in batch],
            documents=[c["text"] for c in batch],
            embeddings=vectors[start:start + 500],
            metadatas=[{"paper_id": paper_id, **{k: c[k] for k in ("page", "pages", "section", "chunk_idx")}} for c in batch],
        )


def delete_chunks(paper_id: str) -> None:
    collection.delete(where={"paper_id": paper_id})
