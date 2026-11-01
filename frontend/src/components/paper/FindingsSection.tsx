import { Section } from "@/components/paper/Section";
import type { Findings } from "@/types";

export function FindingsSection({ data }: { data: Findings }) {
  return (
    <div className="space-y-6">
      <Section title="Summary"><p>{data.summary}</p></Section>
      <Section title="Results">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr><th className="p-2.5">Finding</th><th className="p-2.5">Metric</th><th className="p-2.5">Value</th><th className="p-2.5">Page</th></tr>
            </thead>
            <tbody>
              {data.results.map((r, i) => (
                <tr key={i} className="border-t align-top">
                  <td className="p-2.5">{r.finding}</td>
                  <td className="p-2.5 text-muted-foreground">{r.metric ?? "—"}</td>
                  <td className="p-2.5 font-semibold whitespace-nowrap">{r.value ?? "—"}</td>
                  <td className="p-2.5 text-muted-foreground">{r.page ? `p.${r.page}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
