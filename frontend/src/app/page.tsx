"use client";

import { ArrowRight, FileUp, Link2, Sparkles } from "lucide-react";
import Link from "next/link";

import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { Spotlight } from "@/components/landing/Spotlight";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: FileUp, title: "Add a paper", text: "Upload a PDF or paste an arXiv, OpenReview, DOI or any paper link." },
  { icon: Sparkles, title: "We read it", text: "Parsed, chunked and indexed with hybrid search, then analysed automatically." },
  { icon: Link2, title: "Explore & ask", text: "Browse insights, the knowledge graph, and chat with cited answers." },
];

export default function LandingPage() {
  const { user } = useAuth();
  const cta = user ? "/dashboard" : "/auth";

  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white">R</span>
          Research Buddy
        </Link>
        <Link href={cta} className={buttonVariants({ variant: "ghost" })}>
          {user ? "Dashboard" : "Sign in"}
        </Link>
      </header>

      <Spotlight className="border-b">
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-24 text-center">
          <p className="mx-auto mb-6 w-fit rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            Your AI reading partner for research papers
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Understand any paper <span className="text-indigo-600">in minutes</span>, not hours.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
            Upload a paper and get its overview, methods, findings, limitations and a knowledge graph — then ask
            questions with answers cited to the exact page.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Link href={cta} className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 bg-indigo-600 hover:bg-indigo-700")}>
              Get started <ArrowRight />
            </Link>
            <a href="#features" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-5")}>
              See features
            </a>
          </div>
        </section>
      </Spotlight>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-10 px-6 py-20">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">Everything you need from a paper</h2>
        <p className="mb-10 text-muted-foreground">Hover a feature to preview it.</p>
        <FeatureShowcase />
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="group rounded-2xl border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <s.icon className="size-4" />
                </span>
                <span className="text-xs text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">© Research Buddy</footer>
    </main>
  );
}
