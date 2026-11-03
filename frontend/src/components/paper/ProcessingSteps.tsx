import { Check, Loader2 } from "lucide-react";

import { TimeAgo } from "@/components/ui/time-ago";
import { STATUS_LABEL, STEPS } from "@/helpers/format";
import { cn } from "@/lib/utils";
import type { PaperStatus } from "@/types";

/** What the pipeline is doing right now, as a short checklist with a progress bar. */
export function ProcessingSteps({ status, since }: { status: PaperStatus; since?: string }) {
  const at = status === "queued" ? -1 : STEPS.indexOf(status);
  const done = Math.max(at, 0);
  const pct = ((done + 0.5) / STEPS.length) * 100;

  return (
    <div className="rounded-lg border p-4 text-sm" role="status" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-medium">
          {at < 0 ? "Waiting for a free worker" : `Step ${at + 1} of ${STEPS.length}: ${STATUS_LABEL[status]}`}
        </p>
        {since && <TimeAgo iso={since} prefix="Added" className="text-xs text-muted-foreground" />}
      </div>
      <p className="mt-0.5 text-muted-foreground">
        {status === "analyzing"
          ? "The paper is indexed, so you can already ask questions in the chat while the summary is written."
          : "This usually takes a few minutes. The page updates on its own, no need to refresh."}
      </p>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-highlight transition-[width] duration-500 ease-out" style={{ width: `${at < 0 ? 4 : pct}%` }} />
      </div>

      <ol className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {STEPS.map((s, i) => {
          const state = i < at ? "done" : i === at ? "now" : "todo";
          return (
            <li
              key={s}
              className={cn("flex items-center gap-2 text-xs", state === "todo" && "text-muted-foreground", state === "now" && "font-medium")}
              aria-current={state === "now" ? "step" : undefined}
            >
              <span className="grid size-4 shrink-0 place-items-center">
                {state === "done" && <Check className="size-3.5 text-emerald-400" aria-label="done" />}
                {state === "now" && <Loader2 className="size-3.5 animate-spin text-highlight" aria-label="in progress" />}
                {state === "todo" && <span className="size-1.5 rounded-full bg-muted-foreground/40" />}
              </span>
              <span className="font-mono text-[10.5px] text-muted-foreground tabular-nums">{i + 1}</span>
              {STATUS_LABEL[s]}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
