import { Telescope, TriangleAlert } from "lucide-react";

import type { Limitations } from "@/types";

function Column({ title, items, icon: Icon, tone }: { title: string; items: string[]; icon: typeof Telescope; tone: string }) {
  return (
    <div className="rounded-2xl border bg-card/40 p-5">
      <p className={`mb-4 flex items-center gap-2 text-sm font-medium ${tone}`}><Icon className="size-4" /> {title} <span className="text-xs text-muted-foreground">· {items.length}</span></p>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span> {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing found in the paper.</p>
      )}
    </div>
  );
}

export function LimitationsSection({ data }: { data: Limitations }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Column title="Limitations" items={data.limitations} icon={TriangleAlert} tone="text-amber-300" />
      <Column title="Future directions" items={data.future_work} icon={Telescope} tone="text-emerald-300" />
    </div>
  );
}
