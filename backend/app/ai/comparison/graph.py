"""LangGraph multi-agent comparison: one agent per paper writes a brief (stored analysis + targeted RAG),
then an orchestrator synthesizes similarities and differences across all briefs."""
import asyncio
import json
import operator
from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from app.ai.analysis.graph import SYSTEM
from app.ai.comparison.schemas import ASPECTS, Comparison, PaperBrief
from app.ai.llm import get_structured_llm
from app.ai.rag.retrieval import build_context

# Retrievals each paper agent runs on top of the stored analysis: the details comparisons hinge on.
COMPARE_QUERIES = [
    "experimental setup datasets and evaluation metrics",
    "main results compared with baselines",
    "proposed method key idea and architecture",
    "limitations assumptions and failure cases",
]
ANALYSIS_KEYS = ("overview", "methodology", "findings", "limitations")  # knowledge graph adds noise, skip it
# ponytail: at most 2 paper agents call the LLM at once (free-tier rate limits); raise on a paid API.
_llm_slots = asyncio.Semaphore(2)

ORCHESTRATOR = (
    "You are comparing research papers. Below are briefs of {n} papers, numbered 1..{n}. Using ONLY the briefs, "
    "write an overview (overall summary plus one line per paper) and compare the papers on exactly these "
    "aspects, in order: {aspects}. For each aspect give a short summary, the concrete similarities, the "
    "concrete differences, and each paper's position. Refer to papers by a short name (e.g. 'Transformer', "
    "'BERT'), not 'Paper 1'. Never mention briefs, excerpts or yourself. Never invent facts; if nothing is known "
    "about an aspect for a paper, say the paper doesn't report it."
)


class BriefTask(TypedDict):
    n: int
    paper_id: str
    title: str
    analysis: dict


class CompareState(TypedDict):
    papers: list[BriefTask]
    briefs: Annotated[list, operator.add]  # [(n, title, brief dict)], arrives in any order
    result: dict


async def brief(task: BriefTask) -> dict:
    analysis = {k: task["analysis"][k] for k in ANALYSIS_KEYS if k in task["analysis"]}
    ctx = await build_context(task["paper_id"], COMPARE_QUERIES, k=3)
    async with _llm_slots:
        out = await get_structured_llm(PaperBrief).ainvoke([
            SystemMessage(SYSTEM),
            HumanMessage(
                "Task: write a brief of this paper for comparing it with other papers.\n\n"
                f"Paper title: {task['title']}\n\nStored analysis:\n{json.dumps(analysis)[:8000]}\n\nPaper excerpts:\n{ctx}"
            ),
        ])
    return {"briefs": [(task["n"], task["title"], out.model_dump())]}


async def synthesize(state: CompareState) -> dict:
    briefs = sorted(state["briefs"])
    text = "\n\n".join(f"## Paper {n}: {title}\n{json.dumps(b)}" for n, title, b in briefs)
    out = await get_structured_llm(Comparison).ainvoke([
        SystemMessage(ORCHESTRATOR.format(n=len(briefs), aspects=", ".join(ASPECTS))),
        HumanMessage(text),
    ])
    return {"result": out.model_dump()}


def fan_out(state: CompareState) -> list[Send]:
    return [Send("brief", p) for p in state["papers"]]


def build_graph():
    g = StateGraph(CompareState)
    g.add_node("brief", brief)
    g.add_node("synthesize", synthesize)
    g.add_conditional_edges(START, fan_out, ["brief"])
    g.add_edge("brief", "synthesize")
    g.add_edge("synthesize", END)
    return g.compile()


compare_graph = build_graph()
