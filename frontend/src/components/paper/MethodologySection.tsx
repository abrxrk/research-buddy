import { Section } from "@/components/paper/Section";
import { Badge } from "@/components/ui/badge";
import type { Methodology } from "@/types";

function Tags({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-muted-foreground">None mentioned.</p>;
  return <div className="flex flex-wrap gap-1.5">{items.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>;
}

export function MethodologySection({ data }: { data: Methodology }) {
  return (
    <div className="space-y-6">
      <Section title="Summary"><p>{data.summary}</p></Section>
      <Section title="Techniques">
        <div className="grid gap-2 sm:grid-cols-2">
          {data.techniques.map((t) => (
            <div key={t.name} className="rounded-lg border bg-muted/30 p-3">
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-muted-foreground">{t.description}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Models"><Tags items={data.models} /></Section>
      <Section title="Datasets"><Tags items={data.datasets} /></Section>
    </div>
  );
}
