import { Check, Download, FileSearch, Layers, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PaperStatus } from "@/types";

const STEPS: { key: PaperStatus; label: string; icon: typeof Check }[] = [
  { key: "downloading", label: "Download", icon: Download },
  { key: "parsing", label: "Parse PDF", icon: FileSearch },
  { key: "embedding", label: "Index chunks", icon: Layers },
  { key: "analyzing", label: "Generate insights", icon: Sparkles },
];
const ORDER: PaperStatus[] = ["queued", "downloading", "parsing", "embedding", "analyzing", "ready"];

/** Horizontal stepper with a filling rail; the active step pulses. */
export function ProcessingSteps({ status }: { status: PaperStatus }) {
  const at = ORDER.indexOf(status);
  const done = STEPS.filter((s) => at > ORDER.indexOf(s.key)).length;
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/50 p-5">
      <div className="bg-dots absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="absolute top-4 right-[12.5%] left-[12.5%] h-px bg-white/10">
          <div className="h-full bg-highlight transition-[width] duration-700" style={{ width: `${(done / (STEPS.length - 1)) * 100}%` }} />
        </div>
        <ol className="relative grid grid-cols-4">
          {STEPS.map((s) => {
            const i = ORDER.indexOf(s.key);
            const complete = at > i;
            const active = at === i;
            return (
              <li key={s.key} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "relative grid size-8 place-items-center rounded-full border bg-background transition-colors",
                    complete && "border-highlight bg-highlight text-zinc-900",
                    active && "border-highlight text-highlight",
                  )}
                >
                  {active && <span className="absolute inset-0 animate-ping rounded-full border border-highlight/60" />}
                  {complete ? <Check className="size-4" /> : <s.icon className="size-3.5" />}
                </span>
                <span className={cn("text-xs", complete || active ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
        {status === "analyzing" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">You can already ask questions in the chat while insights are being written.</p>
        )}
      </div>
    </div>
  );
}
