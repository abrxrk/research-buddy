"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { pageLabel } from "@/components/chat/ChatMessageView";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Source } from "@/types";

/** The exact passage an answer cited, with where it sits in the paper. */
export function SourceDialog({ source, onClose }: { source: Source | null; onClose: () => void }) {
  return (
    <Dialog open={!!source} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-3 sm:max-w-xl">
        {source && (
          <>
            <DialogHeader className="gap-1 pr-8">
              <DialogTitle className="flex items-center gap-2">
                <span className="chat-cite" aria-hidden>{source.n}</span>
                Source {source.n}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                {source.paper_title && (
                  source.paper_id ? (
                    <Link href={`/papers/${source.paper_id}`} className="inline-flex items-center gap-0.5 text-foreground hover:underline">
                      {source.paper_title}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </Link>
                  ) : (
                    <span className="text-foreground">{source.paper_title}</span>
                  )
                )}
                <span className="tabular-nums">
                  {pageLabel(source.pages)}
                  {source.section && ` · ${source.section}`}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="scroll-shadow-y -mx-1 min-h-0 overflow-y-auto px-1" style={{ "--scroll-bg": "var(--popover)" } as React.CSSProperties}>
              <blockquote className="border-l-2 border-highlight/60 pl-3 text-sm leading-relaxed text-pretty whitespace-pre-line">{source.text}</blockquote>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Quoted exactly as it appears in the PDF.</span>
              <CopyButton text={source.text} label="Copy passage" size="icon-sm" withText />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
