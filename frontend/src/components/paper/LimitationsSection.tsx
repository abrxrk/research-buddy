import { TriangleAlert, Telescope } from "lucide-react";

import { Section } from "@/components/paper/Section";
import type { Limitations } from "@/types";

function Items({ items, icon: Icon, tone }: { items: string[]; icon: typeof Telescope; tone: string }) {
  if (!items.length) return <p className="text-muted-foreground">Nothing found in the paper.</p>;
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className={`flex gap-2 rounded-lg border-l-2 p-3 ${tone}`}>
          <Icon className="mt-0.5 size-4 shrink-0" /> {t}
        </li>
      ))}
    </ul>
  );
}

export function LimitationsSection({ data }: { data: Limitations }) {
  return (
    <div className="space-y-6">
      <Section title="Limitations">
        <Items items={data.limitations} icon={TriangleAlert} tone="border-amber-500 bg-amber-50/60" />
      </Section>
      <Section title="Future research directions">
        <Items items={data.future_work} icon={Telescope} tone="border-emerald-500 bg-emerald-50/60" />
      </Section>
    </div>
  );
}
