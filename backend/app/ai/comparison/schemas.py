"""Schemas for multi-paper comparison: per-paper agent briefs and the orchestrator's synthesis."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

MAX_PAPERS = 5
ASPECTS = ["Methodology", "Datasets & Metrics", "Results", "Limitations"]
ComparisonStatus = Literal["queued", "briefing", "synthesizing", "ready", "failed"]


class ComparisonIn(BaseModel):
    paper_ids: list[str] = Field(min_length=2, max_length=MAX_PAPERS)

    @field_validator("paper_ids")
    @classmethod
    def unique(cls, v: list[str]) -> list[str]:
        if len(set(v)) != len(v):
            raise ValueError("paper_ids must be unique")
        return v


class PaperBrief(BaseModel):
    problem: str = Field(description="The problem the paper tackles, 1-2 sentences")
    approach: str = Field(description="How it solves it, 2-4 sentences")
    datasets: list[str]
    metrics: list[str]
    key_results: list[str] = Field(description="Main results with their numbers, one per item")
    strengths: list[str]
    limitations: list[str]


class PaperSummary(BaseModel):
    paper: int = Field(description="Paper number, as given in the briefs (1-based)")
    one_liner: str


class Overview(BaseModel):
    summary: str = Field(description="2-4 sentences: what these papers have in common and how they differ overall")
    papers: list[PaperSummary]


class PaperValue(BaseModel):
    paper: int = Field(description="Paper number (1-based)")
    value: str = Field(description="This paper's position on the aspect, one or two short sentences")


class Aspect(BaseModel):
    name: str
    summary: str
    similarities: list[str]
    differences: list[str]
    per_paper: list[PaperValue]


class Comparison(BaseModel):
    overview: Overview
    aspects: list[Aspect] = Field(description=f"Exactly these aspects, in order: {', '.join(ASPECTS)}")


class ComparisonOut(BaseModel):
    id: str
    paper_ids: list[str]
    titles: list[str]
    status: ComparisonStatus
    error: str | None = None
    result: dict | None = None
    created_at: datetime


def comparison_out(doc: dict) -> ComparisonOut:
    return ComparisonOut(id=str(doc["_id"]), **{k: doc.get(k) for k in ComparisonOut.model_fields if k != "id"})


if __name__ == "__main__":
    assert len(ComparisonIn(paper_ids=["a", "b"]).paper_ids) == 2
    for bad in (["a"], ["a", "a"], list("abcdef")):
        try:
            ComparisonIn(paper_ids=bad)
            raise AssertionError(f"accepted {bad}")
        except ValueError:
            pass
    print("comparison input ok")
