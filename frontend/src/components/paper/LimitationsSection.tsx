import { AlertTriangle, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/paper/Section";
import { CopyButton } from "@/components/ui/copy-button";
import type { Limitations } from "@/types";

function List({ items, icon: Icon, empty }: { items: string[]; icon: LucideIcon; empty: string }) {
  if (!items.length) return <p className="text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3">
          <Icon className="mt-1 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-pretty">{t}</span>
        </li>
      ))}
    </ul>
  );
}

const asList = (items: string[]) => () => items.map((t) => `- ${t}`).join("\n");

export function LimitationsSection({ data }: { data: Limitations }) {
  return (
    <div className="grid gap-10 @3xl:grid-cols-2 @3xl:gap-12">
      <Section
        title="Limitations"
        count={data.limitations.length || undefined}
        description="Weaknesses stated by the authors or clearly implied by the paper."
        aside={data.limitations.length > 0 && <CopyButton text={asList(data.limitations)} label="Copy as list" />}
      >
        <List items={data.limitations} icon={AlertTriangle} empty="The paper doesn't state any limitations." />
      </Section>
      <Section
        title="Future directions"
        count={data.future_work.length || undefined}
        description="Open questions and next steps the paper points to."
        aside={data.future_work.length > 0 && <CopyButton text={asList(data.future_work)} label="Copy as list" />}
      >
        <List items={data.future_work} icon={ArrowRight} empty="No future work is mentioned." />
      </Section>
    </div>
  );
}
