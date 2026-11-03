"use client";

/* eslint-disable @next/next/no-img-element -- small local logo SVGs */
import { ExternalLink, Loader2, RotateCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { TimeAgo } from "@/components/ui/time-ago";
import { Tip } from "@/components/ui/tooltip";
import { isProcessing, plural, STEPS } from "@/helpers/format";
import { sourceInfo } from "@/helpers/source";
import { cn } from "@/lib/utils";
import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

type Props = {
  paper: Paper;
  checked: boolean;
  /** shift = extend the selection from the last ticked row */
  onToggle: (shift: boolean) => void;
  onDelete: () => void;
};

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/** Thin "step n of 4" bar shown under the status while a paper is processing. */
function Progress({ status }: { status: Paper["status"] }) {
  const step = STEPS.indexOf(status) + 1;
  return (
    <div
      role="progressbar"
      aria-label="Processing"
      aria-valuemin={0}
      aria-valuemax={STEPS.length}
      aria-valuenow={step}
      className="mt-1.5 h-0.5 w-24 overflow-hidden rounded-full bg-muted"
    >
      <div className="h-full rounded-full bg-highlight transition-[width] duration-300 ease-out" style={{ width: `${((step || 0.3) / STEPS.length) * 100}%` }} />
    </div>
  );
}

/** One library row. Click anywhere to open; the checkbox and action buttons stop propagation. */
export function PaperRow({ paper: p, checked, onToggle, onDelete }: Props) {
  const router = useRouter();
  const retry = usePaperStore((s) => s.retry);
  const [retrying, setRetrying] = useState(false);
  const source = sourceInfo(p.source);
  const ready = p.status === "ready";
  const processing = isProcessing(p.status);

  async function onRetry() {
    setRetrying(true);
    try {
      await retry(p.id);
      toast.success("Retrying — reading the paper again");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not retry");
    } finally {
      setRetrying(false);
    }
  }

  const checkbox = (
    <input
      type="checkbox"
      className="checkbox"
      checked={checked}
      disabled={!ready}
      onMouseDown={(e) => e.shiftKey && e.preventDefault()} // no text selection on shift-click
      onClick={stop}
      onChange={(e) => onToggle((e.nativeEvent as MouseEvent).shiftKey)}
      aria-label={`Select “${p.title}” to compare`}
    />
  );

  return (
    <tr
      data-id={p.id}
      onClick={() => router.push(`/papers/${p.id}`)}
      className={cn(
        "group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40 focus-within:bg-muted/40",
        checked && "bg-highlight/[0.04] hover:bg-highlight/[0.07] focus-within:bg-highlight/[0.07]",
      )}
    >
      <td
        className="w-10 cursor-default pl-4 align-middle"
        onClick={(e) => {
          // the whole cell ticks the box; a near-miss must not open the paper
          e.stopPropagation();
          if (ready) onToggle(e.shiftKey);
        }}
      >
        {ready ? checkbox : (
          <Tip content={processing ? "Available once the paper is ready" : "Only ready papers can be compared"}>
            <span className="inline-flex">{checkbox}</span>
          </Tip>
        )}
      </td>
      <td className="min-w-0 py-3 pr-4 align-middle">
        <Tip content={p.title} whenTruncated side="bottom" align="start">
          <Link
            href={`/papers/${p.id}`}
            onClick={stop}
            className="line-clamp-2 rounded-sm text-sm font-medium outline-offset-2 md:inline-block md:max-w-full md:truncate md:align-top"
          >
            {p.title}
          </Link>
        </Tip>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          {source.logo && <img src={source.logo} alt="" className="size-3" />}
          {source.label}
          {p.page_count ? (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{plural(p.page_count, "page")}</span>
            </>
          ) : null}
        </p>
        {p.status === "failed" && p.error && (
          <Tip content={p.error} whenTruncated side="bottom" align="start">
            <p className="mt-1 truncate text-xs text-red-300">{p.error}</p>
          </Tip>
        )}
        <div className="mt-1 md:hidden">
          <StatusBadge status={p.status} className="text-xs" />
          {processing && <Progress status={p.status} />}
        </div>
      </td>
      <td className="hidden w-44 pr-4 align-middle md:table-cell">
        <StatusBadge status={p.status} className="text-xs" />
        {processing && <Progress status={p.status} />}
      </td>
      <td className="hidden w-24 pr-4 align-middle text-xs text-muted-foreground md:table-cell">
        <TimeAgo iso={p.created_at} />
      </td>
      <td className="w-16 pr-2 align-middle md:w-24">
        <div className="flex items-center justify-end gap-0.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:has-[[aria-busy=true]]:opacity-100">
          {p.status === "failed" && (
            <Tip content="Try processing this paper again">
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  stop(e);
                  onRetry();
                }}
                disabled={retrying}
                aria-busy={retrying}
                aria-label="Retry"
                className="text-muted-foreground hover:text-foreground"
              >
                {retrying ? <Loader2 className="animate-spin" /> : <RotateCw />} <span className="hidden md:inline">Retry</span>
              </Button>
            </Tip>
          )}
          {p.url && (
            <Tip content="Open the original">
              <Button
                variant="ghost"
                size="icon-sm"
                nativeButton={false}
                render={<a href={p.url} target="_blank" rel="noreferrer" />}
                onClick={stop}
                aria-label="Open the original link in a new tab"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink />
              </Button>
            </Tip>
          )}
          <Tip content={processing ? "Wait until processing finishes" : "Delete paper"} shortcut={processing ? undefined : "backspace"}>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  stop(e);
                  onDelete();
                }}
                disabled={processing}
                aria-label={`Delete “${p.title}”`}
                className="text-muted-foreground hover:bg-red-400/10 hover:text-red-300"
              >
                <Trash2 />
              </Button>
            </span>
          </Tip>
        </div>
      </td>
    </tr>
  );
}
