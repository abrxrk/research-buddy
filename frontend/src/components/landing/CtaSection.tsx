"use client";

import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { Reveal } from "@/components/common/Reveal";

export function CtaSection() {
  return (
    <section className="px-6 py-24">
      <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-card px-8 py-20 text-center">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_bottom,black,transparent_70%)]" />
        <div aria-hidden className="absolute -bottom-40 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-highlight/20 blur-3xl" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
            Your next paper,{" "}
            <span className="font-serif font-normal italic">
              <span className="highlight highlight-dark">understood.</span>
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-muted-foreground">Free to use with open models. Add your first paper in under a minute.</p>
          <PrimaryCta label="Start reading free" className="mx-auto mt-10 h-12 px-7 text-sm" />
        </div>
      </Reveal>
    </section>
  );
}
