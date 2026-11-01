"use client";

/* eslint-disable @next/next/no-img-element -- small local logo SVGs */
import { FileText, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { papersApi } from "@/api/papers";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProcessingSteps } from "@/components/paper/ProcessingSteps";
import { authorName, isProcessing, timeAgo } from "@/helpers/format";
import { sourceInfo } from "@/helpers/source";
import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

export function PaperHeader({ paper }: { paper: Paper }) {
  const retry = usePaperStore((s) => s.retry);
  const [retrying, setRetrying] = useState(false);
  const source = sourceInfo(paper.source);
  const authors = (paper.analysis?.overview?.authors ?? []).map(authorName);

  async function onRetry() {
    setRetrying(true);
    try {
      await retry(paper.id);
      toast.success("Retrying — reading the paper again");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  const pill = "flex h-8 items-center gap-1.5 rounded-full border bg-white/[0.02] px-3 text-xs transition-colors hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50";

  return (
    <header className="animate-pop space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <StatusBadge status={paper.status} />
        <span className="flex items-center gap-1.5 rounded-full border px-2 py-0.5">
          {source.logo && <img src={source.logo} alt="" className="size-3" />}
          {source.label}
        </span>
        {paper.page_count ? <span className="rounded-full border px-2 py-0.5">{paper.page_count} pages</span> : null}
        <span className="rounded-full border px-2 py-0.5">Added {timeAgo(paper.created_at)}</span>
      </div>

      <h1 className="max-w-4xl text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{paper.title}</h1>
      {authors.length > 0 && (
        <p className="max-w-3xl text-sm text-muted-foreground">
          {authors.slice(0, 6).join(", ")}
          {authors.length > 6 && <span> + {authors.length - 6} more</span>}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {paper.status !== "queued" && paper.status !== "downloading" && (
          <button onClick={() => papersApi.openPdf(paper.id).catch((e) => toast.error(e.message))} className={pill}>
            <FileText className="size-3.5" /> Open PDF
          </button>
        )}
        {paper.url && (
          <a href={paper.url} target="_blank" rel="noreferrer" className={pill}>
            {source.logo ? <img src={source.logo} alt="" className="size-3" /> : null} View source
          </a>
        )}
        {paper.status === "failed" && (
          <button onClick={onRetry} disabled={retrying} className={`${pill} border-highlight/40 text-highlight`}>
            {retrying ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />} Retry
          </button>
        )}
      </div>

      {isProcessing(paper.status) && <ProcessingSteps status={paper.status} />}
      {paper.error && <p className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{paper.error}</p>}
    </header>
  );
}
