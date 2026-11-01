import { BookOpen, FlaskConical, ListChecks, MessageSquareQuote, Network, Telescope, TriangleAlert } from "lucide-react";

import { CountUp } from "@/components/common/CountUp";
import { GlowCard } from "@/components/common/GlowCard";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

function CardHead({ icon: Icon, title, text }: { icon: typeof BookOpen; title: string; text: string }) {
  return (
    <div className="p-6 pb-0">
      <span className="mb-4 grid size-9 place-items-center rounded-lg border bg-white/[0.03]"><Icon className="size-4" /></span>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function OverviewVisual() {
  return (
    <div className="m-6 rounded-xl border bg-background/60 p-5">
      <p className="text-[11px] tracking-widest text-muted-foreground uppercase">Objective</p>
      <p className="mt-2 text-sm leading-6">
        Replace recurrence with <span className="highlight highlight-dark">attention alone</span> for sequence transduction.
      </p>
      <p className="mt-5 text-[11px] tracking-widest text-muted-foreground uppercase">Contributions</p>
      <ul className="mt-2 space-y-2 text-sm">
        {["The Transformer architecture", "Multi-head self-attention", "New SOTA at a fraction of training cost"].map((t, i) => (
          <li key={t} className="flex items-center gap-2 opacity-0 transition-opacity duration-500 [.is-visible_&]:opacity-100" style={{ transitionDelay: `${600 + i * 200}ms` }}>
            <span className="size-1.5 rounded-full bg-highlight" /> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MethodVisual() {
  const chips = ["Scaled dot-product", "Multi-head", "Positional encoding", "Residual + LayerNorm", "Label smoothing"];
  return (
    <div className="flex flex-wrap gap-2 p-6">
      {chips.map((c, i) => (
        <span key={c} className="rounded-full border bg-white/[0.03] px-3 py-1 text-xs opacity-0 transition-all duration-500 [.is-visible_&]:opacity-100 hover:border-highlight/50 hover:text-highlight" style={{ transitionDelay: `${300 + i * 120}ms` }}>
          {c}
        </span>
      ))}
    </div>
  );
}

function FindingsVisual() {
  return (
    <div className="grid grid-cols-2 gap-3 p-6">
      {[["BLEU EN→DE", 28.4, 1], ["BLEU EN→FR", 41.8, 1], ["Training days", 3.5, 1], ["Params (M)", 213, 0]].map(([l, v, d]) => (
        <div key={l as string} className="rounded-xl border bg-background/60 p-3">
          <p className="text-2xl font-semibold tracking-tight tabular-nums"><CountUp to={v as number} decimals={d as number} /></p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{l}</p>
        </div>
      ))}
    </div>
  );
}

const NODES: [number, number, string, string][] = [
  [260, 110, "Transformer", "#facc15"],
  [110, 55, "Self-attention", "#38bdf8"],
  [130, 175, "Positional enc.", "#38bdf8"],
  [420, 60, "WMT 2014", "#34d399"],
  [430, 170, "BLEU", "#f472b6"],
  [300, 205, "Encoder-decoder", "#a78bfa"],
];
const EDGES = [[0, 1], [0, 2], [0, 3], [3, 4], [0, 5], [1, 5], [0, 4]];

function GraphVisual() {
  return (
    <svg viewBox="0 0 540 240" className="w-full px-4 pb-4">
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]}
          stroke="white" strokeOpacity=".22" strokeDasharray="4 4"
          className="animate-flow"
        />
      ))}
      {NODES.map(([x, y, label, color], i) => (
        <g key={label} className="origin-center [transform-box:fill-box]" style={{ animation: `float ${5 + i}s ease-in-out ${i * 0.4}s infinite` }}>
          <circle cx={x} cy={y} r="18" fill={color} opacity=".12" />
          <circle cx={x} cy={y} r="7" fill={color} />
          <text x={x} y={y + 30} textAnchor="middle" fill="white" fillOpacity=".75" fontSize="12">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function LimitsVisual() {
  return (
    <div className="space-y-2 p-6 text-sm">
      <p className="flex gap-2 rounded-lg border-l-2 border-amber-400 bg-amber-400/5 p-3"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" /> Cost grows quadratically with sequence length</p>
      <p className="flex gap-2 rounded-lg border-l-2 border-emerald-400 bg-emerald-400/5 p-3"><Telescope className="mt-0.5 size-4 shrink-0 text-emerald-400" /> Future: images, audio and video inputs</p>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="space-y-2.5 p-6 text-sm">
      <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-foreground px-3.5 py-2 text-background">What optimizer did they use?</p>
      <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-2">
        Adam with β₁ = 0.9, β₂ = 0.98 and a warm-up schedule
        <span className="group/cite relative ml-1 inline-block">
          <span className="cursor-help rounded bg-highlight px-1 font-mono text-[10px] text-zinc-900">1</span>
          <span className="pointer-events-none absolute bottom-6 left-1/2 w-52 -translate-x-1/2 rounded-lg border bg-zinc-900 p-2.5 text-[11px] opacity-0 shadow-xl transition-opacity group-hover/cite:opacity-100">
            <b>p.7 · 5.3 Optimizer</b>
            <span className="mt-1 block text-muted-foreground">“We used the Adam optimizer with β1 = 0.9, β2 = 0.98…”</span>
          </span>
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">Hover the citation ↑</p>
    </div>
  );
}

const CARDS = [
  { span: "md:col-span-4", head: { icon: BookOpen, title: "Paper overview", text: "Abstract, research objective and key contributions in plain words." }, visual: <OverviewVisual /> },
  { span: "md:col-span-2", head: { icon: FlaskConical, title: "Methodology", text: "Every technique and model, explained." }, visual: <MethodVisual /> },
  { span: "md:col-span-2", head: { icon: ListChecks, title: "Key findings", text: "Results and metrics with page numbers." }, visual: <FindingsVisual /> },
  { span: "md:col-span-4", head: { icon: Network, title: "Knowledge graph", text: "Concepts, methods, datasets and metrics, and how they connect." }, visual: <GraphVisual /> },
  { span: "md:col-span-3", head: { icon: TriangleAlert, title: "Limitations", text: "Weaknesses and future directions, surfaced for you." }, visual: <LimitsVisual /> },
  { span: "md:col-span-3", head: { icon: MessageSquareQuote, title: "Cited Q&A", text: "Ask follow-ups; every claim links to its source." }, visual: <ChatVisual /> },
];

export function FeatureBento() {
  return (
    <section id="features" className="scroll-mt-24 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="Features" title={<>Six ways to <span className="font-serif font-normal italic">get it</span>, instantly</>} sub="Generated automatically the moment your paper is ready." />
        <div className="mt-16 grid gap-4 md:grid-cols-6">
          {CARDS.map((c, i) => (
            <Reveal key={c.head.title} delay={(i % 2) * 120} className={cn(c.span)}>
              <GlowCard className="flex h-full flex-col justify-between">
                <CardHead {...c.head} />
                {c.visual}
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
