"use client";

import { BookOpen, CheckCircle2, FileStack, Loader2 } from "lucide-react";

import { CountUp } from "@/components/common/CountUp";
import { isProcessing } from "@/helpers/format";
import type { Paper, User } from "@/types";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function DashboardHero({ user, papers }: { user: User; papers: Paper[] }) {
  const first = (user.name || user.email.split("@")[0]).split(" ")[0];
  const processing = papers.filter((p) => isProcessing(p.status)).length;
  const stats = [
    { icon: FileStack, label: "Papers", value: papers.length },
    { icon: BookOpen, label: "Pages indexed", value: papers.reduce((n, p) => n + (p.page_count ?? 0), 0) },
    { icon: CheckCircle2, label: "Ready to explore", value: papers.filter((p) => p.status === "ready").length },
    { icon: Loader2, label: "Being read", value: processing, live: processing > 0 },
  ];

  return (
    <section className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="animate-pop">
        <p className="mb-3 text-sm text-muted-foreground">{greeting()},</p>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          <span className="font-serif font-normal italic">
            <span className="highlight highlight-now highlight-dark">{first}.</span>
          </span>{" "}
          What are we reading?
        </h1>
      </div>
      <div className="animate-pop grid grid-cols-2 gap-2 sm:grid-cols-4" style={{ animationDelay: "120ms" }}>
        {stats.map((s) => (
          <div key={s.label} className="min-w-32 rounded-xl border bg-card/50 px-4 py-3">
            <s.icon className={`mb-2 size-4 ${s.live ? "animate-spin text-highlight" : "text-muted-foreground"}`} />
            <p className="text-2xl font-semibold tracking-tight tabular-nums"><CountUp to={s.value} ms={900} /></p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
