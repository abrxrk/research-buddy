import chromadb

from app.core.config import settings

_client = chromadb.PersistentClient(path=str(settings.chroma_dir))
# Embeddings are computed by us (nomic), so no embedding function on the collection.
chunks = _client.get_or_create_collection("paper_chunks", embedding_function=None, metadata={"hnsw:space": "cosine"})
