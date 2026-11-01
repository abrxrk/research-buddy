"use client";

import { cn } from "@/lib/utils";

/** Card whose border lights up in highlighter yellow around the cursor. */
export function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onMouseMove={onMove} className={cn("glow-card rounded-2xl border bg-card/60 transition-transform duration-300 hover:-translate-y-0.5", className)}>
      {children}
    </div>
  );
}
