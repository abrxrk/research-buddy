import { cn } from "@/lib/utils";

export function Section({ title, children, className, aside }: { title: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-highlight" />
        <h3 className="text-xs tracking-widest text-muted-foreground uppercase">{title}</h3>
        {aside && <span className="ml-auto">{aside}</span>}
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

/** Shimmering skeleton while a section is still being generated. */
export function Pending({ processing }: { processing: boolean }) {
  if (!processing)
    return <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">This section couldn&apos;t be generated for this paper.</div>;
  return (
    <div className="space-y-5 rounded-2xl border bg-card/40 p-6">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-highlight" /> Writing this section… free models can take a few minutes.
      </p>
      {[80, 95, 70, 88, 55].map((w, i) => (
        <div
          key={i}
          className="animate-shimmer h-3 rounded-full bg-[linear-gradient(90deg,rgb(255_255_255/0.04),rgb(255_255_255/0.1),rgb(255_255_255/0.04))] bg-[length:200%_100%]"
          style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
