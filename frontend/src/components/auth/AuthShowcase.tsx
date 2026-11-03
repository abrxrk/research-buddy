/* eslint-disable @next/next/no-img-element -- small local logo SVGs */
import { Columns2, FileText, MessageSquareQuote } from "lucide-react";

const FEATURES = [
  { icon: FileText, title: "A summary of every paper", text: "Objective, method, results and limitations in plain language." },
  { icon: MessageSquareQuote, title: "Answers with citations", text: "Ask one paper or your whole library; every claim links to its page." },
  { icon: Columns2, title: "Side-by-side comparisons", text: "Pick 2 to 5 papers and see where they agree and differ." },
];
const SOURCES = [
  { label: "arXiv", logo: "/logos/sources/arxiv.svg" },
  { label: "DOI", logo: "/logos/sources/doi.svg" },
  { label: "OpenReview" },
  { label: "ACL Anthology" },
  { label: "PDF upload" },
];

const Cite = ({ n }: { n: number }) => (
  <span className="mx-0.5 inline-grid h-4 min-w-4 place-items-center rounded-sm bg-highlight px-1 align-text-top font-mono text-[10px] font-medium text-zinc-900">
    {n}
  </span>
);

/** Right-hand panel on the sign-in page: a static preview of a cited answer and what the app does. */
export function AuthShowcase() {
  return (
    <div className="mx-auto w-full max-w-md">
      <p className="text-xs text-muted-foreground">What you get</p>
      <h2 className="mt-2 text-xl leading-snug font-semibold tracking-tight text-balance">
        Read papers faster, with every answer traced back to its page.
      </h2>

      {/* Preview of a real chat exchange, drawn with the app's own styles */}
      <figure className="mt-8 rounded-lg border bg-background p-4 shadow-2xl shadow-black/40" aria-label="Example of a cited answer">
        <div className="flex items-center justify-between border-b pb-3 text-xs">
          <span className="font-medium">Ask about this paper</span>
          <span className="text-muted-foreground">BERT · 16 pages</span>
        </div>
        <p className="mt-4 ml-auto w-fit max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm">What does BERT do differently from GPT?</p>
        <p className="mt-4 text-sm leading-relaxed">
          BERT pre-trains a <strong className="font-medium">bidirectional</strong> Transformer with a masked language model, so every word
          sees context on both sides<Cite n={1} />. GPT reads text left to right only<Cite n={2} />.
        </p>
        <ol className="mt-3 space-y-1 border-t pt-3 font-mono text-[11px] text-muted-foreground">
          <li>[1] page 4 · 3.1 Pre-training BERT</li>
          <li>[2] page 2 · 2 Related Work</li>
        </ol>
      </figure>

      <ul className="mt-10 space-y-5">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-background">
              <Icon className="size-4 text-highlight" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 border-t pt-5">
        <p className="text-xs text-muted-foreground">Add papers from</p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {SOURCES.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5 rounded border bg-background px-2 py-1 text-xs">
              {s.logo && <img src={s.logo} alt="" className="size-3" />}
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
