"use client";

import { FileSearch } from "lucide-react";
import { useMemo, useState } from "react";

import { Reveal } from "@/components/common/Reveal";
import { DeletePaperDialog } from "@/components/dashboard/DeletePaperDialog";
import { type LibraryFilter, LibraryToolbar } from "@/components/dashboard/LibraryToolbar";
import { PaperCard } from "@/components/dashboard/PaperCard";
import { isProcessing } from "@/helpers/format";
import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

const matches = (p: Paper, f: LibraryFilter) =>
  f === "all" || (f === "processing" ? isProcessing(p.status) : p.status === f);

function EmptyLibrary() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed px-6 py-20 text-center">
      <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto mb-6 flex h-24 w-40 items-end justify-center">
        {[-10, 0, 10].map((r, i) => (
          <div key={r} className="absolute h-24 w-20 rounded-md border bg-zinc-100/90 shadow-xl" style={{ transform: `rotate(${r}deg) translateX(${(i - 1) * 18}px)`, zIndex: i === 1 ? 2 : 1 }}>
            <div className="mx-auto mt-3 h-1 w-10 rounded bg-zinc-400" />
            {[0, 1, 2, 3].map((l) => <div key={l} className="mx-auto mt-1.5 h-[3px] w-12 rounded bg-zinc-300" />)}
            {i === 1 && <div className="mx-auto mt-1.5 h-[5px] w-12 rounded-sm bg-highlight" />}
          </div>
        ))}
      </div>
      <p className="relative text-xl font-semibold tracking-tight">
        Your library is <span className="font-serif font-normal italic">empty</span>
      </p>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Paste a link above or drop a PDF anywhere on this page — we&apos;ll read it for you.</p>
    </div>
  );
}

export function PaperGrid() {
  const { papers, loading } = usePaperStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [toDelete, setToDelete] = useState<Paper | null>(null);

  const counts = useMemo(
    () => ({
      all: papers.length,
      ready: papers.filter((p) => matches(p, "ready")).length,
      processing: papers.filter((p) => matches(p, "processing")).length,
      failed: papers.filter((p) => matches(p, "failed")).length,
    }),
    [papers],
  );
  const q = query.trim().toLowerCase();
  const visible = papers.filter((p) => matches(p, filter) && (!q || p.title.toLowerCase().includes(q)));

  return (
    <section className="space-y-5">
      <LibraryToolbar query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} counts={counts} />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl border bg-card/50" />)}
        </div>
      ) : !papers.length ? (
        <EmptyLibrary />
      ) : !visible.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-14 text-sm text-muted-foreground">
          <FileSearch className="size-5" /> No papers match {q ? `“${query}”` : "this filter"}.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 5) * 60} className="h-full">
              <PaperCard paper={p} onDelete={setToDelete} />
            </Reveal>
          ))}
        </div>
      )}
      <DeletePaperDialog paper={toDelete} onClose={() => setToDelete(null)} />
    </section>
  );
}
