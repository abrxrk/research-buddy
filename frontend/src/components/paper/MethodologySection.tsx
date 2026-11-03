import { Section } from "@/components/paper/Section";
import { CopyButton } from "@/components/ui/copy-button";
import type { Methodology } from "@/types";

const PILL_MAX = 36;

/** Short items read as tags; once any item is a sentence, pills turn into boxes, so fall back to a plain list. */
function Tags({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-muted-foreground">{empty}</p>;
  if (items.some((t) => t.length > PILL_MAX))
    return (
      <ul className="divide-y border-y">
        {items.map((t) => <li key={t} className="py-1.5 text-sm text-pretty">{t}</li>)}
      </ul>
    );
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li key={t} className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs leading-5 select-all">{t}</li>
      ))}
    </ul>
  );
}

export function MethodologySection({ data }: { data: Methodology }) {
  const techniquesMd = () => data.techniques.map((t) => `- **${t.name}** — ${t.description}`).join("\n");
  return (
    <div className="space-y-10">
      <Section title="How it works, in plain language">
        <p className="text-base leading-relaxed text-pretty">{data.summary}</p>
      </Section>

      <Section
        title="Techniques"
        count={data.techniques.length || undefined}
        description="The building blocks of the approach, each explained briefly."
        aside={data.techniques.length > 0 && <CopyButton text={techniquesMd} label="Copy as markdown" />}
        measure={false}
      >
        {data.techniques.length ? (
          <dl className="divide-y border-y">
            {data.techniques.map((t) => (
              <div key={t.name} className="grid gap-1 py-3 @xl:grid-cols-[13rem_1fr] @xl:gap-6">
                <dt className="font-medium text-pretty">{t.name}</dt>
                <dd className="max-w-[72ch] text-muted-foreground text-pretty">{t.description}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted-foreground">No specific techniques were identified.</p>
        )}
      </Section>

      <div className="grid gap-10 @xl:grid-cols-2">
        <Section title="Models" count={data.models.length || undefined} description="Architectures or pretrained models the paper uses or compares against.">
          <Tags items={data.models} empty="None mentioned." />
        </Section>
        <Section title="Datasets" count={data.datasets.length || undefined} description="Benchmarks and corpora used for training or evaluation.">
          <Tags items={data.datasets} empty="None mentioned." />
        </Section>
      </div>
    </div>
  );
}
