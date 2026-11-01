"""LangGraph workflow: generates the 5 paper insight sections in parallel, each grounded in retrieved chunks."""
import asyncio
import logging
import operator
from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.helpers.llm import get_structured_llm
from app.models.analysis import Findings, KnowledgeGraph, Limitations, Methodology, Overview
from app.services.retrieval import retrieve

log = logging.getLogger(__name__)
HEAD_CHARS = 6000  # start of the paper: title, authors, abstract, intro

SYSTEM = (
    "You are an expert research assistant analysing an academic paper. Use ONLY the provided excerpts. "
    "Never invent numbers, names or facts; use empty lists or null when something is not in the excerpts. "
    "Write for someone reading about the paper: never mention 'excerpts', 'the provided text', or yourself."
)


class AnalysisState(TypedDict):
    paper_id: str
    head: str
    results: Annotated[dict, operator.or_]
    errors: Annotated[list, operator.add]


async def _context(paper_id: str, queries: list[str], k: int = 5) -> str:
    hits = await asyncio.gather(*(asyncio.to_thread(retrieve, paper_id, q, k) for q in queries))
    seen, parts = set(), []
    for chunk in (c for group in hits for c in group):
        if chunk["id"] not in seen:
            seen.add(chunk["id"])
            parts.append(f"[page {chunk['pages']} | {chunk['section'] or 'n/a'}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def _section(key: str, schema, task: str, queries: list[str], use_head: bool = False):
    async def node(state: AnalysisState) -> dict:
        try:
            ctx = await _context(state["paper_id"], queries)
            if use_head:
                ctx = f"[start of paper]\n{state['head']}\n\n---\n\n{ctx}"
            out = await get_structured_llm(schema).ainvoke(
                [SystemMessage(SYSTEM), HumanMessage(f"Task: {task}\n\nPaper excerpts:\n{ctx}")]
            )
            if isinstance(out, KnowledgeGraph):
                out = out.cleaned()
            return {"results": {key: out.model_dump()}}
        except Exception as e:  # one failed section shouldn't sink the others
            log.exception("analysis section %s failed", key)
            return {"errors": [f"{key}: {e}"]}

    return node


SECTIONS = {
    "overview": _section(
        "overview", Overview,
        "Extract the paper title, authors, the abstract, the research objective, and the key contributions.",
        ["abstract summary of the paper", "main contributions of this work", "research problem and motivation"],
        use_head=True,
    ),
    "methodology": _section(
        "methodology", Methodology,
        "Explain the methodology: a plain-language summary, each technique/component with a short explanation, "
        "the models/architectures used, and the datasets used.",
        ["proposed method architecture", "model training procedure and implementation details",
         "datasets used for training and evaluation"],
    ),
    "findings": _section(
        "findings", Findings,
        "Extract the key findings. 'summary': 2-3 sentences stating the most important results with their numbers. "
        "For each result: 'finding' is one sentence (put comparisons with baselines here); 'metric' is a short readable "
        "name like 'BLEU (EN→DE)' or 'Training time'; 'value' is ONLY the number with its unit, e.g. '28.4', '3.5 days', "
        "'+2.0 BLEU' (null if there is no number); 'page' comes from the excerpt header.",
        ["experimental results and evaluation metrics", "comparison with baselines state of the art",
         "results table accuracy score performance", "ablation study"],
    ),
    "limitations": _section(
        "limitations", Limitations,
        "Identify limitations and weaknesses (stated by the authors or clearly implied by the excerpts) "
        "and future research directions.",
        ["limitations and weaknesses", "future work and research directions", "conclusion discussion"],
    ),
    "knowledge_graph": _section(
        "knowledge_graph", KnowledgeGraph,
        "Build a knowledge graph of the paper with 12-35 nodes covering key concepts, methods, models, datasets, "
        "tasks and metrics. Edges use short relations like 'uses', 'evaluated_on', 'improves', 'part_of', "
        "'measured_by', 'compared_with'. Every edge source/target must be an existing node id.",
        ["proposed method architecture components", "datasets and evaluation metrics", "tasks and baselines compared"],
        use_head=True,
    ),
}


def build_graph():
    g = StateGraph(AnalysisState)
    for name, fn in SECTIONS.items():
        g.add_node(name, fn)
        g.add_edge(START, name)
        g.add_edge(name, END)
    return g.compile()


analysis_graph = build_graph()


async def analyze_paper(paper_id: str, markdown: str) -> tuple[dict, list[str]]:
    state = await analysis_graph.ainvoke({"paper_id": paper_id, "head": markdown[:HEAD_CHARS], "results": {}, "errors": []})
    return state["results"], state["errors"]
