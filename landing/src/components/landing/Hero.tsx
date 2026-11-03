"use client";

import { PaperDemo } from "@/components/landing/PaperDemo";
import { PrimaryCta } from "@/components/landing/PrimaryCta";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24">
      {/* aurora + dot grid */}
      <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div aria-hidden className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.88_0.17_95/0.16),transparent)] blur-2xl" />
      <div aria-hidden className="absolute top-40 -left-40 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">

        <h1 className="animate-pop mx-auto max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-7xl" style={{ animationDelay: "80ms" }}>
          Read research papers
          <br />
          <span className="font-serif font-normal tracking-normal italic">
            like you <span className="highlight highlight-now highlight-dark">wrote them.</span>
          </span>
        </h1>
        <p className="animate-pop mx-auto mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg" style={{ animationDelay: "160ms" }}>
          Add any paper and get a plain-language summary in minutes. Ask questions with answers cited to the exact page, and compare it with the rest of your library.
        </p>
        <div className="animate-pop mt-10 flex flex-wrap justify-center gap-3" style={{ animationDelay: "240ms" }}>
          <PrimaryCta label="Start reading free" className="h-12 px-6 text-sm shadow-[0_0_0_4px_rgb(255_255_255/0.06)]" />
          <a href="#how" className="flex h-12 items-center rounded-full border px-6 text-sm text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground">
            See how it works
          </a>
        </div>

        <div className="animate-tilt-in mx-auto mt-20 max-w-5xl text-left">
          <PaperDemo />
        </div>
      </div>
    </section>
  );
}
