import { FileUp, MessageSquareQuote, ScanText, Sparkles } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

const STEPS = [
  { icon: FileUp, title: "Drop a paper", text: "Upload a PDF or paste an arXiv, OpenReview, DOI or ACL link." },
  { icon: ScanText, title: "We read it", text: "Docling parses the layout; chunks keep their pages and section headings." },
  { icon: Sparkles, title: "Insights appear", text: "An agent writes the overview, methods, findings, limitations and graph." },
  { icon: MessageSquareQuote, title: "Ask anything", text: "Get answers grounded in the paper, each claim cited to its page." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="How it works" title={<>From PDF to <span className="font-serif font-normal italic">understanding</span></>} sub="Four steps, mostly automatic. You just bring the paper." />
        <Reveal className="relative mt-16">
          {/* progress rail that fills when revealed */}
          <div aria-hidden className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-white/10 md:block">
            <div className="h-full origin-left scale-x-0 bg-gradient-to-r from-highlight/0 via-highlight to-highlight/0 transition-transform delay-300 duration-[1600ms] ease-out [.is-visible_&]:scale-x-100" />
          </div>
          <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="group relative text-center">
                <span
                  className="relative mx-auto grid size-12 place-items-center rounded-full border bg-background transition-all duration-500 group-hover:border-highlight/60 group-hover:shadow-[0_0_24px_-4px] group-hover:shadow-highlight/50 [.is-visible_&]:border-white/25"
                  style={{ transitionDelay: `${300 + i * 350}ms` }}
                >
                  <s.icon className="size-5" />
                  <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-highlight font-mono text-[10px] font-semibold text-zinc-900">{i + 1}</span>
                </span>
                <h3 className="mt-5 font-medium">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[15rem] text-sm leading-6 text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
