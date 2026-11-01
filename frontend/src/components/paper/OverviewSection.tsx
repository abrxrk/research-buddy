"use client";

import { useState } from "react";

import { Section } from "@/components/paper/Section";
import type { Overview } from "@/types";

export function OverviewSection({ data }: { data: Overview }) {
  const [full, setFull] = useState(false);
  return (
    <div className="space-y-8">
      {data.objective && (
        <figure className="relative overflow-hidden rounded-2xl border bg-card/60 p-6">
          <div className="absolute inset-y-0 left-0 w-1 bg-highlight" />
          <p className="mb-2 text-xs tracking-widest text-muted-foreground uppercase">In one line</p>
          <blockquote className="font-serif text-2xl leading-snug italic">{data.objective}</blockquote>
        </figure>
      )}

      <Section title={`Key contributions · ${data.contributions.length}`}>
        <ol className="grid gap-3 sm:grid-cols-2">
          {data.contributions.map((c, i) => (
            <li key={i} className="group flex gap-3 rounded-xl border bg-card/40 p-4 transition-colors hover:border-white/20">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-highlight/15 font-mono text-[11px] text-highlight transition-colors group-hover:bg-highlight group-hover:text-zinc-900">
                {i + 1}
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="Abstract"
        aside={data.abstract.length > 420 && (
          <button onClick={() => setFull((f) => !f)} className="text-xs text-muted-foreground hover:text-foreground">
            {full ? "Show less" : "Read full abstract"}
          </button>
        )}
      >
        <p className={full ? "whitespace-pre-line text-muted-foreground" : "line-clamp-5 text-muted-foreground"}>{data.abstract || "Not found."}</p>
      </Section>
    </div>
  );
}
