import { FileWarning } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** A titled block of content. `description` explains what the block shows; `count` is shown next to the title. */
export function Section({
  title, description, count, children, className, aside, measure = true,
}: {
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
  aside?: React.ReactNode;
  /** Cap paragraphs at a comfortable reading width. Turn off for tables and wide layouts. */
  measure?: boolean;
}) {
  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium">
            {title}
            {count !== undefined && <span className="ml-1.5 text-muted-foreground tabular-nums">{count}</span>}
          </h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {aside && <div className="flex shrink-0 items-center gap-1">{aside}</div>}
      </div>
      <div className={cn("text-sm leading-relaxed", measure && "[&_p]:max-w-[72ch] [&_li]:max-w-[72ch]")}>{children}</div>
    </section>
  );
}

export type PendingKind = "overview" | "methodology" | "findings" | "limitations" | "graph";

const Lines = ({ widths }: { widths: number[] }) => (
  <div className="space-y-2.5">
    {widths.map((w, i) => <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />)}
  </div>
);
const Heading = ({ w = 32 }: { w?: number }) => <Skeleton className="h-3.5" style={{ width: `${w}%`, maxWidth: "14rem" }} />;

/** Skeletons shaped like each tab's final layout, so the page doesn't jump when content arrives. */
function Shape({ kind }: { kind: PendingKind }) {
  switch (kind) {
    case "methodology":
      return (
        <>
          <div className="space-y-3"><Heading w={40} /><Lines widths={[95, 88, 70]} /></div>
          <div className="space-y-3">
            <Heading w={20} />
            <div className="divide-y border-y">
              {[0, 1, 2].map((i) => (
                <div key={i} className="grid gap-2 py-3 @xl:grid-cols-[13rem_1fr] @xl:gap-6">
                  <Skeleton className="h-3 w-28" /><Lines widths={[90, 60]} />
                </div>
              ))}
            </div>
          </div>
        </>
      );
    case "findings":
      return (
        <>
          <div className="space-y-3"><Heading w={16} /><Lines widths={[95, 90, 75]} /></div>
          <div className="grid grid-cols-2 gap-6 @xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="space-y-2"><Skeleton className="h-7 w-20" /><Skeleton className="h-3 w-24" /></div>)}
          </div>
          <div className="space-y-3">
            <Heading w={24} />
            <div className="divide-y border-y">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-[2fr_1.5fr_1.5fr_3rem] gap-4 py-3">
                  <Skeleton className="h-3" /><Skeleton className="h-3" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          </div>
        </>
      );
    case "limitations":
      return (
        <div className="grid gap-10 @3xl:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-3">
              <Heading w={40} />
              {[0, 1, 2].map((j) => <div key={j} className="flex gap-3"><Skeleton className="mt-1 size-2 rounded-full" /><Lines widths={[90, 55]} /></div>)}
            </div>
          ))}
        </div>
      );
    case "graph":
      return (
        <>
          <div className="flex gap-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-7 w-20 rounded-md" />)}</div>
          <Skeleton className="h-[560px] w-full rounded-lg" />
        </>
      );
    default:
      return (
        <>
          <div className="space-y-3"><Heading w={44} /><Lines widths={[95, 92, 80, 40]} /></div>
          <div className="space-y-3">
            <Heading w={28} />
            {[0, 1, 2].map((i) => <div key={i} className="flex gap-3"><Skeleton className="size-4 shrink-0" /><Lines widths={[88, 70]} /></div>)}
          </div>
        </>
      );
  }
}

/** Placeholder while a section is still being written (or if it failed). */
export function Pending({ processing, kind = "overview" }: { processing: boolean; kind?: PendingKind }) {
  if (!processing)
    return (
      <EmptyState
        icon={FileWarning}
        title="This section couldn't be generated"
        description="The model didn't return anything usable for this part of the paper. You can still ask about it in the chat."
        className="rounded-lg border border-dashed py-10"
      />
    );
  return (
    <div className="space-y-10" aria-busy>
      <p className="text-sm text-muted-foreground" role="status">Still writing this section. This can take a few minutes; the page updates on its own.</p>
      <Shape kind={kind} />
    </div>
  );
}
