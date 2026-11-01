"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Section } from "@/components/paper/Section";
import type { Findings } from "@/types";

const HEADLINE = 6;
const TABLE_PREVIEW = 8;

const PageTag = ({ page }: { page: number | null }) =>
  page ? <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">p.{page}</span> : null;

export function FindingsSection({ data }: { data: Findings }) {
  const [expanded, setExpanded] = useState(false);
  const withValue = data.results.filter((r) => r.value);
  const headline = withValue.slice(0, HEADLINE);
  const rest = [...withValue.slice(HEADLINE), ...data.results.filter((r) => !r.value)];
  const shown = expanded ? rest : rest.slice(0, TABLE_PREVIEW);

  return (
    <div className="space-y-8">
      <p className="text-[15px] leading-7">{data.summary}</p>

      {headline.length > 0 && (
        <Section title="Headline numbers">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {headline.map((r, i) => (
              <div key={i} className="flex flex-col rounded-2xl border bg-card/40 p-5 transition-colors hover:border-highlight/30">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-xs text-muted-foreground">{r.metric ?? "Result"}</p>
                  <PageTag page={r.page} />
                </div>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-highlight">{r.value}</p>
                <p className="mt-3 line-clamp-3 text-[13px] leading-snug text-muted-foreground">{r.finding}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {rest.length > 0 && (
        <Section title={`All results · ${data.results.length}`}>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-normal">Finding</th>
                  <th className="px-4 py-2.5 font-normal">Metric</th>
                  <th className="px-4 py-2.5 font-normal">Value</th>
                  <th className="px-4 py-2.5 font-normal">Page</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={i} className="border-t align-top transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3">{r.finding}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.metric ?? "—"}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap text-highlight">{r.value ?? "—"}</td>
                    <td className="px-4 py-3"><PageTag page={r.page} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rest.length > TABLE_PREVIEW && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex w-full items-center justify-center gap-1.5 border-t py-2.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground"
              >
                {expanded ? "Show less" : `Show all ${rest.length}`}
                <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
