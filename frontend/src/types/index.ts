export type User = { id: string; email: string; name: string | null };
export type AuthResponse = { token: string; user: User };

export type PaperStatus = "queued" | "downloading" | "parsing" | "embedding" | "analyzing" | "ready" | "failed";

export type Overview = { title: string; authors: string[]; abstract: string; objective: string; contributions: string[] };
export type Methodology = { summary: string; techniques: { name: string; description: string }[]; models: string[]; datasets: string[] };
export type Findings = { summary: string; results: { finding: string; metric: string | null; value: string | null; page: number | null }[] };
export type Limitations = { limitations: string[]; future_work: string[] };
export type GraphNodeType = "concept" | "method" | "model" | "dataset" | "metric" | "task";
export type KnowledgeGraph = {
  nodes: { id: string; label: string; type: GraphNodeType }[];
  edges: { source: string; target: string; relation: string }[];
};
export type Analysis = Partial<{
  overview: Overview;
  methodology: Methodology;
  findings: Findings;
  limitations: Limitations;
  knowledge_graph: KnowledgeGraph;
}>;

export type Paper = {
  id: string;
  title: string;
  source: string;
  url: string | null;
  status: PaperStatus;
  error: string | null;
  page_count: number | null;
  analysis: Analysis | null;
  created_at: string;
};

export type Source = { n: number; page: number; pages: string; section: string; text: string };
export type ChatMessage = { role: "user" | "assistant"; content: string; sources: Source[]; created_at?: string };
