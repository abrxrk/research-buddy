"""LangGraph Q&A workflow: rewrite follow-ups into standalone queries -> hybrid retrieve + rerank -> cited answer."""
import asyncio
from typing import TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.ai.llm import get_llm
from app.ai.rag.retrieval import FINAL_K, retrieve

ANSWER_SYSTEM = (
    "You are Research Buddy, an assistant answering questions about {scope}. "
    "Answer using ONLY the numbered passages below. Cite every claim with the passage number in "
    "square brackets, e.g. [1] or [2][3]. {naming}Never mention excerpts, passages, context or "
    "'the provided text'. If the answer isn't there, say the papers don't seem to cover it. "
    "Be concise and use markdown (lists, bold, tables) where it helps.\n\nPassages:\n{context}"
)
REWRITE_PROMPT = (
    "You turn follow-up questions into standalone search queries about research papers. If the latest question already "
    "makes sense on its own, reply with it UNCHANGED. Only when it refers back to the conversation (e.g. 'it', "
    "'that model', 'what about French?') replace those references with what they mean. Never add other details "
    "from the conversation. Reply with the query only.\n\nConversation:\n{history}\n\nLatest question: {question}"
)


# Multi-paper chats: one paper may fill at most this many of the FINAL_K passages, so a single paper
# (or a duplicate upload) can't crowd every other paper out of the answer.
PER_PAPER_CAP = 3


def cap_per_paper(ranked: list[dict], cap: int, k: int = FINAL_K) -> list[dict]:
    """Best-first, at most `cap` chunks per paper; tops up from the rest if that leaves fewer than k."""
    taken, counts = [], {}
    for c in ranked:
        if counts.get(c["paper_id"], 0) < cap:
            taken.append(c)
            counts[c["paper_id"]] = counts.get(c["paper_id"], 0) + 1
    rest = [c for c in ranked if c not in taken]
    return (taken + rest)[:k] if len(taken) < k else taken[:k]


class QAState(TypedDict):
    paper_ids: list[str]
    titles: dict[str, str]  # paper_id -> title
    question: str
    history: list[dict]  # [{role, content}], oldest first
    query: str
    sources: list[dict]
    answer: str


async def rewrite(state: QAState) -> dict:
    if not state["history"]:
        return {"query": state["question"]}
    history = "\n".join(f"{m['role']}: {m['content'][:500]}" for m in state["history"])
    reply = await get_llm(0).ainvoke(REWRITE_PROMPT.format(history=history, question=state["question"]))
    return {"query": reply.content.strip() or state["question"]}


async def retrieve_node(state: QAState) -> dict:
    # Search with both the user's words and the rewritten query, keeping each chunk's best reranker score,
    # so an over-eager rewrite can't hide the passage the original question would have found.
    queries = list(dict.fromkeys([state["question"], state["query"]]))
    multi = len(state["paper_ids"]) > 1
    k = FINAL_K * 3 if multi else FINAL_K + 3  # extra candidates so the per-paper cap can still fill FINAL_K
    results = await asyncio.gather(*(asyncio.to_thread(retrieve, state["paper_ids"], q, k) for q in queries))
    best: dict[str, dict] = {}
    for c in (c for group in results for c in group):
        if c["id"] not in best or c["score"] > best[c["id"]]["score"]:
            best[c["id"]] = c
    ranked = sorted(best.values(), key=lambda c: c["score"], reverse=True)
    chunks = cap_per_paper(ranked, PER_PAPER_CAP if multi else FINAL_K)
    return {"sources": [
        {"n": i + 1, **{k: c[k] for k in ("paper_id", "page", "pages", "section", "text")},
         "paper_title": state["titles"].get(c["paper_id"])}
        for i, c in enumerate(chunks)
    ]}


async def generate(state: QAState) -> dict:
    multi = len(state["paper_ids"]) > 1
    def header(s: dict) -> str:
        paper = f"paper: {s['paper_title']}, " if multi else ""
        return f"[{s['n']}] ({paper}page {s['pages']}, section: {s['section'] or 'n/a'})"

    context = "\n\n".join(f"{header(s)}\n{s['text']}" for s in state["sources"])
    system = ANSWER_SYSTEM.format(
        scope=f"a library of {len(state['paper_ids'])} research papers" if multi else "one research paper",
        naming="Say which paper each claim comes from, by its title. " if multi else "Speak about 'the paper'. ",
        context=context or "(no excerpts found)",
    )
    messages = [SystemMessage(system)]
    for m in state["history"]:
        messages.append(HumanMessage(m["content"]) if m["role"] == "user" else AIMessage(m["content"]))
    messages.append(HumanMessage(state["question"]))
    reply = await get_llm().ainvoke(messages)
    return {"answer": reply.content}


def build_graph():
    g = StateGraph(QAState)
    g.add_node("rewrite", rewrite)
    g.add_node("retrieve", retrieve_node)
    g.add_node("generate", generate)
    g.add_edge(START, "rewrite")
    g.add_edge("rewrite", "retrieve")
    g.add_edge("retrieve", "generate")
    g.add_edge("generate", END)
    return g.compile()


qa_graph = build_graph()


if __name__ == "__main__":
    ranked = [{"paper_id": p, "id": i} for i, p in enumerate("aaaaab")]
    assert [c["paper_id"] for c in cap_per_paper(ranked, 3)] == ["a", "a", "a", "b", "a"]
    assert [c["paper_id"] for c in cap_per_paper(ranked[:5], 3)] == ["a"] * 5  # only one paper relevant: top up
    print("cap_per_paper ok")
