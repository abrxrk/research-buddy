import { Boxes, Database } from "lucide-react";

import { Section } from "@/components/paper/Section";
import type { Methodology } from "@/types";

function ChipCard({ icon: Icon, title, items }: { icon: typeof Boxes; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border bg-card/40 p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-muted-foreground" /> {title}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((t) => <span key={t} className="rounded-full border bg-white/[0.03] px-2.5 py-1 text-xs">{t}</span>)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">None mentioned.</p>
      )}
    </div>
  );
}

export function MethodologySection({ data }: { data: Methodology }) {
  return (
    <div className="space-y-8">
      <p className="text-[15px] leading-7">{data.summary}</p>
      <Section title={`Techniques · ${data.techniques.length}`}>
        <ol className="relative space-y-3 before:absolute before:top-3 before:bottom-3 before:left-[15px] before:w-px before:bg-white/10">
          {data.techniques.map((t, i) => (
            <li key={t.name} className="relative flex gap-4">
              <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border bg-background font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1 rounded-xl border bg-card/40 p-4 transition-colors hover:border-white/20">
                <p className="font-medium">{t.name}</p>
                <p className="mt-1 text-muted-foreground">{t.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChipCard icon={Boxes} title="Models" items={data.models} />
        <ChipCard icon={Database} title="Datasets" items={data.datasets} />
      </div>
    </div>
  );
}
