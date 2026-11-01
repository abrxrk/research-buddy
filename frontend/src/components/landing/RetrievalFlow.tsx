import { Brain, Combine, Hash, MessageCircleQuestion, Search, SlidersHorizontal } from "lucide-react";

import { GlowCard } from "@/components/common/GlowCard";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

/** Animated dashed arrow between pipeline stages (vertical on mobile). */
function Flow() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-12 shrink-0 max-md:mx-auto max-md:rotate-90" aria-hidden>
      <line x1="0" y1="8" x2="40" y2="8" stroke="oklch(0.88 0.17 95)" strokeOpacity=".7" strokeWidth="1.5" strokeDasharray="4 4" className="animate-flow" />
      <path d="M40 4l6 4-6 4" fill="none" stroke="oklch(0.88 0.17 95)" strokeOpacity=".7" strokeWidth="1.5" />
    </svg>
  );
}

function Stage({ icon: Icon, title, note, accent = false }: { icon: typeof Search; title: string; note: string; accent?: boolean }) {
  return (
    <GlowCard className={accent ? "border-highlight/40 bg-highlight/[0.06]" : ""}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className={accent ? "size-4 text-highlight" : "size-4 text-muted-foreground"} />
        <div>
          <p className="text-sm font-medium whitespace-nowrap">{title}</p>
          <p className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">{note}</p>
        </div>
      </div>
    </GlowCard>
  );
}

export function RetrievalFlow() {
  return (
    <section id="retrieval" className="relative scroll-mt-24 overflow-hidden py-28">
      <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Under the hood"
          title={<>Retrieval that <span className="font-serif font-normal italic">doesn&apos;t miss</span></>}
          sub="Semantic and keyword search run side by side, then a cross-encoder picks the five passages that matter."
        />
        <Reveal className="mt-16 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-center">
          <Stage icon={MessageCircleQuestion} title="Your question" note="rewritten for context" />
          <Flow />
          <div className="flex flex-col gap-2">
            <Stage icon={Search} title="Dense search" note="nomic · top 20" />
            <Stage icon={Hash} title="BM25 keywords" note="exact terms · top 20" />
          </div>
          <Flow />
          <Stage icon={Combine} title="RRF fusion" note="merge rankings" />
          <Flow />
          <Stage icon={SlidersHorizontal} title="Reranker" note="cross-encoder · top 5" />
          <Flow />
          <Stage icon={Brain} title="Cited answer" note="LLM · [1][2]" accent />
        </Reveal>
        <Reveal delay={150} className="mx-auto mt-14 grid max-w-3xl grid-cols-3 divide-x rounded-2xl border bg-card/40">
          {[["40 → 5", "candidates to context"], ["5 models", "free LLM fallback chain"], ["100%", "answers with sources"]].map(([n, l]) => (
            <div key={l} className="px-4 py-5 text-center">
              <p className="text-2xl font-semibold tracking-tight">{n}</p>
              <p className="mt-1 text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
