"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type LibraryFilter = "all" | "ready" | "processing" | "failed";

export function LibraryToolbar({
  query, onQuery, filter, onFilter, counts,
}: {
  query: string;
  onQuery: (q: string) => void;
  filter: LibraryFilter;
  onFilter: (f: LibraryFilter) => void;
  counts: Record<LibraryFilter, number>;
}) {
  const tabs: [LibraryFilter, string][] = [["all", "All"], ["ready", "Ready"], ["processing", "Processing"], ["failed", "Failed"]];
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <h2 className="mr-auto flex items-center gap-2 text-lg font-semibold tracking-tight">
        Library <span className="rounded-full border px-2 py-0.5 text-xs font-normal text-muted-foreground tabular-nums">{counts.all}</span>
      </h2>
      <div className="flex rounded-full border bg-white/[0.02] p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onFilter(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors",
              filter === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {key !== "all" && counts[key] > 0 && <span className="tabular-nums opacity-60">{counts[key]}</span>}
          </button>
        ))}
      </div>
      <label className="flex h-9 items-center gap-2 rounded-full border bg-white/[0.02] px-3 text-sm focus-within:border-white/25 sm:w-56">
        <Search className="size-3.5 text-muted-foreground" />
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search papers" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      </label>
    </div>
  );
}
