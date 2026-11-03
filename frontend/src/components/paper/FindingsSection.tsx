"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Section } from "@/components/paper/Section";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Kbd } from "@/components/ui/kbd";
import { Tip } from "@/components/ui/tooltip";
import { humanize, isHeadlineValue, plural } from "@/helpers/format";
import { useHotkey } from "@/hooks/useHotkey";
import { cn } from "@/lib/utils";
import type { Findings } from "@/types";

const HEADLINE = 4;
const TABLE_PREVIEW = 8;

type Row = Findings["results"][number];
type SortKey = "finding" | "metric" | "value" | "page";
type Sort = { key: SortKey; dir: 1 | -1 } | null;

// Values sort by their leading number ("9.1%" before "80.8"); rows without one go last, tied by text.
const num = (v: string | null) => {
  const m = String(v ?? "").match(/[-+]?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY;
};
const compare = (a: Row, b: Row, k: SortKey) => {
  if (k === "page") return (a.page ?? Number.POSITIVE_INFINITY) - (b.page ?? Number.POSITIVE_INFINITY);
  const x = (a[k] ?? "").toLowerCase(), y = (b[k] ?? "").toLowerCase();
  const byNum = k === "value" ? num(a.value) - num(b.value) : 0;
  return byNum && !Number.isNaN(byNum) ? byNum : x < y ? -1 : x > y ? 1 : 0;
};
const escapeCell = (s: string | number | null | undefined) => String(s ?? "—").replace(/\|/g, "\\|").replace(/\n/g, " ");

function toMarkdown(rows: Row[]) {
  const head = "| Finding | Metric | Value | Page |\n| --- | --- | --- | --- |";
  const body = rows.map((r) => `| ${escapeCell(r.finding)} | ${escapeCell(r.metric && humanize(r.metric))} | ${escapeCell(r.value)} | ${escapeCell(r.page)} |`);
  return [head, ...body].join("\n");
}

export function FindingsSection({ data }: { data: Findings }) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>(null);
  const filter = useRef<HTMLInputElement>(null);
  // "/" focuses the filter, like the library search and the concept-map search (other tabs are unmounted, so no clash).
  useHotkey("/", () => filter.current?.focus());

  // Short numeric values read well as headline numbers; everything goes in the table.
  const headline = data.results.filter((r) => isHeadlineValue(r.value)).slice(0, HEADLINE);

  const q = query.trim().toLowerCase();
  const rows = useMemo(() => {
    const filtered = q
      ? data.results.filter((r) => [r.finding, r.metric, r.value, r.page].some((v) => v != null && String(v).toLowerCase().includes(q)))
      : data.results;
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => compare(a, b, sort.key) * sort.dir);
  }, [data.results, q, sort]);

  const shown = expanded || q ? rows : rows.slice(0, TABLE_PREVIEW);
  const toggleSort = (key: SortKey) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  const th = (k: SortKey, label: string, className?: string, buttonClassName?: string) => {
    const active = sort?.key === k;
    const Icon = !active ? ArrowUpDown : sort!.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th key={k} scope="col" aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : "none"} className={cn("py-2 pr-4 font-normal", className)}>
        <Tip content={active ? (sort!.dir === 1 ? "Sorted ascending. Click to reverse" : "Sorted descending. Click to clear") : `Sort by ${label.toLowerCase()}`} side="bottom">
          <button
            type="button"
            onClick={() => toggleSort(k)}
            className={cn("group/th -ml-1 inline-flex items-center gap-1 rounded-sm px-1 hover:text-foreground", active && "text-foreground", buttonClassName)}
          >
            {label}
            <Icon className={cn("size-3 transition-opacity", active ? "opacity-100" : "opacity-0 group-hover/th:opacity-60")} aria-hidden />
          </button>
        </Tip>
      </th>
    );
  };

  return (
    <div className="space-y-10">
      {data.summary && (
        <Section title="In short">
          <p className="text-base leading-relaxed text-pretty">{data.summary}</p>
        </Section>
      )}

      {headline.length > 0 && (
        <Section title="Headline numbers" description="The shortest numeric results, pulled out so they're easy to spot." measure={false}>
          <dl className="grid grid-cols-2 gap-y-6 @xl:grid-cols-4 @xl:divide-x @xl:divide-border">
            {headline.map((r, i) => (
              <div key={i} className="min-w-0 @xl:px-5 @xl:first:pl-0 @xl:last:pr-0">
                <dd className="font-mono text-2xl leading-none font-semibold tracking-tight tabular-nums">{r.value}</dd>
                <dt className="mt-2 text-xs leading-snug text-muted-foreground text-pretty">
                  {r.metric ? humanize(r.metric) : "Result"}
                  {r.page ? (
                    <Tip content={`Reported on page ${r.page} of the PDF`}>
                      <span className="ml-1.5 inline-block rounded-sm border px-1 font-mono text-[10px] leading-4 text-muted-foreground">p.{r.page}</span>
                    </Tip>
                  ) : null}
                </dt>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {data.results.length > 0 && (
        <Section
          title="All results"
          count={data.results.length}
          description="Every result the paper reports, with the page it appears on. Click a column to sort."
          measure={false}
          aside={<CopyButton text={() => toMarkdown(rows)} label="Copy table as markdown" size="icon-sm" />}
        >
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <label className="group/filter flex h-7 w-full items-center gap-1.5 rounded-md border bg-background px-2 text-xs focus-within:border-ring sm:w-56">
              <Search className="size-3.5 text-muted-foreground" aria-hidden />
              <input
                ref={filter}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
                placeholder="Filter results"
                aria-label="Filter results"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear filter" className="text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              ) : (
                <Kbd className="h-4 min-w-4 text-[9.5px] group-focus-within/filter:hidden">/</Kbd>
              )}
            </label>
            {q && (
              <p className="text-xs text-muted-foreground" role="status">
                {rows.length ? `${rows.length} of ${plural(data.results.length, "result")} match` : "No results match"}
              </p>
            )}
          </div>
          {rows.length > 0 && (
            <div>
              <table className="w-full text-left text-sm">
                {/* Sits under the sticky tab strip (h-12), which itself sits under the mobile header (h-14) below lg. Metric folds under Finding on small screens. */}
                <thead className="sticky top-26 z-[1] lg:top-12 bg-background text-xs text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]">
                  <tr>
                    {th("finding", "Finding", "sm:min-w-48")}
                    {th("metric", "Metric", "hidden sm:table-cell")}
                    {th("value", "Value", "sm:min-w-40")}
                    {th("page", "Page", "pr-0 text-right", "-mr-1 ml-0 flex-row-reverse")}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shown.map((r, i) => (
                    <tr key={i} className="group/row align-top transition-colors hover:bg-muted/30">
                      <td className="py-3 pr-4 text-pretty">
                        {r.finding}
                        {r.metric && <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">{humanize(r.metric)}</span>}
                      </td>
                      <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">{r.metric ? humanize(r.metric) : "—"}</td>
                      <td className={cn("py-3 pr-4 tabular-nums", isHeadlineValue(r.value) && "font-medium whitespace-nowrap")}>{r.value ?? "—"}</td>
                      <td className="py-3 pr-0 text-right font-mono text-xs text-muted-foreground tabular-nums">{r.page ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!q && rows.length > TABLE_PREVIEW && (
            <Button variant="ghost" size="xs" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="mt-3 -ml-2 text-muted-foreground">
              {expanded ? "Show fewer" : `Show all ${plural(rows.length, "result")}`}
            </Button>
          )}
        </Section>
      )}
    </div>
  );
}
