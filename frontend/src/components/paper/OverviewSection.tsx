import { BulletList, Section } from "@/components/paper/Section";
import type { Overview } from "@/types";

export function OverviewSection({ data }: { data: Overview }) {
  return (
    <div className="space-y-6">
      {data.authors.length > 0 && <p className="text-sm text-muted-foreground">{data.authors.join(", ")}</p>}
      <Section title="Abstract"><p className="whitespace-pre-line">{data.abstract || "Not found."}</p></Section>
      <Section title="Research objective"><p>{data.objective || "Not found."}</p></Section>
      <Section title="Key contributions"><BulletList items={data.contributions} /></Section>
    </div>
  );
}
