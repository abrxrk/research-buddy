import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PaperStatus } from "@/types";

const STEPS: { key: PaperStatus; label: string }[] = [
  { key: "downloading", label: "Download" },
  { key: "parsing", label: "Parse PDF" },
  { key: "embedding", label: "Index chunks" },
  { key: "analyzing", label: "Generate insights" },
];
const ORDER: PaperStatus[] = ["queued", "downloading", "parsing", "embedding", "analyzing", "ready"];

export function ProcessingSteps({ status }: { status: PaperStatus }) {
  const at = ORDER.indexOf(status);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((s) => {
        const i = ORDER.indexOf(s.key);
        const done = at > i;
        const active = at === i;
        return (
          <span
            key={s.key}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
              done && "border-emerald-200 bg-emerald-50 text-emerald-700",
              active && "border-indigo-200 bg-indigo-50 text-indigo-700",
              !done && !active && "text-muted-foreground",
            )}
          >
            {done ? <Check className="size-3" /> : active ? <Loader2 className="size-3 animate-spin" /> : null}
            {s.label}
          </span>
        );
      })}
    </div>
  );
}
