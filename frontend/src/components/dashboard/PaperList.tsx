"use client";

import { FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { isProcessing, timeAgo } from "@/helpers/format";
import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

function PaperCard({ paper }: { paper: Paper }) {
  const remove = usePaperStore((s) => s.remove);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Delete "${paper.title}"?`)) return;
    try {
      await remove(paper.id);
      toast.success("Paper deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Link
      href={`/papers/${paper.id}`}
      className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
        <FileText className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium leading-snug">{paper.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={paper.status} />
          <span className="capitalize">{paper.source}</span>
          {paper.page_count && <span>· {paper.page_count} pages</span>}
          <span>· {timeAgo(paper.created_at)}</span>
        </div>
        {paper.error && <p className="mt-2 text-xs text-destructive">{paper.error}</p>}
      </div>
      {!isProcessing(paper.status) && (
        <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete paper" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
          <Trash2 />
        </Button>
      )}
    </Link>
  );
}

export function PaperList() {
  const { papers, loading } = usePaperStore();

  if (loading)
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  if (!papers.length)
    return <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No papers yet — add your first one above.</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {papers.map((p) => <PaperCard key={p.id} paper={p} />)}
    </div>
  );
}
