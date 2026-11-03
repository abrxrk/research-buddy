import { STATUS_LABEL, STEPS } from "@/helpers/format";
import { cn } from "@/lib/utils";
import type { PaperStatus } from "@/types";

/** Coloured dot + plain-language status. Processing states include "step n of 4". Colour is never the only signal. */
export function StatusBadge({ status, className }: { status: PaperStatus; className?: string }) {
  const step = STEPS.indexOf(status) + 1;
  const busy = status !== "ready" && status !== "failed";
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)} aria-busy={busy || undefined}>
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          status === "ready" ? "bg-emerald-400" : status === "failed" ? "bg-red-400" : "animate-pulse bg-highlight",
        )}
      />
      <span className={cn("truncate", status === "failed" ? "text-red-300" : status === "ready" ? "text-foreground" : "text-muted-foreground")}>
        {STATUS_LABEL[status]}
        {step > 0 && <span className="whitespace-nowrap text-muted-foreground/80 tabular-nums"> · {step} of {STEPS.length}</span>}
      </span>
    </span>
  );
}
