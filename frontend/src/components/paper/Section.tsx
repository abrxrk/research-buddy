import { Loader2 } from "lucide-react";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{title}</h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function BulletList({ items, empty = "Nothing found in the paper." }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className="text-muted-foreground">{empty}</p>;
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
}

export function Pending({ processing }: { processing: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
      {processing ? (
        <>
          <Loader2 className="size-5 animate-spin text-indigo-600" />
          Generating this section… free models can take a few minutes.
        </>
      ) : (
        "This section couldn't be generated for this paper."
      )}
    </div>
  );
}
