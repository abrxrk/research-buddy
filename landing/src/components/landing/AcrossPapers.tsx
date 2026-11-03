import { Columns2, MessagesSquare } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

const Cite = ({ n }: { n: number }) => (
  <span className="mx-0.5 inline-grid h-4 min-w-4 place-items-center rounded-sm bg-highlight px-1 align-text-top font-mono text-[10px] font-medium text-zinc-900">
    {n}
  </span>
);

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground">{children}</kbd>
);

function CardHead({ icon: Icon, title, text }: { icon: typeof Columns2; title: string; text: string }) {
  return (
    <div className="p-6 pb-0">
      <span className="mb-4 grid size-9 place-items-center rounded-lg border bg-white/[0.03]"><Icon className="size-4" /></span>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

/** Static preview of the dashboard chat, drawn with the app's own styles. */
function LibraryChatPreview() {
  return (
    <div className="m-6 rounded-xl border bg-background/60 p-4 text-sm">
      <div className="flex items-center justify-between border-b pb-3 text-xs">
        <span className="font-medium">Ask your library</span>
        <span className="text-muted-foreground">3 papers</span>
      </div>
      <p className="mt-4 ml-auto w-fit max-w-[85%] rounded-lg bg-muted px-3 py-2">Which of my papers report BLEU?</p>
      <p className="mt-4 leading-relaxed">
        <strong className="font-medium">Attention Is All You Need</strong> reports 28.4 BLEU on WMT 2014 English–German
        <Cite n={1} />. <strong className="font-medium">BERT</strong> doesn&apos;t use BLEU; it reports GLUE and SQuAD scores instead
        <Cite n={2} />.
      </p>
      <ol className="mt-3 space-y-1 border-t pt-3 font-mono text-[11px] text-muted-foreground">
        <li className="truncate">[1] Attention Is All You Need · p.8 · 6.1 Machine Translation</li>
        <li className="truncate">[2] BERT · p.6 · 4 Experiments</li>
      </ol>
    </div>
  );
}

const ROWS = [
  ["P1", "Transformer", "28.4 BLEU (EN→DE), 41.8 BLEU (EN→FR)"],
  ["P2", "BERT", "GLUE 80.5, SQuAD v1.1 F1 93.2"],
];

/** Static preview of a comparison's Results tab. */
function ComparisonPreview() {
  return (
    <div className="m-6 rounded-xl border bg-background/60 text-sm">
      <div className="flex gap-4 overflow-hidden border-b px-4 pt-3 text-xs whitespace-nowrap text-muted-foreground">
        {["Overview", "Methodology", "Datasets & Metrics", "Results", "Limitations"].map((t) => (
          <span key={t} className={t === "Results" ? "border-b-2 border-foreground pb-2.5 font-medium text-foreground" : "pb-2.5"}>{t}</span>
        ))}
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">In common</p>
          <p className="mt-1 leading-relaxed">Both build on self-attention and set a new state of the art on their benchmarks.</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Where they differ</p>
          <p className="mt-1 leading-relaxed">The Transformer is judged on translation; BERT on language understanding after fine-tuning.</p>
        </div>
      </div>
      <dl className="divide-y border-t">
        {ROWS.map(([id, name, value]) => (
          <div key={id} className="flex gap-3 px-4 py-2.5">
            <dt className="flex w-32 shrink-0 items-center gap-2 font-medium">
              <span className="rounded border px-1 font-mono text-[10px] text-muted-foreground">{id}</span>
              {name}
            </dt>
            <dd className="text-muted-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function AcrossPapers() {
  return (
    <section id="across" className="scroll-mt-24 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Across papers"
          title="Your whole library, not one PDF at a time"
          sub="Ask questions across everything you've added, or line papers up side by side."
        />
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          <Reveal className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl border bg-card/60">
              <CardHead
                icon={MessagesSquare}
                title="Library chat"
                text="One question, searched across every indexed paper. Each citation names the paper and page it comes from."
              />
              <LibraryChatPreview />
            </div>
          </Reveal>
          <Reveal delay={120} className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl border bg-card/60">
              <CardHead
                icon={Columns2}
                title="Compare papers"
                text="Pick 2 to 5 papers. Get an overview plus methodology, datasets, results and limitations, each with what they share and where they differ."
              />
              <ComparisonPreview />
            </div>
          </Reveal>
        </div>

        <Reveal delay={150} className="mx-auto mt-10 max-w-3xl space-y-5 text-center text-sm text-muted-foreground">
          <p>
            Under the hood, one agent reads each paper (its summary plus four targeted searches) and an orchestrator writes the
            comparison. Comparisons are saved, and each one has its own chat that only searches those papers.
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5"><Kbd>⌘K</Kbd> jump anywhere</span>
            <span className="flex items-center gap-1.5"><Kbd>/</Kbd> search</span>
            <span className="flex items-center gap-1.5"><Kbd>j</Kbd><Kbd>k</Kbd> move</span>
            <span className="flex items-center gap-1.5"><Kbd>x</Kbd> select to compare</span>
            <span className="flex items-center gap-1.5"><Kbd>⌘J</Kbd> ask</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
