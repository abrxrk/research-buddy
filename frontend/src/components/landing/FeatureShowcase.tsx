"use client";

import { BookOpen, FlaskConical, ListChecks, MessageSquareQuote, Network, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Paper overview",
    text: "Abstract, research objective and key contributions in seconds.",
    preview: (
      <>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Objective</p>
        <p>Replace recurrence with attention alone for sequence transduction.</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-indigo-600">Contributions</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>The Transformer architecture</li>
          <li>Multi-head self-attention</li>
          <li>State-of-the-art translation at a fraction of training cost</li>
        </ul>
      </>
    ),
  },
  {
    icon: FlaskConical,
    title: "Methodology breakdown",
    text: "Techniques and models explained in plain language.",
    preview: (
      <div className="space-y-2">
        {[["Scaled dot-product attention", "Weights values by query-key similarity"], ["Positional encoding", "Injects token order with sinusoids"], ["Encoder-decoder stack", "6 layers each, residual + layer norm"]].map(([a, b]) => (
          <div key={a} className="rounded-md border bg-background p-2">
            <p className="font-medium">{a}</p>
            <p className="text-muted-foreground">{b}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: ListChecks,
    title: "Key findings",
    text: "Important results and metrics, with page numbers.",
    preview: (
      <table className="w-full text-left">
        <thead className="text-xs text-muted-foreground"><tr><th className="pb-2">Metric</th><th>Value</th><th>Page</th></tr></thead>
        <tbody>
          <tr className="border-t"><td className="py-1.5">BLEU EN-DE</td><td className="font-semibold">28.4</td><td>p.8</td></tr>
          <tr className="border-t"><td className="py-1.5">BLEU EN-FR</td><td className="font-semibold">41.8</td><td>p.8</td></tr>
          <tr className="border-t"><td className="py-1.5">Training</td><td className="font-semibold">3.5 days</td><td>p.7</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    icon: TriangleAlert,
    title: "Limitations",
    text: "Weaknesses and future research directions surfaced for you.",
    preview: (
      <ul className="space-y-2">
        <li className="rounded-md border-l-2 border-amber-500 bg-amber-50 p-2">Quadratic cost in sequence length</li>
        <li className="rounded-md border-l-2 border-amber-500 bg-amber-50 p-2">Evaluated mainly on translation</li>
        <li className="rounded-md border-l-2 border-emerald-500 bg-emerald-50 p-2">Future: images, audio, video inputs</li>
      </ul>
    ),
  },
  {
    icon: Network,
    title: "Knowledge graph",
    text: "See how concepts, methods and datasets connect.",
    preview: (
      <svg viewBox="0 0 300 160" className="w-full">
        {[[150, 80, 60, 35], [150, 80, 250, 40], [150, 80, 70, 130], [150, 80, 240, 125], [250, 40, 240, 125]].map(([a, b, c, d], i) => (
          <line key={i} x1={a} y1={b} x2={c} y2={d} className="stroke-muted-foreground/40" strokeWidth="1.5" />
        ))}
        {[[150, 80, "Transformer", "fill-indigo-500"], [60, 35, "Attention", "fill-sky-500"], [250, 40, "WMT 2014", "fill-emerald-500"], [70, 130, "Positional enc.", "fill-sky-500"], [240, 125, "BLEU", "fill-amber-500"]].map(([x, y, l, c]) => (
          <g key={l as string}>
            <circle cx={x} cy={y} r="9" className={c as string} />
            <text x={x} y={(y as number) + 22} textAnchor="middle" className="fill-foreground text-[10px]">{l}</text>
          </g>
        ))}
      </svg>
    ),
  },
  {
    icon: MessageSquareQuote,
    title: "Interactive Q&A",
    text: "Ask anything, get answers cited to pages and sections.",
    preview: (
      <div className="space-y-2">
        <p className="ml-auto w-fit rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">How many attention heads?</p>
        <p className="w-fit rounded-lg bg-muted px-3 py-1.5">
          The base model uses <b>8 heads</b> <span className="rounded bg-indigo-100 px-1 text-xs text-indigo-700">p.5 · 3.2.2</span>
        </p>
      </div>
    ),
  },
];

export function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const feature = FEATURES[active];

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <div className="grid gap-2">
        {FEATURES.map((f, i) => (
          <button
            key={f.title}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
              i === active ? "border-indigo-300 bg-indigo-50/60 shadow-sm" : "border-transparent hover:bg-muted/60",
            )}
          >
            <f.icon className={cn("mt-0.5 size-5 shrink-0", i === active ? "text-indigo-600" : "text-muted-foreground")} />
            <span>
              <span className="block font-medium">{f.title}</span>
              <span className="block text-sm text-muted-foreground">{f.text}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 border-b pb-3">
          <feature.icon className="size-4 text-indigo-600" />
          <span className="text-sm font-medium">{feature.title}</span>
          <span className="ml-auto text-xs text-muted-foreground">Attention Is All You Need</span>
        </div>
        <div key={active} className="animate-in fade-in slide-in-from-bottom-2 text-sm duration-300">
          {feature.preview}
        </div>
      </div>
    </div>
  );
}
