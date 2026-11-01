"use client";

import { BookOpen, ListChecks, Network, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// Which paper lines get highlighted, and the margin note that appears for each.
const MARKS = [
  { line: 2, note: "Contribution", ref: "p.1 · Abstract" },
  { line: 6, note: "Method", ref: "p.3 · §3.2" },
  { line: 10, note: "Key finding", ref: "p.8 · §6.1" },
];
const LINE_WIDTHS = [96, 88, 92, 70, 0, 94, 86, 90, 78, 0, 92, 84, 60];
const TABS = [
  { icon: BookOpen, label: "Overview" },
  { icon: ListChecks, label: "Findings" },
  { icon: Network, label: "Graph" },
];
const STEP_MS = 1600;

function PaperPage({ step }: { step: number }) {
  const active = Math.min(step, MARKS.length);
  return (
    <div className="relative h-full rounded-lg bg-zinc-100 px-6 py-5 text-zinc-900 shadow-inner">
      <p className="text-center font-serif text-xl leading-tight">Attention Is All You Need</p>
      <p className="mt-1 text-center text-[9px] text-zinc-500">Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin</p>
      <p className="mt-4 mb-2 text-[10px] font-semibold tracking-wide uppercase">Abstract</p>
      <div className="space-y-[7px]">
        {LINE_WIDTHS.map((w, i) => {
          if (w === 0) return <div key={i} className="h-2" />;
          const markIdx = MARKS.findIndex((m) => m.line === i);
          const mark = markIdx !== -1 && markIdx < active ? MARKS[markIdx] : null;
          return (
            <div key={i} className="relative">
              <div className="relative h-[7px]" style={{ width: `${w}%` }}>
                <div className={cn("absolute -inset-x-1 -inset-y-[3px] origin-left rounded-sm bg-highlight/80 transition-transform duration-700", mark ? "scale-x-100" : "scale-x-0")} />
                <div className="relative h-full rounded-full bg-zinc-300" />
              </div>
              {/* margin note */}
              {mark && (
                <div className="animate-pop absolute -top-3 -right-10 z-10 hidden rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[10px] text-zinc-100 shadow-xl sm:block">
                  <span className="mr-1.5 inline-block size-1.5 rounded-full bg-highlight align-middle" />
                  {mark.note}
                  <span className="block font-mono text-[9px] text-zinc-400">{mark.ref}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightPanel({ tab }: { tab: number }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 rounded-lg bg-white/5 p-1">
        {TABS.map((t, i) => (
          <span key={t.label} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] transition-colors", tab === i ? "bg-white/10 text-foreground" : "text-muted-foreground")}>
            <t.icon className="size-3" /> {t.label}
          </span>
        ))}
      </div>
      <div key={tab} className="animate-pop mt-4 flex-1 text-[12px]">
        {tab === 0 && (
          <ul className="space-y-2.5">
            {["Transformer: attention only, no recurrence", "Multi-head self-attention", "SOTA translation at a fraction of the cost"].map((t) => (
              <li key={t} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-highlight" />{t}</li>
            ))}
          </ul>
        )}
        {tab === 1 && (
          <div className="space-y-3">
            {[["BLEU EN→DE", 28.4, 68], ["BLEU EN→FR", 41.8, 92], ["Training days", 3.5, 30]].map(([l, v, w]) => (
              <div key={l as string}>
                <div className="mb-1 flex justify-between"><span className="text-muted-foreground">{l}</span><span className="font-mono">{v}</span></div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full origin-left rounded-full bg-gradient-to-r from-highlight/60 to-highlight [animation:grow-x_0.9s_cubic-bezier(.2,.7,.2,1)_both]" style={{ width: `${w}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 2 && (
          <svg viewBox="0 0 220 120" className="w-full">
            {[[110, 60, 40, 25], [110, 60, 185, 30], [110, 60, 50, 100], [110, 60, 180, 98], [185, 30, 180, 98]].map(([a, b, c, d], i) => (
              <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="white" strokeOpacity=".3" strokeDasharray="120" style={{ animation: `draw 0.8s ${i * 0.12}s ease-out both` }} />
            ))}
            {[[110, 60, "Transformer", "#facc15"], [40, 25, "Attention", "#38bdf8"], [185, 30, "WMT 2014", "#34d399"], [50, 100, "Positional", "#38bdf8"], [180, 98, "BLEU", "#f472b6"]].map(([x, y, l, c], i) => (
              <g key={l as string} className="animate-pop" style={{ animationDelay: `${i * 0.1}s` }}>
                <circle cx={x} cy={y} r="5" fill={c as string} />
                <text x={x} y={(y as number) + 15} textAnchor="middle" fill="white" fillOpacity=".8" fontSize="9">{l}</text>
              </g>
            ))}
          </svg>
        )}
      </div>
      <div className="mt-3 rounded-lg border bg-background/60 p-2.5 text-[11px]">
        <p className="text-muted-foreground">How many attention heads?</p>
        <p className="mt-1">
          The base model uses <b>8 heads</b>
          <span className="ml-1 rounded bg-highlight px-1 font-mono text-[9px] text-zinc-900">p.5</span>
        </p>
      </div>
    </div>
  );
}

/** Looping mock of the app: the paper gets highlighted while insights cycle on the right. */
export function PaperDemo({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 9), STEP_MS);
    return () => clearInterval(id);
  }, []);
  const tab = Math.floor(step / 3) % TABS.length;

  return (
    <div className="rounded-2xl border bg-zinc-900/80 p-2 shadow-[0_40px_120px_-30px_rgb(250_204_21/0.25)] backdrop-blur">
      <div className="flex items-center gap-1.5 px-3 py-2">
        {["bg-red-400/80", "bg-yellow-400/80", "bg-green-400/80"].map((c) => <span key={c} className={cn("size-2.5 rounded-full", c)} />)}
        <span className="mx-auto flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-0.5 font-mono text-[10px] text-muted-foreground">
          <Sparkles className="size-3 text-highlight" /> research-buddy / attention-is-all-you-need
        </span>
      </div>
      <div className={cn("grid gap-2", compact ? "h-[380px] grid-cols-1" : "h-[400px] md:grid-cols-[1.25fr_1fr]")}>
        <PaperPage step={step % 4} />
        {!compact && (
          <div className="hidden rounded-lg border bg-card p-4 md:block">
            <InsightPanel tab={tab} />
          </div>
        )}
      </div>
    </div>
  );
}
