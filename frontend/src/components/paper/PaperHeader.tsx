"use client";

import { AlertCircle, ExternalLink, FileText, Globe, Loader2, RotateCcw, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { papersApi } from "@/api/papers";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProcessingSteps } from "@/components/paper/ProcessingSteps";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { TimeAgo } from "@/components/ui/time-ago";
import { Tip } from "@/components/ui/tooltip";
import { authorName, isProcessing, plural } from "@/helpers/format";
import { sourceInfo } from "@/helpers/source";
import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

const AUTHORS_SHOWN = 5;

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function PaperHeader({ paper }: { paper: Paper }) {
  const retry = usePaperStore((s) => s.retry);
  const [retrying, setRetrying] = useState(false);
  const [allAuthors, setAllAuthors] = useState(false);
  const authors = (paper.analysis?.overview?.authors ?? []).map(authorName);
  const hiddenAuthors = authors.length - AUTHORS_SHOWN;
  const source = sourceInfo(paper.source);
  const generic = ["web", "pdf", "upload"].includes(source.key);
  const SourceIcon = source.key === "upload" ? Upload : source.key === "pdf" ? FileText : Globe;
  const pdfReady = paper.status !== "queued" && paper.status !== "downloading";

  async function onRetry() {
    setRetrying(true);
    try {
      await retry(paper.id);
      toast.success("Processing the paper again");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <header className="space-y-4">
      <div className="space-y-2">
        {/* Copy button sits inline after the last word, so it reads as "copy this title". */}
        <h1 className="group/title max-w-[40ch] text-2xl leading-tight font-semibold tracking-tight text-balance">
          {paper.title}
          <CopyButton
            text={paper.title}
            label="Copy title"
            size="icon-sm"
            className="ml-1.5 inline-flex align-middle opacity-0 transition-opacity group-hover/title:opacity-100 focus-visible:opacity-100"
          />
        </h1>

        {authors.length > 0 && (
          <p className="max-w-[80ch] text-sm text-muted-foreground">
            {(allAuthors ? authors : authors.slice(0, AUTHORS_SHOWN)).join(", ")}
            {hiddenAuthors > 0 && (
              <button
                type="button"
                onClick={() => setAllAuthors((v) => !v)}
                aria-expanded={allAuthors}
                className="ml-1.5 rounded-sm text-foreground/80 underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground/40"
              >
                {allAuthors ? "Show fewer" : `and ${plural(hiddenAuthors, "more author")}`}
              </button>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <StatusBadge status={paper.status} />
          <span aria-hidden className="hidden text-muted-foreground/40 sm:inline">·</span>
          <Tip content={paper.url ? `Added from ${hostname(paper.url)}` : "Uploaded from your computer"}>
            <span className="inline-flex items-center gap-1.5">
              <SourceIcon className="size-3.5" aria-hidden /> {source.label}
            </span>
          </Tip>
          {paper.page_count ? (
            <>
              <span aria-hidden className="hidden text-muted-foreground/40 sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <FileText className="size-3.5" aria-hidden /> {plural(paper.page_count, "page")}
              </span>
            </>
          ) : null}
          <span aria-hidden className="hidden text-muted-foreground/40 sm:inline">·</span>
          <TimeAgo iso={paper.created_at} prefix="Added" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {pdfReady && (
          <Tip content="Opens the PDF in a new tab">
            <Button variant="outline" size="sm" onClick={() => papersApi.openPdf(paper.id).catch((e) => toast.error(e.message))}>
              <FileText /> Open PDF
            </Button>
          </Tip>
        )}
        {paper.url && (
          <>
            <Tip content={hostname(paper.url)}>
              <a href={paper.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <ExternalLink /> {generic ? "Open original link" : `View on ${source.label}`}
              </a>
            </Tip>
            <CopyButton text={paper.url} label="Copy link" withText size="icon-sm" className="text-muted-foreground" />
          </>
        )}
        {paper.status === "failed" && (
          <Button variant="accent" size="sm" onClick={onRetry} disabled={retrying}>
            {retrying ? <Loader2 className="animate-spin" /> : <RotateCcw />} Try again
          </Button>
        )}
      </div>

      {isProcessing(paper.status) && <ProcessingSteps status={paper.status} since={paper.created_at} />}
      {paper.error && (
        <div role="alert" className="flex gap-2.5 rounded-md border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
          <p className="max-w-[72ch]">
            <span className="font-medium">Processing failed.</span> {paper.error}
            {paper.status === "failed" && <span className="text-red-200/70"> Try again, or add the paper from a different link.</span>}
          </p>
        </div>
      )}
    </header>
  );
}
