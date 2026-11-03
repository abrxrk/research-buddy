"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, FileText, Search, SearchX, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { MAX_COMPARE } from "@/api/comparisons";
import { pickExample } from "@/components/dashboard/AddPaperBar";
import { CompareBar } from "@/components/dashboard/CompareBar";
import { DeletePaperDialog } from "@/components/dashboard/DeletePaperDialog";
import { PaperRow } from "@/components/dashboard/PaperRow";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { Tip } from "@/components/ui/tooltip";
import { isProcessing, parseDate, plural, STEPS } from "@/helpers/format";
import { sourceInfo } from "@/helpers/source";
import { isTyping, useHotkey } from "@/hooks/useHotkey";
import { cn } from "@/lib/utils";
import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

type Filter = "all" | "ready" | "processing" | "failed";
const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["ready", "Ready"],
  ["processing", "Processing"],
  ["failed", "Failed"],
];
const matches = (p: Paper, f: Filter) => f === "all" || (f === "processing" ? isProcessing(p.status) : p.status === f);

type SortKey = "title" | "status" | "added";
type Sort = { key: SortKey; dir: "asc" | "desc" };
const STATUS_RANK: Paper["status"][] = ["queued", ...STEPS, "ready", "failed"];
const BY: Record<SortKey, (a: Paper, b: Paper) => number> = {
  title: (a, b) =>
    a.title.localeCompare(b.title, undefined, {
      sensitivity: "base",
      numeric: true,
    }),
  status: (a, b) => STATUS_RANK.indexOf(a.status) - STATUS_RANK.indexOf(b.status),
  added: (a, b) => parseDate(a.created_at).getTime() - parseDate(b.created_at).getTime(),
};
const DEFAULT_DIR: Record<SortKey, Sort["dir"]> = {
  title: "asc",
  status: "asc",
  added: "desc",
};

function SortHeader({ col, label, sort, onSort, className }: { col: SortKey; label: string; sort: Sort; onSort: (k: SortKey) => void; className?: string }) {
  const active = sort.key === col;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={cn("px-0 text-left font-normal", className)}>
      <Tip content={`Sort by ${col === "title" ? "title" : label.toLowerCase()}`}>
        <button
          type="button"
          onClick={() => onSort(col)}
          className={cn("group/th -ml-1.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 transition-colors hover:text-foreground", active && "text-foreground")}
        >
          {label}
          <Icon className={cn("size-3 transition-opacity", active ? "opacity-100" : "opacity-0 group-hover/th:opacity-60")} aria-hidden />
        </button>
      </Tip>
    </th>
  );
}

const rowOf = (el: Element | null) => el?.closest<HTMLTableRowElement>("tr[data-id]") ?? null;

