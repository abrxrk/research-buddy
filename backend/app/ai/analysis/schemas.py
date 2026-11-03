"""Schemas for generated paper insights. Every field is required (strict JSON schema mode)."""
from typing import Literal

from pydantic import BaseModel, Field


class Overview(BaseModel):
    title: str
    authors: list[str]
    abstract: str = Field(description="The paper abstract, verbatim if present")
    objective: str = Field(description="The research question / goal in 1-3 sentences")
    contributions: list[str] = Field(description="Key contributions, one short sentence each")


class Technique(BaseModel):
    name: str
    description: str


class Methodology(BaseModel):
    summary: str = Field(description="Plain-language summary of the approach")
    techniques: list[Technique]
    models: list[str]
    datasets: list[str]


class Result(BaseModel):
    finding: str
    metric: str | None
    value: str | None
    page: int | None


class Findings(BaseModel):
    summary: str
    results: list[Result]


class Limitations(BaseModel):
    limitations: list[str]
    future_work: list[str]


class Node(BaseModel):
    id: str = Field(description="short snake_case id")
    label: str
    type: Literal["concept", "method", "model", "dataset", "metric", "task"]


class Edge(BaseModel):
    source: str
    target: str
    relation: str


class KnowledgeGraph(BaseModel):
    nodes: list[Node]
    edges: list[Edge]

    def cleaned(self, max_nodes: int = 40) -> "KnowledgeGraph":
        """Dedupe nodes, cap size, drop edges pointing at missing nodes."""
        unique: dict[str, Node] = {}
        for n in self.nodes:
            unique.setdefault(n.id, n)
        nodes = list(unique.values())[:max_nodes]
        ids = {n.id for n in nodes}
        edges = [e for e in self.edges if e.source in ids and e.target in ids and e.source != e.target]
        return KnowledgeGraph(nodes=nodes, edges=edges)


if __name__ == "__main__":
    g = KnowledgeGraph(
        nodes=[Node(id="a", label="A", type="method"), Node(id="a", label="dup", type="method"), Node(id="b", label="B", type="task")],
        edges=[Edge(source="a", target="b", relation="solves"), Edge(source="a", target="zzz", relation="x"), Edge(source="a", target="a", relation="self")],
    ).cleaned()
    assert [n.label for n in g.nodes] == ["A", "B"] and len(g.edges) == 1
    print("graph clean ok")
