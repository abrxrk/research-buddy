"use client";

/* eslint-disable @next/next/no-img-element -- small local logo SVGs */
import { ArrowUpRight, Trash2 } from "lucide-react";
import Link from "next/link";

import { GlowCard } from "@/components/common/GlowCard";
import { PaperThumb } from "@/components/dashboard/PaperThumb";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { STATUS_LABEL, STATUS_PROGRESS, isProcessing, timeAgo } from "@/helpers/format";
import { sourceInfo } from "@/helpers/source";
import type { Paper } from "@/types";

export function PaperCard({ paper, onDelete }: { paper: Paper; onDelete: (p: Paper) => void }) {
  const processing = isProcessing(paper.status);
  const source = sourceInfo(paper.source);

  return (
    <GlowCard className="group h-full overflow-hidden">
      <Link href={`/papers/${paper.id}`} className="flex h-full flex-col">
        <div className="relative">
          <PaperThumb title={paper.title} status={paper.status} />
          <StatusBadge status={paper.status} className="absolute top-3 left-3" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 leading-snug font-medium">{paper.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {source.logo && <img src={source.logo} alt="" className="size-3" />}
              {source.label}
            </span>
            {paper.page_count ? <span>· {paper.page_count} pages</span> : null}
            <span>· {timeAgo(paper.created_at)}</span>
          </div>

          <div className="mt-auto pt-4">
            {processing ? (
              <div>
                <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>{STATUS_LABEL[paper.status]}…</span>
                  <span className="tabular-nums">{STATUS_PROGRESS[paper.status]}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="animate-shimmer h-full rounded-full bg-[linear-gradient(90deg,oklch(0.88_0.17_95/0.5),oklch(0.88_0.17_95),oklch(0.88_0.17_95/0.5))] bg-[length:200%_100%] transition-[width] duration-700"
                    style={{ width: `${STATUS_PROGRESS[paper.status]}%` }}
                  />
                </div>
              </div>
            ) : paper.status === "failed" ? (
              <p className="line-clamp-2 text-xs text-red-300/90">{paper.error}</p>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                Open workspace <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            )}
          </div>
        </div>
      </Link>
      {!processing && (
        <button
          onClick={() => onDelete(paper)}
          aria-label="Delete paper"
          title="Delete paper"
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-full border bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition-all group-hover:opacity-100 hover:border-red-400/40 hover:text-red-300 focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </GlowCard>
  );
}
