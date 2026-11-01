import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { STATUS_LABEL } from "@/helpers/format";
import { cn } from "@/lib/utils";
import type { PaperStatus } from "@/types";

export function StatusBadge({ status, className }: { status: PaperStatus; className?: string }) {
  const base = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur";
  if (status === "ready")
    return <span className={cn(base, "border-emerald-400/25 bg-emerald-400/10 text-emerald-300", className)}><CheckCircle2 className="size-3" /> Ready</span>;
  if (status === "failed")
    return <span className={cn(base, "border-red-400/25 bg-red-400/10 text-red-300", className)}><XCircle className="size-3" /> Failed</span>;
  return (
    <span className={cn(base, "border-highlight/30 bg-highlight/10 text-highlight", className)}>
      <Loader2 className="size-3 animate-spin" /> {STATUS_LABEL[status]}
    </span>
  );
}
