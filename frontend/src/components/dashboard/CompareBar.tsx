"use client";

import { GitCompareArrows, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MAX_COMPARE } from "@/api/comparisons";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { useComparisonStore } from "@/store/comparisonStore";
import type { Paper } from "@/types";

type Props = { papers: Paper[]; onRemove: (id: string) => void; onClear: () => void };

/** Floating bar listing the ticked papers; starts a side-by-side comparison. */
export function CompareBar({ papers, onRemove, onClear }: Props) {
  const create = useComparisonStore((s) => s.create);
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const n = papers.length;

  async function compare() {
    setStarting(true);
    try {
      const c = await create(papers.map((p) => p.id));
      router.push(`/comparisons/${c.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the comparison");
      setStarting(false);
    }
  }

  // Below xl it sits above the "Ask a question" bar (PageWithChat) instead of covering it.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-4 lg:pl-64 xl:bottom-5 xl:pr-[calc(380px+2rem)]" role="region" aria-label="Compare selected papers">
      <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-lg border bg-elevated py-1.5 pr-1.5 pl-3 text-sm shadow-xl shadow-black/40 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground" aria-live="polite">
          <span className="font-medium tabular-nums text-foreground">{n}</span> of {MAX_COMPARE}
        </span>
        <ul className="no-scrollbar hidden min-w-0 gap-1 overflow-x-auto sm:flex" aria-label="Selected papers">
          {papers.map((p) => (
            <li key={p.id} className="flex h-7 shrink-0 items-center gap-0.5 rounded-md bg-muted pl-2 pr-0.5 text-xs">
              <span className="max-w-40 truncate">{p.title}</span>
              <Tip content="Remove from selection">
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  aria-label={`Remove “${p.title}” from selection`}
                  className="grid size-5 place-items-center rounded-sm text-muted-foreground hover:bg-background/60 hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </Tip>
            </li>
          ))}
        </ul>
        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:hidden">{n === 1 ? "paper selected" : "papers selected"}</span>
        {n < 2 && <span className="hidden shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:inline">Tick one more</span>}
        <Button variant="accent" size="sm" className="shrink-0 px-3" disabled={n < 2 || starting} onClick={compare}>
          {starting ? <Loader2 className="animate-spin" /> : <GitCompareArrows />} Compare
        </Button>
        <Tip content="Clear selection" shortcut="escape">
          <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear selection" className="shrink-0 text-muted-foreground hover:text-foreground">
            <X />
          </Button>
        </Tip>
      </div>
    </div>
  );
}
