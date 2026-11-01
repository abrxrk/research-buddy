"""LangGraph Q&A workflow: rewrite follow-ups into standalone queries -> hybrid retrieve + rerank -> cited answer."""
import asyncio
from typing import TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.helpers.llm import get_llm
from app.services.retrieval import retrieve

ANSWER_SYSTEM = (
    "You are Research Buddy, an assistant answering questions about one research paper. "
    "Answer using ONLY the numbered excerpts below. Cite every claim with the excerpt number in square "
    "brackets, e.g. [1] or [2][3]. If the excerpts don't contain the answer, say so plainly. "
    "Be concise and use markdown (lists, bold, tables) where it helps.\n\nExcerpts:\n{context}"
)
REWRITE_PROMPT = (
    "Rewrite the user's latest question as a standalone search query about the paper, resolving references "
    "to earlier messages. Reply with the query only.\n\nConversation:\n{history}\n\nLatest question: {question}"
)


class QAState(TypedDict):
    paper_id: str
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
    chunks = await asyncio.to_thread(retrieve, state["paper_id"], state["query"])
    return {"sources": [{"n": i + 1, **{k: c[k] for k in ("page", "pages", "section", "text")}} for i, c in enumerate(chunks)]}


async def generate(state: QAState) -> dict:
    context = "\n\n".join(f"[{s['n']}] (page {s['pages']}, section: {s['section'] or 'n/a'})\n{s['text']}" for s in state["sources"])
    messages = [SystemMessage(ANSWER_SYSTEM.format(context=context or "(no excerpts found)"))]
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
