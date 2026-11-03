import { cn } from "@/lib/utils";
import type { ComparisonStatus, PaperStatus } from "@/types";

/** Status dot: emerald = ready, red = failed, yellow pulse = processing. Decorative; pair it with text. */
export function StatusDot({ status, className }: { status: PaperStatus | ComparisonStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        status === "ready" ? "bg-emerald-400/80" : status === "failed" ? "bg-red-400" : "animate-pulse bg-highlight",
        className,
      )}
    />
  );
}