/** The library as a table. Ticking ready papers selects them for a side-by-side comparison. */
export function PaperGrid() {
  const { papers, loading } = usePaperStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>({ key: "added", dir: "desc" });
  const [toDelete, setToDelete] = useState<Paper | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const lastPick = useRef<string | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const table = useRef<HTMLTableElement>(null);

  const q = query.trim().toLowerCase();
  const visible = papers
    .filter((p) => matches(p, filter) && (!q || p.title.toLowerCase().includes(q) || sourceInfo(p.source).label.toLowerCase().includes(q)))
    .sort((a, b) => (sort.dir === "asc" ? 1 : -1) * BY[sort.key](a, b));
  // drop selections whose paper was deleted or is no longer ready
  const picked = selected.filter((id) => papers.some((p) => p.id === id && p.status === "ready"));
  const pickedPapers = picked.map((id) => papers.find((p) => p.id === id)!);
  const readyVisible = visible.filter((p) => p.status === "ready");
  const allPicked = readyVisible.length > 0 && readyVisible.every((p) => picked.includes(p.id));
  const somePicked = !allPicked && readyVisible.some((p) => picked.includes(p.id));

  function select(ids: string[]) {
    if (ids.length > MAX_COMPARE) {
      toast.error(`You can compare up to ${MAX_COMPARE} papers at a time.`);
      return;
    }
    setSelected(ids);
  }

  function toggle(id: string, shift = false) {
    const i = visible.findIndex((p) => p.id === id);
    const last = visible.findIndex((p) => p.id === lastPick.current);
    lastPick.current = id;
    if (shift && last >= 0 && i >= 0) {
      const [from, to] = last < i ? [last, i] : [i, last];
      const range = visible
        .slice(from, to + 1)
        .filter((p) => p.status === "ready")
        .map((p) => p.id);
      return select(Array.from(new Set([...picked, ...range])));
    }
    if (picked.includes(id)) return setSelected(picked.filter((x) => x !== id));
    select([...picked, id]);
  }

  function toggleAll() {
    if (allPicked) return setSelected([]);
    const ids = readyVisible.slice(0, MAX_COMPARE).map((p) => p.id);
    setSelected(ids);
    if (readyVisible.length > MAX_COMPARE)
      toast(`Selected the first ${MAX_COMPARE}`, {
        description: `You can compare up to ${MAX_COMPARE} papers at a time.`,
      });
  }

  const onSort = (key: SortKey) =>
    setSort((s) => ({
      key,
      dir: s.key === key ? (s.dir === "asc" ? "desc" : "asc") : DEFAULT_DIR[key],
    }));

  // Keyboard: "/" search, j/k or arrows move between rows, x ticks, Backspace deletes, Esc clears the selection
  function moveFocus(delta: 1 | -1) {
    const rows = Array.from(table.current?.querySelectorAll<HTMLTableRowElement>("tr[data-id]") ?? []);
    if (!rows.length) return;
    const i = rows.indexOf(rowOf(document.activeElement)!);
    const next = rows[i < 0 ? (delta > 0 ? 0 : rows.length - 1) : Math.min(rows.length - 1, Math.max(0, i + delta))];
    next.querySelector<HTMLAnchorElement>("a[href]")?.focus();
    next.scrollIntoView({ block: "nearest" });
  }
  const modal = !!toDelete;
  useHotkey("/", () => search.current?.focus(), { enabled: !modal });
  useHotkey("j", () => moveFocus(1), { enabled: !modal });
  useHotkey("k", () => moveFocus(-1), { enabled: !modal });
  // Esc in a text box only clears that box; the global Esc fires for everything else (useHotkey always passes Escape through)
  useHotkey("escape", (e) => !isTyping(e.target) && setSelected([]), {
    enabled: picked.length > 0 && !modal,
  });

  // Arrows only inside the table, so they don't hijack page or chat scrolling
  function onTableKey(e: React.KeyboardEvent) {
    const row = rowOf(e.target as Element);
    if (!row || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      return moveFocus(e.key === "ArrowDown" ? 1 : -1);
    }
    const paper = papers.find((p) => p.id === row.dataset.id);
    if (!paper) return;
    if (e.key === "x" && paper.status === "ready") {
      e.preventDefault();
      toggle(paper.id, e.shiftKey);
    } else if ((e.key === "Backspace" || e.key === "Delete") && !isProcessing(paper.status)) {
      e.preventDefault();
      setToDelete(paper);
    }
  }

  const clearSearch = () => {
    setQuery("");
    setFilter("all");
  };

  const hasRows = loading || papers.length > 0;
  const focusAfterDelete = () => table.current?.querySelector<HTMLElement>("tr[data-id] a[href]") ?? search.current;

  return (
    <section aria-labelledby="papers" className={cn(picked.length > 0 && "pb-16")}>
      {hasRows && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 id="papers" className="mr-auto text-sm font-medium">
            Papers{" "}
            {visible.length !== papers.length && (
              <span className="font-normal tabular-nums text-muted-foreground">
                {visible.length} of {papers.length}
              </span>
            )}
          </h2>
          <div className="no-scrollbar flex max-w-full overflow-x-auto rounded-md border bg-card p-0.5 text-xs" role="group" aria-label="Filter papers">
            {FILTERS.map(([key, label]) => {
              const n = papers.filter((p) => matches(p, key)).length;
              if (!n && key !== "all" && filter !== key) return null; // nothing to filter to
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn("shrink-0 rounded px-2.5 py-1 transition-colors", filter === key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {label} <span className={cn("tabular-nums", key === "failed" && n ? "text-red-300" : "opacity-60")}>{n}</span>
                </button>
              );
            })}
          </div>
          <label className="group/search flex h-8 w-full items-center gap-2 rounded-md border bg-card px-2.5 text-sm transition-colors focus-within:border-ring sm:w-52">
            <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="sr-only">Search papers</span>
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault(); // clears only the search, not the compare selection
                  setQuery("");
                  e.currentTarget.blur();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  moveFocus(1);
                }
              }}
              placeholder="Search"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="grid size-5 place-items-center rounded-sm text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            ) : (
              <Kbd className="group-focus-within/search:hidden">/</Kbd>
            )}
          </label>
        </div>
      )}

      <div className="overflow-clip rounded-lg border bg-card/40">
        <table ref={table} onKeyDown={onTableKey} className="w-full table-fixed border-collapse text-sm">
          {hasRows && (
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b [&>th]:sticky [&>th]:top-14 [&>th]:z-10 [&>th]:h-9 [&>th]:bg-card [&>th]:text-left [&>th]:align-middle lg:[&>th]:top-0">
                <th scope="col" className="w-10 pl-4">
                  <Tip content={allPicked ? "Clear selection" : `Select ready papers${readyVisible.length > MAX_COMPARE ? ` (first ${MAX_COMPARE})` : ""}`}>
                    <span className="inline-flex">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={allPicked}
                        ref={(el) => {
                          if (el) el.indeterminate = somePicked;
                        }}
                        disabled={!readyVisible.length}
                        onChange={toggleAll}
                        aria-label="Select all ready papers"
                      />
                    </span>
                  </Tip>
                </th>
                <SortHeader col="title" label="Paper" sort={sort} onSort={onSort} className="pr-4" />
                <SortHeader col="status" label="Status" sort={sort} onSort={onSort} className="hidden w-44 pr-4 md:table-cell" />
                <SortHeader col="added" label="Added" sort={sort} onSort={onSort} className="hidden w-24 pr-4 md:table-cell" />
                <th scope="col" className="w-16 md:w-24">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
          )}
          <tbody>{!loading && visible.map((p) => <PaperRow key={p.id} paper={p} checked={picked.includes(p.id)} onToggle={(shift) => toggle(p.id, shift)} onDelete={() => setToDelete(p)} />)}</tbody>
        </table>

        {loading ? (
          <div aria-busy="true" aria-label="Loading papers">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
                <Skeleton className="size-4 rounded-sm" />
                <div className="flex-1 space-y-2">
                  <Skeleton className={cn("h-4", ["w-80", "w-56", "w-72"][i])} />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="hidden h-3 w-16 md:block" />
                <Skeleton className="hidden h-3 w-20 md:block" />
                <span className="w-24" />
              </div>
            ))}
          </div>
        ) : !papers.length ? (
          <EmptyState
            icon={FileText}
            title="No papers yet"
            description="Paste a link or upload a PDF above. Each paper is read, indexed and summarised automatically, then you can ask questions about it."
          >
            <Button variant="outline" size="sm" onClick={() => pickExample()}>
              Try an example
            </Button>
          </EmptyState>
        ) : !visible.length ? (
          <EmptyState icon={SearchX} title={q ? `Nothing matches “${query.trim()}”` : `No ${filter} papers`} description={q ? "Try a different word or clear the search." : undefined}>
            <Button variant="outline" size="sm" onClick={clearSearch}>
              Show all papers
            </Button>
          </EmptyState>
        ) : null}
      </div>

      {papers.length > 0 && !loading && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <p>{picked.length ? `${plural(picked.length, "paper")} selected` : `Tick 2 to ${MAX_COMPARE} ready papers to compare them.`}</p>
          <p className="hidden items-center gap-1 md:flex" aria-label="Keyboard shortcuts">
            <Kbd>/</Kbd> search <span className="mx-1 opacity-40">·</span>
            <Kbd>j</Kbd>
            <Kbd>k</Kbd> move <span className="mx-1 opacity-40">·</span>
            <Kbd combo="enter" /> open <span className="mx-1 opacity-40">·</span>
            <Kbd>x</Kbd> select <span className="mx-1 opacity-40">·</span>
            <Kbd combo="backspace" /> delete
          </p>
        </div>
      )}

      {picked.length > 0 && <CompareBar papers={pickedPapers} onRemove={(id) => setSelected(picked.filter((x) => x !== id))} onClear={() => setSelected([])} />}
      <DeletePaperDialog paper={toDelete} onClose={() => setToDelete(null)} focusAfterDelete={focusAfterDelete} />
    </section>
  );
}
